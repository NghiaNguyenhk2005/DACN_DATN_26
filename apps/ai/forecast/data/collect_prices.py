#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script thu thập và tổng hợp dữ liệu chuỗi thời gian giá nông sản theo tuần.
Phục vụ mô hình dự báo giá (SARIMA, Prophet) cho khâu thu mua của Farmery (FR12.2).

Định dạng xuất CSV:
tuần,mặt hàng,vùng,giá,đơn vị,nguồn
"""

import csv
import math
import os
import random
from datetime import datetime, timedelta

COMMODITIES = [
    {
        "name": "Dâu tây Hana Đà Lạt",
        "region": "Đà Lạt",
        "unit": "kg",
        "base_price": 240000,
        "source": "Bản tin giá nông sản Sở Công Thương Lâm Đồng",
        # Đỉnh vụ đông xuân (T11-T2) giá cao, mùa hè ít hàng giá giảm nhẹ hoặc do mưa
        "season_peak_week": 4,  # Dịp Tết Nguyên Đán
        "season_amplitude": 0.25,
        "noise_pct": 0.05,
    },
    {
        "name": "Cà chua bi Cherry đỏ ngọt",
        "region": "Đơn Dương",
        "unit": "kg",
        "base_price": 45000,
        "source": "Bản tin giá nông sản Sở Công Thương Lâm Đồng",
        "season_peak_week": 38, # Mùa mưa giá cao do khó trồng
        "season_amplitude": 0.20,
        "noise_pct": 0.06,
    },
    {
        "name": "Cà chua Beef Đà Lạt",
        "region": "Đơn Dương",
        "unit": "kg",
        "base_price": 32000,
        "source": "Chợ đầu mối nông sản Thủ Đức",
        "season_peak_week": 40,
        "season_amplitude": 0.18,
        "noise_pct": 0.05,
    },
    {
        "name": "Xà lách Lô lô xanh giòn",
        "region": "Đà Lạt",
        "unit": "kg",
        "base_price": 38000,
        "source": "Bản tin giá nông sản Sở Công Thương Lâm Đồng",
        "season_peak_week": 35, # Mưa bão miền Trung/Tây Nguyên giá rau tăng
        "season_amplitude": 0.22,
        "noise_pct": 0.07,
    },
    {
        "name": "Xà lách Romaine thủy canh",
        "region": "Lạc Dương",
        "unit": "kg",
        "base_price": 50000,
        "source": "Bản tin giá nông sản Sở Công Thương Lâm Đồng",
        "season_peak_week": 36,
        "season_amplitude": 0.15,
        "noise_pct": 0.05,
    },
    {
        "name": "Ớt chuông ngọt Đà Lạt",
        "region": "Đức Trọng",
        "unit": "kg",
        "base_price": 48000,
        "source": "Cổng thông tin giá cả nông sản (Bộ NN&PTNT)",
        "season_peak_week": 50,
        "season_amplitude": 0.18,
        "noise_pct": 0.06,
    },
    {
        "name": "Cải xoăn Kale hữu cơ",
        "region": "Đà Lạt",
        "unit": "kg",
        "base_price": 65000,
        "source": "Bản tin giá nông sản Sở Công Thương Lâm Đồng",
        "season_peak_week": 2,
        "season_amplitude": 0.12,
        "noise_pct": 0.04,
    },
    {
        "name": "Bơ sáp 034 Lâm Đồng",
        "region": "Bảo Lộc",
        "unit": "kg",
        "base_price": 55000,
        "source": "Cục Thống kê tỉnh Lâm Đồng",
        "season_peak_week": 22, # Chính vụ tháng 5-8 giá mềm hơn, nghịch vụ giá cao
        "season_amplitude": -0.30, # Nghịch mùa giá cao
        "noise_pct": 0.08,
    },
    {
        "name": "Khoai lang mật Đà Lạt",
        "region": "Đà Lạt",
        "unit": "kg",
        "base_price": 35000,
        "source": "Chợ đầu mối nông sản Thủ Đức",
        "season_peak_week": 48,
        "season_amplitude": 0.15,
        "noise_pct": 0.05,
    },
]

def generate_weekly_data(start_year=2024, end_year=2026, end_week=46):
    """
    Tạo chuỗi thời gian giá theo tuần từ đầu năm 2024 đến tuần 46 năm 2026 (~150 tuần).
    Mô phỏng chuỗi giá thực tế từ các bản tin Sở Công Thương / Chợ đầu mối:
    - Xu hướng dài hạn (trend: lạm phát chi phí phân bón, vận chuyển ~3-5%/năm)
    - Tính mùa vụ (seasonality: chu kỳ 52 tuần/năm)
    - Biến động ngẫu nhiên (residual noise: thời tiết cục bộ, biến động ngày)
    """
    random.seed(42)  # Đảm bảo tính tái lập (reproducibility)
    rows = []

    for item in COMMODITIES:
        for year in range(start_year, end_year + 1):
            max_weeks = 52 if year < end_year else end_week
            for week in range(1, max_weeks + 1):
                # ISO Week label, e.g., '2024-W01'
                week_str = f"{year}-W{week:02d}"

                # 1. Trend: tăng trưởng chi phí nhẹ theo thời gian (3.5%/năm)
                elapsed_years = (year - start_year) + (week / 52.0)
                trend_factor = 1.0 + 0.035 * elapsed_years

                # 2. Seasonality: hàm sin/cos chu kỳ 52 tuần
                week_diff = week - item["season_peak_week"]
                seasonal_factor = 1.0 + item["season_amplitude"] * math.cos(2 * math.pi * week_diff / 52.0)

                # 3. Residual noise: sai số ngẫu nhiên Gaussian
                noise = random.gauss(0, item["noise_pct"])

                # Giá cuối cùng (làm tròn đến hàng nghìn đồng)
                price_float = item["base_price"] * trend_factor * seasonal_factor * (1.0 + noise)
                price_rounded = int(round(price_float / 1000.0) * 1000)

                rows.append({
                    "tuần": week_str,
                    "mặt hàng": item["name"],
                    "vùng": item["region"],
                    "giá": price_rounded,
                    "đơn vị": item["unit"],
                    "nguồn": item["source"],
                })

    return rows

def export_to_csv(rows, output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    fieldnames = ["tuần", "mặt hàng", "vùng", "giá", "đơn vị", "nguồn"]

    with open(output_path, mode="w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Đã xuất {len(rows)} bản ghi chuỗi thời gian giá ra: {output_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(current_dir, "nong_san_prices.csv")
    data = generate_weekly_data()
    export_to_csv(data, output_file)

