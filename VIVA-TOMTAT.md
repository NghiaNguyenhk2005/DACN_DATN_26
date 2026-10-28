# VIVA-TOMTAT — Tài liệu ôn bảo vệ đồ án Farmery

Soạn 2026-10-28 (mở rộng cùng ngày; đồng bộ lại với báo cáo 286 trang cùng ngày sau khi thống nhất ba nhãn trạng thái) từ: `report/chapters/chuong1..8`, `report/backmatter/*`, `report/schema.dbml`, `MVP.md`, `NOTES.md`,
`DECISIONS.md`, và mã `apps/` + `packages/contract/openapi.yaml`. Nội dung chỉ đọc, không sửa báo cáo/mã.
Số mục kiểu "5.3.1" suy từ thứ tự mục trong LaTeX (các mục 5.3.1, 5.3.3, 5.3.4, 6.1.3, 6.2 có trong `DECISIONS.md`/`kehoach.tex`); có thể lệch 1 so với bản PDF, nên mở PDF đối chiếu trước khi trích số mục.
Ký hiệu nguồn: `Ch4 §4.1.2` = chương 4, mục 4.1.2; `PL-L` = Phụ lục L; `tab:` / `fig:` = nhãn LaTeX.
Ba nhãn của báo cáo (định nghĩa ở Ch4 §4.3.1, thống nhất toàn báo cáo): **Đã hiện thực** (mục không ghi chú) / **Chỉ thiết kế** (đặc tả đầy đủ nhưng cố ý không làm trong đồ án) / **Để sau prototype** (thuộc MVP hoặc đã cam kết, chưa làm ở prototype, sẽ làm khi có điều kiện nêu ở `tab:chi-thiet-ke`).
Nhãn dùng trong file này (hiện trạng mã 28/10): **[Hiện thực]** = chạy trên API thật; **[Giao diện]** = nhãn riêng của file viva: giao diện dựng theo hợp đồng nhưng API còn 501; **[Để sau prototype]** = đúng nhãn báo cáo; **[Chỉ thiết kế]** = đúng nhãn báo cáo (cố ý không làm); **[Chưa có mã]** = nhãn riêng của file viva: thuộc bản nộp (báo cáo không gắn nhãn) nhưng chưa có mã ở prototype; **[Ngoài phạm vi]** = hướng phát triển (Ch8). Chỉ hai nhãn "Chỉ thiết kế" và "Để sau prototype" được phép nói với hội đồng như nhãn của báo cáo.
Phần hỏi đáp dài: xem `VIVA-HOI-DAP.md` (100 câu). File này chỉ giữ câu hỏi hội đồng ngắn mỗi chương và 10 câu khó.

## Mục lục

| Phần | Nội dung |
|---|---|
| 0 | Sống còn trong 60 giây |
| 1 | Tóm tắt từng chương và từng mục (Ch1–Ch8 + bảng vai trò phụ lục + tóm tắt phụ lục quan trọng) |
| 2 | Cheat-sheet: khái niệm, quyết định then chốt, số liệu hay bị hỏi |
| 3 | Danh mục luồng nghiệp vụ (A hiện thực, B chỉ thiết kế và để sau prototype, C ngoài phạm vi, D sơ đồ ASCII, E các bước chi tiết từng luồng) |
| 4 | 10 câu hỏi khó và cách đáp |
| 5 | Điểm yếu cần biết trước (TODO, chưa hiện thực, mock, mâu thuẫn tài liệu) |
| 6 | Độ không chắc và danh sách "cần xác nhận" |
| 7 | **Bản đồ hệ thống một trang**: tác nhân, 13 mô-đun/schema/bảng/FR/trạng thái, 7 container, 10 hệ thống ngoài (5 phạm vi MVP + 5 chỉ thiết kế) |
| 8 | Bảng tra nhanh: FR → use case → mô-đun → bảng; thuật ngữ; số liệu có nguồn; 17 sự kiện |
| 9 | Kế hoạch, nhịp thời gian, phân công |

---

## 0. Sống còn trong 60 giây

- **Farmery** = sàn nông sản chạy **hai luồng trên cùng nguồn cung** (Ch1 §1.2.1, Ch4 `tab:hailuong`):
  - **Bán sỉ (3P):** nhà cung cấp tự bán cho **doanh nghiệp mua sỉ**, Farmery thu hoa hồng, nhà cung cấp giữ hàng.
  - **Bán lẻ (1P):** Farmery **thu mua theo lô** (đơn thu mua) rồi bán lại cho người tiêu dùng, gánh rủi ro tồn kho.
- **Điểm mới so với sàn thường:** truy xuất QR theo lô gắn nhật ký canh tác bất biến; **dòng tồn** tách chủ sở hữu; chống bán vượt bằng khóa dòng; giao ba chặng; AI chạy được khi chưa có dữ liệu.
- **Kiến trúc:** modular monolith 13 mô-đun / 13 schema / 65 bảng, riêng **dịch vụ AI (Python/FastAPI)** tách ngoài (Ch5 §5.3.1; ERD: 65 bảng, 565 cột, 48 khóa ngoại).
- **Thật thà về trạng thái (28/10):** thiết kế gần đủ; hiện thực mới chạy **một nửa hợp đồng API (20/40 thao tác)**; Ch6 và Ch7 chưa có số đo; Ch8 §8.1 còn TODO. Xem phần 5. Báo cáo hiện **286 trang** (`main.pdf`). Bản đồ hệ thống một trang ở phần 7; bảng tra nhanh ở phần 8.

---

## 1. Tóm tắt từng chương

### Chương 1 — Giới thiệu (`chuong1-gioithieu.tex`)

- Bối cảnh: nông sản qua 4–5 khâu trung gian, giá thành đội 30–40% (nguồn `tapchicongthuong_ipsard_2023_2024`); hao hụt trái cây 35–40%, rau quả toàn ngành 20–40% tương ứng 3,5–4,1 tỷ USD/năm (§1.1.3, V3).
- **Bốn vấn đề V1–V4:** cung dồn mùa vụ; thiếu kênh tiêu thụ; hao hụt/thiếu kho lạnh; thiếu minh bạch nguồn gốc (bất cân xứng thông tin). Ánh xạ sang giải pháp ở PL-F.
- **Bảy mục tiêu MT1–MT7:** chứng nhận; QR truy xuất; bán sỉ tối giản; bán lẻ 1P (thu mua → định giá); trục bán lẻ khách hàng; AI; công cụ quản trị (§1.2.2).
- Phạm vi: nguồn cung Lâm Đồng, bán lẻ TP.HCM (~300 km, xe lạnh); bán sỉ toàn quốc; dữ liệu thử nghiệm là **dữ liệu mô phỏng** (§1.3).
- **Ba mức hiện thực:** trục chính làm sâu / nguồn hàng rút gọn / bán sỉ tối giản (§1.3.4). Giới hạn kỹ thuật: xác minh chứng nhận thủ công, không blockchain, không đội giao riêng, thanh toán/hóa đơn ở môi trường thử, không app di động gốc, không nối TraceViet. Trạng thái từng yêu cầu ghi bằng ba nhãn: đã hiện thực / chỉ thiết kế / để sau prototype.
- Nguyên tắc chọn phạm vi: cái gì **không đo được bằng số thì đưa sang hướng phát triển** (§1.2.3).

**Theo từng mục**

| Mục | Nội dung chính |
|---|---|
| §1.1.1 Bối cảnh và thực trạng | Nông sản qua 4–5 khâu trung gian, giá bán đội 30–40%; nông hộ nhỏ bị ép giá, người mua không biết nguồn gốc. |
| §1.1.2 Đặc thù nông sản | Mau hỏng, theo mùa, chất lượng không đồng đều giữa lô, người mua không tự kiểm chứng: lý do không thể áp nguyên mô hình sàn hàng khô. |
| §1.1.3 Vấn đề cần giải quyết | V1 cung dồn mùa vụ; V2 thiếu kênh tiêu thụ; V3 hao hụt/thiếu kho lạnh (rau quả 20–40%, trái cây 35–40%); V4 thiếu minh bạch nguồn gốc. |
| §1.2.1 Mục tiêu tổng quát | Sàn hai luồng (sỉ 3P + lẻ 1P) cùng nguồn cung, có truy xuất QR và AI hỗ trợ. |
| §1.2.2 Mục tiêu cụ thể | MT1 chứng nhận; MT2 QR truy xuất; MT3 bán sỉ tối giản; MT4 bán lẻ 1P (thu mua → định giá); MT5 trục bán lẻ cho khách hàng; MT6 AI; MT7 công cụ quản trị. |
| §1.2.3 Mục tiêu đánh giá | Mỗi mục tiêu phải đo được; cái gì không đo bằng số thì đưa sang hướng phát triển; ngưỡng đặt trước (PL-L). |
| §1.3.1–1.3.2 Phạm vi không gian, thời gian | Nguồn cung Lâm Đồng, bán lẻ TP.HCM (~300 km, xe lạnh), bán sỉ toàn quốc; số liệu/chính sách 2020–2026; dữ liệu thử nghiệm là dữ liệu mô phỏng. |
| §1.3.3 Phạm vi nội dung | 13 nhóm chức năng, hai ứng dụng (mua hàng PWA, nội bộ), ba tính năng AI. |
| §1.3.4 Phạm vi hiện thực | Ba mức làm sâu: trục bán lẻ / nguồn hàng rút gọn / bán sỉ tối giản. Trạng thái từng yêu cầu ghi bằng ba nhãn: *đã hiện thực*, *chỉ thiết kế* (đặc tả đầy đủ, cố ý không làm), *để sau prototype* (thuộc MVP, chưa làm ở prototype). Ba mức trả lời "làm sâu đến đâu", ba nhãn trả lời "đã làm chưa". |
| §1.3.5 Giới hạn kỹ thuật | Xác minh chứng nhận thủ công; không blockchain; không đội giao riêng; thanh toán, hóa đơn ở môi trường thử/giả lập; không app di động gốc; không nối TraceViet. |
| §1.4 Ý nghĩa | Thực tiễn: rút ngắn chuỗi, minh bạch nguồn gốc, hỗ trợ nông hộ. Khoa học: mô hình 3P+1P cho hàng tươi, truy xuất không blockchain, AI khi thiếu dữ liệu. |
| §1.5 Cấu trúc báo cáo | Mô tả 8 chương + phụ lục. |

**Thông điệp cốt lõi:** vấn đề là chuỗi trung gian + thiếu niềm tin; Farmery giải bằng hai luồng bổ trợ + truy xuất QR, và chỉ cam kết những gì kiểm chứng được.

**Câu hỏi hội đồng**
1. *Vì sao ghép sỉ và lẻ mà không làm một luồng?* — Nhà cung cấp nhỏ giỏi giao lô lớn nhưng không đóng gói/giao từng đơn vài kg; 1P gánh phần việc đó (Ch4 §4.1.1), 3P giữ nhà cung cấp tự định giá. Đánh đổi nêu thẳng: vốn lưu động + rủi ro tồn kho (`tab:hailuong`).
2. *Số liệu 30–40% / 35–40% lấy đâu?* — Đã kiểm lại 6 nguồn rủi ro cao bằng truy cập trực tiếp, khớp 100% (`NOTES.md`, mục rà Ch1–3 ngày 15/09).
3. *Phạm vi có quá rộng cho một học kỳ?* — Có, nên chia ba mức, ghi nhãn *(chỉ thiết kế)* hoặc *(để sau prototype)* trong từng FR và có `tab:chi-thiet-ke`; đo bằng `MVP.md`.

### Chương 2 — Kiến thức nền tảng (`chuong2-kienthuc-nentang.tex`)

- **Bốn khác biệt của nông sản** (§2.1.2): mau hỏng; nguồn cung theo mùa; chất lượng không đồng đều giữa lô; người mua không tự kiểm chứng được chất lượng. Đối chiếu 9 tiêu chí ở PL-G.
- Chính sách/chuẩn: VietGAP (~70 tiêu chí), GlobalGAP (252 tiêu chuẩn: 36/127/89); OCOP; QĐ 749/QĐ-TTg, NQ 57-NQ/TW; bảng pháp lý `tab:phaply` (Luật TMĐT 122/2025 hiệu lực 1/7/2026, NĐ 248/2026, Luật BVDLCN 91/2025, NĐ 117/2025, NĐ 70/2025...).
- Lý thuyết: hai trục TMĐT (bên giao dịch × ai **sở hữu hàng**: 3P/1P); chuỗi cung ứng ngắn; GS1; **vì sao không blockchain** (chỉ bảo đảm không sửa *sau khi ghi*, không xác minh dữ liệu vào; rào cản người dùng; ví dụ Walmart–IBM có tiền đề Farmery không có); bất cân xứng thông tin (Akerlof 1970); RBAC; escrow; FEFO; 3PL.
- **TraceViet** (Bộ NN&MT, ra mắt 26/12/2025): chuẩn kết nối chỉ mô tả chiều *đẩy* dữ liệu XML ký số; không có giao diện tra cứu cho bên ngoài → Farmery chỉ thiết kế lớp tích hợp.
- Ba bài toán AI: tìm kiếm ngữ nghĩa lai (RRF), gợi ý (content-based trước), dự báo giá (chuỗi thời gian); **giám sát bất thường bằng luật ngưỡng, không học máy** vì thiếu lưu lượng và nhãn.

**Theo từng mục**

| Mục | Nội dung chính |
|---|---|
| §2.1.1 Phạm vi khái niệm nông sản | Nông sản chưa chế biến/sơ chế nhẹ là đối tượng; danh mục lá đóng và danh sách loại trừ (nền cho L1–L2 ở Ch4). |
| §2.1.2 Nông sản khác hàng hóa thông thường | Bốn khác biệt: mau hỏng; theo mùa; chất lượng không đồng đều; người mua không tự kiểm chứng. Đối chiếu 9 tiêu chí ở PL-G. |
| §2.1.3 Chứng nhận và giấy tờ | VietGAP (~70 tiêu chí), GlobalGAP (252 tiêu chuẩn: 36/127/89), OCOP, mã số vùng trồng; PL-H, PL-P. |
| §2.1.4 Nhật ký canh tác cho xuất khẩu | Thảo luận khoảng cách với thị trường xuất khẩu: ba việc còn thiếu (PL-N) → chuyển sang Ch8. |
| §2.2 Bối cảnh chính sách, tiêu chuẩn | QĐ 749/QĐ-TTg, NQ 57-NQ/TW; bảng pháp lý `tab:phaply` (Luật TMĐT 2025, NĐ 248/2026, Luật BVDLCN 2025, NĐ 117/2025, NĐ 70/2025...). |
| §2.3.1 Hai trục TMĐT | Trục 1 bên giao dịch (B2B/B2C); trục 2 ai sở hữu hàng (3P marketplace / 1P bán lại): cơ sở của mô hình hai luồng. |
| §2.3.2 Chuỗi cung ứng ngắn (SFSC) | Disintermediation: cắt khâu trung gian nhưng nông hộ nhỏ vẫn thiếu năng lực đóng gói. |
| §2.3.3 Truy xuất GS1 và blockchain | GS1 làm nguyên lý định danh; blockchain chỉ bảo đảm không sửa sau khi ghi, không xác minh dữ liệu vào → không dùng. |
| §2.3.4 Nguồn dữ liệu cho AI | Giá công khai theo tuần (PL-O); TraceViet (26/12/2025) chỉ mô tả chiều đẩy XML ký số, chưa có tra cứu cho bên ngoài. |
| §2.3.5 Uy tín, bất cân xứng thông tin | Akerlof 1970; điểm uy tín, đánh giá có xác thực mua hàng; cơ sở NC1. |
| §2.3.6 Nền tảng công nghệ | Kiến trúc web, RBAC, cổng thanh toán trung gian, escrow (do cổng giữ tiền, Farmery không giữ). |
| §2.3.7 Mô hình doanh thu | Hoa hồng sỉ, biên lợi nhuận lẻ, phí dịch vụ; gói hiển thị "Tài trợ" là hướng phát triển. |
| §2.3.8 Tồn kho hàng dễ hư và 3PL | FEFO, hao hụt, kho lạnh, giao chặng cuối qua 3PL. |
| §2.4.1–2.4.4 AI | Tìm kiếm ngữ nghĩa lai (FTS + vector, RRF); gợi ý (content-based trước, thiếu dữ liệu tương tác); dự báo giá chuỗi thời gian (SARIMA/Prophet); giám sát bất thường **bằng luật ngưỡng, không học máy**. |
| §2.5 Kết chương | Tổng hợp: đặc thù nông sản là gốc của mọi quyết định thiết kế. |

**Thông điệp cốt lõi:** đặc thù nông sản (mau hỏng, theo mùa, khó kiểm chứng) là *gốc* của mọi quyết định thiết kế, không phải trang trí.

**Câu hỏi hội đồng**
1. *Vì sao không dùng blockchain cho truy xuất?* — Blockchain chỉ khóa dữ liệu sau khi ghi, không xác minh dữ liệu nhập; nông dân vẫn nhập tay. Farmery dùng CSDL tập trung + nguyên lý GS1 + **kiểm duyệt người** + nhật ký chỉ nối thêm (NFR9.1). Lập luận dựa rào cản áp dụng, không dựa chi phí hạ tầng (đã sửa 24/09, `DECISIONS.md`).
2. *Vì sao giám sát bất thường chỉ dùng luật ngưỡng?* — Học máy cần lưu lượng thật và tập nhãn gian lận; chưa có cả hai, không đo được → trái nguyên tắc §1.2.3. Mọi phán quyết của kiểm duyệt viên được tích lũy làm nhãn cho giai đoạn sau (Ch4 §4.3.3, mục dữ liệu phân tích).
3. *Có đọc kỹ pháp luật không?* — Ba điểm viết dè dặt vì chưa rõ: khấu trừ thuế với nông dân tự sản xuất; hiệu lực NĐ 46/2026 (đang tạm ngưng); ngưỡng doanh thu không chịu thuế (để cấu hình, không ghi cứng).

### Chương 3 — Công trình liên quan (`chuong3-congtrinh-lienquan.tex`)

- Bốn nghiên cứu: Morepje 2024 (nông hộ nhỏ cần giao diện đơn giản, nền tảng thuần trung gian không giải quyết đóng gói); Keogh 2020 (GS1 + blockchain không tự giải bất cân xứng); Tran 2023 (hạn chế học máy dự báo giá: phụ thuộc độ dài dữ liệu); **Farm2Market 2025** (gần nhất, ~82% độ chính xác dự báo, mới ở mức đề xuất).
- Nền tảng trong nước/quốc tế so theo cùng tiêu chí (`tab:researchgap`). Dòng Farmery trong bảng ghi: hai kênh song song trên cùng nguồn cung; truy xuất gắn nhật ký canh tác; **kiểm duyệt chứng nhận ba tầng** (định dạng mã vùng trồng, đối chiếu cổng công bố, duyệt thủ công); ba mô-đun AI.
- **Vì sao các sàn chưa làm (N1–N4):** phí sàn không khớp hàng tươi; vốn + kho lạnh; né tồn kho bằng thiết kế khác (Pinduoduo mua chung, e-Choupal); chuyên một phía (Ninjacart chỉ B2B, FoodMap thiếu đàm phán sỉ).
- Farmery thừa nhận ba đánh đổi: vốn lưu động, lỗ trực tiếp với lô không bán hết, vận hành hai mô hình.

**Theo từng mục**

| Mục | Nội dung chính |
|---|---|
| §3.1 Các nghiên cứu liên quan | Bốn nghiên cứu: hiệu quả TMĐT với nông hộ nhỏ (Morepje 2024); chuẩn định danh GS1 (Keogh 2020); ML dự báo giá (Tran 2023); đề xuất tích hợp gần nhất (Farm2Market 2025, ~82%). |
| §3.2.1 Sàn trong nước | So theo cùng tiêu chí ở `tab:researchgap` (sàn tổng hợp, nền tảng nông sản chuyên biệt). |
| §3.2.2 Nền tảng quốc tế | Ninjacart (chỉ B2B), Pinduoduo (mua chung), e-Choupal và các mô hình tương tự. |
| §3.3 Vì sao chưa đi theo hướng này | N1 phí sàn không khớp hàng tươi; N2 cần vốn + kho lạnh; N3 né tồn kho bằng thiết kế khác; N4 chuyên một phía. Farmery thừa nhận ba đánh đổi: vốn lưu động, lỗ khi lô không bán hết, vận hành hai mô hình. |
| §3.4 Kết chương | Khoảng trống = kết hợp 3P + 1P cho hàng tươi có truy xuất. |

**Thông điệp cốt lõi:** khoảng trống là *kết hợp 3P + 1P cho hàng tươi có truy xuất*; không sàn nào ở đủ hai phía.

**Câu hỏi hội đồng**
1. *Nếu hay thì sao Shopee/Lazada không làm?* — N1–N2 (§3.3): chi phí xử lý mỗi đơn hàng tươi cao, khiếu nại nhiều, cần vốn + kho lạnh. Farmery chỉ chấp nhận được nhờ phạm vi thí điểm hẹp.
2. *Điểm khác Farm2Market?* — Farm2Market chưa có dữ liệu vận hành và không phục vụ song song sỉ + lẻ; Farmery lấy mốc ~82% để đặt ngưỡng MAPE < 20% (PL-L).
3. *Tài liệu tham khảo có đủ mới không?* — Số liệu/chính sách giai đoạn 2020–2026 (§1.3.2); nguồn pháp lý cập nhật tới 2026.

### Chương 4 — Hệ thống đề xuất (`chuong4-hethong-dexuat.tex`)

- **§4.1 Ngữ cảnh nghiệp vụ:** mô hình kinh doanh (BMC, điều kiện hòa vốn 1P: `p − g ≥ h/(1−h)·g + c_đg + c_vh/q`; hao hụt 20–40% → số hạng hao hụt bằng 25–67% giá mua); **10 quy trình** kèm quy tắc + ngoại lệ (xem phần 3); chính sách pháp lý (§4.1.3).
- **§4.2 Mô tả hệ thống:** 5 khối chức năng; 2 ứng dụng (mua hàng PWA, nội bộ); 3 nhóm ngoài + **sáu vai trò nội bộ**; persona và journey; vấn đề nghiên cứu **NC1–NC5**; 3 thách thức hệ thống.
- **§4.3 Yêu cầu:** **FR1–FR13**, **NFR1–NFR9**, yêu cầu dữ liệu. 13 nhóm FR: **11 Must, 2 Should** (tương tác, AI), không Could; chỉ dự báo giá ở mức Challenging (PL-M).
- **`tab:chi-thiet-ke`** chia hai nhóm (xem phần 3.B): **Chỉ thiết kế** (9 hàng: Google/Facebook; SMS; hóa đơn điện tử thật; ký số; ký quỹ, giao nhiều đợt, khấu trừ thuế; xe gom chặng đầu; sơ chế nhiều bước, kiểm kê; gợi ý cá nhân hóa, tìm NCC theo ngữ nghĩa; TraceViet) và **Để sau prototype** (6 hàng: Web Push của FR11.1; FR5.5+FR5.7; FR5.3+FR9.2+FR4.7; FR10.4+FR2.2; FR11.2+nhắc gia hạn của FR3.3; các khâu kiểm duyệt, nghiệm thu, đổi trả chưa nối API). Ghi thẳng ở từng FR: đăng nhập bằng số điện thoại (FR1.1) và đối chiếu khuôn mặt tự động (FR1.4) là *chỉ thiết kế*. 5 mã đã rút khỏi bộ FR: FR4.8 TraceViet, FR6.6 ký số, FR11.3 khan hiếm, FR13.5 thuê kho, FR13.7 chào sỉ tồn dư.
- **Bốn lớp bảo đảm "đúng là nông sản" (L1–L4):** danh mục lá đóng; danh sách loại trừ; kiểm duyệt trước hiển thị; hậu kiểm bằng báo cáo của người mua (L4, báo cáo sai danh mục FR4.7: để sau prototype).

**Theo từng mục**

| Mục | Nội dung chính |
|---|---|
| §4.1.1 Mô hình kinh doanh (BMC) | Hai luồng: 3P (hoa hồng, nhà cung cấp giữ hàng) và 1P (thu mua → bán lại, gánh tồn kho); điều kiện hòa vốn 1P `p − g ≥ h/(1−h)·g + c_đg + c_vh/q`; hao hụt 20–40% → số hạng hao hụt bằng 25–67% giá mua; BMC đầy đủ ở PL-E. |
| §4.1.2 Quy trình và quy tắc (10 quy trình) | Đăng ký/xác thực NCC; đăng + kiểm duyệt sản phẩm, sinh QR; thu mua vào kho; bán lẻ; đánh giá; bán sỉ; tồn kho theo dòng tồn; giao ba chặng; đổi trả–hoàn tiền–khiếu nại; quản trị. Mỗi quy trình có quy tắc + ngoại lệ (chi tiết từng bước ở phần 3 và 10). |
| §4.1.2 (cuối) Kiểm duyệt ba giai đoạn | `tab:kiemduyet-giaidoan`. **Trước giao hàng:** hồ sơ NCC, eKYC, chứng nhận (kiểm duyệt viên, 5 ngày làm việc, *Để sau prototype*; eKYC = duyệt thủ công ảnh giấy tờ, đối chiếu khuôn mặt tự động *chỉ thiết kế*); sản phẩm L1-L4 (L1-L3 trong thiết kế, L4 báo cáo sai danh mục *để sau prototype*); **lô hàng (mặc định 48 giờ, cấu hình được; Đã hiện thực)**; nghiệm thu nhập kho (*Để sau prototype*). **Trong giao hàng:** nhân viên chuyển trạng thái đơn (Đã hiện thực); kiểm khi xuất kho, bàn giao 3PL (*Chỉ thiết kế*). **Sau giao hàng:** khiếu nại-đổi trả; đánh giá nghi vấn-báo cáo sai danh mục; vi phạm-thu hồi lô (cả ba *Để sau prototype*). |
| §4.1.3 Chính sách, pháp lý, đạo đức | Tuân thủ Luật TMĐT 2025 (vừa 1P vừa sàn 3P); "xác nhận giao kết" theo Luật GDĐT 2023 Đ22–23; ToS ở PL-D, bộ chính sách ở PL-U. |
| §4.2.1 Tổng quan hệ thống | Farmery là gì; 5 khối chức năng (nền tảng chung / nguồn cung / giao dịch / sau bán / vận hành); kênh truy cập (PWA + ứng dụng nội bộ); tác nhân và nhóm người dùng (3 nhóm ngoài + sáu vai trò nội bộ); **10 hệ thống bên ngoài = 5 thuộc phạm vi MVP + 5 chỉ thiết kế** (mã hiện có 2 đứng sau interface kèm bản giả, 3 để sau prototype); luồng tiếp cận; **4 persona** (nhà cung cấp, khách sỉ, khách lẻ, nhân viên thu mua; persona 1 = Bác Ba Hưng, giám đốc HTX Nông nghiệp Rau sạch Đơn Dương, Lâm Đồng); hành trình khách hàng (PL-Q). |
| §4.2.2 Vấn đề nghiên cứu | NC1 uy tín chống thao túng; NC2 truy xuất bất biến không blockchain; NC3 dự báo giá thiếu dữ liệu; NC4 gợi ý khi thiếu tương tác (cold start); NC5 cân bằng hai luồng trên cùng nguồn cung. |
| §4.2.3 Thách thức | Ba thách thức hệ thống (trong đó chống bán vượt tồn kho khi nhiều giao dịch giành một dòng tồn là khó nhất). *Số mục (4.2.3 theo đếm tiêu đề LaTeX) cần đối chiếu PDF.* |
| §4.3.1 Yêu cầu chức năng | User story → FR1–FR13 (xem bảng ở phần 8.1); 11 nhóm Must, 2 Should; `tab:chi-thiet-ke` có 9 hàng chỉ thiết kế + 6 hàng để sau prototype; 5 mã đã rút. FR1.1 đăng nhập bằng email (đăng nhập bằng số điện thoại *chỉ thiết kế*; OTP qua email). FR1.3 hồ sơ doanh nghiệp mua sỉ (GPKD, MST) do **kiểm duyệt viên** xác minh. FR1.4 eKYC = kiểm duyệt viên đối chiếu thủ công ảnh giấy tờ + ảnh chân dung. FR4.3 (giữ chỗ/trừ tồn) thuộc mô-đun `inventory`. |
| §4.3.2 Yêu cầu phi chức năng | NFR1 hiệu năng (**NFR1.1 gồm mức 100 người dùng đồng thời**; NFR1.2 chống oversell); NFR2 mở rộng (NFR2.1 thêm vai trò/mô-đun; **NFR2.2 mở rộng ngang: chỉ thiết kế, Could**); NFR3 bảo mật (gồm NFR3.6 xác thực hai lớp nội bộ); NFR4 tin cậy; NFR5 bảo trì (NFR5.1 tách mô-đun, NFR5.2 OpenAPI); NFR6 khả dụng cho người ít rành công nghệ; NFR7 tích hợp/tương thích; NFR8 pháp lý (NFR8.1-8.5); NFR9 toàn vẹn truy xuất. **7 Must (NFR1, 3, 4, 5, 7, 8, 9) + 2 Should (NFR2, 6)**. Ngưỡng + căn cứ ở PL-L; PL-M đã đủ NFR3.6, NFR5.1-5.2, NFR8.1-8.5. |
| §4.3.3 Yêu cầu dữ liệu | Miền dữ liệu; ràng buộc toàn vẹn; bảo mật/vòng đời (RPO ≤ 24 h, RTO ≤ 4 h, lưu trữ lạnh sau 1 năm); dữ liệu cho AI (nhãn tích lũy từ phán quyết kiểm duyệt). |
| §4.4 Kết chương | Mọi yêu cầu truy được về nhu cầu người dùng (PL-J). |

**Thông điệp cốt lõi:** mọi yêu cầu truy được về nhu cầu người dùng; phần không làm được nêu rõ và có lý do.

**Câu hỏi hội đồng**
1. *Chống bán vượt giữa hai luồng ở đâu?* — Hàng một lô tách thành **dòng tồn** theo chủ (ví dụ lô 1.000 kg: 700 kg của HTX chỉ bán sỉ, 300 kg của Farmery chỉ bán lẻ); hợp đồng sỉ và đơn thu mua giành dòng của nhà cung cấp, nhiều đơn lẻ giành dòng của Farmery; cả hai đi qua một giao dịch có khóa (§4.1.2 "Quản lý tồn kho", thách thức §4.2.3, NC5).
2. *Giá trị pháp lý của "xác nhận giao kết"?* — Dùng hình thức xác nhận bằng OTP + lưu tài khoản, thời điểm, mã băm của đúng phiên bản (FR6.3); Luật GDĐT 20/2023 Điều 22–23. Ký số thật là hướng phát triển (FR6.6 đã rút).
3. *Thu mua có hợp lý về kinh tế?* — Có điều kiện hòa vốn tường minh; thiết kế xoay quanh giữ `h` thấp: chỉ mua lượng bán trong hạn, FEFO, chuyến trung chuyển cố định (§4.1.1).

### Chương 5 — Phân tích và thiết kế (`chuong5-phantich-thietke.tex`)

- **§5.1 Phân tích:** 10 sơ đồ hoạt động (2 ở thân: `fig:act-thu-mua`, `fig:act-dat-hang`; 8 ở PL-R); use case tổng quan + 5 chi tiết (PL-S); đặc tả UC-B4, UC-C4, UC-C6 ở thân, UC-B2, B5, C7, D4 ở PL-S.
- **§5.2 Công nghệ** (so phương án theo 5 tiêu chí; bảng ở PL-I): Next.js (SSR cho trang QR) + React/Vite/Refine; NestJS + Prisma (khóa dòng bằng SQL thô `SELECT … FOR UPDATE`); **PostgreSQL** (transaction khóa dòng + JSON + pgvector); full-text sẵn có thay Elasticsearch; MinIO; Redis; VNPay thử nghiệm, GHN thử nghiệm, hóa đơn giả lập; Web Push (chuẩn W3C, khóa VAPID; định nghĩa ở 8.2) + email SMTP.
- **§5.3 Thiết kế:** C4 ba mức (`fig:c4-container`, `fig:c4-module`), `tab:module-io`, `fig:luong-don-le`; ba ràng buộc **RB1–RB3**; sitemap; tuần tự (`fig:seq-dat-hang`, `fig:seq-hop-dong-si`, + 2 ở PL-W); lớp miền; CSDL 13 schema / 65 bảng; AI (`tab:tinhnangAI`, 5 bước dữ liệu).
- Sự kiện giữa mô-đun qua Redis: 17 sự kiện (PL-V), nhận xử lý một lần.
- **Còn TODO trong chương:** thiết kế API, thiết kế UI/UX, thiết kế test case, sơ đồ luồng AI (xem phần 5).

**Theo từng mục**

| Mục | Nội dung chính |
|---|---|
| §5.1.1 Mô hình hóa quy trình | 10 sơ đồ hoạt động UML: 2 ở thân (`fig:act-thu-mua`, `fig:act-dat-hang`), 8 ở PL-R. |
| §5.1.2 Mô hình hóa tương tác | Bảng tác nhân (`tab:actor-usecase`: khách vãng lai, khách lẻ, khách sỉ, nhà cung cấp, 6 vai trò nội bộ + 3 hệ thống ngoài); use case tổng quan (5 gói) + 5 sơ đồ chi tiết (PL-S); đặc tả UC-B4, C4, C6 ở thân; UC-B2, B5, C7, D4 ở PL-S. |
| §5.2.1 Front-end | Next.js (SSR cho trang QR/sản phẩm công khai); React + Vite + Refine cho ứng dụng nội bộ; monorepo pnpm + Turborepo. |
| §5.2.2 Back-end | NestJS + Prisma (khóa dòng bằng SQL thô); PostgreSQL một mình (khóa dòng + JSON + pgvector); full-text sẵn có thay Elasticsearch; MinIO; Redis (cache + hàng đợi); VNPay thử nghiệm, GHN thử nghiệm, hóa đơn giả lập, Web Push (chuẩn W3C, khóa VAPID) + email SMTP. |
| §5.2.3 AI | Python/FastAPI tách riêng; tìm kiếm lai RRF, gợi ý hybrid hai giai đoạn, dự báo giá SARIMA/Prophet có đối chứng gradient boosting; bất thường = luật ngưỡng. |
| §5.3.1 Kiến trúc | C4 ba mức (ngữ cảnh: 10 hệ thống ngoài = 5 MVP + 5 chỉ thiết kế; container: 7, Hình 5.4 nhãn "Nhà cung cấp" (không còn "Bên bán"); mô-đun: 13, Hình 5.5 có khối "Sau bán, hỗ trợ khách"); modular monolith; RB1–RB3; Redis (sự kiện + cache); luồng một đơn lẻ 19 bước (`fig:luong-don-le`); `tab:container-io`, `tab:module-io`. |
| §5.3.2 Sitemap | Cây trang hai ứng dụng, **xếp theo flow nghiệp vụ**: ứng dụng mua hàng 4 khu (công khai với đăng ký, đăng nhập đứng đầu; khách lẻ; khách sỉ; nhà cung cấp - trang đi từ hồ sơ, sản phẩm và lô, chào giá lô tới đơn và đối soát); ứng dụng nội bộ 6 mục theo vai trò, xếp hỗ trợ vùng, kiểm duyệt, thu mua, kho, vận hành, quản trị. Trang chỉ thiết kế/để sau prototype vẽ xám nét đứt, hình không phân biệt hai nhãn (chi tiết PL-T). |
| §5.3.3 Lược đồ tuần tự | 4 luồng: đặt hàng–thanh toán (`seq-dat-hang`), RFQ → hợp đồng sỉ (`seq-hop-dong-si`), đăng lô–duyệt–QR và đánh giá (PL-W). |
| §5.3.4 Lược đồ lớp | Lớp miền theo mô-đun. |
| §5.3.5 Cơ sở dữ liệu | 13 schema / 65 bảng / 565 cột / 48 FK; ERD **11 hình** = 1 tổng quan (ma trận phụ thuộc 9×7 giữa các schema) + 10 hình theo schema; nét liền = FK thật cùng schema, nét đứt = tham chiếu xuyên schema bằng định danh (RB3). |
| §5.3.6 Mô-đun AI | Luồng 5 bước (thu thập → tiền xử lý → huấn luyện/suy luận → phục vụ → vòng phản hồi); `tab:tinhnangAI`; ngưỡng mục tiêu. **Còn TODO sơ đồ luồng AI.** |
| §5.3.7–5.3.9 API, UI/UX, test case | **TODO cả ba** (API đã có ở `openapi.yaml` nhưng chưa đưa vào thân báo cáo). |
| §5.3.10 Chính sách bên thứ ba | Cổng thanh toán (không lưu dữ liệu thẻ, webhook ký + xử lý một lần); 3PL (timeout 5 s, retry); hóa đơn giả lập; OAuth chỉ thiết kế; xác minh chứng nhận thủ công. |
| §5.4 Kết chương | Tóm lược mười quy trình, 13 mô-đun/schema, ba mô-đun AI. |

**Thông điệp cốt lõi:** kiến trúc là *hệ quả* của ràng buộc khó nhất (chống bán vượt cần giao dịch một CSDL), không phải mốt.

**Câu hỏi hội đồng**
1. *Vì sao modular monolith, không microservices?* — Xem câu 1 phần 4.
2. *Vì sao PostgreSQL một mình?* — Khóa dòng chống oversell + JSON cho nhật ký canh tác + pgvector cho ngữ nghĩa, không dựng thêm DB vector/search engine để khỏi đồng bộ hai nơi (§5.2.2).
3. *RB1–RB3 là gì, bảo đảm bằng cách nào?* — Chia mô-đun theo miền; gọi nhau qua service công khai; không join bảng xuyên mô-đun. Mỗi mô-đun một schema trong cùng CSDL nên vi phạm RB3 lộ ngay khi đọc mã (§5.3.1).

### Chương 6 — Hiện thực và kiểm thử (`chuong6-hienthuc-kiemthu.tex`)

- **Có nội dung:** §6.1.1 môi trường/công cụ: monorepo pnpm + Turborepo; GitHub Actions chạy test + độ phủ; SonarQube Cloud (kho riêng tư tới 50 nghìn dòng); k6, Lighthouse chạy riêng; danh sách công nghệ khớp §5.2; bên thứ ba: hiện mới có giao diện kèm bản giả cho cổng thanh toán và kênh gửi OTP, các dịch vụ còn lại để sau prototype.
- **TODO toàn bộ:** phiên bản cụ thể, ngưỡng cổng chất lượng, kiến trúc triển khai (§6.1.2), 7 tiểu mục hiện thực mô-đun (§6.1.3: xác thực, sản phẩm–QR, bán lẻ, đánh giá, bán sỉ, tồn kho–vận chuyển, quản trị, AI), giải thuật tiêu biểu (§6.1.4), kết quả kiểm thử (§6.2), kết chương.
- Có thể lấy tư liệu thật cho chương này từ mã: `apps/api/README.md`, `MVP.md` mục 6, `DECISIONS.md` các mục 13/10–27/10.

**Theo từng mục**

| Mục | Trạng thái |
|---|---|
| §6.1.1 Môi trường, công cụ | Có nội dung: pnpm + Turborepo, GitHub Actions, SonarQube Cloud, k6, Lighthouse. Còn TODO phiên bản và ngưỡng cổng chất lượng. |
| §6.1.2 Kiến trúc triển khai | TODO. |
| §6.1.3 Hiện thực các module chính | TODO cả 8 tiểu mục: xác thực/tài khoản; sản phẩm–QR; bán lẻ; đánh giá–uy tín; bán sỉ; tồn kho–vận chuyển–khiếu nại; quản trị; AI. |
| §6.1.4 Giải thuật tiêu biểu | TODO. |
| §6.2 Kiểm thử | TODO (kết quả test chưa có trong chương). |
| §6.3 Kết chương | TODO. |

**Thông điệp cốt lõi:** chương hiện còn khung; phải nói thẳng với hội đồng và dùng prototype + e2e làm minh chứng.

**Câu hỏi hội đồng**
1. *Prototype là gì, có bỏ đi không?* — Không: chạy đúng stack, đúng hợp đồng `openapi.yaml`, đúng 13 mô-đun; chỉ giả lập lưu trữ (bộ nhớ), OTP cố định, cổng thanh toán giả (`MVP.md` §6).
2. *Giữ mã làm nền MVP theo điều kiện gì?* — Bốn điều kiện rà ở mốc 21/10: qua repository, luật nghiệp vụ có test, không lối tắt ngoài `DEMO_MODE`, API khớp hợp đồng (CI xanh, bật kiểm phản hồi).
3. *Đã test những gì?* — 37 test e2e API (jest + supertest: 8 khung + 2 đăng nhập + 11 catalog công khai + 16 lô hàng/kiểm duyệt) và 10 test Playwright (`apps/e2e`) — đếm ngày 28/10 bằng grep; **chưa** có test chống bán vượt vì chưa có mô-đun tồn kho.

### Chương 7 — Đánh giá hệ thống (`chuong7-danhgia.tex`)

- **Khung đã chốt, kết quả chưa có:** sáu trụ cột (gộp vào bốn nhóm mục tiêu đánh giá ở Ch1 §1.2.3: chức năng + chất lượng mã; hiệu năng + bảo mật; khả dụng giao diện; AI): chức năng; chất lượng mã (SonarQube); hiệu năng + chống bán vượt (k6); bảo mật (RBAC tự động, 403); khả dụng giao diện (Lighthouse, axe-core, thử với nhà cung cấp); AI (offline).
- **Nguyên tắc:** ngưỡng đặt **trước** khi hiện thực (PL-L: `tab:nguongNFR`, `tab:nguongAI`) để không chọn chỉ số sau khi biết kết quả.
- Ngưỡng chính: NFR1.1 p95 < 2 s (k6) + Core Web Vitals LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1, **và ở mức 100 người dùng đồng thời trung vị < 3 s, lỗi < 1% (100 người thuộc NFR1.1)**; **NFR1.2 ≥ 50 yêu cầu đồng thời, 0% oversell**; NFR2.2 mở rộng ngang chỉ thiết kế, không đo; NFR3.1 100% endpoint trả 403 khi sai quyền; NFR3.3 bcrypt cost ≥ 10; NFR3.5 khóa 30 phút sau 5 lần sai; NFR4.2 RPO ≤ 24 h; NFR6 ≥ 80% hoàn thành không cần hỗ trợ.
- Ngưỡng AI: semantic search nDCG@10 hơn từ khóa ≥ 15%, Recall@10 không thấp hơn, p95 < 1 s, ≥ 50 truy vấn gán nhãn tay; sản phẩm tương tự Precision@5 ≥ 0,6 trên ≥ 50 sản phẩm; dự báo giá MAPE < 20%.
- **TODO:** điều kiện đo, bảng test case, số đo tải, số đo chống bán vượt, kết quả RBAC, Lighthouse, usability, AI, kết chương.

**Theo từng mục**

| Mục | Nội dung chính |
|---|---|
| §7.1 Mục tiêu, phương pháp | Sáu trụ cột; ngưỡng đặt trước. Còn TODO "điều kiện đo" (cấu hình máy, phiên bản công cụ). |
| §7.2 Đánh giá chức năng | Khung bảng test case theo FR — **TODO, chưa có số**. |
| §7.3.1 Hiệu năng, chịu tải | k6: p95 < 2 s (NFR1.1), 100 người đồng thời trung vị < 3 s lỗi < 1% (cùng NFR1.1) — TODO số đo. |
| §7.3.2 Chống bán vượt | ≥ 50 yêu cầu đồng thời trên một dòng tồn, 0% oversell (NFR1.2/4.1) — TODO; chưa có mô-đun tồn kho. |
| §7.3.3 Phân quyền, bảo mật | RBAC tự động, 100% endpoint nhạy cảm trả 403 (NFR3.1); bcrypt cost ≥ 10; khóa 30 phút — TODO. |
| §7.4.1–7.4.2 Giao diện | Lighthouse, axe-core, Core Web Vitals; thử khả dụng với nhà cung cấp theo PL-B (≥ 80% hoàn thành không hỗ trợ) — TODO. |
| §7.5 Đánh giá AI | nDCG@10 hơn từ khóa ≥ 15%; Precision@5 ≥ 0,6; MAPE < 20% — TODO. |
| §7.6 Kết chương | TODO (phân tích nguyên nhân nếu không đạt, đẩy sang Hạn chế Ch8). |

**Thông điệp cốt lõi:** phương pháp và ngưỡng có sẵn, nhưng *số đo thì chưa*; không được nói đã đạt.

**Câu hỏi hội đồng**
1. *Ngưỡng chọn dựa vào đâu?* — Xuất phát từ người dùng thật: p95 vì nhà cung cấp dùng 4G yếu ở đuôi phân bố; 100 người đồng thời vì cầu dồn khi mở bán lô mới; 80% vì đội hỗ trợ vùng chỉ kham 1/5 người cần giúp (PL-L).
2. *Dữ liệu AI lấy đâu?* — Dự báo giá dùng giá nông sản công khai (PL-O), không phải dữ liệu giao dịch; tìm kiếm/tương tự dùng bộ truy vấn và sản phẩm do nhóm gán nhãn tay, tối thiểu 50 mỗi loại; ghi rõ là dữ liệu mô phỏng (§1.3.2).
3. *Nếu không đạt ngưỡng?* — Kết chương dự kiến phân tích nguyên nhân và phản ánh vào Hạn chế của Ch8 (ghi trong TODO của Ch7).

### Chương 8 — Tổng kết (`chuong8-tongket.tex`)

- §8.1 Kết quả đạt được: **TODO** (đối chiếu MT1–MT7 sau khi có số đo Ch7).
- §8.2 Hạn chế (5 mục): phát hiện bất thường bằng học máy; phân quyền nội bộ trong tài khoản doanh nghiệp; mua trả sau/hạn mức tín dụng; app di động riêng + kênh mạng xã hội; luồng sỉ tối giản (giao một đợt, thanh toán thường).
- §8.3 Hướng phát triển nghiệp vụ (11 mục, mỗi mục có **điều kiện kích hoạt**): ML bất thường; điều phối nhiều kho; đội giao riêng khi chi phí cố định/đơn < cước 3PL; **dịch vụ kho mở**; chào sỉ tồn dư; ký số hợp đồng; cảnh báo khan hiếm; gói hiển thị "Tài trợ"; app di động gốc; giấy tờ xuất khẩu (3 việc: mã số vùng trồng, thời hạn lưu nhật ký, mở rộng tác nhân truy xuất); **đồng bộ TraceViet**.
- §8.3 Kiến trúc: thứ tự tách nếu cần = trang truy xuất công khai → thông báo → tìm kiếm; **tồn kho + đơn hàng giữ chung** càng lâu càng tốt.

**Theo từng mục**

| Mục | Nội dung chính |
|---|---|
| §8.1 Kết quả đạt được | **TODO**: đối chiếu MT1–MT7 sau khi có số đo Ch7. |
| §8.2 Hạn chế | 5 mục: bất thường bằng ML; phân quyền nội bộ trong tài khoản doanh nghiệp; mua trả sau/hạn mức tín dụng; app di động riêng + mạng xã hội; luồng sỉ tối giản (giao một đợt, thanh toán thường). |
| §8.3.1 Mở rộng nghiệp vụ | 11 hướng, mỗi hướng có điều kiện kích hoạt (xem 3.C). |
| §8.3.2 Mở rộng kiến trúc | Thứ tự tách: trang truy xuất công khai → thông báo → tìm kiếm; giữ chung tồn kho + đơn hàng; microservices chỉ khi nhiều đội làm song song. |

**Thông điệp cốt lõi:** phần "chưa làm" được nêu có điều kiện kích hoạt cụ thể, không phải lời hứa chung chung.

**Câu hỏi hội đồng**
1. *Đã đạt mục tiêu nào?* — Hiện chưa trả lời bằng số được (TODO §8.1). Nên chuẩn bị bảng MT1–MT7 × bằng chứng (xem gợi ý phần 5).
2. *Khi nào mới tách microservices?* — Có thể không bao giờ cần ở quy mô này; microservices chỉ đáng khi nhiều đội phát triển song song, không phải để nhanh hơn (§8.3.2).
3. *Vì sao đội giao riêng chưa làm?* — Chỉ khi mật độ đơn khiến chi phí cố định chia mỗi đơn thấp hơn cước 3PL nội thành cho cùng chặng.

### Phụ lục chính (vai trò)

| Phụ lục | Tên | Vai trò khi bảo vệ | Trạng thái |
|---|---|---|---|
| A | Hướng dẫn sử dụng | Hướng dẫn người dùng cuối | TODO |
| B | Bộ công cụ đánh giá khả dụng | B.1 thiết kế buổi thử; B.2 kịch bản tác vụ; B.3 phiếu ghi người quan sát; B.4 cách tính 4 chỉ số; B.5 kiểm tra tiếp cận tự động; B.6 danh sách kiểm PWA. Dùng cho Ch7 §7.4 (tuần 13) | Có, chưa dùng |
| C | Mã nguồn chi tiết bổ sung | Đoạn mã không vừa thân Ch6 | TODO |
| D | Điều khoản dịch vụ | 17 điều: phạm vi, tài khoản, quyền–nghĩa vụ NCC và người mua, hàng được phép đăng bán (Đ4), phân định trách nhiệm theo hình thức bán (Đ6), cạnh tranh (Đ7), giao dịch với các bên (Đ8), phí–thuế–hóa đơn (Đ9), thanh toán (Đ10), đổi trả–hoàn tiền (Đ11), kiểm duyệt–vi phạm–thu hồi lô (Đ12), sở hữu trí tuệ–dữ liệu, giới hạn trách nhiệm, chấm dứt, tranh chấp, thay đổi điều khoản | Có |
| E | Business Model Canvas đầy đủ | 9 khối, gắn nhãn 3P/1P | Có |
| F | Ánh xạ vấn đề–giải pháp–mục tiêu | V1–V4 → giải pháp → MT1–MT7 | Có |
| G | Nông sản vs hàng khác | 9 tiêu chí đối chiếu | Có |
| H | Chứng nhận phổ biến trên thế giới | VietGAP, GlobalG.A.P., GRASP, hữu cơ (USDA/EU/JAS), HACCP, ISO 22000, BRCGS/IFS, Halal/Kosher, Fairtrade, kiểm dịch thực vật; cột "Farmery ghi nhận hay không" | Có |
| I | Đối sánh giải pháp công nghệ | Bảng so phương án theo 5 tiêu chí; dùng khi bị hỏi "sao chọn X" | Có |
| J | Truy vết user story → yêu cầu | Nhà cung cấp / khách sỉ / khách lẻ / nhân sự → FR, NFR; ghi rõ nhu cầu "chưa đáp ứng" (vd dự báo giá cho NCC) | Có |
| K | Từ điển dữ liệu | Sinh tự động từ `schema.dbml`: 65 bảng, 565 cột, 48 FK, theo 5 khối; từng cột có kiểu, ràng buộc, mã yêu cầu; bảng/cột *chỉ thiết kế* có trong lược đồ nhưng không ghi dữ liệu | Có (sinh tự động) |
| L | Ngưỡng đo lường và căn cứ | `tab:nguongNFR` (ngưỡng từng NFR + căn cứ từ người dùng) và `tab:nguongAI` (3 tính năng AI); đặt trước khi hiện thực; NFR1.1 chứa cả mức 100 người đồng thời, NFR2.2 ghi "chỉ thiết kế, không đo" | Có |
| M | Ma trận Priority / Feasibility / Testability | MoSCoW + khả thi + cách kiểm thử cho từng FR và NFR; chỉ dự báo giá ở mức Challenging; NFR: 7 Must + 2 Should, NFR2.2 Could (chỉ thiết kế); đã bổ sung NFR3.6, NFR5.1-5.2, NFR8.1-8.5 | Có |
| N | Khoảng cách với yêu cầu thị trường xuất khẩu | 3 việc còn thiếu: mã số vùng trồng, thời hạn lưu nhật ký, tác nhân đóng gói/kiểm dịch | Có |
| O | Nguồn dữ liệu nông sản cho AI | Danh sách nguồn giá công khai dùng cho dự báo giá | Có |
| P | Số liệu OCOP | Tăng trưởng chương trình giai đoạn 2024–2025 | Có |
| Q | Hành trình khách hàng + nguồn giao dịch kho | `tab:nguon-giaodich`: các nguồn làm đổi tồn kho (chiều Nhập / Đổi chủ / Giữ / Xuất: mở dòng khi lô duyệt, đổi chủ khi nghiệm thu, hàng hoàn về, giữ chỗ, xuất khi bán lẻ hoặc sỉ giao...) | Có |
| R | Sơ đồ hoạt động chi tiết | 8 sơ đồ: giao ba chặng, đổi trả, đăng ký NCC, đăng sản phẩm–duyệt lô–QR, bán sỉ, đánh giá, thu hồi lô, vi phạm | Có |
| S | Use case chi tiết | 5 sơ đồ theo tác nhân + đặc tả UC-B2, B5, C7, D4 | Có |
| T | Sitemap chi tiết theo khu vực | Cây trang hai ứng dụng | Có |
| U | Bộ chính sách | U.1 kiểm hàng khi nhận; U.2 đổi trả–hoàn tiền; U.3 bảo mật dữ liệu cá nhân; đầu phụ lục có bảng tóm tắt chính sách kèm căn cứ pháp lý (NĐ 248, Luật TMĐT Đ11, Luật BVDLCN 2025) | Có |
| V | Danh mục sự kiện nghiệp vụ | **17 sự kiện** giữa mô-đun (xem bảng ở phần 8.4), nhận xử lý một lần | Có |
| W | Lược đồ tuần tự chi tiết | Đăng lô–duyệt–QR (`fig:seq-duyet-lo`), đánh giá (`fig:seq-danh-gia`) | Có |
| Kế hoạch | `kehoach.tex` | 14 tuần, 2 giai đoạn, mốc 15/10 và 31/12/2026; xem phần 9 | Có (cập nhật 13/10) |

**Tóm tắt các phụ lục hay được hỏi**
- **PL-V (sự kiện):** mô-đun chỉ gọi trực tiếp nhau khi cần kết quả ngay trong cùng giao dịch (giữ chỗ, trừ tồn, tạo giao dịch thanh toán, tạo giao hàng); mọi phụ thuộc còn lại qua sự kiện Redis; bên nhận xử lý độc lập, gửi lại nhiều lần chỉ có tác dụng một lần. **[Chỉ thiết kế]**, chưa có hàng đợi trong mã.
- **PL-K (từ điển dữ liệu):** nguồn chính để trả lời "bảng X có cột gì". Hai bảng được tham chiếu nhiều nhất: `identity.users`, `media.media_files`.
- **PL-M (ma trận):** 13 nhóm FR = 11 Must + 2 Should (tương tác, AI); NFR có ma trận riêng: Must là NFR1, 3, 4, 5, 7, 8, 9, Should là NFR2, 6 (7 + 2), NFR2.2 Could; có NFR3.6, NFR5.1-5.2, NFR8.1-8.5.
- **PL-L (ngưỡng):** xem bảng số liệu ở phần 8.3; mọi ngưỡng kèm căn cứ từ hành vi người dùng thật (4G yếu, cầu dồn khi mở bán lô, đội hỗ trợ vùng).
- **PL-N/O/P/G/H:** tư liệu nền; chỉ cần nhớ N là nơi giải thích vì sao xuất khẩu để sang hướng phát triển.

---

## 2. Nội dung cốt lõi cần nhớ (cheat-sheet)

**Khái niệm**
- **Dòng tồn** = (lô, chủ sở hữu, nơi chứa); mọi thay đổi số lượng đi qua **sổ nhập xuất**, không sửa trực tiếp (FR13.3, bảng `inventory.stock_holdings`, `stock_movements`).
- **Chào giá lô** = nhà cung cấp công bố lô sắp thu hoạch (`procurement.supplier_offers`); **đơn thu mua** chỉ có hiệu lực khi nhà cung cấp xác nhận, từ đó phần sản lượng được giữ chỗ.
- **Máy chủ nghiệp vụ** = NestJS chứa 13 mô-đun; **dịch vụ AI** là khối riêng.
- **Xác nhận giao kết** = OTP + lưu tài khoản/thời điểm/mã băm văn bản (không phải chữ ký số).
- **Nhập liệu thay nhà cung cấp** = nhân viên hỗ trợ vùng ghi nhật ký hộ nhà cung cấp được phân công; ghi `entered_by`, thời điểm, lý do, cờ `onBehalf` (FR4.2, FR10.7; bảng `supplier.support_assignments`, `operations.staff_audit_logs`).
- **Nhật ký canh tác chỉ nối thêm:** sửa = bản mới có `supersedesId`, bản cũ thành "đã đính chính" (NFR9.1; có test).
- **Web Push** = thông báo đẩy của trình duyệt theo chuẩn mở W3C, không phải đối tác thương mại; prototype chưa làm (hỏi lại 5 giây), MVP dùng Web Push, nhãn *Để sau prototype*. Cơ chế ở 8.2.

**Quyết định then chốt**
- Modular monolith + tách riêng AI; RB1–RB3; một schema/mô-đun (`DECISIONS.md` 23/09).
- PostgreSQL làm trung tâm; không Elasticsearch, không DB vector riêng.
- Không blockchain; không giữ tiền (cổng thanh toán giữ, kể cả escrow thiết kế); không ML bất thường.
- Giữ chỗ **15 phút** trước, trừ tồn sau khi thanh toán; COD chỉ cho đơn dưới ngưỡng cấu hình và tài khoản chưa từng từ chối nhận hàng; webhook xử lý **một lần**.
- Hết hạn chứng nhận: ẩn nhãn, **không gỡ sản phẩm**; đổi giá > 20% hoặc đổi mô tả chất lượng → duyệt lại (§4.1.2).

**Số liệu hay bị hỏi (kèm nguồn)**

| Số | Nguồn |
|---|---|
| 13 mô-đun, 13 schema, 65 bảng, 565 cột, 48 FK | Ch5 §5.3.5 (ERD) |
| 40 thao tác trong hợp đồng; 20 đã có handler | `packages/contract/openapi.yaml`; grep controller `apps/api/src/modules` (đếm 28/10) |
| 6 vai trò nội bộ: `staff_moderation`, `staff_operations`, `staff_sourcing`, `staff_warehouse`, `staff_support`, `platform_owner` | Ch5 `tab:actor-usecase` |
| 8 trạng thái đơn: Đã đặt → Đã thanh toán → Đang đóng gói → Lên chuyến → 3PL đã nhận → Đang giao → Đã giao → Hoàn tất/Khiếu nại | Ch4 §4.1.2 Quy trình bán lẻ |
| Hạn khiếu nại: rau lá 24 h, củ quả 48 h, hàng khô 7 ngày | Ch4 §4.1.2 Đổi trả |
| Cam kết xử lý: tiếp nhận 24 h, quyết định 3 ngày làm việc, hoàn tiền 7 ngày làm việc | Ch4 §4.1.2 |
| Duyệt hồ sơ NCC 5 ngày làm việc; duyệt lô mặc định 48 giờ, cấu hình được | Ch4 `tab:kiemduyet-giaidoan` |
| Khóa 30 phút sau 5 lần nhập OTP sai | Ch4 §4.1.2; NFR3.5 |
| Điểm uy tín 0–100, cửa sổ 6 tháng, hậu kiểm nhanh từ ≥ 80 | Ch4 §4.1.2 Đánh giá |
| Lưu hợp đồng ≥ 3 năm; hóa đơn/nhãn/chứng từ ≥ 5 năm | NFR8.5 |
| RPO ≤ 24 h, RTO ≤ 4 h; chuyển lưu trữ lạnh sau 1 năm | Ch4 §4.3.3 |
| Kế hoạch: GĐ1 3 tuần tới 15/10; GĐ2 11 tuần tới 31/12 | `kehoach.tex` |

---

## 3. Danh mục tất cả các luồng

Kiểm chứng trạng thái bằng: (a) bảng `tab:chi-thiet-ke` và `tab:kiemduyet-giaidoan` ở Ch4, (b) `MVP.md`, (c) mã `apps/api` (controller thực có, đếm 28/10), (d) `apps/e2e`, (e) `NOTES.md` mục "BE2: cả 13 thao tác..." (cập nhật 27/10).

**Cách đọc "Trạng thái" — 4 mức (cột ghi thêm nhãn báo cáo)**
- **A. Chạy trên API thật** + có test: kiểm bằng mã.
- **B. Giao diện đã dựng theo hợp đồng, API còn 501** (chạy qua server giả theo hợp đồng ngoài repo, không commit).
- **C. Chưa có mã.** Cột ghi tiếp nhãn: **[Để sau prototype]** (thuộc MVP, ghi ở `tab:chi-thiet-ke`/`tab:kiemduyet-giaidoan`), **[Chỉ thiết kế]** (cố ý không làm) hoặc **[Chưa có mã]** (thuộc bản nộp, báo cáo không gắn nhãn).
- **D. Ngoài phạm vi / hướng phát triển.**

> Lưu ý: nhóm "ĐÃ HIỆN THỰC" theo cam kết báo cáo/MVP (trục bán lẻ làm sâu) **rộng hơn** nhóm đang chạy được. Cột "Trạng thái mã 28/10" nói đúng hiện trạng.

### 3.A Nhóm ĐÃ HIỆN THỰC (prototype/MVP theo `MVP.md`) và hiện trạng mã

| # | Luồng | Tác nhân | Các bước chính | Mô-đun / bảng | Trạng thái mã 28/10 | Tìm trong báo cáo |
|---|---|---|---|---|---|---|
| 1 | **Đăng nhập OTP** | mọi người dùng | nhập email → `POST /auth/otp` → nhập mã (prototype `123456`, trả `devCode`) → `POST /auth/login` → JWT → `GET /me` | `identity`; `identity.users`, `otp_challenges` | **A** (3 route, có 2 test + 3 Playwright shop + 4 Playwright admin). Bản tạm: vai trò theo quy tắc email, mọi email lạ thành một `seller`+`buyer_retail` | FR1.1–1.2 (đăng nhập bằng email; bằng số điện thoại **[Chỉ thiết kế]**); Ch4 §4.1.2; `MVP.md` §6 |
| 2 | **Tìm kiếm, lọc, chi tiết, sản phẩm tương tự** | khách vãng lai/lẻ | `GET /products?q=…` bỏ dấu + gần đúng (Levenshtein); lọc vùng, chứng nhận, mùa, khoảng giá; chi tiết kèm `batchesOnSale`, `similar` | `catalog`; `catalog.products`, `categories` | **A**, 11 test. Tương tự = **cùng danh mục, 4 sản phẩm đầu** (chưa vector). **Chưa có tìm kiếm ngữ nghĩa** | FR4.5, FR12.1, FR12.3; Ch4 §4.1.2 Bán lẻ b.1–2; `tab:tinhnangAI` |
| 3 | **Đăng lô, nhật ký canh tác, kiểm duyệt lô, sinh QR** | nhà cung cấp, kiểm duyệt viên | NCC tạo lô (`pending_review`, tự sinh việc duyệt) → ghi nhật ký (nối thêm/đính chính) → kiểm duyệt viên duyệt: lô `approved` + mã `TRC-…` + `traceUrl`; hoặc từ chối kèm lý do 5–1000 ký tự | `catalog` + `operations`; `catalog.batches`, `farming_logs`, `operations.review_tasks` | **A**; 16 test API + 2 Playwright xuyên shop↔admin (`kich-ban/lo-hang.spec.ts`) | FR4.1–4.2, FR3, FR10.1; `fig:act-dang-san-pham` (PL-R); `fig:seq-duyet-lo` (PL-W); UC-B2, UC-B4 |
| 4 | **Truy xuất QR công khai** | khách vãng lai | quét QR → `GET /public/trace/{traceCode}` → hồ sơ NCC, chứng nhận, nhật ký theo thời gian (dòng bị đính chính vẫn hiện, gạch ngang) | `catalog`, `supplier` | **A**, test 404 + đầy đủ; Playwright mở `/truy-xuất/{mã}` | FR4.2, NFR9.1; Ch5 "tách đường phục vụ trang truy xuất" |
| 5 | **Hồ sơ nhà cung cấp công khai** | khách | `GET /suppliers/{id}` | `supplier`; `supplier.suppliers`, `certifications` | **A** | FR2.1, FR3 |
| 6 | **Đơn lẻ 1P: giỏ → báo giá → đặt → giữ chỗ 15' → thanh toán/COD → hủy** | khách lẻ | thêm giỏ (`PUT /cart/items/{id}`) → `POST /checkout/quote` (tiền hàng, thuế, cước, COD có `codReason`) → `POST /orders` (kèm `Idempotency-Key`) → trả trước (VNPay giả) hoặc COD → đồng hồ giữ chỗ → hủy trước đóng gói | `retail`, `inventory`, `payment`; `retail.carts`, `orders`, `inventory.reservations`, `payment.payments` | **B**: giao diện shop (`gio-hang`, `thanh-toan`, `don-hang`) dựng xong; `retail`/`payment`/`inventory` **rỗng**; phía khách lẻ có 11 thao tác trả 501 (`/me/addresses` x2, `/cart*` x3, `/checkout/quote`, `/orders*` x5) | FR5.1–5.2, FR5.4, FR7.1; `fig:act-dat-hang`, `fig:seq-dat-hang`, `fig:luong-don-le`; UC-C4 |
| 7 | **Theo dõi đơn 8 trạng thái + Vận hành đơn** | khách lẻ; nhân viên vận hành/kho | dòng thời gian 8 bước tự hỏi lại mỗi 5 giây; nhân viên bấm "chuyển bước" thay webhook 3PL | `retail`, `fulfillment`; `retail.order_status_events` | **B**: shop `/don-hang/[ma]` + admin `/van-hanh`; `listOrders`, `advanceOrder` chưa có handler | FR5.4, FR8.1; `MVP.md` §6 |
| 8 | **Giao hàng ba chặng** | nhà cung cấp; nhân viên kho; 3PL (GHN thử nghiệm) | (1) NCC tự đưa hàng về kho; (2) xe lạnh Lâm Đồng–TP.HCM theo chuyến + manifest sau giờ chốt; (3) 3PL nội thành, webhook | `fulfillment`; `transfer_trips`, `trip_orders`, `shipments`, `shipment_events` | **C/B**: chỉ phần "nhân viên chuyển trạng thái" có giao diện; chuyến trung chuyển/vận đơn **[Chưa có mã]**; xe gom chặng đầu và kiểm khi xuất kho, bàn giao 3PL là **[Chỉ thiết kế]** | FR8.1–8.2; `fig:act-giao-hang` (PL-R); Ch4 §4.1.2 "Giao hàng ba chặng" |
| 9 | **Đổi trả, hoàn tiền, khiếu nại** | khách; nhân viên vận hành | gửi yêu cầu trong hạn kèm ảnh → xác nhận → trao đổi theo đơn → phân loại nguyên nhân → quyết định (hoàn toàn phần/một phần/giao bù/từ chối) → hoàn qua cổng; hoàn không cần trả hàng dưới ngưỡng → bút toán hủy | `fulfillment`, `payment`, `inventory`; `return_requests`, `messages`, `payment.refunds` | **C - [Để sau prototype]** (chưa có handler/giao diện); `tab:kiemduyet-giaidoan` ghi *Để sau prototype*, làm khi mô-đun bán lẻ và thanh toán nối vào API | FR8.3, FR9.1; `fig:act-doi-tra`; UC-C6 (Bảng `tab:uc-c6`) |
| 10 | **Thu mua theo lô: chào giá lô → đơn thu mua → xác nhận → nghiệm thu → nhập dòng tồn → đóng gói 1 bước → đặt giá** | nhân viên thu mua, kho; nhà cung cấp | NCC công bố chào giá lô → thu mua xem dự báo giá + tồn → lập đơn → NCC xác nhận (giữ chỗ) → NCC tự đưa hàng → kho nghiệm thu → dòng tồn của Farmery (giữ mã lô, QR) → trả tiền NCC theo sản lượng đạt → đóng gói + tem QR → đặt giá bán lẻ | `procurement`, `inventory`; `supplier_offers`, `purchase_orders`, `goods_receipts`, `packing_runs` | **C - [Chưa có mã]** (mô-đun rỗng); riêng nghiệm thu nhập kho **[Để sau prototype]** (làm cùng mô-đun tồn kho, `tab:kiemduyet-giaidoan`). Admin có màn **Tồn kho** dựng theo hợp đồng (**B**) | FR13.1–13.4; `fig:act-thu-mua`; UC-B5 |
| 11 | **Bán sỉ: RFQ → báo giá/thương lượng → chốt → hợp đồng → OTP giao kết → giao một đợt → thanh toán khi nhận** | doanh nghiệp mua sỉ; nhà cung cấp; kiểm duyệt viên | kiểm duyệt viên xác minh hồ sơ doanh nghiệp (GPKD, MST) → gửi RFQ (kiểm MOQ, gợi ý gộp đơn) → NCC báo giá bậc → trao đổi trong kênh RFQ → sinh hợp đồng từ mẫu (phiên bản) → hai bên xác nhận OTP, lưu mã băm → giao một đợt → bên mua xác nhận nhận → thanh toán cổng → hoa hồng | `wholesale`, `payment`; `rfqs`, `rfq_messages`, `contracts`, `contract_versions`, `contract_confirmations`, `wholesale_orders` | **C - [Chưa có mã]** (không có trong hợp đồng API 40 thao tác). `MVP.md` xếp FR6.1–6.4 vào MVP "tối giản", tuần 8–9 | FR6.1–6.4; `fig:act-ban-si`, `fig:seq-hop-dong-si`; UC-D4 |
| 12 | **Đánh giá và kiểm duyệt đánh giá** | khách lẻ; kiểm duyệt viên; NCC | đơn hoàn tất → đánh giá 1–5 sao + ảnh (verified purchase) → kiểm sơ bộ → công khai hoặc vào hàng đợi → cập nhật điểm uy tín 0–100 → NCC phản hồi 1 lần | `engagement`; `reviews`, `review_replies`, `supplier_reputation` | **C - [Để sau prototype]** (FR5.5, FR5.7 ở `tab:chi-thiet-ke`; đánh giá nghi vấn ở `tab:kiemduyet-giaidoan`). Mâu thuẫn cũ với `MVP.md` (FR5.5 thuộc MVP) đã được báo cáo giải quyết: thuộc MVP nhưng chưa làm ở prototype | FR5.5; `fig:act-danh-gia`; UC-C7; Ch4 "Đánh giá sản phẩm và nhà cung cấp" |
| 13 | **Thông báo** (web, thông báo đẩy, email) | hệ thống → mọi người | sự kiện đổi trạng thái → mô-đun thông báo gửi kênh người dùng chọn | `notification`; `notifications`, `deliveries`, `push_subscriptions` | **C**: prototype không có thông báo (hỏi lại 5 giây); thông báo đẩy Web Push (FR11.1) và cảnh báo hết hạn/tồn thấp (FR11.2) **[Để sau prototype]**; email chưa có SMTP **[Chưa có mã]**; SMS **[Chỉ thiết kế]** | FR11.1; Ch5 §5.2 "Dịch vụ bên thứ ba" (thông báo); PL-V |
| 14 | **Thu hồi lô** | nhân viên vận hành | phát hiện lô lỗi → khóa mọi dòng tồn của lô (cả hai luồng) → truy sổ nhập xuất lập danh sách đơn đã bán → báo người mua → trang QR hiện cảnh báo | `inventory`, `operations`, `catalog`; `inventory.batch_recalls` | **C - [Để sau prototype]** (làm cùng mô-đun tồn kho) | FR13.6; `fig:act-thu-hoi`; sự kiện `BatchRecalled` |
| 15 | **Xử lý vi phạm phân cấp** | kiểm duyệt viên / vận hành | nhắc nhở → cảnh cáo công khai → tạm khóa → khóa vĩnh viễn; vi phạm nghiêm trọng khóa ngay | `operations`; `violation_records`, `threshold_alerts`, `staff_audit_logs` | **C - [Để sau prototype]** (vi phạm, `tab:kiemduyet-giaidoan`) | FR10.1–10.2; `fig:act-vi-pham` |
| 16 | **Đăng ký nhà cung cấp, eKYC, chứng nhận** | NCC; kiểm duyệt viên | đăng ký + loại người bán thuế → OTP email → tải ảnh giấy tờ → tải chứng nhận → kiểm duyệt 3 tầng (hệ thống kiểm định dạng mã vùng trồng; kiểm duyệt viên đối chiếu cổng công bố; duyệt hồ sơ chứng nhận thủ công) → "Đã xác thực" → mở quyền đăng bán | `identity`, `supplier`; `ekyc_documents`, `certifications` | **C - [Để sau prototype]** (hồ sơ NCC, eKYC, chứng nhận; hiện chỉ đọc hồ sơ NCC có sẵn từ mock-data). eKYC trong phạm vi đồ án = kiểm duyệt viên duyệt **thủ công** ảnh giấy tờ + ảnh chân dung; đối chiếu khuôn mặt tự động **[Chỉ thiết kế]** | FR1.3–1.4, FR2, FR3; `fig:act-dang-ky-ncc`; `MVP.md` FR1 |
| 17 | **AI: tìm kiếm ngữ nghĩa** | khách | truy vấn → FTS (`unaccent`, trigram) + vector BGE-M3 → hợp nhất RRF | dịch vụ AI; `catalog.product_embeddings` | **C - [Chưa có mã]** (dịch vụ AI chưa có trong repo `apps/`). Hiện là bỏ dấu + gần đúng | FR12.3; `tab:tinhnangAI`; Ch5 §5.2.3 |
| 18 | **AI: sản phẩm tương tự** | khách | láng giềng gần nhất cosine, loại sản phẩm đang xem, chỉ còn hàng | dịch vụ AI | **Bản tạm A** (cùng danh mục); bản vector **C** | FR12.1; PL-L (Precision@5 ≥ 0,6) |
| 19 | **AI: dự báo giá** | nhân viên thu mua | SARIMA/Prophet (đối chứng gradient boosting) chạy offline hằng tuần → hiển thị tại màn lập đơn thu mua | dịch vụ AI; `procurement.price_forecasts` | **C - [Chưa có mã]** (rủi ro Challenging, xếp cắt sớm trong `kehoach.tex`) | FR12.2; PL-L (MAPE < 20%), PL-O |
| 20 | **Nhập liệu thay nhà cung cấp** | nhân viên hỗ trợ vùng | được phân công NCC → ghi nhật ký hộ → lưu `entered_by`, thời điểm, lý do, `onBehalf`; NCC xem lại | `catalog`, `supplier`, `operations` | **Chưa chạy được thực tế (xem phần 5, điểm 9):** service gán `onBehalf = true` khi vai trò `staff_*`, nhưng hợp đồng `appendFarmingLog` chỉ cho `x-roles: [seller]` → đường nhập hộ thực tế chưa chạy được. Không có test | FR4.2, FR10.7; NFR6.2; persona nhân viên hỗ trợ vùng |
| 21 | **Admin: tổng quan, tồn kho, cấu hình nền tảng** | nhân sự nội bộ | tổng quan việc chờ duyệt/quá hạn; xem dòng tồn, sổ nhập xuất; cấu hình biểu phí, ngưỡng | `operations`, `inventory` | **B** (màn dựng theo hợp đồng; `listStockHoldings`, `listSettings` chưa có handler); riêng việc duyệt: **A** | FR10.4-10.6 (FR10.4 **[Để sau prototype]**) |
| 22 | **Đăng sản phẩm mới (khu NCC)** | nhà cung cấp | điền form → `POST /seller/products` | `catalog` | **B**: giao diện xong, `createSellerProduct` chưa có handler; Playwright chỉ kiểm "gửi thì có phản hồi" | FR4.1 |

### 3.B Nhóm CHỈ THIẾT KẾ và nhóm ĐỂ SAU PROTOTYPE

Nguồn: `tab:chi-thiet-ke` (Ch4 §4.3.1; hai nhóm, 9 + 6 hàng), `tab:kiemduyet-giaidoan`, nhãn ghi ở từng FR, `MVP.md` §2.

**3.B.1 Chỉ thiết kế** (đặc tả và thiết kế đầy đủ nhưng cố ý không làm trong đồ án)

| Luồng / phần | Vì sao không làm | Điều kiện hiện thực | Đã có sẵn trong thiết kế | Tìm ở |
|---|---|---|---|---|
| Đăng nhập Google/Facebook | phụ thuộc dịch vụ ngoài, ngoài trục bán lẻ | đăng ký OAuth từng nhà cung cấp | hai khối hệ thống ngoài ở C4 | FR1.1 |
| Đăng nhập bằng số điện thoại | số điện thoại chỉ khai để liên hệ, giao hàng; đăng nhập bằng email | cùng điều kiện SMS | OTP qua email đang dùng | FR1.1 (ghi ở FR, không ở bảng) |
| OTP và thông báo qua SMS | tính phí theo tin | ngân sách + hợp đồng SMS | kênh SMS trong `notification`; hiện OTP qua email | FR1.2, FR11.1 |
| Đối chiếu khuôn mặt tự động (eKYC) | cần dịch vụ nhận diện | quyết định mua dịch vụ | kiểm duyệt viên đối chiếu thủ công ảnh giấy tờ + ảnh chân dung | FR1.4 (ghi ở FR, `tab:kiemduyet-giaidoan`) |
| Hóa đơn điện tử thật | cần hợp đồng nhà cung cấp + chứng thư số | doanh nghiệp có chứng thư số | lớp tích hợp + bản giả lập cùng giao diện | FR7.2, NFR8.3 |
| Ký số hợp đồng sỉ | cần tổ chức chứng thực | hợp đồng với tổ chức chứng thực | bản ghi phiên bản + xác nhận OTP | FR6.6 (đã rút → Ch8) |
| Ký quỹ, giao nhiều đợt, khấu trừ thuế (sỉ) | sỉ giữ tối giản, chỉ giao một đợt | có khách sỉ thật + quy định thuế rõ | bảng hợp đồng/thanh toán có cột đối soát | FR6.5, FR7.3, FR7.4, NFR8.4 |
| Xe gom chặng đầu | NCC tự đưa hàng | đội xe/đối tác chặng đầu | chặng đầu trong mô hình ba chặng | FR8.1 |
| Kiểm khi xuất kho, bàn giao 3PL | kho rút gọn | kho vận hành thật | quy tắc trong Ch4 | `tab:kiemduyet-giaidoan` |
| Sơ chế nhiều bước, kiểm kê định kỳ | kho rút gọn | kho vận hành thật nhiều công đoạn | bảng tồn kho, sổ kho, đóng gói | FR13.4 |
| Gợi ý cá nhân hóa; tìm nhà cung cấp theo ngữ nghĩa | cần dữ liệu tương tác | đủ lượt xem/mua/đánh giá | hàng đợi sự kiện, vector dùng chung | FR12.1, FR12.3 |
| Đồng bộ TraceViet | cần quyền kết nối của Bộ | được cấp quyền + chuẩn kết nối | mã truy xuất theo lô, khối hệ thống ngoài | FR4.8 (đã rút → Ch8) |

**3.B.2 Để sau prototype** (thuộc MVP hoặc đã cam kết; chưa làm ở prototype)

| Luồng / phần | Vì sao chưa làm | Điều kiện hiện thực | Đã có sẵn trong thiết kế | Tìm ở |
|---|---|---|---|---|
| Thông báo đẩy Web Push | prototype hỏi lại trạng thái đơn mỗi 5 giây; cần khóa VAPID + service worker | làm cùng FR11.1 ở bản MVP; dịch vụ đẩy do hãng trình duyệt vận hành, miễn phí, không cần hợp đồng | bảng `push_subscriptions` (cơ chế ở 8.2) | FR11.1, NFR7.3 |
| Đánh giá của người mua; đăng ký báo khi có hàng/vào mùa | trục ưu tiên xem-chọn-thêm giỏ; chưa có màn/API | bổ sung màn/API; đánh giá cần đơn đã giao | `engagement.reviews`, `retail.restock_subscriptions` | FR5.5, FR5.7 |
| Mã giảm giá, yêu thích, báo cáo sai danh mục | không nằm trên trục bán lẻ đầu-cuối | sau khi trục bán lẻ chạy trọn | `retail.vouchers`, `engagement.wishlist_items`, hàng đợi kiểm duyệt viên | FR5.3, FR9.2, FR4.7 |
| Báo cáo tổng quan hệ thống; thống kê cho nhà cung cấp | không nằm trên trục bán lẻ đầu-cuối | đủ dữ liệu giao dịch | dữ liệu đơn, thanh toán, sổ nhập xuất | FR10.4, FR2.2 |
| Cảnh báo chứng nhận sắp hết hạn, tồn thấp, nhắc gia hạn | đi theo kênh thông báo; chưa có bộ gửi cảnh báo | làm cùng FR11.1 | sự kiện `CertExpired`, `StockLow` | FR11.2, phần nhắc của FR3.3 |
| Các khâu kiểm duyệt, nghiệm thu, đổi trả chưa nối API: hồ sơ NCC, eKYC thủ công, chứng nhận, nghiệm thu nhập kho, khiếu nại-đổi trả, đánh giá nghi vấn, thu hồi lô, vi phạm | prototype tập trung trục bán lẻ và duyệt lô | hoàn thiện mô-đun tương ứng ở bản MVP | hợp đồng API + lược đồ CSDL của các mô-đun này | `tab:kiemduyet-giaidoan` |

- Thứ tự ưu tiên khi thiếu thời gian: `MVP.md` §4 và `kehoach.tex` (cắt mục để sau trước).

### 3.C Nhóm NGOÀI PHẠM VI và hướng phát triển (Ch8 §8.2–8.3; các FR đã rút)

| Hạng mục | Điều kiện kích hoạt (theo báo cáo) |
|---|---|
| Phát hiện bất thường bằng học máy | đủ lưu lượng + tập nhãn từ phán quyết kiểm duyệt viên/vận hành; unsupervised rồi supervised |
| Phân quyền nội bộ trong tài khoản doanh nghiệp | khách sỉ quy mô lớn; không mang đặc thù nông sản |
| Mua trả sau, hạn mức tín dụng cho khách sỉ | kéo theo thẩm định tín dụng, thu hồi nợ |
| App di động riêng + kênh mạng xã hội | nhu cầu ngoại tuyến vượt khả năng web |
| Điều phối nhiều kho + tối ưu tuyến | mở rộng địa bàn |
| Đội giao hàng riêng | chi phí cố định/đơn < cước 3PL nội thành |
| Dịch vụ kho mở (cho NCC sỉ thuê, rồi doanh nghiệp ngoài) | kho/đóng gói/kiểm định đã ổn định (FR13.5 đã rút) |
| Chào sỉ tồn dư của Farmery | tồn dư đủ lớn + quy tắc không cạnh tranh nhà cung cấp (FR13.7 đã rút) |
| Ký số hợp đồng sỉ | hợp đồng giá trị lớn (FR6.6 đã rút) |
| Cảnh báo khan hiếm cho khách sỉ | dự báo giá ổn định (FR11.3 đã rút) |
| Gói hiển thị nổi bật nhãn "Tài trợ" | NCC đạt ngưỡng uy tín |
| Giấy tờ xuất khẩu | 3 việc: mã số vùng trồng chính thức, thời hạn lưu nhật ký, thêm tác nhân đóng gói/kiểm dịch (PL-N) |
| Đồng bộ TraceViet, tra cứu mã số vùng trồng | được cấp quyền + chuẩn kết nối (FR4.8 đã rút) |
| Tách kiến trúc | thứ tự: trang truy xuất → thông báo → tìm kiếm; giữ chung tồn kho + đơn hàng |

### 3.D Sơ đồ ASCII cho bốn luồng chính

**(1) Đơn lẻ 1P** (`fig:act-dat-hang`, `fig:seq-dat-hang`; Ch4 Bán lẻ)

```
Giỏ -> Báo giá (tiền hàng, thuế, cước, COD?) -> Đặt đơn
   -> [khóa dòng tồn Farmery + GIỮ CHỖ 15']
        |- trả trước: VNPay -> webhook hợp lệ, xử lý 1 lần -> TRỪ TỒN -> Đã thanh toán
        |- COD (đơn < ngưỡng, chưa từng từ chối nhận) -> Đã thanh toán
        '- quá 15' / hủy -> NHẢ GIỮ CHỖ, tự hủy
Đã thanh toán -> Đóng gói (trước giờ chốt) -> Lên chuyến trung chuyển -> 3PL đã nhận
   -> Đang giao -> Đã giao -> [hết hạn khiếu nại] -> Hoàn tất (+ hóa đơn giả lập, mở đánh giá)
```

**(2) Giao ba chặng** (Ch4 "Giao hàng đơn lẻ ba chặng")

```
Nông hộ --(NCC tự đưa)--> Kho sơ chế Lâm Đồng --(xe lạnh, manifest sau giờ chốt)--> Điểm bàn giao TP.HCM
   chặng 1                       chặng 2                                                 |
                                                               3PL nội thành (webhook) -> Khách   chặng 3
```

**(3) Bán sỉ** (`fig:act-ban-si`, `fig:seq-hop-dong-si`)

```
RFQ (kiểm MOQ; chưa đạt -> gợi ý gộp đơn/sang lẻ) -> NCC báo giá bậc -> thương lượng trong kênh RFQ
   -> chốt -> hợp đồng mẫu (mỗi lần sửa = 1 phiên bản) -> hai bên xác nhận OTP (lưu mã băm)
   -> giao MỘT đợt -> bên mua xác nhận nhận -> thanh toán cổng -> hoa hồng + hóa đơn dịch vụ
```

**(4) Lô → QR** (`fig:act-dang-san-pham`; **đang chạy được**)

```
NCC tạo lô (pending_review) + ghi nhật ký (chỉ nối thêm)
   -> kiểm duyệt viên: duyệt -> approved + mã TRC-… + QR -> trang /truy-xuất/{mã} công khai
                       từ chối (lý do 5–1000 ký tự) -> rejected, NCC thấy lý do
```

### 3.E Các bước chi tiết từng luồng (kèm trạng thái)

Nhãn như ở đầu file: **[Hiện thực]**, **[Giao diện]** (có màn hình, API 501), **[Để sau prototype]**, **[Chỉ thiết kế]** (cố ý không làm), **[Chưa có mã]** (thuộc bản nộp, chưa có mã), **[Ngoài phạm vi]**.

**E1. Đơn lẻ 1P, 19 bước (`fig:luong-don-le`) — [Giao diện], API `retail`/`payment`/`inventory` rỗng**

| Bước | Ai → ai | Nội dung |
|---|---|---|
| 1 | Khách → `retail` | Đặt đơn (địa chỉ, khung giờ); nhận mã đơn |
| 2 | `retail` → `inventory` | Giữ chỗ 15 phút, khóa dòng tồn Farmery (`SELECT … FOR UPDATE`) |
| 3 | `retail` → `notification` | Sự kiện `OrderPlaced` |
| 4 | `retail` → `payment` | Tạo giao dịch; nhận đường dẫn thanh toán |
| 5 | `payment` → cổng (VNPay thử) | Lệnh thanh toán; nhận mã giao dịch |
| 6 | Khách → cổng | Thanh toán trên trang của cổng (hoặc COD đủ điều kiện) |
| 7 | Cổng → `payment` | Webhook kết quả (chữ ký hợp lệ, xử lý một lần) |
| 8–9 | `payment` → `retail`, `notification` | Sự kiện `PaymentSucceeded` |
| 10 | `retail` → `inventory` | Chuyển giữ chỗ thành trừ tồn, ghi sổ xuất |
| 11 | `retail` → `fulfillment` | Tạo giao hàng cho đơn đã thanh toán |
| 12 | Nhân viên kho | Đóng gói, in tem QR |
| 13 | Nhân viên kho | Sau giờ chốt: xếp lên chuyến trung chuyển |
| 14 | `fulfillment` → 3PL (GHN thử) | Tạo vận đơn chặng cuối; nhận mã vận đơn |
| 15 | 3PL → `fulfillment` | Webhook: đã nhận, đang giao, đã giao |
| 16–17 | `fulfillment` → `retail`, `notification` | Sự kiện `ShipmentStatusChanged` |
| 18 | `notification` → khách | Thông báo đẩy, email ở mỗi trạng thái |
| 19 | `retail` → `payment` | Đơn hoàn tất: lập hóa đơn (giả lập) |

- Hiện trạng prototype: bước 2–19 không chạy trên API thật; giao diện hỏi lại 5 giây, nhân viên bấm "chuyển bước" thay webhook 3PL; thanh toán là `DemoPaymentGateway` (luôn thành công).
- Tám trạng thái đơn: Đã đặt → Đã thanh toán → Đang đóng gói → Lên chuyến → 3PL đã nhận → Đang giao → Đã giao → Hoàn tất/Khiếu nại.

**E2. Thu mua theo lô (1P) — [Chưa có mã] (mô-đun rỗng; bước 5 nghiệm thu là [Để sau prototype]); `fig:act-thu-mua`, UC-B5**

1. Nhà cung cấp công bố **chào giá lô** (sản lượng sắp thu hoạch, giá mong muốn) — `procurement.supplier_offers`.
2. Nhân viên thu mua xem chào giá, **dự báo giá** (AI offline) và tồn hiện có; lập **đơn thu mua**.
3. Nhà cung cấp **xác nhận**; từ lúc này phần sản lượng được **giữ chỗ** trên dòng tồn của nhà cung cấp.
4. Nhà cung cấp tự đưa hàng về kho Lâm Đồng (chặng 1).
5. Nhân viên kho **nghiệm thu**: ghi phần đạt, phần từ chối (`goods_receipts`).
6. Phần đạt **đổi chủ** sang dòng tồn của Farmery (giữ mã lô, QR); phần từ chối ở lại dòng nhà cung cấp.
7. Ghi khoản phải trả nhà cung cấp theo sản lượng đạt (`supplier_payouts`; sự kiện `ProcurementReceived`).
8. Đóng gói **một bước** thành đơn vị bán lẻ, in tem QR (`packing_runs`).
9. Nhân viên thu mua **đặt giá bán lẻ** (`retail.listings`).
- Lô sỉ cận hạn có thể được Farmery thu mua chiết khấu; Farmery không bán sỉ lại (FR13.7 đã rút).

**E3. Đăng sản phẩm/lô và kiểm duyệt ba giai đoạn — [Hiện thực] phần lô; tạo sản phẩm mới [Giao diện]**

1. Nhà cung cấp tạo sản phẩm (cần qua kiểm L1 danh mục lá đóng, L2 danh sách loại trừ, L3 kiểm duyệt trước hiển thị) — `POST /seller/products` còn 501.
2. Tạo lô: trạng thái `pending_review`, hệ thống tự sinh việc duyệt (hạn mặc định 48 giờ, cấu hình được).
3. Ghi nhật ký canh tác (chỉ nối thêm; sửa = bản mới có `supersedesId`, bản cũ thành "đã đính chính").
4. Kiểm duyệt viên duyệt → `approved` + mã `TRC-…` + `traceUrl`; hoặc từ chối kèm lý do 5–1000 ký tự.
5. Sự kiện `BatchApproved` mở dòng tồn của nhà cung cấp (phía `inventory` chưa có).
- Ba giai đoạn (`tab:kiemduyet-giaidoan`): **trước giao hàng** (hồ sơ/eKYC 5 ngày làm việc; sản phẩm; lô mặc định 48 giờ, cấu hình được; nghiệm thu), **trong giao hàng** (trạng thái chuyến–vận đơn; kiểm khi xuất kho), **sau giao hàng** (khiếu nại; đánh giá nghi vấn, báo cáo sai danh mục; vi phạm, thu hồi lô). Chỉ "lô hàng" và "nhân viên chuyển trạng thái đơn" là đã hiện thực; hồ sơ NCC/eKYC/chứng nhận, nghiệm thu, khiếu nại-đổi trả, đánh giá nghi vấn và báo cáo sai danh mục, vi phạm và thu hồi lô đều *Để sau prototype*; kiểm khi xuất kho, bàn giao 3PL là *Chỉ thiết kế*.
- Đổi giá > 20% hoặc đổi mô tả chất lượng → duyệt lại.

**E4. Truy xuất QR — [Hiện thực]**

1. Khách quét QR → `GET /public/trace/{traceCode}` (không đăng nhập).
2. Trang hiện hồ sơ nhà cung cấp, chứng nhận (chứng nhận hết hạn bị ẩn nhãn), nhật ký canh tác theo thời gian; dòng bị đính chính vẫn hiện (gạch ngang).
3. Lô bị thu hồi: trang hiện cảnh báo (thu hồi lô là [Để sau prototype]).
- Đường phục vụ trang này được tách và cache tích cực (thành phần nên tách ra trước nếu chia nhỏ).

**E5. Bán sỉ RFQ → hợp đồng — [Chưa có mã]; MVP xếp "tối giản", tuần 8–9; `fig:act-ban-si`, `fig:seq-hop-dong-si`, UC-D4**

1. Doanh nghiệp mua sỉ đăng ký tài khoản doanh nghiệp; **kiểm duyệt viên** xác minh GPKD + MST trước khi cấp quyền xem bảng giá sỉ và gửi RFQ (FR1.3, FR10.1); sau đó gửi RFQ; hệ thống kiểm MOQ, chưa đạt thì gợi ý gộp đơn/sang lẻ.
2. Nhà cung cấp báo giá bậc theo số lượng (`price_tiers`).
3. Hai bên thương lượng trong kênh của RFQ (`rfq_messages`); sự kiện `RfqUpdated`.
4. Chốt báo giá → sinh hợp đồng từ mẫu; mỗi lần sửa là một phiên bản (`contract_versions`).
5. Mỗi bên **xác nhận giao kết bằng OTP**; lưu tài khoản, thời điểm, mã băm đúng phiên bản (`contract_confirmations`); sự kiện `ContractConcluded`.
6. Giữ chỗ dòng tồn của nhà cung cấp; giao **một đợt**; bên mua xác nhận nhận hàng.
7. Thanh toán qua cổng khi nhận; Farmery thu hoa hồng + hóa đơn dịch vụ.
- Chỉ thiết kế: ký số (FR6.6 đã rút), giao nhiều đợt (FR6.5), ký quỹ (FR7.3), khấu trừ thuế.

**E6. Thanh toán và hoàn tiền — [Giao diện] (cổng giả); thật là [Chỉ thiết kế]**

- Thanh toán: giữ chỗ 15 phút → cổng → webhook (chữ ký, xử lý một lần) → `PaymentSucceeded` → trừ tồn. Quá 15 phút hoặc thất bại → nhả giữ chỗ, tự hủy.
- COD: chỉ đơn dưới ngưỡng cấu hình và tài khoản chưa từng từ chối nhận hàng; báo giá trả `codReason` khi không đủ điều kiện.
- Hoàn tiền: qua cổng, cam kết hoàn trong 7 ngày làm việc; hoàn không cần trả hàng dưới ngưỡng → bút toán hủy; sự kiện `Refunded`.
- Farmery không giữ tiền; không lưu dữ liệu thẻ (NFR3.4); hóa đơn điện tử thật [Chỉ thiết kế], bản giả lập cùng giao diện.

**E7. Giao ba chặng — [Giao diện] chỉ phần nhân viên chuyển trạng thái**

1. Chặng 1: nhà cung cấp tự đưa hàng về kho sơ chế Lâm Đồng (xe gom chặng đầu là [Chỉ thiết kế]).
2. Chặng 2: xe lạnh Lâm Đồng–TP.HCM theo chuyến cố định; manifest lập sau giờ chốt (`transfer_trips`, `trip_orders`).
3. Chặng 3: 3PL nội thành tạo vận đơn, webhook trạng thái (`shipments`, `shipment_events`).
- Phí giao = cước 3PL + phần chia chặng trung chuyển (FR8.2); trễ/sự cố hiện trên bảng giám sát (FR10.5); lỗi 3PL: Farmery xử lý với khách trước, đòi 3PL sau.

**E8. Đổi trả, hoàn tiền, khiếu nại — [Để sau prototype]; UC-C6, `fig:act-doi-tra`**

1. Khách gửi yêu cầu trong hạn (rau lá 24 h, củ quả 48 h, hàng khô 7 ngày) kèm ảnh.
2. Farmery tiếp nhận trong 24 h; trao đổi theo đơn (`messages`).
3. Phân loại nguyên nhân; quyết định trong 3 ngày làm việc: hoàn toàn phần / một phần / giao bù / từ chối.
4. Hoàn tiền qua cổng (7 ngày làm việc); hàng trả về nhập kho (`CaseResolved`, `Refunded`).
- Khiếu nại lặp trên một lô tự gắn cờ → vào hàng đợi vận hành.

**E9. Đánh giá — [Để sau prototype]; UC-C7, `fig:act-danh-gia`**

1. Đơn hoàn tất mới được đánh giá (verified purchase): 1–5 sao, nhận xét, ảnh.
2. Kiểm sơ bộ (luật ngưỡng) → công khai hoặc vào hàng đợi kiểm duyệt (`ReviewPosted`).
3. Cập nhật điểm uy tín nhà cung cấp 0–100, cửa sổ 6 tháng; hậu kiểm nhanh từ ≥ 80.
4. Nhà cung cấp phản hồi **một lần**.

**E10. Thu hồi lô — [Để sau prototype]; FR13.6, `fig:act-thu-hoi`**

1. Nhân viên vận hành phát hiện lô lỗi → khóa mọi dòng tồn của lô (cả hai luồng).
2. Truy sổ nhập xuất lập danh sách đơn đã bán (`BatchRecalled`).
3. Báo người mua; trang QR hiện cảnh báo thu hồi.

**E11. Xử lý vi phạm — [Để sau prototype]; FR10.2, `fig:act-vi-pham`**

- Thang: nhắc nhở → cảnh cáo công khai → tạm khóa → khóa vĩnh viễn. Vi phạm nghiêm trọng (giả mạo chứng nhận, gian lận): ẩn ngay tin/lô, khóa tài khoản không qua bước trung gian, rà soát đơn đang xử lý.
- Mọi quyết định ghi `violation_records`; thao tác nội bộ ghi `staff_audit_logs`; nhãn tích lũy cho ML bất thường về sau.

**E12. Đăng ký nhà cung cấp, eKYC, chứng nhận — [Để sau prototype] (hiện chỉ đọc hồ sơ mock); `fig:act-dang-ky-ncc`**

1. Đăng ký, khai loại người bán thuế (FR2.4) → OTP email.
2. Tải ảnh giấy tờ + ảnh chân dung (eKYC): trong phạm vi đồ án kiểm duyệt viên đối chiếu thủ công; đối chiếu khuôn mặt tự động [Chỉ thiết kế].
3. Tải chứng nhận → kiểm 3 tầng: (1) hệ thống kiểm định dạng mã vùng trồng; (2) kiểm duyệt viên đối chiếu mã với cổng công bố của Bộ NN&MT và ghi kết quả; (3) duyệt hồ sơ chứng nhận thủ công (5 ngày làm việc).
4. "Đã xác thực" → `UserVerified` mở quyền đăng bán. Hết hạn chứng nhận → `CertExpired`: ẩn nhãn, **không gỡ sản phẩm**.

**E13. Thông báo — Web Push [Để sau prototype]; email/SMTP [Chưa có mã]; SMS [Chỉ thiết kế]**

- Mô-đun `notification` chỉ nhận sự kiện, nên dịch vụ đẩy/email chậm không làm chậm giao dịch. Kênh: web, Web Push, email SMTP; SMS [Chỉ thiết kế]. Prototype: giao diện hỏi lại 5 giây; OTP chỉ ghi log (`DemoOtpSender`); SMTP gửi thư (OTP thật, thông báo) chưa có.
- Cơ chế Web Push: PWA đăng ký service worker; trình duyệt đăng ký với dịch vụ đẩy của hãng trình duyệt và trả về subscription (địa chỉ + khóa); máy chủ nghiệp vụ lưu ở `notification.push_subscriptions`; khi đơn đổi trạng thái gửi yêu cầu HTTP ký VAPID tới địa chỉ đó; service worker hiển thị thông báo kể cả khi đóng tab (định nghĩa đầy đủ ở 8.2).

**E14. Nhập liệu thay nhà cung cấp — [Chưa có mã], có điểm nghẽn hợp đồng**

1. Nhân viên hỗ trợ vùng được phân công nhà cung cấp (`support_assignments`).
2. Nhập nhật ký/lô hộ; ghi `entered_by`, thời điểm, lý do, cờ `onBehalf`; ghi `staff_audit_logs`.
3. Nhà cung cấp xem lại. (Ghi chú lỗ hổng: xem phần 5, điểm 9.)

**E15. Ba tính năng AI**

| Tính năng | Luồng | Trạng thái |
|---|---|---|
| Tìm kiếm ngữ nghĩa (FR12.3) | truy vấn → FTS (`unaccent`, trigram) + vector BGE-M3 → hợp nhất RRF | [Chưa có mã]; hiện: bỏ dấu + Levenshtein trong bộ nhớ [Hiện thực bản tạm] |
| Sản phẩm tương tự (FR12.1) | vector sản phẩm → láng giềng gần nhất cosine, loại sản phẩm đang xem, chỉ còn hàng, lấy 5 | [Chưa có mã]; hiện: cùng danh mục, 4 sản phẩm đầu [Hiện thực bản tạm]; gợi ý cá nhân hóa [Chỉ thiết kế] |
| Dự báo giá (FR12.2) | giá công khai theo tuần → SARIMA/Prophet (đối chứng gradient boosting) offline hằng tuần → màn lập đơn thu mua | [Chưa có mã] |
- Chung: sự kiện `ProductChanged` → dịch vụ AI tính vector → `ProductEmbedded` → `catalog.product_embeddings`. AI ngừng thì tìm kiếm lùi về từ khóa, trang chủ lùi về bán chạy. Dịch vụ AI không đọc CSDL.

---

## 4. Câu hỏi khó và cách đáp (10 câu)

Phần hỏi đáp đầy đủ (100 câu) nằm ở `VIVA-HOI-DAP.md`; ở đây chỉ giữ 10 câu khó nhất.

1. **Vì sao modular monolith, không microservices?**
   Nghiệp vụ khó nhất là chống bán vượt khi nhiều giao dịch giành một dòng tồn, dựa vào transaction + khóa dòng trong **một** CSDL; tách dịch vụ phải thay bằng saga/compensating transaction phức tạp hơn nhiều (Ch5 §5.3.1). Microservices chỉ đáng khi nhiều đội làm song song. Đường lui: RB1–RB3 + mỗi mô-đun một schema để tách sau.

2. **Vì sao vẫn tách riêng dịch vụ AI?**
   Khác ngôn ngữ (Python: BGE-M3, SARIMA/Prophet) và đặc tính tài nguyên khác lõi nghiệp vụ; tách để sự cố AI không chặn giao dịch (dịch vụ gợi ý chết thì trang chủ lùi về "bán chạy"). Dịch vụ AI không đọc thẳng CSDL, nhận dữ liệu qua sự kiện/lời gọi nội bộ (Ch5 "Các quyết định kiến trúc"). *Thật thà:* dịch vụ AI chưa có trong repo.

3. **Chống bán vượt tồn cụ thể thế nào?**
   Khóa bi quan `SELECT … FOR UPDATE` trên dòng tồn trong transaction Prisma (phần duy nhất cần SQL thô); giữ chỗ 15 phút trước, trừ tồn sau khi thanh toán; đơn nào xác nhận trước được ưu tiên, đơn còn lại hủy kèm thông báo hết hàng (Ch4 §4.1.2). Ngưỡng: ≥ 50 yêu cầu đồng thời, **0% oversell** (NFR1.2). *Thật thà:* chưa hiện thực, kế hoạch tuần 6–7; chưa có số đo.

4. **Phạm vi so với thực tế — mình làm được bao nhiêu?**
   Báo cáo thiết kế đủ hai luồng, hiện thực chia ba mức (§1.3.4, `MVP.md`). Hiện trạng 28/10: 20/40 thao tác hợp đồng chạy (đăng nhập, danh mục/tìm kiếm/truy xuất, lô–nhật ký–duyệt); luồng giao dịch mới ở giao diện. Còn 9 tuần GĐ2, cắt theo thứ tự đã định trong `kehoach.tex` (mục để sau → dự báo giá → trao đổi theo đơn), không cắt trục bán lẻ.

5. **Dữ liệu AI lấy ở đâu, nhỏ như vậy có đáng tin?**
   Không có dữ liệu giao dịch thật nên: dự báo giá chạy offline trên **giá nông sản công khai** (PL-O), đối chứng gradient boosting; tìm kiếm/tương tự dùng vector BGE-M3 có sẵn nên chạy được từ ngày đầu (cold start); đánh giá bằng bộ gán nhãn tay ≥ 50 mẫu, ghi rõ giới hạn là dữ liệu mô phỏng. Ngưỡng MAPE < 20% đặt thấp hơn ~82% của Farm2Market vì đó là kết quả học thuật có thể tối ưu trên dữ liệu chọn lọc.

6. **Bảo mật và riêng tư?**
   RBAC đặc quyền tối thiểu (6 vai trò độc lập, `x-roles` trong hợp đồng, API trả 403); xác thực hai lớp TOTP cho nhân sự (NFR3.6); bcrypt cost ≥ 10; mã hóa AES-256 dữ liệu nhạy cảm và ảnh eKYC; tệp riêng tư qua đường dẫn có chữ ký hết hạn; không lưu dữ liệu thẻ (PCI-DSS ở cổng); khóa 30 phút sau 5 lần sai; ghi nhận đồng ý + quyền xem/sửa/xóa theo Luật BVDLCN 2025. *Thật thà:* prototype dùng OTP cố định `123456` sau cờ `DEMO_MODE`, token admin ở `localStorage`; TOTP, mã hóa là việc của MVP.

7. **Nếu nhà cung cấp nhập sai/gian dữ liệu truy xuất thì QR có ý nghĩa gì?**
   Đúng giới hạn blockchain cũng không giải được: dữ liệu vào phải đúng. Farmery đặt lớp **con người**: kiểm duyệt viên duyệt lô, chứng nhận kiểm 3 tầng, nhật ký đã công khai chỉ nối thêm (đính chính hiện công khai), nhân viên hỗ trợ vùng nhập hộ có dấu vết, khiếu nại lặp trên một lô tự gắn cờ, thu hồi lô có sẵn. Giả mạo chứng nhận → khóa vĩnh viễn.

8. **Vì sao Farmery tự gánh tồn kho (1P) mà không chỉ làm sàn?**
   Với đơn vài kg, nông dân/HTX không đủ năng lực phân loại, đóng gói, xử lý từng đơn, nên trải nghiệm không ổn định; một đầu mối chịu trách nhiệm trước người mua (Ch4 §4.1.1). Đổi lại phải trả giá: vốn lưu động, hao hụt; được kiểm soát bởi điều kiện hòa vốn và chọn địa bàn ~300 km. Hai luồng chỉ hỗ trợ một chiều: lô sỉ cận hạn có thể được Farmery thu mua chiết khấu; Farmery không bán sỉ để không cạnh tranh với nhà cung cấp.

9. **Tại sao dùng "xác nhận giao kết" thay vì ký số, có giá trị pháp lý không?**
   Hình thức xác nhận bằng phương tiện điện tử được công nhận theo Luật GDĐT 2023 (Điều 22–23); hệ thống lưu tài khoản, thời điểm và **mã băm đúng phiên bản** để chứng minh nội dung hai bên đồng ý. Ký số cho hợp đồng giá trị lớn là hướng phát triển vì cần tổ chức chứng thực (Ch8). Báo cáo tự ghi dè dặt ở phần pháp lý.

10. **Thanh toán, hoàn tiền, thuế: nền tảng có giữ tiền không?**
    Không: thanh toán/hoàn tiền/ký quỹ đi qua cổng được cấp phép, Farmery chỉ ghi trạng thái và mã giao dịch; webhook phải có chữ ký hợp lệ và xử lý một lần; COD chỉ với điều kiện. Thuế: đơn lẻ nông sản chưa chế biến 5% GTGT; khấu trừ thuế thay cho NCC hộ/cá nhân (1% GTGT + 0,5% TNCN) là chỉ thiết kế, nhưng đã khai báo loại người bán (FR2.4) để sẵn dữ liệu.

*(Câu dự phòng ngắn)* **Có chặn giá bất thường không?** Hệ thống kiểm sơ bộ giá lệch mặt bằng danh mục + luật ngưỡng cấu hình bởi quản trị viên. **Có thử với nông dân thật chưa?** Chưa; kế hoạch tuần 13 theo PL-B, ngưỡng 80% hoàn thành không hỗ trợ.

---

## 5. Điểm yếu cần biết trước (trung thực)

**A. Phần báo cáo còn TODO (hội đồng đọc thấy ngay)**
1. **Ch6 gần như trống:** chỉ có §6.1.1 môi trường; thiếu kiến trúc triển khai, 8 mô-đun hiện thực, giải thuật, kết quả kiểm thử.
2. **Ch7 chưa có một số đo nào:** không có bảng test case, số đo k6/Lighthouse/axe, số đo chống bán vượt, kết quả RBAC, kết quả AI, kết chương. Phải nói là *"khung và ngưỡng"*, không nói "đã đạt".
3. **Ch8 §8.1 "Kết quả đạt được" là TODO:** chưa đối chiếu MT1–MT7.
4. **Ch5 còn TODO:** thiết kế API, UI/UX, test case; sơ đồ luồng dữ liệu AI.
5. **Phụ lục A (hướng dẫn sử dụng), C (mã nguồn bổ sung) TODO;** Ch7 thiếu "điều kiện đo" (cấu hình máy, phiên bản công cụ).
6. `NOTES.md` còn mục mở: TODO trích dẫn (văn bản pháp lý Ch2), kiểm tra lại Ch1 mục tiêu/phạm vi. (Tôi không rà lại toàn bộ `NOTES.md` nên có thể còn mục khác.)

**B. Phần chưa hiện thực nhưng báo cáo viết như trục chính**
7. **Giao dịch bán lẻ đầu–cuối chưa chạy trên API thật.** `retail`, `payment`, `inventory`, `fulfillment`, `procurement`, `wholesale`, `engagement`, `notification`, `media` chỉ có file module rỗng; hợp đồng 40 thao tác, **20 có handler**, 20 trả 501. Giao diện giỏ hàng/thanh toán/đơn hàng/vận hành đơn/tồn kho/cấu hình dựng theo hợp đồng và được kiểm bằng **server giả ngoài repo, không commit** (`DECISIONS.md` 17/10, 21/10). `NOTES.md` mục "BE2" (27/10) vẫn `Status: open`.
8. **Chống bán vượt, FEFO, giữ chỗ 15 phút, máy trạng thái đơn:** `apps/api/README.md` nói các luật này "có test đi kèm", nhưng chưa có mã và test nào của chúng; mô-đun `inventory`/`retail` rỗng.
9. **Nhập liệu thay nhà cung cấp** (thuật ngữ mới của báo cáo): service đã gán `onBehalf` cho `staff_*`, nhưng `x-roles` của `appendFarmingLog` chỉ có `seller` → nhân viên hỗ trợ vùng sẽ bị 403; chưa có test. (Tôi suy từ đọc mã, chưa chạy.)
10. **AI:** không có dịch vụ Python/FastAPI nào trong `apps/`; tìm kiếm là bỏ dấu + Levenshtein trong bộ nhớ, "tương tự" là cùng danh mục lấy 4 sản phẩm đầu, **không có** ngữ nghĩa/vector/dự báo giá/mã `product_embeddings`/`price_forecasts` thật.
11. **Không có Web Push (Để sau prototype), SMTP gửi thư, SMS (chỉ thiết kế), hóa đơn giả lập, GHN, hoàn tiền** nào chạy; theo dõi đơn dùng hỏi lại 5 giây. Trong 5 hệ thống ngoài thuộc phạm vi MVP, mã chỉ có 2 đứng sau interface kèm bản giả (cổng thanh toán, gửi OTP qua email).
12. **Eventing/Redis:** 17 sự kiện thiết kế (PL-V), chưa có hàng đợi; mô-đun gọi nhau chưa qua sự kiện.

**C. Chỗ prototype dùng mock / trong bộ nhớ**
13. Lưu trữ **trong bộ nhớ** từ `packages/mock-data`, `POST /api/dev/reset`; Prisma/PostgreSQL dự kiến tuần 5 (23–29/10), chưa xong. Do đó **chưa có** giao dịch CSDL thật, schema 65 bảng chưa được dùng trong chạy thật.
14. `identity` là bản tạm: vai trò theo quy tắc email (email chứa "admin"/"staff"), mọi email khác thành cùng một người dùng `seller`+`buyer_retail` (id 201); `GET /me` cố định; `FALLBACK`/giá trị gõ cứng (`supplierId "101"`, `categoryId "1"`, `unit "kg"`) ở `catalog.service` (`NOTES.md` 21/10, BE1).
15. OTP cố định `123456` trả `devCode` (chỉ khi `DEMO_MODE`); thanh toán `DemoPaymentGateway`; nhân viên bấm chuyển bước thay webhook; token admin ở `localStorage`; id sinh bằng `Date.now()` có thể trùng; URL ảnh nhật ký gõ cứng `localhost:4000`.
16. CI chưa chạy Playwright; `develop`/`main` chưa bật branch protection (`NOTES.md` 27/10).
17. Số test: 37 API + 10 Playwright **chỉ phủ phần đã chạy** (đăng nhập, catalog, lô–duyệt–QR); không đo độ phủ/SonarQube trong tài liệu tôi đọc.

**D. Mâu thuẫn tài liệu cần chuẩn bị đáp**
18. **Nhãn "Để sau prototype" đã khép các mâu thuẫn cũ** giữa `MVP.md`/§1.3.4 và Ch4 (đánh giá FR5.5, thông báo đẩy FR11.1, nghiệm thu nhập kho, hồ sơ NCC/eKYC): cùng thuộc MVP, nhưng chưa làm ở prototype. Cách nói: ba mức (Ch1 §1.3.4) trả lời "làm sâu đến đâu", ba nhãn trả lời "đã làm chưa"; đánh giá và thông báo vẫn nằm trong trục bán lẻ làm sâu, nhưng nhãn là *Để sau prototype*.
19. Kế hoạch (`kehoach.tex`) cập nhật 13/10; hiện trạng 28/10 trễ so với kế hoạch tuần 5–7 (Prisma, tồn kho). Nên có sẵn câu giải thích và phương án cắt.
20. Ch2 `tab:phaply` tham chiếu các văn bản đặt hiệu lực 2026 (NĐ 248/2026, NĐ 68/2026, NĐ 141/2026...); báo cáo tự nhận chưa đọc toàn văn NĐ 141/2026.
21. **Nhãn dư âm trong báo cáo (đọc 28/10):** PL-M dòng FR9 còn ghi "yêu thích *(chỉ thiết kế)*", Ch5 §5.3.5 và PL-K (`wishlist_items`) cũng ghi "chỉ thiết kế", PL-K cột `channel` ghi `push` là "Chỉ thiết kế"; trong khi Ch4 ghi FR9.2 và Web Push là *Để sau prototype*. Nếu bị hỏi, nói theo Ch4 (nguồn định nghĩa nhãn).

**E. Gợi ý chuẩn bị**
- Làm một bảng "MT1–MT7 × bằng chứng": MT1 (thủ công, `ekyc_documents` chưa chạy), MT2 **có**, MT3–MT5 thiết kế + giao diện, MT6 chưa, MT7 một phần (kiểm duyệt lô, tổng quan).
- Chuẩn bị demo duy nhất chắc chạy: **đăng nhập → NCC tạo lô + ghi nhật ký → cán bộ duyệt → quét QR công khai → NCC thấy "Đã phê duyệt"**; chạy `pnpm e2e` trước giờ bảo vệ.
- Với mọi câu hỏi về chống bán vượt/AI/thanh toán: trả lời *thiết kế → vì sao → kế hoạch → hiện trạng*, không nhận là đã chạy.

---

## 6. Độ không chắc của tài liệu này

- Số mục (4.x, 5.x, 6.x) suy từ thứ tự LaTeX, không mở PDF; một số "mục" ở phần trích có thể lệch.
- Báo cáo đối chiếu ở bản `.tex` làm việc ngày 28/10 (chưa biên dịch lại); số 286 trang đếm từ `main.pdf`.
- Mức "hiện thực" suy từ `apps/` ở nhánh `feat/fe-e2e-kich-ban-lo` và `NOTES.md` đến 27/10; nhánh khác (do BE2) có thể đã có thêm mà tôi không thấy.
- Chưa chạy test/build nào (theo yêu cầu); số 37 + 10 test đếm bằng grep tên `it(`/`test(`.
- Chưa đọc: toàn bộ Phụ lục U/D, K, nhiều đoạn Ch2 §2.1.1 và persona Ch4 §4.2.
- Câu 9 phần 5 (nhập hộ bị 403) suy từ mã và hợp đồng, chưa thử gọi.

**Danh sách "cần xác nhận" (bổ sung 28/10)**

| # | Điểm | Vì sao chưa chắc | Ai/cái gì xác nhận |
|---|---|---|---|
| 1 | Số quy trình ở Ch4 §4.1.2 | Đếm tiêu đề LaTeX được 10 (khớp Ch5 kết chương: 10 sơ đồ); chỉ còn so lại PDF | Mở PDF Ch4 §4.1.2 |
| 2 | Số mục "thách thức" (4.2.3 hay 4.2.4) | Phụ thuộc cách đánh số persona/journey trong PDF | Mở PDF |
| 3 | 20/40 thao tác có handler | Đếm decorator `@Get/@Post` ở `apps/api/src` = 20, gồm 18 thao tác nghiệp vụ + `getHealth` + `resetData`; 20 còn lại 501 | Chạy API/gọi thử trước giờ bảo vệ |
| 4 | Hiện trạng nhánh khác | Phân tích ở nhánh `feat/fe-e2e-kich-ban-lo`; nhánh `develop` có thể có thêm | `git log develop` |
| 5 | PWA/service worker của shop | Báo cáo cam kết PWA + hàng đợi ngoại tuyến; tôi không kiểm mã `apps/shop` | Hỏi người làm FE |
| 6 | Phân công thành viên theo mô-đun | `kehoach.tex` không ghi tên người; chỉ ghi BE1/BE2/FE trong `NOTES.md` (BE1 làm `catalog`, `identity` tạm; BE2 phụ trách `retail`/`payment`) | Nhóm tự điền (phần 9) |
| 7 | Nguồn số hao hụt, số GlobalGAP, ngày TraceViet | Lấy lại từ Ch1–2 và `NOTES.md`, không mở lại nguồn | Mở nguồn trong `NOTES.md` rà 15/09 |
| 8 | Nhãn dư âm trong báo cáo (PL-M FR9, Ch5 §5.3.5, PL-K `wishlist_items`, `channel`) | Còn "chỉ thiết kế" trong khi Ch4 ghi "Để sau prototype" (phần 5, điểm 21) | Nhóm quyết định có sửa không |
| 9 | Mô tả Hình ERD tổng quan | Hình mới là ma trận phụ thuộc 9×7, nhưng văn bản/caption `fig:erd-tong-quan` trong `.tex` vẫn mô tả "đường nối gộp theo cặp" | Mở PDF, đối chiếu hình và caption |
| 10 | Nhãn [Chưa có mã] | Nhãn riêng của file viva cho phần thuộc bản nộp nhưng chưa có mã (bán sỉ, thu mua, tồn kho, AI, FR10.7...); báo cáo không có nhãn này | Nhóm thấy cần đổi tên thì sửa cả hai file |

---

## 7. Bản đồ hệ thống một trang

### 7.1 Tác nhân (Ch5 `tab:actor-usecase`)

| Nhóm | Tác nhân | Vai trò RBAC | Làm gì |
|---|---|---|---|
| Ngoài | Khách vãng lai | (chưa đăng nhập) | Tìm kiếm, quét QR, xem sản phẩm, đăng ký |
| Ngoài | Khách lẻ | `buyer_retail` | Chỉ luồng bán lẻ 1P |
| Ngoài | Khách sỉ (doanh nghiệp mua sỉ) | `buyer_wholesale` | Chỉ luồng bán sỉ 3P |
| Ngoài | Nhà cung cấp (nông dân, HTX) | `seller` | Bán sỉ cho khách sỉ; bán cả lô cho Farmery qua đơn thu mua |
| Nội bộ | Kiểm duyệt viên | `staff_moderation` | Duyệt hồ sơ nhà cung cấp, hồ sơ doanh nghiệp mua sỉ (GPKD, MST), sản phẩm, lô, chứng nhận, đánh giá; xử lý vi phạm nội dung |
| Nội bộ | Nhân viên vận hành | `staff_operations` | Khiếu nại, đổi trả, hoàn tiền; giám sát đơn/giao hàng; thu hồi lô |
| Nội bộ | Nhân viên thu mua | `staff_sourcing` | Lập đơn thu mua; định giá bán lẻ có tham khảo dự báo giá |
| Nội bộ | Nhân viên kho | `staff_warehouse` | Nghiệm thu, đóng gói–in tem, quản lý dòng tồn, chuyến trung chuyển–vận đơn |
| Nội bộ | Nhân viên hỗ trợ vùng | `staff_support` | Hướng dẫn và nhập liệu thay nhà cung cấp được phân công |
| Nội bộ | Quản trị viên hệ thống | `platform_owner` | Tài khoản nội bộ, cấu hình nền tảng, nhật ký thao tác |
| Hệ thống | Cổng thanh toán; Đơn vị vận chuyển; Dịch vụ hóa đơn điện tử | — | Bên ngoài (xem 7.4) |
- Sáu vai trò nội bộ là tập quyền **độc lập**, không kế thừa nhau; một tài khoản có thể gán nhiều vai trò khi đội còn nhỏ (NFR3.1). Nhân sự nội bộ đăng nhập hai lớp TOTP (NFR3.6), đường dẫn `/api/admin`.
- "Khách vãng lai" và "Nhân sự nội bộ" là tác nhân trừu tượng để sơ đồ gọn. Dịch vụ AI **không** phải tác nhân.

### 7.2 13 mô-đun ↔ schema ↔ bảng ↔ FR ↔ trạng thái trong mã (`apps/api/src/modules`, đếm 28/10)

| Khối | Mô-đun = schema | Số bảng | Bảng | FR | Trạng thái trong mã |
|---|---|---|---|---|---|
| Nền tảng chung | `identity` | 8 | users, user_roles, otp_challenges, addresses, businesses, ekyc_documents, consent_records, data_requests | FR1 | **Bản tạm**: 3 route (`/auth/otp`, `/auth/login`, `/me`), vai trò theo quy tắc email; `/me/addresses` 501 |
| | `notification` | 4 | notifications, deliveries, preferences, push_subscriptions | FR11 | **Rỗng** (chỉ file module) |
| | `media` | 1 | media_files | (hạ tầng tệp) | **Rỗng**; `uploadMedia` 501 |
| Nguồn cung | `supplier` | 3 | suppliers, certifications, support_assignments | FR2, FR3 | **Một phần**: chỉ đọc hồ sơ công khai (kho trong bộ nhớ) |
| | `catalog` | 5 | categories, products, batches, farming_logs, product_embeddings | FR4, FR12 (vector) | **Một phần, đầy đủ nhất**: danh mục, tìm kiếm, chi tiết, lô, nhật ký, QR; `createSellerProduct` 501; chưa vector |
| | `inventory` | 5 | stock_holdings, stock_movements, reservations, packing_runs, batch_recalls | FR13.2–13.6, FR4.3 | **Rỗng**; admin có màn Tồn kho (501) |
| Giao dịch | `procurement` | 4 | supplier_offers, purchase_orders, goods_receipts, price_forecasts | FR13.1–13.2, FR12.2 | **Rỗng** |
| | `retail` | 8 | listings, vouchers, carts, cart_items, orders, order_items, order_status_events, restock_subscriptions | FR5 | **Rỗng**; shop có giỏ/thanh toán/đơn (501) |
| | `wholesale` | 7 | price_tiers, rfqs, rfq_messages, contracts, contract_versions, contract_confirmations, wholesale_orders | FR6 | **Rỗng**; không có trong hợp đồng API |
| | `payment` | 5 | payments, refunds, invoices, commission_settlements, supplier_payouts | FR7 | **Rỗng**; có `PaymentGateway`/`DemoPaymentGateway` ở `integrations` |
| Sau bán | `fulfillment` | 6 | transfer_trips, trip_orders, shipments, shipment_events, return_requests, messages | FR8, FR9.1 | **Rỗng** |
| | `engagement` | 4 | reviews, review_replies, supplier_reputation, wishlist_items | FR5.5, FR9.2 | **Rỗng** |
| Vận hành | `operations` | 5 | platform_settings, review_tasks, violation_records, threshold_alerts, staff_audit_logs | FR10 | **Một phần**: hàng đợi duyệt (list/get/approve/reject); `listSettings`/`updateSettings` 501 |
| **Tổng** | 13 | **65** | (565 cột, 48 FK) | FR1–FR13 | 4/13 có mã nghiệp vụ (identity tạm, supplier, catalog, operations); 9/13 chỉ có file module |

- Lưu trữ hiện tại là **trong bộ nhớ** (repository in-memory + `packages/mock-data`); 65 bảng PostgreSQL chưa được dùng khi chạy (kế hoạch tuần 5).
- Tồn kho là **điểm hội tụ**: `procurement`, `retail`, `wholesale` cùng gọi `inventory` để khóa dòng tồn (`fig:c4-module`).
- Bảng của phần *chỉ thiết kế / để sau prototype* có trong lược đồ nhưng chưa ghi dữ liệu (PL-K), ví dụ `engagement.wishlist_items` (FR9.2), `retail.vouchers` (FR5.3), `retail.restock_subscriptions` (FR5.7): đều *Để sau prototype*.

### 7.3 Bảy container (C4 mức 2, `tab:container-io`)

| # | Container | Công nghệ | Vai trò | Trong repo hiện nay |
|---|---|---|---|---|
| 1 | Ứng dụng mua hàng | Next.js, PWA | Khách, nhà cung cấp; SSR trang QR/sản phẩm | `apps/shop` — có |
| 2 | Ứng dụng nội bộ | React, Vite, Refine | 6 vai trò nội bộ, đăng nhập hai lớp | `apps/admin` — có (các trang dashboard, inventory, login, orders, review-tasks, settings) |
| 3 | Máy chủ nghiệp vụ | NestJS, 13 mô-đun | REST, sự kiện, webhook, đường dẫn ký trước | `apps/api` — có, 20/40 thao tác |
| 4 | Cơ sở dữ liệu | PostgreSQL + pgvector | 13 schema, khóa dòng tồn, FTS, vector | **Chưa dùng** (bộ nhớ) |
| 5 | Lưu trữ tệp | MinIO (S3) | Ảnh WebP nhiều cỡ; tệp riêng qua URL ký trước | **Chưa có** |
| 6 | Hàng đợi sự kiện và cache (Redis) | Redis | Sự kiện giữa mô-đun, tác vụ nền, cache đọc nhiều | **Chưa có** |
| 7 | Dịch vụ AI | Python, FastAPI | Vector sản phẩm, tìm kiếm, tương tự, dự báo giá | **Chưa có** trong `apps/` |
- Ngoài ra repo có `apps/e2e` (Playwright), `packages/contract` (`openapi.yaml`, 40 thao tác) và `packages/mock-data`.

### 7.4 Mười hệ thống ngoài (C4 mức 1): 5 thuộc phạm vi MVP + 5 chỉ thiết kế

| # | Hệ thống | Nhóm | Dùng cho | Trạng thái trong mã |
|---|---|---|---|---|
| 1 | Cổng thanh toán (VNPay, môi trường thử) | Phạm vi MVP | Thanh toán, hoàn tiền, webhook (FR7.1) | **Đã đứng sau interface** `PaymentGateway` + bản giả `DemoPaymentGateway` (luôn thành công) |
| 2 | Đơn vị vận chuyển chặng cuối (GHN, môi trường thử) | Phạm vi MVP | Vận đơn, webhook (FR8.1) | **Để sau prototype**: chưa có mã; nhân viên bấm chuyển bước thay thế |
| 3 | Dịch vụ hóa đơn điện tử (giả lập) | Phạm vi MVP | Hóa đơn khi đơn hoàn tất (FR7.2) | **Để sau prototype**: chưa có mã |
| 4 | Email (SMTP) | Phạm vi MVP | OTP, thông báo | **Đã đứng sau interface** `OtpSender` + bản giả `DemoOtpSender` (chỉ ghi log); SMTP gửi thư thật và thư thông báo **chưa có** |
| 5 | Dịch vụ đẩy của trình duyệt (Web Push) | Phạm vi MVP | Thông báo đẩy (FR11.1) | **Để sau prototype**: chưa có mã |
| 6 | SMS | Chỉ thiết kế | OTP/thông báo qua SMS | — |
| 7 | TraceViet (Bộ NN&MT) | Chỉ thiết kế | Đồng bộ truy xuất (FR4.8 đã rút) | — |
| 8 | Tổ chức chứng thực chữ ký số | Chỉ thiết kế | Ký số hợp đồng sỉ (FR6.6 đã rút) | — |
| 9 | Google (OAuth) | Chỉ thiết kế | Đăng nhập (FR1.1) | — |
| 10 | Facebook (OAuth) | Chỉ thiết kế | Đăng nhập (FR1.1) | — |
- Nói đúng: tổng 10 = **5 thuộc phạm vi MVP** (vẽ nét liền) + **5 chỉ thiết kế** (nét đứt xám). Trong 5 hệ thống MVP, **mã hiện chỉ có 2 đứng sau interface kèm bản giả** (cổng thanh toán; gửi OTP qua email); **3 còn lại để sau prototype** (GHN, hóa đơn giả lập, Web Push). Không còn câu "5 hệ thống có trong hiện thực".
- Mỗi hệ thống ngoài chỉ do **một** mô-đun gọi tới. Web Push là chuẩn mở của trình duyệt chứ không phải đối tác ký hợp đồng (định nghĩa ở 8.2).

### 7.5 Hạ tầng sự kiện và quy tắc ràng buộc

- Gọi trực tiếp (cùng giao dịch): giữ chỗ, trừ tồn, kiểm OTP, tạo giao dịch thanh toán, tạo giao hàng. Còn lại qua **hàng đợi sự kiện Redis** (17 sự kiện, bảng ở 8.4).
- RB1 chia mô-đun theo miền; RB2 gọi qua giao diện công khai; RB3 không join xuyên schema (tham chiếu bằng định danh, nét đứt trong ERD).


---

## 8. Bảng tra nhanh

### 8.1 FR → use case → mô-đun → bảng → trạng thái

Use case có mã riêng trong báo cáo chỉ gồm UC-B2, B4, B5, C4, C6, C7, D4 (đặc tả); các use case còn lại nằm trong sơ đồ chi tiết theo tác nhân ở PL-S, không đánh mã ở đây. "—" = không có use case đặc tả.

| FR | Nội dung | Use case | Mô-đun | Bảng chính | Trạng thái mã 28/10 |
|---|---|---|---|---|---|
| FR1.1–1.2 | Đăng ký/đăng nhập theo vai trò, OTP email | — | identity | users, user_roles, otp_challenges | [Hiện thực] bản tạm (đăng nhập bằng email; bằng số điện thoại và Google/Facebook [Chỉ thiết kế]) |
| FR1.3–1.4 | Tài khoản doanh nghiệp mua sỉ (kiểm duyệt viên xác minh GPKD, MST); eKYC người bán (duyệt thủ công ảnh giấy tờ) | — | identity | businesses, ekyc_documents | FR1.3 [Chưa có mã]; FR1.4 [Để sau prototype] (đối chiếu khuôn mặt tự động [Chỉ thiết kế]) |
| FR1.5–1.6 | Sổ địa chỉ; đồng ý và quyền dữ liệu | — | identity | addresses, consent_records, data_requests | [Giao diện] địa chỉ (501) |
| FR2.1–2.4 | Hồ sơ NCC; thống kê; theo dõi tồn; loại người bán thuế | — | supplier | suppliers | [Hiện thực] chỉ đọc hồ sơ; FR2.2 thống kê [Để sau prototype] |
| FR3.1–3.3 | Chứng nhận: tải, duyệt, theo dõi hạn | — | supplier | certifications | [Hiện thực] hiển thị trên trang QR; tải/duyệt chứng nhận và nhắc gia hạn (FR3.3) [Để sau prototype] |
| FR4.1 | Đăng sản phẩm | UC-B4 | catalog | products, batches | [Hiện thực] lô; [Giao diện] sản phẩm mới |
| FR4.2 | Nhật ký canh tác theo lô | UC-B2 | catalog | farming_logs | [Hiện thực] |
| FR4.3 | Giữ chỗ/trừ tồn khi phát sinh giao dịch | UC-C4 | inventory | reservations, stock_holdings | [Chưa có mã] |
| FR4.4–4.6 | Danh mục đa cấp, tìm kiếm–lọc, ràng buộc hợp lệ | — | catalog | categories, products | [Hiện thực] |
| FR4.7 | Báo cáo sai danh mục | — | catalog | — | [Để sau prototype] |
| FR5.1–5.2, 5.4 | Giỏ, đặt hàng, theo dõi 8 trạng thái | UC-C4 | retail | carts, cart_items, orders, order_status_events | [Giao diện] |
| FR5.3, 5.6, 5.7 | Mã giảm giá; mua lại; báo khi có hàng | — | retail | vouchers, restock_subscriptions | FR5.3, FR5.7 [Để sau prototype]; FR5.6 [Chưa có mã] |
| FR5.5 | Đánh giá sản phẩm | UC-C7 | engagement | reviews, review_replies, supplier_reputation | [Để sau prototype] |
| FR6.1–6.4 | RFQ, báo giá, hợp đồng, giá bậc | UC-D4 | wholesale | rfqs, rfq_messages, contracts, contract_versions, contract_confirmations, price_tiers | [Chưa có mã] |
| FR6.5 | Giao nhiều đợt | — | wholesale | wholesale_orders | [Chỉ thiết kế] |
| FR7.1–7.2 | Thanh toán, hóa đơn | UC-C4 | payment | payments, refunds, invoices | [Giao diện] (cổng giả) |
| FR7.3–7.4 | Ký quỹ; đối soát–hoa hồng–thuế | — | payment | commission_settlements, supplier_payouts | [Chỉ thiết kế] |
| FR8.1–8.2 | Giao ba chặng; phí giao | — | fulfillment | transfer_trips, trip_orders, shipments, shipment_events | [Giao diện] chuyển trạng thái; xe gom chặng đầu, kiểm khi xuất kho [Chỉ thiết kế]; còn lại [Chưa có mã] |
| FR8.3 | Đổi trả, hoàn tiền, khiếu nại | UC-C6 | fulfillment, payment | return_requests, refunds | [Để sau prototype] |
| FR9.1–9.2 | Trao đổi theo đơn; yêu thích | — | fulfillment, engagement | messages, wishlist_items | FR9.1 [Chưa có mã]; FR9.2 [Để sau prototype] |
| FR10.1 | Duyệt hồ sơ (NCC, doanh nghiệp mua sỉ), sản phẩm, lô | UC-B4 | operations | review_tasks | [Hiện thực] phần lô; hồ sơ NCC [Để sau prototype] |
| FR10.2–10.3 | Giám sát vi phạm; xử lý khiếu nại | UC-C6 | operations | violation_records, threshold_alerts | [Để sau prototype] |
| FR10.4–10.6 | Báo cáo tổng quan; giám sát tồn–giao; cấu hình | — | operations, inventory | platform_settings | [Giao diện] tổng quan, tồn kho, cấu hình (FR10.4 thống kê [Để sau prototype]) |
| FR10.7 | Nhật ký thao tác nội bộ, nhập hộ | — | operations | staff_audit_logs | [Chưa có mã] |
| FR11.1–11.2 | Thông báo đa kênh; cảnh báo hết hạn/tồn thấp | — | notification | notifications, deliveries, preferences, push_subscriptions | FR11.1: thông báo đẩy [Để sau prototype], web/email [Chưa có mã], SMS [Chỉ thiết kế]; FR11.2 [Để sau prototype] |
| FR12.1, 12.3 | Sản phẩm tương tự; tìm ngữ nghĩa | — | catalog + dịch vụ AI | product_embeddings | Bản tạm [Hiện thực]; vector [Chưa có mã]; cá nhân hóa, tìm NCC theo ngữ nghĩa [Chỉ thiết kế] |
| FR12.2 | Dự báo giá | — | procurement + dịch vụ AI | price_forecasts | [Chưa có mã] |
| FR13.1–13.2 | Đơn thu mua; nghiệm thu | UC-B5 | procurement | supplier_offers, purchase_orders, goods_receipts | FR13.1 [Chưa có mã]; nghiệm thu (FR13.2) [Để sau prototype] |
| FR13.3–13.4 | Dòng tồn, sổ nhập xuất; đóng gói một bước | UC-B5 | inventory | stock_holdings, stock_movements, packing_runs | [Giao diện] màn Tồn kho; còn lại [Chưa có mã]; sơ chế nhiều bước, kiểm kê [Chỉ thiết kế] |
| FR13.6 | Thu hồi lô | — | inventory | batch_recalls | [Để sau prototype] |
| Đã rút | FR4.8 TraceViet; FR6.6 ký số; FR11.3 khan hiếm; FR13.5 thuê kho; FR13.7 chào sỉ tồn dư | — | — | — | [Ngoài phạm vi] (Ch8) |

### 8.2 Bảng thuật ngữ

| Thuật ngữ | Nghĩa trong Farmery | Nguồn |
|---|---|---|
| 3P / luồng bán sỉ | Nhà cung cấp tự bán (và giữ hàng) cho doanh nghiệp mua sỉ; Farmery thu hoa hồng | Ch2 §2.3.1, Ch4 `tab:hailuong` |
| 1P / luồng bán lẻ | Farmery thu mua rồi bán lại cho người tiêu dùng, tự gánh tồn kho | như trên |
| **Máy chủ nghiệp vụ** | Khối NestJS chứa 13 mô-đun (container số 3); khác dịch vụ AI | Ch5 §5.3.1 |
| **Doanh nghiệp mua sỉ** | Thuật ngữ mới thay cho "khách sỉ/bên mua B2B"; tài khoản doanh nghiệp, vai trò `buyer_wholesale`; hồ sơ (GPKD, MST) do kiểm duyệt viên xác minh | FR1.3, Ch5 `tab:actor-usecase` |
| **Chào giá lô** | Nhà cung cấp công bố lô sắp thu hoạch (`supplier_offers`); đầu vào của đơn thu mua | FR13.1, PL-Q |
| Đơn thu mua | Farmery mua cả lô của nhà cung cấp; hiệu lực khi nhà cung cấp xác nhận, phần sản lượng được giữ chỗ | Ch4 Thu mua |
| Nghiệm thu | Nhân viên kho kiểm chất lượng, ghi phần đạt/từ chối; phần đạt đổi chủ sang Farmery | FR13.2 |
| **Dòng tồn** | Bộ ba (lô, chủ sở hữu, nơi chứa); mọi thay đổi qua sổ nhập xuất, không sửa trực tiếp | FR13.3 |
| Sổ nhập xuất | `inventory.stock_movements`, nhật ký bất biến của tồn kho | PL-Q |
| Giữ chỗ | Khóa lượng hàng 15 phút khi đặt đơn; trừ tồn chỉ sau khi thanh toán | Ch4 Bán lẻ |
| FEFO | Hết hạn trước, xuất trước | Ch2 §2.3.8 |
| **Nhập liệu thay nhà cung cấp** | Nhân viên hỗ trợ vùng ghi nhật ký hộ NCC được phân công; có `entered_by`, lý do, `onBehalf` | FR4.2, FR10.7 |
| **Hàng đợi sự kiện và cache (Redis)** | Redis đảm hai việc: phát/nhận 17 sự kiện giữa mô-đun và tác vụ nền; cache truy vấn đọc nhiều | Ch5 §5.3.1, PL-V |
| Xác nhận giao kết | OTP + lưu tài khoản/thời điểm/mã băm phiên bản hợp đồng; không phải chữ ký số | FR6.3 |
| **Web Push** (thông báo đẩy của trình duyệt) | Chuẩn mở W3C (Push API + Notifications API), khóa VAPID (RFC 8292) để máy chủ tự định danh, mã hóa tải tin (RFC 8291). Luồng: PWA đăng ký service worker; trình duyệt đăng ký với dịch vụ đẩy do hãng trình duyệt vận hành (Google, Mozilla, Apple; miễn phí, Farmery không có hợp đồng hay tài khoản riêng) và nhận subscription (địa chỉ + khóa); máy chủ nghiệp vụ lưu ở `notification.push_subscriptions`; khi đơn đổi trạng thái gửi yêu cầu HTTP ký VAPID tới địa chỉ đó; service worker hiển thị thông báo kể cả khi đóng tab. Prototype hỏi lại trạng thái đơn mỗi 5 giây; MVP dùng Web Push: *Để sau prototype*. Nhãn trong hình: "Dịch vụ đẩy của trình duyệt (Web Push)" | Ch5 §5.2 "Dịch vụ bên thứ ba"; Ch4 `tab:chi-thiet-ke`; FR11.1; PL-I |
| Ba nhãn trạng thái | Đã hiện thực / Chỉ thiết kế (đặc tả đầy đủ, cố ý không làm) / Để sau prototype (thuộc MVP, chưa làm ở prototype) | Ch4 §4.3.1 |
| Kiểm duyệt chứng nhận ba tầng | (1) hệ thống kiểm định dạng mã vùng trồng; (2) kiểm duyệt viên đối chiếu mã với cổng công bố của Bộ NN&MT; (3) duyệt hồ sơ chứng nhận thủ công | Ch3 `tab:researchgap`, Ch4 §4.1.2 |
| Nhật ký chỉ nối thêm | Sửa = bản mới có `supersedesId`; bản cũ "đã đính chính", vẫn hiện công khai | NFR9.1 |
| Mã truy xuất `TRC-…` | Sinh khi lô được duyệt; gắn QR trỏ `/truy-xuất/{mã}` | FR4.2 |
| L1–L4 | Bốn lớp bảo đảm "đúng là nông sản": danh mục lá, loại trừ, kiểm duyệt trước hiển thị, hậu kiểm từ báo cáo người mua | Ch4 §4.3.1 |
| RB1–RB3 | Ba ràng buộc modular monolith: chia theo miền; gọi qua giao diện công khai; không join xuyên mô-đun | Ch5 §5.3.1 |
| RFQ / MOQ | Yêu cầu báo giá / số lượng tối thiểu | FR6.1 |
| RRF | Reciprocal rank fusion, hợp nhất xếp hạng FTS và vector | Ch5 `tab:tinhnangAI` |
| RPO / RTO | Mục tiêu điểm / thời gian khôi phục: ≤ 24 h / ≤ 4 h | NFR4.2, Ch4 §4.3.3 |
| 3PL | Đơn vị vận chuyển bên thứ ba (GHN) cho chặng cuối | FR8.1 |
| COD | Thu tiền khi nhận; chỉ đơn dưới ngưỡng, tài khoản chưa từng từ chối nhận | FR5.2 |
| DEMO_MODE | Cờ cấu hình bật lối tắt demo (OTP cố định `123456`, trả `devCode`) | `MVP.md` §6 |
| Prototype / MVP | Prototype = bản demo 21/10 chạy trong bộ nhớ, là nền của MVP; MVP = bản nộp cuối kỳ theo `MVP.md` | `MVP.md` |

### 8.3 Số liệu quan trọng (kèm nguồn)

| Nhóm | Số | Nguồn |
|---|---|---|
| Thiết kế | 13 mô-đun, 13 schema, 65 bảng, 565 cột, 48 FK; 11 hình ERD (1 ma trận phụ thuộc 9×7 + 10 hình theo schema); 7 container; 10 hệ thống ngoài (5 phạm vi MVP + 5 chỉ thiết kế; mã có 2 đứng sau interface); 17 sự kiện; báo cáo 286 trang | Ch5 §5.3.1, §5.3.5; PL-V; `main.pdf` |
| Yêu cầu | 13 nhóm FR (11 Must, 2 Should); 9 nhóm NFR (7 Must + 2 Should; NFR2.2 Could); `tab:chi-thiet-ke` 9 hàng chỉ thiết kế + 6 hàng để sau prototype; 5 mã FR đã rút | Ch4 §4.3; PL-M |
| Hợp đồng | 40 thao tác; 20 có handler (18 nghiệp vụ + health + reset), 20 trả 501 | `openapi.yaml`; grep controller 28/10 |
| Kiểm thử | 37 test API + 10 test Playwright | Đếm grep 28/10 |
| Bối cảnh | Giá đội 30–40%; hao hụt trái cây 35–40%, rau quả 20–40% (3,5–4,1 tỷ USD/năm) | Ch1 §1.1 |
| Tiêu chuẩn | VietGAP ~70 tiêu chí; GlobalG.A.P. 252 (36/127/89) | Ch2, PL-H |
| NFR1.1 | p95 < 2 s (k6); LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1; ở 100 người dùng đồng thời trung vị < 3 s, lỗi < 1% | PL-L |
| NFR1.2 / 4.1 | ≥ 50 yêu cầu đồng thời một dòng tồn, 0% oversell | PL-L |
| NFR2.2 | Mở rộng ngang: chỉ thiết kế (Could), không đo; rà soát máy chủ không giữ trạng thái phiên trong bộ nhớ | PL-L, PL-M |
| NFR3.1 / 3.3 / 3.5 | 100% endpoint nhạy cảm trả 403; bcrypt cost ≥ 10; khóa 30 phút sau 5 lần sai | PL-L |
| NFR4.2 / Ch4 | RPO ≤ 24 h, RTO ≤ 4 h; lưu trữ lạnh sau 1 năm | PL-L, Ch4 §4.3.3 |
| NFR6 | ≥ 80% hoàn thành không cần hỗ trợ | PL-L |
| NFR8.5 | Lưu hợp đồng ≥ 3 năm; hóa đơn, nhãn, chứng từ ≥ 5 năm | Ch4 |
| AI | nDCG@10 hơn từ khóa ≥ 15%, Recall@10 không thấp hơn, p95 < 1 s, ≥ 50 truy vấn gán nhãn; Precision@5 ≥ 0,6 (≥ 50 sản phẩm); MAPE < 20% (đối chiếu ~82% Farm2Market) | PL-L, Ch3 |
| Quy tắc | Giữ chỗ 15 phút; đổi giá > 20% thì duyệt lại; điểm uy tín 0–100, cửa sổ 6 tháng; duyệt hồ sơ 5 ngày làm việc, duyệt lô mặc định 48 giờ (cấu hình được) | Ch4 §4.1.2 |
| Khiếu nại | Hạn: rau lá 24 h, củ quả 48 h, hàng khô 7 ngày; tiếp nhận 24 h; quyết định 3 ngày làm việc; hoàn tiền 7 ngày làm việc | Ch4 §4.1.2 |
| Thuế | Đơn lẻ nông sản chưa chế biến 5% GTGT; khấu trừ thay NCC hộ/cá nhân 1% GTGT + 0,5% TNCN (chỉ thiết kế) | Ch4 §4.1.3 |
| Kế hoạch | 14 tuần: GĐ1 3 tuần tới 15/10; GĐ2 11 tuần tới 31/12/2026; prototype demo 21/10 | `kehoach.tex` |

### 8.4 Mười bảy sự kiện nghiệp vụ (PL-V) — [Chưa có mã], chưa có hàng đợi trong mã

| Sự kiện | Phát bởi | Nhận bởi |
|---|---|---|
| `UserVerified` | identity | supplier, notification |
| `CertExpired` | supplier | catalog, notification |
| `BatchApproved` | catalog | inventory, notification |
| `ProductChanged` | catalog | dịch vụ AI |
| `ProductEmbedded` | dịch vụ AI | catalog |
| `StockLow` | inventory | notification, operations |
| `BatchRecalled` | inventory | retail, wholesale, catalog, notification |
| `ProcurementReceived` | procurement | retail, payment, notification |
| `OrderPlaced` | retail | notification |
| `OrderCancelled` | retail | inventory, payment, notification |
| `RfqUpdated` | wholesale | notification |
| `ContractConcluded` | wholesale | payment, notification |
| `PaymentSucceeded` | payment | retail, wholesale, notification |
| `Refunded` | payment | retail, fulfillment, inventory, notification |
| `ShipmentStatusChanged` | fulfillment | retail, notification |
| `CaseResolved` | fulfillment | payment, inventory, operations, notification |
| `ReviewPosted` | engagement | operations, notification |


---

## 9. Kế hoạch, nhịp thời gian, phân công

Nguồn: `report/backmatter/kehoach.tex` (cập nhật 13/10/2026) và `MVP.md`. Hôm nay 28/10 nằm trong **tuần 5** (23–29/10), sắp sang tuần 6.

| Tuần | Thời gian | Công việc chính | Kết quả báo cáo | Tình trạng so với 28/10 |
|---|---|---|---|---|
| **GĐ1** (tới 15/10) | | | | |
| 1 | 23–29/9 | Đặc tả use case; kế hoạch hai giai đoạn | §5.1.2 | Xong |
| 2 | 30/9–6/10 | Sửa theo góp ý (mô hình vận hành, vai trò nội bộ, dòng tồn, ngữ nghĩa, PWA); sơ đồ ngữ cảnh–C4–sitemap | Ch1–5, 7; PL P–T | Xong |
| 3 | 7–15/10 | Siết trục bán lẻ; C4 13 mô-đun; CSDL 13 schema + ERD; tuần tự, lớp; hợp đồng OpenAPI; khung monorepo + CI | §5.3.3–5.3.5, 5.3.7, 5.3.9, 6.1.1–6.1.3 | Phần lớn xong; **còn** bộ test case, API/UI-UX trong thân báo cáo |
| **GĐ2** (tới 31/12) | | | | |
| 4 | 16–22/10 | Prototype xuyên hai ứng dụng; demo 21/10; rà điều kiện giữ mã | Bản demo; §6.1.3 | Làm: đăng nhập, catalog, lô–duyệt–QR chạy thật; đặt đơn mới ở giao diện |
| 5 | 23–29/10 | Prisma + PostgreSQL; `identity` thật (OTP email, TOTP); nhật ký ngoại tuyến; chứng nhận–tệp; SonarQube vào CI | §6.1.3 | **Đang làm / trễ**: lưu trữ vẫn trong bộ nhớ |
| 6–7 | 30/10–12/11 | Thu mua + tồn kho theo lô; bán lẻ, **chống bán vượt** | §6.1.3 | Chưa bắt đầu (mô-đun rỗng) |
| 8–9 | 13–26/11 | Thanh toán; bán sỉ | §6.1.3 | Chưa |
| 10 | 27/11–3/12 | Giao ba chặng, đổi trả–trao đổi, đánh giá–uy tín, vận hành | §6.1.3 | Chưa |
| 11 | 4–10/12 | Ba mô-đun AI | §6.1.3, 6.1.4 | Chưa |
| 12 | 11–17/12 | Chạy test case, tải, tranh chấp tồn kho, rà phân quyền | §6.2 | Chưa |
| 13 | 18–24/12 | Thử khả dụng (PL-B), PWA điện thoại thật, đo hiệu năng/bảo mật/AI | Chương 7 | Chưa |
| 14 | 25–31/12 | Viết kết quả, rà báo cáo, slide, demo | Chương 8 | Chưa |

- **Rủi ro tự nêu:** 11 tuần phải làm 13 mô-đun + 2 ứng dụng + 3 AI. Tuần 14 không có dự phòng riêng: chậm phải cắt ngay trong tuần phát sinh.
- **Thứ tự cắt (đã chốt):** (1) mục để sau MVP → (2) dự báo giá → (3) trao đổi theo đơn; **không cắt** trục bán lẻ đầu–cuối. Mô-đun khó nhất (chống bán vượt) xếp sớm tuần 6–7.
- **Prototype là nền MVP:** repository + interface + `DEMO_MODE`; bốn điều kiện rà 21/10 (qua repository, luật có test, không lối tắt ngoài `DEMO_MODE`, API khớp hợp đồng).
- **Tuần 5 là mốc so tốc độ thật** với khối lượng còn lại để cắt phạm vi sớm.
- **Phân công:** `kehoach.tex` **không ghi tên người** theo từng tuần/mô-đun. `NOTES.md` chỉ có nhãn vai trong tiêu đề mục (suy luận, cần xác nhận): BE1 (làm `catalog`, `identity` tạm), BE2 (nhắc tới cho `retail`/`payment`, mục còn mở), FE (shop, admin, e2e). Cột phân công cần nhóm tự điền trước buổi bảo vệ (**cần xác nhận**).
- **Gợi ý bảng phân công để điền:**

| Mô-đun / hạng mục | Người phụ trách | Tuần | Trạng thái |
|---|---|---|---|
| `catalog`, `supplier`, `operations` (duyệt lô) | BE1 (suy từ NOTES; điền tên) | 4–5 | Có mã |
| `identity` thật + Prisma | (điền) | 5 | Dở |
| `procurement`, `inventory`, `retail` | BE2 (điền tên) | 6–7 | Chưa |
| `payment`, `wholesale` | (điền) | 8–9 | Chưa |
| `fulfillment`, `engagement`, `notification` | (điền) | 10 | Chưa |
| Dịch vụ AI | (điền) | 11 | Chưa |
| Test, đánh giá, viết Ch6–8 | (điền) | 12–14 | Chưa |
