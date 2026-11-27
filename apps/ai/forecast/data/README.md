# Dữ liệu Chuỗi Thời Gian Giá Nông Sản (FR12.2)

Thư mục này chứa script thu thập, tổng hợp và dữ liệu giá nông sản theo tuần phục vụ huấn luyện và đánh giá mô hình dự báo giá (SARIMA, Prophet) chạy offline cho khâu thu mua của Farmery.

## 1. Cấu trúc tệp
- `collect_prices.py`: Script thu thập và mô phỏng chuỗi giá theo tuần dựa trên bản tin giá nông sản thực tế.
- `nong_san_prices.csv`: Tệp dữ liệu CSV kết xuất chuỗi thời gian giá theo tuần từ 2024 đến 2026.

## 2. Định dạng lược đồ (Schema)

| Cột | Ý nghĩa | Ví dụ |
|-----|---------|-------|
| `tuần` | Tuần theo chuẩn ISO 8601 (`YYYY-Www`) | `2024-W01` |
| `mặt hàng` | Tên nông sản chủ lực vùng Lâm Đồng / Tây Nguyên | `Dâu tây Hana Đà Lạt`, `Cà chua bi Cherry đỏ ngọt` |
| `vùng` | Địa bàn vùng trồng | `Đà Lạt`, `Đơn Dương`, `Lạc Dương`, `Đức Trọng` |
| `giá` | Giá nông sản bình quân theo tuần (VNĐ) | `294000` |
| `đơn vị` | Đơn vị tính | `kg` |
| `nguồn` | Cơ quan / nguồn công bố dữ liệu | `Bản tin giá nông sản Sở Công Thương Lâm Đồng` |

## 3. Cách chạy
```bash
python3 apps/ai/forecast/data/collect_prices.py
```
Dữ liệu sẽ được kết xuất trực tiếp vào `apps/ai/forecast/data/nong_san_prices.csv`.

