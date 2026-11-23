# Dự báo giá nông sản theo tháng (FR12.2)

Chạy offline, không có endpoint, không có trang admin. Đầu ra dùng cho Chương 7.

## Chạy

```bash
python -m venv .venv && .venv/Scripts/activate        # Windows; Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python data/collect_faostat.py                         # tải và trích dữ liệu thật
python run_forecast.py                                 # ~1 phút; ghi results/forecasts.json và results/metrics.csv
python run_forecast.py --splice-threshold 0 --outdir results/raw   # chuỗi thô, không nối điểm gãy
```

## Phương pháp

- Bốn mô hình: seasonal naive (mốc), SARIMA(1,1,1)(0,1,1)12 trên log giá, Prophet, LightGBM (mỗi tầm một mô hình,
  hồi quy phân vị 10% và 90% cho khoảng tin cậy). Bậc SARIMA và tham số LightGBM đặt cố định trước, không chỉnh theo
  tập kiểm tra.
- Kiểm tra ngược rolling-origin: 16 lần dự báo, mỗi lần huấn luyện trên phần đầu chuỗi rồi dự báo 3 tháng kế tiếp,
  lùi từ cuối chuỗi, bước 3 tháng (48 điểm kiểm tra mỗi mặt hàng). Mỗi mô hình được huấn luyện lại ở mỗi lần.
- Chỉ số: MAPE (gộp ba tầm, tính từng tầm), MASE so với seasonal naive trong mẫu huấn luyện, độ phủ khoảng 80%.
- Mô hình chọn cho từng mặt hàng là mô hình có MAPE thấp nhất; dự báo cuối huấn luyện trên toàn chuỗi cho 3 tháng sau
  điểm cuối (02–04/2025, đã thuộc quá khứ).
- Gãy mức giá ở FAOSTAT (xem `data/README.md`) được nối tại điểm gãy trước khi mô hình hóa. Báo cáo phải nêu rõ.

## Hạn chế đã biết

- MAPE trên chuỗi đã nối thấp hơn thực tế của chuỗi thô. So sánh hai thư mục `results/` và `results/raw/`.
- Khoảng tin cậy của Prophet và LightGBM phủ dưới 80%; của SARIMA phủ trên 80%. LightGBM có thể cho khoảng suy biến
  (cận trên bằng giá dự báo) khi phân vị 90% nhỏ hơn dự báo trung tâm.
- Chưa có biểu đồ; cần cho Chương 7.
