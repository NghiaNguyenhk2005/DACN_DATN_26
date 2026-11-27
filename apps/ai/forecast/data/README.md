# Dữ liệu Chuỗi Thời Gian Giá Nông Sản (FR12.2)

Thư mục này chứa script sinh dữ liệu giá nông sản **mô phỏng** theo tuần, chỉ dùng để chạy thử pipeline dự báo giá. Dữ liệu này không lấy từ nguồn nào, không dùng đo MAPE và không trích làm số liệu báo cáo; số đo dự báo giá dùng dữ liệu FAOSTAT (`collect_faostat.py`).

## 1. Cấu trúc tệp
- `collect_prices.py`: Script sinh chuỗi giá mô phỏng theo tuần (`random.seed(42)`, xu hướng + mùa vụ + nhiễu).
- `nong_san_prices.csv`: Tệp CSV mô phỏng do script trên sinh ra, từ 2024 đến 2026.

## 2. Định dạng lược đồ (Schema)

| Cột | Ý nghĩa | Ví dụ |
|-----|---------|-------|
| `tuần` | Tuần theo chuẩn ISO 8601 (`YYYY-Www`) | `2024-W01` |
| `mặt hàng` | Tên nông sản chủ lực vùng Lâm Đồng / Tây Nguyên | `Dâu tây Hana Đà Lạt`, `Cà chua bi Cherry đỏ ngọt` |
| `vùng` | Địa bàn vùng trồng | `Đà Lạt`, `Đơn Dương`, `Lạc Dương`, `Đức Trọng` |
| `giá` | Giá nông sản bình quân theo tuần (VNĐ) | `294000` |
| `đơn vị` | Đơn vị tính | `kg` |
| `nguồn` | Nhãn nguồn dữ liệu; luôn là dữ liệu mô phỏng | `mô phỏng (simulated)` |

## 3. Cách chạy
```bash
python3 apps/ai/forecast/data/collect_prices.py
```
Dữ liệu sẽ được kết xuất trực tiếp vào `apps/ai/forecast/data/nong_san_prices.csv`.

