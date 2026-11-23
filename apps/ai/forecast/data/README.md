# Dữ liệu giá nông sản cho dự báo giá (FR12.2)

Dự báo theo **tháng**, nguồn thật là FAOSTAT. Tệp mô phỏng chỉ để thử pipeline.

## Tệp

| Tệp | Là gì | Dùng để |
|---|---|---|
| `collect_faostat.py` | Trích chuỗi tháng của Việt Nam từ gói FAOSTAT Producer Prices (đồng trên tấn) | Sinh `faostat_vn_monthly.csv` |
| `faostat_vn_monthly.csv` | Dữ liệu THẬT: khoai tây, nấm, chè, cà phê; cột `month, commodity, price, unit, source` | Huấn luyện và đo MAPE |
| `collect_prices.py` | Script SINH dữ liệu giả theo tuần (`random.seed(42)`), không lấy từ nguồn nào | Chỉ thử pipeline |
| `nong_san_prices.csv` | Đầu ra của `collect_prices.py`; cột nguồn là `mô phỏng (simulated)` | Không đo MAPE, không trích làm số liệu |

## Chạy lại dữ liệu thật

```bash
python collect_faostat.py                      # tải gói FAOSTAT (11,7 MB) vào .cache/ rồi trích
python collect_faostat.py duong/dan/toi/Prices_E_All_Data_(Normalized).zip   # dùng tệp đã có
```

## Giới hạn cần ghi vào báo cáo

- Chỉ bốn mặt hàng khớp sản phẩm Farmery (khoai tây, nấm, chè, cà phê). Dâu tây, cà chua, xà lách, ớt chuông, bơ
  không có trong FAOSTAT.
- Giá nhà sản xuất cấp quốc gia, không phải giá Đà Lạt. Dữ liệu dừng ở 01/2025.
- Đầu chuỗi có 4 điểm theo quý (2011); chuỗi tháng liên tục bắt đầu từ 12/2011 (khoai tây, chè, cà phê: 158 tháng)
  và 01/2013 (nấm: 145 tháng).
- **Gãy mức giá chưa rõ nguyên nhân giữa 12/2021 và 01/2022** dù mọi dòng đều mang cờ chính thức `A`: cà phê
  36,1 triệu xuống 13,7 triệu đồng/tấn (USD/tấn 1.386 xuống 604), chè 24,4 triệu xuống 9,3 triệu, nấm 30,2 triệu lên
  113,9 triệu. Chè còn một bước nhảy nữa ở 01/2021. Khoai tây không bị. Nên đọc siêu dữ liệu của FAOSTAT để biết có
  đổi phương pháp khảo sát không. `run_forecast.py` nối chuỗi tại điểm gãy (`--splice-threshold`, mặc định 0,5);
  `results/raw/` là kết quả khi tắt nối.
