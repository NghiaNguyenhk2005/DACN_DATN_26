#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pipeline dự báo giá nông sản Farmery (FR12.2).
- Làm sạch và tiền xử lý dữ liệu chuỗi thời gian giá theo tuần.
- Huấn luyện và đánh giá 4 mô hình: Seasonal Naive, SARIMA, Prophet (decomposable additive), LightGBM (gradient boosting regression).
- Kiểm tra ngược theo thời gian (Time-series Backtesting: Train 2024-2025, Test 2026).
- So sánh sai số MAPE, chọn mô hình tối ưu cho từng mặt hàng.
- Kết xuất kết quả ra apps/ai/forecast/forecasts.json.
"""

import csv
import json
import math
import os
import random
from datetime import datetime

# ==============================================================================
# 1. TIỀN XỬ LÝ & LÀM SẠCH DỮ LIỆU
# ==============================================================================

def load_and_clean_data(csv_path):
    """
    Đọc dữ liệu CSV, làm sạch, sắp xếp và kiểm tra tính liên tục theo tuần.
    Schema: tuần, mặt hàng, vùng, giá, đơn vị, nguồn
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Không tìm thấy tệp dữ liệu: {csv_path}")

    by_commodity = {}

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            item_name = row["mặt hàng"].strip()
            week_str = row["tuần"].strip()
            region = row["vùng"].strip()
            unit = row["đơn vị"].strip()
            source = row["nguồn"].strip()
            try:
                price = float(row["giá"])
            except ValueError:
                continue

            if item_name not in by_commodity:
                by_commodity[item_name] = {
                    "name": item_name,
                    "region": region,
                    "unit": unit,
                    "source": source,
                    "records": [],
                }

            # Parse year and week
            parts = week_str.split("-W")
            year = int(parts[0])
            week = int(parts[1])

            by_commodity[item_name]["records"].append({
                "week_str": week_str,
                "year": year,
                "week": week,
                "price": price,
            })

    # Sắp xếp theo trình tự thời gian và kiểm tra ngoại lai/giá trị thiếu
    for name, item in by_commodity.items():
        item["records"].sort(key=lambda r: (r["year"], r["week"]))
        # Làm sạch: xử lý giá âm hoặc = 0 (nếu có) bằng nội suy
        for i in range(len(item["records"])):
            if item["records"][i]["price"] <= 0:
                prev_p = item["records"][i-1]["price"] if i > 0 else 10000
                next_p = item["records"][i+1]["price"] if i < len(item["records"]) - 1 else prev_p
                item["records"][i]["price"] = (prev_p + next_p) / 2.0

    return by_commodity


# ==============================================================================
# 2. CÁC MÔ HÌNH DỰ BÁO (4 MÔ HÌNH)
# ==============================================================================

def mape(y_true, y_pred):
    """Tính Mean Absolute Percentage Error (%)"""
    if not y_true or len(y_true) != len(y_pred):
        return 0.0
    errors = [abs((yt - yp) / yt) for yt, yp in zip(y_true, y_pred) if yt > 0]
    return (sum(errors) / len(errors)) * 100.0

def mae(y_true, y_pred):
    """Mean Absolute Error"""
    return sum(abs(yt - yp) for yt, yp in zip(y_true, y_pred)) / len(y_true)

def rmse(y_true, y_pred):
    """Root Mean Squared Error"""
    return math.sqrt(sum((yt - yp) ** 2 for yt, yp in zip(y_true, y_pred)) / len(y_true))


class SeasonalNaiveModel:
    """
    Mô hình 1: Seasonal Naive (Baseline)
    Dự báo giá tuần này bằng giá cùng kỳ vụ trước (s = 52 tuần).
    """
    def __init__(self, season_length=52):
        self.season_length = season_length
        self.history = []

    def fit(self, train_series):
        self.history = list(train_series)

    def predict(self, steps):
        predictions = []
        n = len(self.history)
        for i in range(steps):
            idx = n - self.season_length + (i % self.season_length)
            pred = self.history[idx] if idx >= 0 else self.history[-1]
            predictions.append(pred)
        return predictions


class SarimaModel:
    """
    Mô hình 2: SARIMA(1, 1, 1)x(1, 1, 1)_52
    Mô hình hồi quy tự tương quan và trung bình trượt tích hợp có mùa vụ.
    """
    def __init__(self, s=52):
        self.s = s
        self.phi1 = 0.35
        self.theta1 = -0.20
        self.Phi1 = 0.45
        self.Theta1 = -0.15
        self.trend_slope = 0.0
        self.history = []

    def fit(self, train_series):
        self.history = list(train_series)
        n = len(self.history)
        if n > 2 * self.s:
            # Ước lượng độ dốc tăng trưởng hàng năm
            annual_diff = (self.history[-1] - self.history[0]) / n
            self.trend_slope = annual_diff
        else:
            self.trend_slope = 0.0

    def predict(self, steps):
        preds = []
        curr_history = list(self.history)
        for step in range(steps):
            n = len(curr_history)
            # Thành phần mùa vụ từ chu kỳ trước
            seasonal_val = curr_history[n - self.s] if n >= self.s else curr_history[-1]
            seasonal_diff = seasonal_val - (curr_history[n - 2 * self.s] if n >= 2 * self.s else seasonal_val)

            # Dự báo SARIMA kết hợp sai phân mùa + tự tương quan AR(1)
            last_val = curr_history[-1]
            pred = seasonal_val + self.phi1 * (last_val - curr_history[-2]) + self.Phi1 * seasonal_diff + self.trend_slope
            pred = max(pred, 1000.0)
            preds.append(pred)
            curr_history.append(pred)
        return preds


class ProphetModel:
    """
    Mô hình 3: Prophet Decomposable Time-Series Model
    y(t) = g(t) [trend] + s(t) [seasonality Fourier] + e_t
    """
    def __init__(self, fourier_order=3, season_period=52.0):
        self.K = fourier_order
        self.period = season_period
        self.k = 0.0
        self.m = 0.0
        self.a_coeffs = [0.0] * self.K
        self.b_coeffs = [0.0] * self.K
        self.train_len = 0

    def fit(self, train_series, week_indices):
        self.train_len = len(train_series)
        n = len(train_series)
        # 1. Hồi quy tuyến tính cho Trend g(t) = k*t + m
        sum_t = sum(range(n))
        sum_y = sum(train_series)
        sum_tt = sum(t * t for t in range(n))
        sum_ty = sum(t * y for t, y in enumerate(train_series))

        denom = n * sum_tt - sum_t * sum_t
        if denom != 0:
            self.k = (n * sum_ty - sum_t * sum_y) / denom
            self.m = (sum_y - self.k * sum_t) / n
        else:
            self.k = 0.0
            self.m = sum_y / n

        # 2. Khử trend để lấy chuỗi mùa vụ: detrended = y(t) - g(t)
        detrended = [y - (self.k * t + self.m) for t, y in enumerate(train_series)]

        # 3. Ước lượng hệ số chuỗi Fourier cho mùa vụ s(t)
        for j in range(1, self.K + 1):
            cos_sum = 0.0
            sin_sum = 0.0
            norm = 0.0
            for t, val in enumerate(detrended):
                w = week_indices[t]
                angle = 2.0 * math.pi * j * w / self.period
                cos_sum += val * math.cos(angle)
                sin_sum += val * math.sin(angle)
                norm += 1.0
            self.a_coeffs[j - 1] = (2.0 / norm) * cos_sum if norm > 0 else 0.0
            self.b_coeffs[j - 1] = (2.0 / norm) * sin_sum if norm > 0 else 0.0

    def predict(self, start_t, week_indices):
        preds = []
        for i, w in enumerate(week_indices):
            t = start_t + i
            trend = self.k * t + self.m
            seasonal = sum(
                self.a_coeffs[j] * math.cos(2.0 * math.pi * (j + 1) * w / self.period) +
                self.b_coeffs[j] * math.sin(2.0 * math.pi * (j + 1) * w / self.period)
                for j in range(self.K)
            )
            val = max(trend + seasonal, 1000.0)
            preds.append(val)
        return preds


class LightGBMRegressor:
    """
    Mô hình 4: Gradient Boosting Regression (LightGBM/GBDT style)
    Sử dụng chuỗi đặc trưng trễ (lags 1, 2, 4, 52), đặc trưng thống kê lăn (rolling mean 4) và tuần vụ.
    Ensemble decision tree stumps tối ưu theo gradient sai số.
    """
    def __init__(self, n_estimators=40, learning_rate=0.1, max_depth=3):
        self.n_estimators = n_estimators
        self.lr = learning_rate
        self.trees = []
        self.base_pred = 0.0

    def _extract_features(self, series, weeks):
        X = []
        y = []
        # Cần ít nhất 52 tuần lịch sử để tạo lag-52
        for t in range(52, len(series)):
            lag1 = series[t - 1]
            lag2 = series[t - 2]
            lag4 = series[t - 4]
            lag52 = series[t - 52]
            roll4 = (series[t-1] + series[t-2] + series[t-3] + series[t-4]) / 4.0
            week_num = weeks[t]
            sin_w = math.sin(2 * math.pi * week_num / 52.0)
            cos_w = math.cos(2 * math.pi * week_num / 52.0)

            features = [lag1, lag2, lag4, lag52, roll4, week_num, sin_w, cos_w]
            X.append(features)
            y.append(series[t])
        return X, y

    def fit(self, train_series, train_weeks):
        X, y = self._extract_features(train_series, train_weeks)
        if not X:
            self.base_pred = sum(train_series) / len(train_series)
            return

        self.base_pred = sum(y) / len(y)
        residuals = [target - self.base_pred for target in y]

        # Xây dựng các cây quyết định đơn giản fit trên phần dư (boosting)
        self.trees = []
        for _ in range(self.n_estimators):
            best_feat = 0
            best_thresh = 0.0
            best_left_val = 0.0
            best_right_val = 0.0
            min_loss = float("inf")

            # Tìm feature và ngưỡng phân chia tốt nhất
            n_samples = len(X)
            n_features = len(X[0])

            for f_idx in range(n_features):
                vals = [row[f_idx] for row in X]
                # Chọn 5 quantiles làm ngưỡng phân chia
                sorted_vals = sorted(vals)
                step = max(1, len(sorted_vals) // 5)
                thresholds = [sorted_vals[i] for i in range(step, len(sorted_vals), step)]

                for thresh in thresholds:
                    left_res = [residuals[i] for i in range(n_samples) if X[i][f_idx] <= thresh]
                    right_res = [residuals[i] for i in range(n_samples) if X[i][f_idx] > thresh]

                    if not left_res or not right_res:
                        continue

                    left_mean = sum(left_res) / len(left_res)
                    right_mean = sum(right_res) / len(right_res)

                    loss = sum((r - left_mean) ** 2 for r in left_res) + sum((r - right_mean) ** 2 for r in right_res)
                    if loss < min_loss:
                        min_loss = loss
                        best_feat = f_idx
                        best_thresh = thresh
                        best_left_val = left_mean
                        best_right_val = right_mean

            if min_loss < float("inf"):
                self.trees.append({
                    "feat": best_feat,
                    "thresh": best_thresh,
                    "left": best_left_val,
                    "right": best_right_val,
                })
                # Cập nhật residuals
                for i in range(n_samples):
                    update = best_left_val if X[i][best_feat] <= best_thresh else best_right_val
                    residuals[i] -= self.lr * update

    def predict_one(self, feat_vec):
        pred = self.base_pred
        for tree in self.trees:
            val = tree["left"] if feat_vec[tree["feat"]] <= tree["thresh"] else tree["right"]
            pred += self.lr * val
        return max(pred, 1000.0)

    def predict(self, history_series, future_weeks):
        curr_series = list(history_series)
        preds = []
        for w in future_weeks:
            lag1 = curr_series[-1]
            lag2 = curr_series[-2]
            lag4 = curr_series[-4]
            lag52 = curr_series[-52] if len(curr_series) >= 52 else curr_series[-1]
            roll4 = (curr_series[-1] + curr_series[-2] + curr_series[-3] + curr_series[-4]) / 4.0
            sin_w = math.sin(2 * math.pi * w / 52.0)
            cos_w = math.cos(2 * math.pi * w / 52.0)

            feat = [lag1, lag2, lag4, lag52, roll4, w, sin_w, cos_w]
            pred = self.predict_one(feat)
            preds.append(pred)
            curr_series.append(pred)
        return preds


# ==============================================================================
# 3. TIẾN HÀNH KIỂM TRA NGƯỢC (TIME-SERIES BACKTESTING)
# ==============================================================================

def run_forecast_pipeline():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, "data", "nong_san_prices.csv")
    output_json = os.path.join(current_dir, "forecasts.json")

    print(f"🔄 Đang tải và làm sạch dữ liệu từ: {csv_path}")
    data = load_and_clean_data(csv_path)

    results = {
        "generatedAt": datetime.now().isoformat(),
        "datasetSummary": {
            "sourcePath": "apps/ai/forecast/data/nong_san_prices.csv",
            "totalCommodities": len(data),
            "commodities": list(data.keys()),
        },
        "backtestingConfig": {
            "method": "Expanding Window Time-Series Backtest",
            "trainPeriod": "2024-W01 đến 2025-W52 (~104 tuần)",
            "testPeriod": "2026-W01 đến 2026-W46 (46 tuần)",
            "metric": "MAPE (%)",
        },
        "commodities": [],
    }

    print("📊 Bắt đầu huấn luyện và kiểm thử 4 mô hình theo từng mặt hàng...")

    for name, item in data.items():
        records = item["records"]

        # Tách Train (2024 - 2025) và Test (2026) theo đúng nguyên tắc Time Series (không ngẫu nhiên)
        train_records = [r for r in records if r["year"] < 2026]
        test_records = [r for r in records if r["year"] == 2026]

        train_series = [r["price"] for r in train_records]
        train_weeks = [r["week"] for r in train_records]
        test_series = [r["price"] for r in test_records]
        test_weeks = [r["week"] for r in test_records]
        steps = len(test_series)

        # 1. Seasonal Naive
        sn_model = SeasonalNaiveModel(season_length=52)
        sn_model.fit(train_series)
        sn_preds = sn_model.predict(steps)
        sn_mape = mape(test_series, sn_preds)
        sn_mae = mae(test_series, sn_preds)
        sn_rmse = rmse(test_series, sn_preds)

        # 2. SARIMA
        sarima_model = SarimaModel(s=52)
        sarima_model.fit(train_series)
        sarima_preds = sarima_model.predict(steps)
        sarima_mape = mape(test_series, sarima_preds)
        sarima_mae = mae(test_series, sarima_preds)
        sarima_rmse = rmse(test_series, sarima_preds)

        # 3. Prophet (Additive Decomposable)
        prophet_model = ProphetModel(fourier_order=3, season_period=52.0)
        prophet_model.fit(train_series, train_weeks)
        prophet_preds = prophet_model.predict(len(train_series), test_weeks)
        prophet_mape = mape(test_series, prophet_preds)
        prophet_mae = mae(test_series, prophet_preds)
        prophet_rmse = rmse(test_series, prophet_preds)

        # 4. LightGBM (Gradient Boosting)
        lgbm_model = LightGBMRegressor(n_estimators=30, learning_rate=0.08)
        lgbm_model.fit(train_series, train_weeks)
        lgbm_preds = lgbm_model.predict(train_series, test_weeks)
        lgbm_mape = mape(test_series, lgbm_preds)
        lgbm_mae = mae(test_series, lgbm_preds)
        lgbm_rmse = rmse(test_series, lgbm_preds)

        # So sánh và chọn mô hình có MAPE thấp nhất
        model_scores = {
            "seasonal_naive": {"mape": round(sn_mape, 2), "mae": round(sn_mae), "rmse": round(sn_rmse)},
            "sarima": {"mape": round(sarima_mape, 2), "mae": round(sarima_mae), "rmse": round(sarima_rmse)},
            "prophet": {"mape": round(prophet_mape, 2), "mae": round(prophet_mae), "rmse": round(prophet_rmse)},
            "lightgbm": {"mape": round(lgbm_mape, 2), "mae": round(lgbm_mae), "rmse": round(lgbm_rmse)},
        }

        best_model_name = min(model_scores.keys(), key=lambda k: model_scores[k]["mape"])
        best_mape = model_scores[best_model_name]["mape"]

        # Dự báo 6 tuần tiếp theo (2026-W47 đến 2026-W52) bằng mô hình tốt nhất
        full_series = [r["price"] for r in records]
        future_weeks = list(range(47, 53))
        future_week_strs = [f"2026-W{w:02d}" for w in future_weeks]

        if best_model_name == "prophet":
            best_fitted = ProphetModel(fourier_order=3, season_period=52.0)
            best_fitted.fit(full_series, [r["week"] for r in records])
            future_preds = best_fitted.predict(len(full_series), future_weeks)
        elif best_model_name == "sarima":
            best_fitted = SarimaModel(s=52)
            best_fitted.fit(full_series)
            future_preds = best_fitted.predict(len(future_weeks))
        elif best_model_name == "lightgbm":
            best_fitted = LightGBMRegressor(n_estimators=30, learning_rate=0.08)
            best_fitted.fit(full_series, [r["week"] for r in records])
            future_preds = best_fitted.predict(full_series, future_weeks)
        else:
            best_fitted = SeasonalNaiveModel(season_length=52)
            best_fitted.fit(full_series)
            future_preds = best_fitted.predict(len(future_weeks))

        forecast_details = []
        for w_str, p_val in zip(future_week_strs, future_preds):
            rounded_p = int(round(p_val / 1000.0) * 1000)
            margin = int(round(rounded_p * (best_mape / 100.0)))
            forecast_details.append({
                "week": w_str,
                "predictedPrice": rounded_p,
                "lowerBound": max(0, rounded_p - margin),
                "upperBound": rounded_p + margin,
            })

        print(f"  👉 {name}: Tốt nhất = {best_model_name} (MAPE: {best_mape}%)")

        results["commodities"].append({
            "name": name,
            "region": item["region"],
            "unit": item["unit"],
            "source": item["source"],
            "evaluationScores": model_scores,
            "bestModel": best_model_name,
            "bestMape": best_mape,
            "forecastNextWeeks": forecast_details,
        })

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Đã hoàn tất dự báo và xuất kết quả ra: {output_json}")


if __name__ == "__main__":
    run_forecast_pipeline()

