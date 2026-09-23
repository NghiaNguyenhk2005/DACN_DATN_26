# 01 — Nguồn dữ liệu nông sản cho phân tích dữ liệu / mô-đun AI

> File làm việc độc lập, CHƯA merge vào `chapters/`. Mục tiêu: liệt kê nguồn dữ
> liệu nông sản Việt Nam (và một số nguồn quốc tế đối chiếu) có thể dùng làm
> input cho 2 mô-đun AI đã thiết kế ở Ch.3/`sec:thietkeAI`: **FR12.2 dự báo
> nhu cầu/giá** và (gián tiếp) **FR12.1 gợi ý sản phẩm**. Khi merge, nội dung
> này nên vào Ch.2 (`subsec:...` mới, gần business model/kho bãi) hoặc phụ lục
> kỹ thuật ở Ch.4 (`sec:hienthucAI`) — nhóm quyết định vị trí cuối cùng.

## Bối cảnh — vì sao mảng này đáng lưu ý

Kiểm tra `references.bib` hiện tại (32 mục): **không có nguồn dữ liệu dạng
dataset/API nào** — toàn bộ là bài báo, chính sách, lý thuyết. Mô-đun AI dự
báo giá/nhu cầu (FR12.2, mục tiêu MT5) hiện mới có kiến trúc pipeline 5 bước
ở mức lý thuyết, **chưa gắn với nguồn dữ liệu huấn luyện cụ thể nào**. Đây là
khoảng trống thật cần lấp trước khi sang Ch.4 (Hiện thực) và Ch.5 (Đánh giá
AI — accuracy/MAE...).

Kiểm tra nhanh mục "Nông nghiệp" trên Cổng dữ liệu mở quốc gia
(`open.data.gov.vn/group`) tại thời điểm khảo sát: chỉ có **2 bộ dữ liệu** —
xác nhận nguồn mở chuyên biệt cho nông nghiệp tại Việt Nam còn rất hạn chế,
khác hẳn các lĩnh vực khác trên cùng cổng (ví dụ Lao động 109 bộ, Giáo dục 97
bộ).

## Bảng tổng hợp nguồn dữ liệu

| # | Nguồn | Đơn vị quản lý | Loại dữ liệu | Hình thức truy cập | Mức khả dụng cho Farmery |
|---|---|---|---|---|---|
| 1 | **Cổng dữ liệu mở quốc gia** — `data.gov.vn` / `open.data.gov.vn` | Bộ Khoa học và Công nghệ (trước là Bộ TT&TT) | Đa ngành, mục Nông nghiệp hiện chỉ 2 bộ dữ liệu | Tra cứu/tải trực tiếp trên cổng, không có API thống nhất mạnh | Thấp — nghèo nàn cho nông nghiệp, chỉ nên dùng làm nguồn đối chiếu phụ |
| 2 | **Tổng cục Thống kê (GSO/NSO)** — `gso.gov.vn`, `nso.gov.vn` | Bộ Tài chính (GSO sáp nhập) | Diện tích gieo trồng, năng suất, sản lượng theo cây trồng/địa phương/năm; giá trị sản phẩm nông-lâm-thủy sản/ha | Tra cứu bảng số liệu thống kê (`gso.gov.vn/so-lieu-thong-ke`), một số theo chuỗi năm, không có REST API mở công khai | Trung bình — số liệu vĩ mô, tần suất năm/quý, phù hợp làm baseline/feature theo mùa vụ, không đủ mịn (theo ngày) để dự báo giá ngắn hạn |
| 3 | **Hệ thống truy xuất nguồn gốc nông sản quốc gia** — `traceviet.mae.gov.vn` (CheckVN, vận hành chính thức từ 1/7/2026) | Bộ Nông nghiệp và Môi trường (Cục Chuyển đổi số) | Batch/lô hàng, nông hộ, vùng trồng, mã số vùng trồng, cơ sở đóng gói — tính đến giữa 2026 đã có ~18.000-18.500 sản phẩm, hơn 100 nhóm sản phẩm, 24-26/34 tỉnh, ~900 lô hàng, ~550 nông hộ, ~255 vùng trồng | Hệ thống nghiệp vụ nhà nước; dự kiến kết nối 7 CSDL chuyên ngành của Bộ (mã số vùng trồng, cơ sở đóng gói, cơ sở chăn nuôi...). Không phải "dữ liệu mở" tải tự do, nhưng là hình mẫu tham chiếu trực tiếp cho thiết kế `FarmingLog`/QR của Farmery | Cao về mặt tham chiếu thiết kế (schema, mã định danh), thấp về khả năng lấy dữ liệu training trực tiếp (cần thỏa thuận/API riêng nếu có) |
| 4 | **Mã số vùng trồng** — Quyết định 3156/QĐ-BNN-TT (2022), TCCS 774:2020/BVTV | Cục Trồng trọt và Bảo vệ thực vật (Bộ NN&MT) | Danh mục vùng trồng đã cấp mã, cơ sở đóng gói, theo tỉnh/loại cây (đặc biệt cây xuất khẩu: sầu riêng, chuối, thanh long, chanh...) | Công bố theo tỉnh/Chi cục Trồng trọt-BVTV địa phương, một số tỉnh có cổng tra cứu riêng (ví dụ Gia Lai công bố số liệu mã vùng trồng theo đợt) | Trung bình — hữu ích để đối chiếu/xác thực `growing_region` trong ERD hiện có (FR2.1), đặc biệt nếu mở rộng sang xuất khẩu |
| 5 | **Bộ Công Thương / Cục Xuất nhập khẩu** | Bộ Công Thương | Kim ngạch xuất khẩu nông sản theo thị trường/mặt hàng theo tháng (ví dụ số liệu xuất khẩu sang Trung Quốc, thị phần sầu riêng/chuối/sắn...) | Báo cáo định kỳ, thông cáo báo chí; không có API mở | Trung bình — dùng làm dữ liệu ngữ cảnh thị trường cho mô-đun dự báo, không phải dữ liệu giá bán lẻ/sỉ chi tiết |
| 6 | **Sàn TMĐT nông sản đối chứng đã khảo sát ở Ch.3** — FoodMap, VIPO Mall, Buudien.vn | Doanh nghiệp tư nhân/nhà nước | Giá niêm yết công khai trên sàn (có thể thu thập qua crawling công khai nếu điều khoản cho phép) | Không có API chính thức cho bên thứ ba; chỉ xem được qua giao diện web | Thấp-trung bình — có thể dùng để tham chiếu mức giá thị trường tương đương, nhưng rủi ro pháp lý/điều khoản nếu crawl quy mô lớn |
| 7 | **FAO/FAOSTAT, World Bank Open Data** | FAO (Liên Hợp Quốc), World Bank | Sản lượng, xuất-nhập khẩu nông sản theo quốc gia (cấp vĩ mô, không theo tỉnh/huyện) | API mở (FAOSTAT API, World Bank Open Data API), CSV tải trực tiếp | Trung bình — tốt cho đối chiếu quốc tế trong Ch.2/Ch.3 (nghiên cứu gap), không đủ chi tiết cho huấn luyện mô hình dự báo giá nội địa |
| 8 | **Dữ liệu nội sinh của chính Farmery** (giao dịch, tồn kho theo lô, lịch sử giá bán lẻ/bán sỉ) | Farmery tự thu thập qua vận hành | Lịch sử giá thực tế theo sản phẩm/vùng/thời điểm, dữ liệu clickstream (đã liệt kê ở `chuong4-hethong-dexuat.tex`, mục Dữ liệu phân tích và học máy) | Nội bộ, có sẵn ngay khi hệ thống vận hành | Cao nhất về độ khớp nhưng **chỉ có sau khi đã vận hành** — có độ trễ khởi động (cold-start problem) cho mô-đun AI ở giai đoạn đầu MVP |

## Nhận định — khoảng trống và hướng đi thực tế cho Farmery MVP

- **Không có một nguồn mở "sẵn dùng" đủ tốt** để huấn luyện thẳng mô-đun dự
  báo giá/nhu cầu (FR12.2) ngay từ ngày đầu — đây là hạn chế cần nêu thẳng ở
  Ch.5 (đánh giá AI) hoặc Ch.8 (hạn chế), không nên né tránh.
- Hướng thực tế thường dùng ở giai đoạn MVP: kết hợp **(a)** số liệu vĩ mô
  GSO/FAOSTAT làm baseline theo mùa vụ, **(b)** dữ liệu nội sinh của Farmery
  tích lũy dần sau khi vận hành (cold-start bằng heuristic/seasonal naive
  trước, chuyển sang mô hình học máy khi đủ dữ liệu), **(c)** mã số vùng
  trồng/hệ thống truy xuất quốc gia dùng để **chuẩn hóa schema** (không phải
  để lấy dữ liệu training) — khớp với hướng đã chọn ở `subsec:gs1blockchain`
  (định danh theo GS1/mã vùng trồng thay vì tự đặt ra chuẩn riêng).
- Nếu nhóm quyết định mở rộng phạm vi sang thị trường xuất khẩu (xem file
  `02-nhat-ky-canh-tac.md`), nguồn #3, #4 trở thành bắt buộc tham chiếu thay
  vì tùy chọn.

## Việc cần nhóm xác nhận trước khi merge

1. Vị trí đưa nội dung này vào báo cáo: Ch.2 (lý thuyết/khảo sát) hay Ch.4
   (`sec:hienthucAI`, mô tả nguồn dữ liệu thật sẽ dùng)? Đề xuất: cả hai —
   Ch.2 nêu khảo sát nguồn, Ch.4 chốt nguồn thực tế dùng khi hiện thực.
2. Có cần thêm entry vào `references.bib` cho GSO, CheckVN/traceviet.mae.gov.vn,
   Quyết định 3156/QĐ-BNN-TT, FAOSTAT? (đề xuất có — đều là nguồn số liệu cụ
   thể đã trích ở bảng trên).
3. Xác nhận lại số liệu hệ thống truy xuất nguồn gốc quốc gia (18.000 vs
   18.500 sản phẩm, 24 vs 26 tỉnh) — các bài báo tham khảo có chênh lệch nhỏ
   theo thời điểm đăng, cần chọn 1 nguồn/1 mốc thời gian nhất quán khi trích
   dẫn chính thức.
