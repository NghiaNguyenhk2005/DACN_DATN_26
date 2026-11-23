"""Dự báo giá nông sản theo THÁNG, chạy offline: kiểm tra ngược rolling-origin, chọn mô hình, xuất kết quả.

Đầu vào: data/faostat_vn_monthly.csv (month, commodity, price, unit, source) do data/collect_faostat.py sinh.
Đầu ra: results/forecasts.json và results/metrics.csv.
Mô hình: seasonal naive (mốc), SARIMA, Prophet, LightGBM; tầm dự báo 3 tháng, đo MAPE, MASE, độ phủ khoảng 80%.
Chạy: python run_forecast.py [--input CSV] [--outdir DIR] [--origins N]
"""
import argparse
import csv
import json
import logging
import warnings
from datetime import datetime, timezone
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from prophet import Prophet
from statsmodels.tsa.statespace.sarimax import SARIMAX

HERE = Path(__file__).resolve().parent
H = 3  # tầm dự báo (tháng)
SEASON = 12
MIN_TRAIN = 72  # số tháng tối thiểu ở lần huấn luyện đầu tiên
MODELS = ["seasonal_naive", "sarima", "prophet", "lightgbm"]

logging.getLogger("cmdstanpy").setLevel(logging.ERROR)
logging.getLogger("prophet").setLevel(logging.ERROR)
warnings.filterwarnings("ignore")


def splice_breaks(y: pd.Series, thresh: float):
    """Nối chuỗi tại điểm gãy mức giá: tháng nào |ln(giá/giá tháng trước)| > thresh thì nhân các tháng trước đó
    với tỷ lệ giá(tháng gãy)/giá(tháng trước) để chuỗi liền mạch; mức giá mới nhất giữ nguyên.
    Dùng vì FAOSTAT đổi mức giá bất thường giữa 12/2021 và 01/2022 (xem README)."""
    if thresh <= 0:
        return y, []
    v = y.to_numpy().copy()
    found = []
    for i in range(len(v) - 1, 0, -1):
        if abs(np.log(v[i] / v[i - 1])) > thresh:
            v[:i] *= v[i] / v[i - 1]
            found.append(str(y.index[i]))
    return pd.Series(v, index=y.index), sorted(found)


def load_series(path: Path, thresh: float) -> dict[str, dict]:
    df = pd.read_csv(path, encoding="utf-8")
    out = {}
    for name, g in df.groupby("commodity"):
        g = g.sort_values("month")
        idx = pd.PeriodIndex(g["month"], freq="M")
        # Giữ đoạn tháng liên tục dài nhất tính đến điểm cuối (bỏ các điểm theo quý đầu chuỗi).
        keep = len(idx)
        for i in range(len(idx) - 1, 0, -1):
            if (idx[i] - idx[i - 1]).n != 1:
                keep = len(idx) - i
                break
        s = pd.Series(g["price"].to_numpy(dtype=float)[-keep:], index=idx[-keep:])
        s, breaks = splice_breaks(s, thresh)
        out[name] = {"y": s, "unit": g["unit"].iloc[0], "source": g["source"].iloc[0], "breaks": breaks}
    return out


def fc_seasonal_naive(y: pd.Series, h: int):
    vals = y.to_numpy()
    return np.array([vals[len(vals) - SEASON + (k % SEASON)] for k in range(h)]), None, None


def fc_sarima(y: pd.Series, h: int):
    ly = np.log(y.to_numpy())
    res = SARIMAX(ly, order=(1, 1, 1), seasonal_order=(0, 1, 1, SEASON),
                  enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
    f = res.get_forecast(h)
    ci = f.conf_int(alpha=0.2)
    return np.exp(f.predicted_mean), np.exp(ci[:, 0]), np.exp(ci[:, 1])


def fc_prophet(y: pd.Series, h: int):
    df = pd.DataFrame({"ds": y.index.to_timestamp(), "y": np.log(y.to_numpy())})
    m = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False, interval_width=0.8)
    m.fit(df)
    fut = pd.DataFrame({"ds": [(y.index[-1] + k).to_timestamp() for k in range(1, h + 1)]})
    p = m.predict(fut)
    return np.exp(p["yhat"].to_numpy()), np.exp(p["yhat_lower"].to_numpy()), np.exp(p["yhat_upper"].to_numpy())


def _lag_features(ly: np.ndarray, month: np.ndarray, t: int) -> list[float]:
    # Đặc trưng chỉ dùng thông tin đến tháng t: 11 độ trễ (so với giá hiện tại), giá hiện tại, tháng, cờ Tết (tháng 1, 2).
    lags = [ly[t - k] - ly[t] for k in range(1, 12)]
    return lags + [ly[t], month[t], float(month[t] in (1, 2))]


def fc_lightgbm(y: pd.Series, h: int):
    ly = np.log(y.to_numpy())
    month = y.index.month.to_numpy()
    n = len(ly)
    mean, lo, hi = [], [], []
    last = _lag_features(ly, month, n - 1)
    for k in range(1, h + 1):
        X = [_lag_features(ly, month, t) for t in range(11, n - k)]
        t_target = np.array([ly[t + k] - ly[t] for t in range(11, n - k)])
        # Tháng của điểm cần dự báo được thêm vào đặc trưng để mô hình biết mùa vụ của đích.
        tgt_month = np.array([month[t + k] for t in range(11, n - k)], dtype=float)
        X = np.column_stack([np.array(X), tgt_month])
        x_last = np.array(last + [float(y.index[-1].month - 1 + k) % 12 + 1]).reshape(1, -1)
        common = dict(n_estimators=200, learning_rate=0.05, num_leaves=8, min_child_samples=5,
                      subsample=0.8, subsample_freq=1, colsample_bytree=0.8, random_state=0, verbose=-1)
        mid = lgb.LGBMRegressor(objective="regression", **common).fit(X, t_target).predict(x_last)[0]
        q10 = lgb.LGBMRegressor(objective="quantile", alpha=0.1, **common).fit(X, t_target).predict(x_last)[0]
        q90 = lgb.LGBMRegressor(objective="quantile", alpha=0.9, **common).fit(X, t_target).predict(x_last)[0]
        mean.append(np.exp(ly[-1] + mid))
        lo.append(np.exp(ly[-1] + min(q10, mid)))
        hi.append(np.exp(ly[-1] + max(q90, mid)))
    return np.array(mean), np.array(lo), np.array(hi)


FORECASTERS = {"seasonal_naive": fc_seasonal_naive, "sarima": fc_sarima, "prophet": fc_prophet, "lightgbm": fc_lightgbm}


def backtest(y: pd.Series, n_origins: int):
    """Mỗi lần: huấn luyện trên y[:t], dự báo H tháng kế tiếp; lùi dần từ cuối chuỗi, bước H tháng."""
    n = len(y)
    origins = [n - H * k for k in range(n_origins, 0, -1)]
    origins = [t for t in origins if t >= MIN_TRAIN]
    recs = {m: [] for m in MODELS}
    for t in origins:
        train, test = y.iloc[:t], y.iloc[t:t + H].to_numpy()
        # Thang của MASE: sai số tuyệt đối trung bình của seasonal naive trong mẫu huấn luyện.
        tv = train.to_numpy()
        scale = np.mean(np.abs(tv[SEASON:] - tv[:-SEASON]))
        for m in MODELS:
            mean, lo, hi = FORECASTERS[m](train, H)
            recs[m].append({"origin": str(train.index[-1]), "actual": test, "mean": mean, "lo": lo, "hi": hi, "scale": scale})
    return recs


def summarize(recs: list[dict]) -> dict:
    act = np.concatenate([r["actual"] for r in recs])
    pred = np.concatenate([r["mean"] for r in recs])
    ape = np.abs(act - pred) / act
    mase = np.mean([np.mean(np.abs(r["actual"] - r["mean"])) / r["scale"] for r in recs])
    out = {"mape": float(ape.mean() * 100), "mase": float(mase), "n_forecasts": len(act), "n_origins": len(recs)}
    for h in range(H):
        out[f"mape_h{h + 1}"] = float(np.mean([abs(r["actual"][h] - r["mean"][h]) / r["actual"][h] for r in recs]) * 100)
    if recs[0]["lo"] is not None:
        lo = np.concatenate([r["lo"] for r in recs])
        hi = np.concatenate([r["hi"] for r in recs])
        out["coverage80"] = float(np.mean((act >= lo) & (act <= hi)) * 100)
    else:
        out["coverage80"] = None
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default=str(HERE / "data" / "faostat_vn_monthly.csv"))
    ap.add_argument("--outdir", default=str(HERE / "results"))
    ap.add_argument("--origins", type=int, default=16, help="số lần dự báo trong kiểm tra ngược (mỗi lần H tháng)")
    ap.add_argument("--splice-threshold", type=float, default=0.5,
                    help="ngưỡng |ln tỷ lệ giá| để nối chuỗi tại điểm gãy; 0 là tắt, dùng chuỗi thô")
    args = ap.parse_args()
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    series = load_series(Path(args.input), args.splice_threshold)
    rows, results = [], []
    for name, s in series.items():
        y = s["y"]
        recs = backtest(y, args.origins)
        stats = {m: summarize(recs[m]) for m in MODELS}
        for m in MODELS:
            rows.append({"commodity": name, "model": m, **stats[m]})
        best = min(MODELS, key=lambda m: stats[m]["mape"])
        mean, lo, hi = FORECASTERS[best](y, H)
        hist = [{"month": str(p), "price": float(v)} for p, v in y.iloc[-36:].items()]
        fut = [{"month": str(y.index[-1] + k + 1), "price": float(mean[k]),
                "lower": None if lo is None else float(lo[k]), "upper": None if hi is None else float(hi[k])} for k in range(H)]
        results.append({
            "commodity": name, "unit": s["unit"], "source": s["source"], "model": best,
            "mape": stats[best]["mape"], "mase": stats[best]["mase"], "coverage80": stats[best]["coverage80"],
            "seasonalNaiveMape": stats["seasonal_naive"]["mape"],
            "series": {"start": str(y.index[0]), "end": str(y.index[-1]), "months": len(y), "splicedAt": s["breaks"]},
            "history": hist, "forecast": fut,
            "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        })
        print(name.encode("ascii", "replace").decode(), "best:", best,
              {m: round(stats[m]["mape"], 1) for m in MODELS})

    with (outdir / "forecasts.json").open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    cols = ["commodity", "model", "mape", "mase", "coverage80", "mape_h1", "mape_h2", "mape_h3", "n_forecasts", "n_origins"]
    with (outdir / "metrics.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in rows:
            w.writerow({k: (None if r.get(k) is None else (round(r[k], 3) if isinstance(r[k], float) else r[k])) for k in cols})


if __name__ == "__main__":
    main()
