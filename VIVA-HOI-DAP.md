# VIVA-HOI-DAP — 100 câu hỏi hội đồng có khả năng cao hỏi về Farmery

Soạn 2026-10-28, bổ trợ cho `VIVA-TOMTAT.md` (đọc file đó trước). Nguồn: `report/chapters`, `report/backmatter`, `report/schema.dbml`, `MVP.md`, `NOTES.md`, `DECISIONS.md`, mã `apps/` và `packages/contract/openapi.yaml`.

**Cách dùng**
- Mỗi câu: ý chính nói trước (1 câu in đậm) rồi gạch đầu dòng. Đọc cả nhóm vài lần, đừng học thuộc từng chữ.
- Ba nhãn của báo cáo (Ch4 §4.3.1, thống nhất toàn báo cáo): **Đã hiện thực** (mục không ghi chú) / **Chỉ thiết kế** (đặc tả đầy đủ nhưng cố ý không làm trong đồ án) / **Để sau prototype** (thuộc MVP hoặc đã cam kết, chưa làm ở prototype, sẽ làm khi có điều kiện ở `tab:chi-thiet-ke`).
- Nhãn dùng trong file này: **[Hiện thực]** = chạy trên API thật có test; **[Giao diện]** = nhãn riêng của file viva: giao diện dựng theo hợp đồng nhưng API còn 501; **[Để sau prototype]** và **[Chỉ thiết kế]** = đúng nhãn báo cáo; **[Chưa có mã]** = nhãn riêng của file viva: thuộc bản nộp (báo cáo không gắn nhãn) nhưng chưa có mã ở prototype; **[Ngoài phạm vi]** = hướng phát triển (Ch8). Chỉ hai nhãn "Chỉ thiết kế" và "Để sau prototype" được nói với hội đồng như nhãn của báo cáo.
- Hiện trạng mã chốt ngày 28/10 (nhánh `feat/fe-e2e-kich-ban-lo`): 20/40 thao tác hợp đồng có handler; lưu trữ trong bộ nhớ; 9 mô-đun chỉ có file module rỗng (`retail`, `payment`, `inventory`, `fulfillment`, `procurement`, `wholesale`, `engagement`, `notification`, `media`). Báo cáo hiện 286 trang (`main.pdf`).
- Số mục kiểu "Ch4 §4.1.2" suy từ thứ tự LaTeX, có thể lệch 1 so với PDF; mở PDF đối chiếu trước khi trích. Chỗ chưa chắc ghi "(cần xác nhận)", gom ở cuối file.
- Quy tắc vàng khi trả lời chức năng chưa chạy: **thiết kế, vì sao, kế hoạch, hiện trạng** - không nhận là đã chạy.

## Mục lục

| Nhóm | Câu | Chủ đề |
|---|---|---|
| A | Q1-Q10 | Bối cảnh và bài toán |
| B | Q11-Q18 | Phạm vi, phân loại hiện thực/thiết kế/ngoài phạm vi |
| C | Q19-Q26 | Yêu cầu và use case |
| D | Q27-Q38 | Kiến trúc: modular monolith, C4, mô-đun, sự kiện, Redis |
| E | Q39-Q48 | Cơ sở dữ liệu, ERD, schema, ràng buộc |
| F | Q49-Q60 | Nghiệp vụ lõi: tồn kho, giữ chỗ, khóa dòng, FEFO, thanh toán, giao ba chặng, đổi trả |
| G | Q61-Q68 | Truy xuất nguồn gốc và kiểm duyệt ba giai đoạn |
| H | Q69-Q73 | Bán sỉ: RFQ, hợp đồng |
| I | Q74-Q81 | AI |
| J | Q82-Q87 | Bảo mật, phân quyền, riêng tư, 2FA, eKYC |
| K | Q88-Q93 | Công nghệ và lựa chọn |
| L | Q94-Q100 | Hiện thực, kiểm thử, đánh giá, hạn chế, hướng phát triển, trung thực |
| M | cuối file, sau "Nếu chỉ có 10 phút" (không đánh số Q) | Các phương án đã cân nhắc: chọn gì, bỏ gì, vì sao (M.1-M.12: 40 quyết định; M.13: 5 tiêu chí chọn; M.14: danh sách quyết định thiếu đối chiếu) |
| - | cuối file | 10 thuật ngữ; 5 con số; 10 phút ôn; danh sách "cần xác nhận" |

---

## A. Bối cảnh và bài toán (Q1-Q10)

**Q1. Farmery là gì, nói trong 30 giây?**
- **Ý chính: sàn nông sản chạy hai luồng trên cùng nguồn cung, có truy xuất QR theo lô.**
- Bán sỉ (3P): nhà cung cấp tự bán cho doanh nghiệp mua sỉ, Farmery thu hoa hồng, nhà cung cấp giữ hàng.
- Bán lẻ (1P): Farmery thu mua theo lô rồi bán lại cho người tiêu dùng, gánh rủi ro tồn kho (Ch1 §1.2.1, `tab:hailuong`).
- Điểm mới: QR gắn nhật ký canh tác chỉ nối thêm, dòng tồn tách chủ sở hữu, giao ba chặng, AI chạy được khi chưa có dữ liệu.

**Q2. Bài toán thực tế mà đề tài giải là gì?**
- **Ý chính: chuỗi trung gian dài và thiếu niềm tin vào nguồn gốc.**
- Nông sản qua 4-5 khâu, giá thành đội 30-40% (Ch1 §1.1, nguồn `tapchicongthuong_ipsard_2023_2024`).
- Hao hụt trái cây 35-40%, rau quả toàn ngành 20-40% tương ứng 3,5-4,1 tỷ USD/năm (Ch1 §1.1.3).
- Bốn vấn đề V1-V4: cung dồn mùa vụ; thiếu kênh tiêu thụ; hao hụt và thiếu kho lạnh; thiếu minh bạch nguồn gốc. Ánh xạ sang giải pháp ở Phụ lục F.

**Q3. Bảy mục tiêu MT1-MT7 là gì?**
- **Ý chính: từ chứng nhận đến công cụ quản trị, bám V1-V4 (Ch1 §1.2.2).**
- MT1 chứng nhận; MT2 QR truy xuất; MT3 bán sỉ tối giản; MT4 bán lẻ 1P (thu mua đến định giá); MT5 trục bán lẻ khách hàng; MT6 AI; MT7 công cụ quản trị.
- Bằng chứng hiện có: MT2 có chạy; MT7 một phần (duyệt lô, tổng quan); MT3-MT5 mới thiết kế + giao diện; MT6 chưa.
- Cẩn thận: Ch8 §8.1 "Kết quả đạt được" còn TODO, đừng nói "đạt cả bảy mục tiêu".

**Q4. Vì sao ghép sỉ và lẻ trên một nền tảng mà không chọn một?**
- **Ý chính: hai luồng bổ trợ nhau trên cùng nguồn cung.**
- Nhà cung cấp nhỏ giỏi giao lô lớn nhưng không đóng gói từng đơn vài kg; 1P gánh phần đó (Ch4 §4.1.1).
- 3P giữ nhà cung cấp tự định giá và không đè vốn của Farmery.
- Lô sỉ cận hạn có thể được Farmery thu mua chiết khấu; chiều ngược lại không có (Farmery không bán sỉ cạnh tranh nhà cung cấp).
- Cẩn thận: đánh đổi nêu thẳng là vốn lưu động, lỗ trực tiếp với lô không bán hết, vận hành hai mô hình (Ch3 §3.3).

**Q5. Khác biệt 1P và 3P là gì (câu bẫy hay gặp)?**
- **Ý chính: khác nhau ở ai sở hữu hàng và ai gánh rủi ro.**

| | 3P (bán sỉ) | 1P (bán lẻ) |
|---|---|---|
| Chủ sở hữu hàng | Nhà cung cấp, tới khi bàn giao | Farmery, sau nghiệm thu nhập kho |
| Người mua | Doanh nghiệp mua sỉ | Người tiêu dùng |
| Doanh thu Farmery | Hoa hồng trên đơn sỉ hoàn tất | Chênh lệch giá mua - bán |
| Rủi ro tồn kho | Nhà cung cấp | Farmery |
| Giá | Nhà cung cấp tự báo giá bậc | Farmery đặt giá bán lẻ |

- Nguồn: Ch4 `tab:hailuong`, Ch4 §4.1.1 (mô hình kinh doanh).

**Q6. Thu mua theo lô (1P) có hợp lý về kinh tế không?**
- **Ý chính: có điều kiện hòa vốn tường minh.**
- Công thức: `p - g >= h/(1-h)*g + c_đg + c_vh/q` (Ch4 §4.1.1): giá bán p, giá mua g, tỷ lệ hao hụt h, chi phí đóng gói, chi phí vận hành chia sản lượng q.
- Hao hụt 20-40% làm số hạng hao hụt bằng 25-67% giá mua; nên thiết kế xoay quanh giữ h thấp: chỉ mua lượng bán trong hạn, FEFO, chuyến trung chuyển cố định.
- Cẩn thận: chưa có số liệu giao dịch thật; công thức là khung phân tích, không phải kết quả đo.

**Q7. Vì sao chọn Lâm Đồng và TP.HCM?**
- **Ý chính: thí điểm hẹp để kiểm soát hao hụt và chi phí lạnh.**
- Nguồn cung Lâm Đồng, bán lẻ TP.HCM cách khoảng 300 km, đi xe lạnh; bán sỉ toàn quốc (Ch1 §1.3).
- Phạm vi hẹp là lý do Farmery chấp nhận được rủi ro tồn kho mà sàn lớn né (Ch3 N1-N2).
- Dữ liệu thử nghiệm là dữ liệu mô phỏng, ghi rõ trong báo cáo.

**Q8. Vì sao Shopee/Lazada không làm điều này nếu hay?**
- **Ý chính: hàng tươi không khớp mô hình phí sàn và đòi vốn + kho lạnh.**
- Ch3 §3.3 nêu N1-N4: phí sàn không khớp hàng tươi; vốn và kho lạnh; né tồn kho bằng thiết kế khác (Pinduoduo mua chung, e-Choupal); chuyên một phía (Ninjacart chỉ B2B, FoodMap thiếu đàm phán sỉ).
- Khoảng trống: kết hợp 3P + 1P cho hàng tươi có truy xuất (`tab:researchgap`).

**Q9. So với Farm2Market (công trình gần nhất) khác gì?**
- **Ý chính: Farm2Market mới ở mức đề xuất, chưa có dữ liệu vận hành, không phục vụ song song sỉ và lẻ.**
- Báo cáo lấy mốc ~82% độ chính xác dự báo của họ để đặt ngưỡng MAPE < 20% (Phụ lục L).
- Bốn nghiên cứu nền: Morepje 2024, Keogh 2020, Tran 2023, Farm2Market 2025 (Ch3).
- Cẩn thận: đừng nói ta "tốt hơn" khi Ch7 chưa có số đo.

**Q10. Số liệu 30-40% và 35-40% lấy ở đâu, đáng tin không?**
- **Ý chính: có nguồn và đã kiểm lại.**
- Đã kiểm lại 6 nguồn rủi ro cao bằng truy cập trực tiếp, khớp 100% (`NOTES.md`, mục rà Ch1-3 ngày 15/09).
- Nguồn đầu: bài trên Tạp chí Công Thương, IPSARD 2023-2024 (khóa `tapchicongthuong_ipsard_2023_2024`).
- Cẩn thận: có mục TODO trích dẫn văn bản pháp lý Ch2 còn mở trong `NOTES.md`.

---

## B. Phạm vi và phân loại hiện thực / thiết kế / ngoài phạm vi (Q11-Q18)

**Q11. Hiện thực được bao nhiêu so với thiết kế?**
- **Ý chính: thiết kế gần đủ, hiện thực mới chạy một nửa hợp đồng API.**
- 20/40 thao tác của `openapi.yaml` có handler: đăng nhập OTP, danh mục/tìm kiếm/truy xuất, lô - nhật ký - duyệt, hồ sơ nhà cung cấp.
- 20 thao tác còn lại trả 501; giao diện giỏ hàng/thanh toán/đơn hàng/vận hành/tồn kho/cấu hình đã dựng theo hợp đồng.
- Trạng thái ở `NOTES.md` mục "BE2: cả 13 thao tác của luồng khách lẻ còn trả 501" vẫn `Status: open`.

**Q12. Ba mức hiện thực là gì?**
- **Ý chính: trục chính làm sâu / nguồn hàng rút gọn / bán sỉ tối giản (Ch1 §1.3.4, `MVP.md` §1).**
- Làm sâu: bán lẻ đầu-cuối (tìm, giỏ, thanh toán, theo dõi 8 trạng thái, ba chặng, đổi trả, đánh giá, QR).
- Rút gọn: nguồn hàng (đăng ký NCC, lô, duyệt, đơn thu mua, nhập kho, đóng gói một bước, thu hồi lô).
- Tối giản: bán sỉ (RFQ đến hợp đồng, giao một đợt, thanh toán thường).

**Q13. Cái gì đang chạy được thật bây giờ? [Hiện thực]**
- **Ý chính: luồng đăng nhập - đăng lô - duyệt - QR công khai.**
- NCC tạo lô (`pending_review`), ghi nhật ký; kiểm duyệt viên duyệt thành `approved` + mã `TRC-...`; khách quét `/truy-xuất/{mã}`.
- Có 37 test e2e API và 10 test Playwright (đếm bằng grep ngày 28/10, chưa chạy lại).
- Demo chắc chạy nhất: chạy `pnpm e2e` trước giờ bảo vệ.

**Q14. "Chỉ thiết kế", "để sau prototype" và "ngoài phạm vi" khác nhau thế nào?**
- **Ý chính: hai nhãn của báo cáo trả lời "đã làm chưa"; ngoài phạm vi là hướng phát triển có điều kiện kích hoạt.**
- Chỉ thiết kế: đặc tả và thiết kế đầy đủ nhưng cố ý không làm trong đồ án. Bảng `tab:chi-thiet-ke` (Ch4 §4.3.1) nhóm này có 9 hàng: Google/Facebook, SMS, hóa đơn điện tử thật, ký số, ký quỹ-giao nhiều đợt-khấu trừ thuế, xe gom chặng đầu, sơ chế nhiều bước-kiểm kê, gợi ý cá nhân hóa-tìm nhà cung cấp theo ngữ nghĩa, TraceViet. Ghi thẳng ở FR: đăng nhập bằng số điện thoại (FR1.1), đối chiếu khuôn mặt tự động (FR1.4).
- Để sau prototype: thuộc phạm vi MVP hoặc đã cam kết, chưa làm ở prototype, có điều kiện làm nêu trong bảng (6 hàng): Web Push (FR11.1); đánh giá + báo khi có hàng (FR5.5, FR5.7); mã giảm giá, yêu thích, báo cáo sai danh mục (FR5.3, FR9.2, FR4.7); thống kê (FR10.4, FR2.2); cảnh báo hết hạn/tồn thấp và nhắc gia hạn (FR11.2, FR3.3); các khâu kiểm duyệt-nghiệm thu-đổi trả (hồ sơ NCC, eKYC thủ công, chứng nhận, nghiệm thu nhập kho, khiếu nại-đổi trả, đánh giá nghi vấn, thu hồi lô, vi phạm) ở `tab:kiemduyet-giaidoan`.
- Ngoài phạm vi: Ch8 §8.2-8.3, mỗi mục có điều kiện kích hoạt (ví dụ đội giao riêng khi chi phí cố định/đơn < cước 3PL).
- 5 mã FR đã rút hẳn: FR4.8 TraceViet, FR6.6 ký số, FR11.3 khan hiếm, FR13.5 thuê kho, FR13.7 chào sỉ tồn dư.

**Q15. Vì sao `MVP.md` xếp đánh giá, thông báo đẩy vào MVP mà bảng Ch4 ghi chưa làm? (mâu thuẫn cũ, đã giải quyết)**
- **Ý chính: báo cáo đã giải quyết bằng nhãn "Để sau prototype" - thuộc MVP nhưng chưa làm ở prototype.**
- Đánh giá (FR5.5, FR5.7), thông báo đẩy (FR11.1), cảnh báo (FR11.2), nghiệm thu nhập kho (FR13.2), hồ sơ NCC/eKYC (FR1.4) đều có nhãn này ở `tab:chi-thiet-ke` hoặc `tab:kiemduyet-giaidoan`; không còn chỗ nào bảo "chỉ thiết kế" cho các mục này.
- Cẩn thận: Ch1 §1.3.4 vẫn liệt kê đánh giá, thông báo trong "trục chính làm sâu" vì đó là phạm vi sản phẩm; ba mức trả lời "làm sâu đến đâu", ba nhãn trả lời "đã làm chưa". Còn vài nhãn dư âm (PL-M FR9, `wishlist_items`): xem danh sách cần xác nhận.

**Q16. Nguyên tắc chọn phạm vi là gì?**
- **Ý chính: cái gì không đo được bằng số thì đưa sang hướng phát triển (Ch1 §1.2.3).**
- `MVP.md` §1: một yêu cầu để sau MVP nếu không nằm trên ba phần chính, phụ thuộc bên ngoài chưa chủ động được (ký số, TraceViet, hóa đơn thật, SMS), hoặc cần dữ liệu nền tảng mới chưa có.
- Khi chuyển mục giữa hai cột phải sửa `MVP.md`, sửa đánh dấu ở §4.3 và ghi `DECISIONS.md`.

**Q17. Nếu không kịp, cắt cái gì?**
- **Ý chính: cắt theo thứ tự đã định, không cắt trục bán lẻ.**
- Thứ tự (`kehoach.tex`, `MVP.md` §6): mục để sau (MVP.md gọi là "để sau MVP", báo cáo gọi là "để sau prototype") trước, rồi dự báo giá, rồi trao đổi theo đơn.
- Kế hoạch: 14 tuần, 2 giai đoạn; GĐ1 tới 15/10, GĐ2 tới 31/12/2026.
- Cẩn thận: hiện trạng 28/10 trễ so với kế hoạch tuần 5-7 (Prisma, tồn kho); chuẩn bị sẵn câu giải thích.

**Q18. Có thử với nông dân thật chưa?**
- **Ý chính: chưa; có kế hoạch và ngưỡng.**
- Kế hoạch thử khả dụng tuần 13 theo Phụ lục B (bộ công cụ), ngưỡng NFR6: >= 80% hoàn thành không cần hỗ trợ.
- Căn cứ 80%: đội hỗ trợ vùng chỉ kham 1/5 người cần giúp (Phụ lục L).
- Không nói "đã thử với nông dân" ở thời điểm hiện tại.

---

## C. Yêu cầu và use case (Q19-Q26)

**Q19. Có bao nhiêu yêu cầu chức năng và phi chức năng?**
- **Ý chính: 13 nhóm FR, 9 nhóm NFR (Ch4 §4.3).**
- FR1-FR13 (tài khoản, nhà cung cấp, chứng nhận, sản phẩm - truy xuất, bán lẻ, bán sỉ, thanh toán - hóa đơn, giao hàng - khiếu nại, tương tác, vận hành, thông báo, AI, thu mua - kho).
- Ưu tiên MoSCoW: 11 nhóm Must, 2 nhóm Should (tương tác, AI), không Could; riêng dự báo giá ở mức Challenging (Phụ lục M).
- NFR: Must là NFR1, 3, 4, 5, 7, 8, 9 và Should là NFR2, 6 (7 + 2); riêng NFR2.2 (mở rộng ngang) là Could, chỉ thiết kế. Phụ lục M đã có NFR3.6 (2FA nội bộ), NFR5.1-5.2, NFR8.1-8.5.
- Truy vết user story đến FR ở Phụ lục J.

**Q20. Ai là tác nhân của hệ thống?**
- **Ý chính: 3 nhóm ngoài + 6 vai trò nội bộ (Ch5 `tab:actor-usecase`).**
- Nhóm ngoài: khách (vãng lai/lẻ), doanh nghiệp mua sỉ, nhà cung cấp.
- Nội bộ: `staff_moderation`, `staff_operations`, `staff_sourcing`, `staff_warehouse`, `staff_support`, `platform_owner`.
- Hai ứng dụng: ứng dụng mua hàng (PWA) và ứng dụng nội bộ.

**Q21. Kể các use case đã đặc tả chi tiết.**
- **Ý chính: 3 ở thân báo cáo, 4 ở Phụ lục S.**
- Thân: UC-B4, UC-C4 (đặt hàng), UC-C6 (đổi trả, bảng `tab:uc-c6`).
- Phụ lục S: UC-B2, UC-B5, UC-C7, UC-D4.
- Use case tổng quan + 5 sơ đồ chi tiết (Phụ lục S); 10 sơ đồ hoạt động (2 ở thân: `fig:act-thu-mua`, `fig:act-dat-hang`; 8 ở Phụ lục R).

**Q22. Có những quy trình nghiệp vụ nào?**
- **Ý chính: 10 quy trình, mỗi quy trình kèm quy tắc và ngoại lệ (Ch4 §4.1.2).**
- Gồm: đăng ký-xác thực nhà cung cấp và kiểm duyệt chứng nhận; đăng và kiểm duyệt sản phẩm, sinh mã QR; thu mua vào kho; bán lẻ; đánh giá sản phẩm và nhà cung cấp; bán sỉ; quản lý tồn kho theo dòng tồn; giao hàng ba chặng; đổi trả-hoàn tiền-khiếu nại; quản trị hệ thống (gồm xử lý vi phạm). Thu hồi lô nằm trong FR13.6, không phải quy trình riêng (đếm 10 tiêu đề trong `.tex`).
- Sơ đồ: `fig:act-*` ở Phụ lục R.

**Q23. Tám trạng thái đơn lẻ là gì?**
- **Ý chính: Đã đặt, Đã thanh toán, Đang đóng gói, Lên chuyến, 3PL đã nhận, Đang giao, Đã giao, Hoàn tất (hoặc Khiếu nại).**
- Nguồn: Ch4 §4.1.2 "Quy trình bán lẻ"; bảng `retail.order_status_events` lưu từng sự kiện đổi trạng thái.
- [Giao diện] Timeline 8 bước ở shop `/don-hang/[ma]` hỏi lại mỗi 5 giây; `advanceOrder` chưa có handler.

**Q24. Các hạn và cam kết thời gian then chốt?**
- **Ý chính: nhớ 5 nhóm số.**

| Hạng mục | Giá trị | Nguồn |
|---|---|---|
| Hạn khiếu nại | rau lá 24 h, củ quả 48 h, hàng khô 7 ngày | Ch4 §4.1.2 Đổi trả |
| Cam kết xử lý | tiếp nhận 24 h, quyết định 3 ngày làm việc, hoàn tiền 7 ngày làm việc | Ch4 §4.1.2 |
| Duyệt hồ sơ NCC / duyệt lô | 5 ngày làm việc / mặc định 48 giờ, cấu hình được | `tab:kiemduyet-giaidoan` |
| Giữ chỗ tồn | 15 phút | Ch4 §4.1.2 |
| Khóa OTP | 30 phút sau 5 lần sai | NFR3.5 |

**Q25. Các yêu cầu phi chức năng quan trọng nhất và ngưỡng?**
- **Ý chính: ngưỡng đặt trước khi hiện thực (Phụ lục L, `tab:nguongNFR`).**
- NFR1.1 p95 < 2 s (k6), LCP <= 2,5 s, INP <= 200 ms, CLS <= 0,1; ở mức 100 người dùng đồng thời: trung vị < 3 s, lỗi < 1% (100 người thuộc NFR1.1).
- NFR1.2 >= 50 yêu cầu đồng thời, 0% oversell; NFR2.2 mở rộng ngang là chỉ thiết kế (Could), không đo.
- NFR3.1 100% endpoint trả 403 khi sai quyền; NFR3.3 bcrypt cost >= 10; NFR4.2 RPO <= 24 h.
- Cẩn thận: chương 7 chưa có số đo nào (xem Q97).

**Q26. Yêu cầu dữ liệu và lưu trữ bao lâu?**
- **Ý chính: hợp đồng >= 3 năm; hóa đơn, nhãn, chứng từ >= 5 năm (NFR8.5).**
- RPO <= 24 h, RTO <= 4 h; chuyển lưu trữ lạnh sau 1 năm (Ch4 §4.3.3).
- Nhật ký canh tác chỉ nối thêm (NFR9.1).

---

## D. Kiến trúc: modular monolith, C4, mô-đun, sự kiện, Redis (Q27-Q38)

**Q27. Vì sao modular monolith mà không microservices? (câu bẫy số 1)**
- **Ý chính: kiến trúc là hệ quả của ràng buộc khó nhất - chống bán vượt cần giao dịch trong một CSDL.**
- Nhiều giao dịch giành một dòng tồn; dựa vào transaction + khóa dòng trong một CSDL. Tách dịch vụ phải thay bằng saga/giao dịch bù phức tạp hơn nhiều (Ch5 §5.3.1).
- Microservices chỉ đáng khi nhiều đội làm song song (Ch8 §8.3); nhóm nhỏ và một học kỳ không cần.
- Đường lui: ràng buộc RB1-RB3 + mỗi mô-đun một schema để tách sau.

**Q28. 13 mô-đun là gì và mô-đun nào gắn bảng nào?**
- **Ý chính: 13 mô-đun = 13 schema = 65 bảng (nguồn `schema.dbml`).**

| Mô-đun / schema | Số bảng | Bảng tiêu biểu |
|---|---|---|
| identity | 8 | users, user_roles, otp_challenges, addresses, businesses, ekyc_documents, consent_records, data_requests |
| supplier | 3 | suppliers, certifications, support_assignments |
| catalog | 5 | categories, products, batches, farming_logs, product_embeddings |
| inventory | 5 | stock_holdings, stock_movements, reservations, packing_runs, batch_recalls |
| procurement | 4 | supplier_offers, purchase_orders, goods_receipts, price_forecasts |
| retail | 8 | listings, vouchers, carts, cart_items, orders, order_items, order_status_events, restock_subscriptions |
| wholesale | 7 | price_tiers, rfqs, rfq_messages, contracts, contract_versions, contract_confirmations, wholesale_orders |
| payment | 5 | payments, refunds, invoices, commission_settlements, supplier_payouts |
| fulfillment | 6 | transfer_trips, trip_orders, shipments, shipment_events, return_requests, messages |
| engagement | 4 | reviews, review_replies, supplier_reputation, wishlist_items |
| operations | 5 | platform_settings, review_tasks, violation_records, threshold_alerts, staff_audit_logs |
| notification | 4 | notifications, deliveries, preferences, push_subscriptions |
| media | 1 | media_files |

- Tổng 8+3+5+5+4+8+7+5+6+4+5+4+1 = 65. Đối chiếu `tab:module-io` (Ch5 §5.3).

**Q29. RB1-RB3 là gì?**
- **Ý chính: ba ràng buộc giữ monolith không thành "ổ bùn" (Ch5 §5.3.1).**
- RB1: chia mô-đun theo miền nghiệp vụ, không theo tầng kỹ thuật.
- RB2: mô-đun gọi nhau qua giao diện (service) công khai, không truy vấn thẳng bảng của nhau.
- RB3: không kết nối bảng xuyên mô-đun ở tầng truy vấn - quan trọng nhất vì thứ khóa chặt một monolith là dữ liệu chứ không phải mã.
- Bảo đảm rẻ nhất: mỗi mô-đun một schema trong cùng CSDL, vi phạm RB3 lộ ngay khi đọc mã.

**Q30. C4 của hệ thống có mấy mức, nhìn vào đâu?**
- **Ý chính: ba mức - ngữ cảnh, container, mô-đun.**
- `fig:c4-ngu-canh`, `fig:c4-container`, `fig:c4-module` (Ch5 §5.3); `tab:module-io` liệt kê vào/ra từng mô-đun; `fig:luong-don-le` cho luồng đơn lẻ.
- Container chính: ứng dụng mua hàng (Next.js PWA), ứng dụng nội bộ (React/Vite/Refine), máy chủ nghiệp vụ (NestJS), dịch vụ AI (Python/FastAPI), PostgreSQL, hàng đợi sự kiện và cache (Redis), MinIO; sơ đồ ngữ cảnh có 10 hệ thống bên ngoài (5 thuộc phạm vi MVP + 5 chỉ thiết kế).

**Q31. Vì sao vẫn tách dịch vụ AI riêng? (câu bẫy)**
- **Ý chính: khác ngôn ngữ, khác tài nguyên, và để sự cố AI không chặn giao dịch.**
- Python cho BGE-M3, SARIMA/Prophet; dịch vụ gợi ý chết thì trang chủ lùi về "bán chạy" (Ch5 "Các quyết định kiến trúc").
- Dịch vụ AI không đọc thẳng CSDL, nhận dữ liệu qua sự kiện hoặc lời gọi nội bộ.
- **[Chưa có mã]** Cẩn thận: dịch vụ AI chưa có trong `apps/` (xem Q74).

**Q32. Mô-đun trong mã thật khác gì thiết kế?**
- **Ý chính: 4 mô-đun có mã (identity, catalog, supplier, operations), 9 mô-đun mới là file module rỗng.**
- Có mã: `identity` (bản tạm), `catalog`, `supplier`, `operations`.
- Rỗng: `retail`, `payment`, `inventory`, `fulfillment`, `procurement`, `wholesale`, `engagement`, `notification`, `media`.
- Cấu trúc đúng RB1: mỗi mô-đun tự chứa controller, service, repository (mẫu: `catalog`).

**Q33. Giao tiếp giữa mô-đun qua đâu?**
- **Ý chính: gọi service công khai (đồng bộ) và sự kiện (bất đồng bộ) qua Redis.**
- 17 sự kiện nghiệp vụ được liệt kê ở Phụ lục V (ví dụ `BatchRecalled`, `CertExpired`, `StockLow`); xử lý một lần.
- **[Chưa có mã]** Chưa có hàng đợi trong mã; mô-đun gọi nhau chưa qua sự kiện.

**Q34. Redis dùng để làm gì?**
- **Ý chính: một thành phần "hàng đợi sự kiện và cache (Redis)" đảm hai việc.**
- Hàng đợi sự kiện: mô-đun xong việc thì phát sự kiện vào Redis, mô-đun quan tâm nhận để làm tiếp (17 sự kiện, nhận xử lý một lần); cũng chạy tác vụ nền như gửi thông báo và gửi dữ liệu sang dịch vụ AI.
- Cache: lưu tạm kết quả truy vấn đọc nhiều (danh mục, trang sản phẩm, trang truy xuất) để khỏi đọc lại CSDL (Ch5 §5.3.1).
- Cẩn thận: giao dịch ghi như khóa dòng tồn không đi qua Redis mà chạy trực tiếp trên PostgreSQL; Redis không chứa dữ liệu nghiệp vụ gốc. **[Chưa có mã]** (chưa có Redis trong repo).

**Q35. Hợp đồng API (`openapi.yaml`) có vai trò gì?**
- **Ý chính: nguồn sự thật chung của FE, BE và test.**
- 40 thao tác; quyền đọc từ `x-roles` của chính hợp đồng; API kiểm dữ liệu vào và phản hồi theo hợp đồng (lệch trả 500 `RESPONSE_CONTRACT_MISMATCH`).
- FE dựng giao diện trước theo hợp đồng, chạy qua server giả ngoài repo (không commit) khi API còn 501.
- Điều kiện giữ nền MVP: CI xanh, bật kiểm phản hồi.

**Q36. Tại sao có đường phục vụ trang truy xuất riêng?**
- **Ý chính: trang QR công khai nhiều lượt đọc, không cần đăng nhập, nên tách đường phục vụ.**
- Next.js dùng SSR cho trang truy xuất để lên được công cụ tìm kiếm và tải nhanh (Ch5 §5.2).
- Thứ tự tách nếu cần sau này: trang truy xuất công khai, thông báo, tìm kiếm; tồn kho + đơn hàng giữ chung càng lâu càng tốt (Ch8 §8.3).

**Q37. Sơ đồ tuần tự nào quan trọng?**
- **Ý chính: bốn sơ đồ tuần tự.**
- `fig:seq-dat-hang` (đặt hàng + giữ chỗ), `fig:seq-hop-dong-si` (hợp đồng sỉ), và hai ở Phụ lục W: đăng lô - QR (`fig:seq-duyet-lo`) và đánh giá.
- Lớp miền ở Ch5 §5.3; `OrderItem` lưu `holdingId` và `batchId` chứ không trỏ đối tượng sang mô-đun khác (RB3).

**Q38. Lúc tăng tải thì sao, có scale được không?**
- **Ý chính: ban đầu scale dọc và nhân bản máy chủ nghiệp vụ; mở rộng ngang là chỉ thiết kế.**
- NFR2.2 (mở rộng theo chiều ngang) là chỉ thiết kế (Could), không đo; rà soát thiết kế chỉ xác nhận máy chủ không giữ trạng thái phiên trong bộ nhớ. Mức 100 người dùng đồng thời là của NFR1.1 và vẫn đo bằng k6.
- Đã sửa trong báo cáo: Ch5 §5.2 nay trích đúng NFR1.1 cho "100 người dùng đồng thời"; NFR1.2 là chống oversell (50 yêu cầu, 0%).

---

## E. Cơ sở dữ liệu, ERD, schema, ràng buộc (Q39-Q48)

**Q39. CSDL lớn cỡ nào?**
- **Ý chính: 65 bảng, 13 schema, 565 cột, 48 khóa ngoại (Ch5 §5.3.5, `schema.dbml`).**
- ERD gồm 11 hình: tổng quan `fig:erd-tong-quan` (ma trận phụ thuộc 9×7 giữa các schema, gộp theo năm khối) và 10 hình theo schema (`fig:erd-dinh-danh` ... `fig:erd-danh-gia-van-hanh`).
- Từ điển đầy đủ mọi cột: Phụ lục K, sinh tự động từ `schema.dbml`.

**Q40. Vì sao chỉ 48 khóa ngoại cho 65 bảng?**
- **Ý chính: tham chiếu xuyên schema bằng định danh (RB3), không khai báo khóa ngoại cứng.**
- Đường nối xuyên schema vẽ nét đứt trong ERD; hai lớp ở hai mô-đun chỉ giữ định danh của nhau.
- Cẩn thận: nói rõ đây là chủ đích để dễ tách mô-đun; đánh đổi là tính toàn vẹn xuyên schema do tầng ứng dụng giữ. (Số 48 là tổng khóa ngoại trong ERD; chi tiết nội/xuyên schema: cần xác nhận.)

**Q41. Ai sở hữu dữ liệu tồn kho và vì sao?**
- **Ý chính: mô-đun `inventory` sở hữu `stock_holdings`, `stock_movements`, `reservations`.**
- Dòng tồn = (lô, chủ sở hữu, nơi chứa); mọi thay đổi số lượng đi qua sổ nhập xuất, không sửa trực tiếp (FR13.3).
- Mô-đun khác (retail, wholesale, procurement) chỉ tham chiếu `holdingId`.

**Q42. "Dòng tồn" là gì và vì sao tách chủ sở hữu?**
- **Ý chính: để một lô hàng phục vụ hai luồng mà không bán vượt.**
- Ví dụ: lô 1.000 kg - 700 kg của HTX chỉ bán sỉ, 300 kg của Farmery chỉ bán lẻ (Ch4 §4.1.2 "Quản lý tồn kho").
- Hợp đồng sỉ và đơn thu mua giành dòng của nhà cung cấp; nhiều đơn lẻ giành dòng của Farmery.
- Phụ lục Q `tab:nguon-giaodich` liệt kê nguồn làm đổi tồn kho.

**Q43. Nhật ký canh tác lưu thế nào để không sửa lén được?**
- **Ý chính: chỉ nối thêm, sửa = bản mới có `supersedesId`, bản cũ thành "đã đính chính".**
- Bảng `catalog.farming_logs`; có test cho hành vi này (NFR9.1).
- Trang QR vẫn hiện dòng bị đính chính (gạch ngang) để người xem thấy lịch sử.
- **[Hiện thực]**

**Q44. Làm sao biết ai sửa/nhập dữ liệu, kể cả nhân viên làm hộ?**
- **Ý chính: `entered_by`, thời điểm, lý do, cờ `onBehalf`, và `operations.staff_audit_logs`.**
- Nhân viên hỗ trợ vùng chỉ nhập hộ nhà cung cấp được phân công (`supplier.support_assignments`) - FR4.2, FR10.7.
- Cẩn thận: đường nhập hộ chưa chạy thật (xem Q66).

**Q45. Khi lô bị thu hồi thì dữ liệu xử lý thế nào?**
- **Ý chính: khóa mọi dòng tồn của lô ở cả hai luồng, truy sổ nhập xuất ra đơn đã bán, báo người mua.**
- Bảng `inventory.batch_recalls`; sự kiện `BatchRecalled`; trang QR hiện cảnh báo (FR13.6, `fig:act-thu-hoi`).
- **[Để sau prototype]** (làm cùng mô-đun tồn kho). Mô-đun `inventory` còn rỗng; dữ liệu demo có sẵn lô thu hồi để hiển thị.

**Q46. Dữ liệu nhạy cảm lưu thế nào?**
- **Ý chính: mã hóa phía lưu trữ cho dữ liệu nhạy cảm và ảnh eKYC, tệp riêng tư qua URL ký hết hạn.**
- AES-256 cho dữ liệu nhạy cảm; `identity.users.totp_secret_enc` cho 2FA (NFR3.6); ảnh giấy tờ ở `identity.ekyc_documents` + MinIO.
- Quyền dữ liệu cá nhân: `identity.consent_records`, `identity.data_requests` (Luật BVDLCN 2025).
- **[Chưa có mã]** (NFR3.2 thuộc bản nộp); prototype chưa mã hóa gì ngoài JWT.

**Q47. Vì sao prototype dùng dữ liệu trong bộ nhớ, không dùng PostgreSQL? (câu bẫy)**
- **Ý chính: để dựng và kiểm hợp đồng - giao diện - luồng trước, thay lưu trữ sau mà không viết lại.**
- Mỗi mô-đun một repository (interface), prototype dùng bản trong bộ nhớ nạp từ `packages/mock-data`; MVP thay bằng bản Prisma cùng interface (`MVP.md` §6).
- `POST /api/dev/reset` đặt lại dữ liệu cho test.
- Cẩn thận: do đó schema 65 bảng chưa được dùng trong chạy thật; Prisma/PostgreSQL dự kiến tuần 5 (23-29/10), chưa xong. Đừng nói "đang chạy trên PostgreSQL".

**Q48. Dữ liệu demo lấy ở đâu, có thật không?**
- **Ý chính: dữ liệu mô phỏng ở `packages/mock-data`.**
- Báo cáo ghi rõ là dữ liệu mô phỏng (Ch1 §1.3.2); ảnh demo từng lấy từ trang ngoài (đã ghi ở `NOTES.md` mục BE1 16/10).
- Địa chỉ vùng trồng theo địa giới mới: Đà Lạt, Lang Biang, Đơn Dương, Hiệp Thạnh.

---

## F. Nghiệp vụ lõi: tồn kho, giữ chỗ, khóa dòng, FEFO, thanh toán, giao ba chặng, đổi trả (Q49-Q60)

**Q49. Chống bán vượt tồn cụ thể thế nào, và đã có mã chưa? (câu bẫy số 2)**
- **Ý chính: khóa bi quan `SELECT ... FOR UPDATE` trên dòng tồn trong một transaction - nhưng chưa có mã.**
- Thiết kế: giữ chỗ 15 phút trước, trừ tồn sau khi thanh toán; đơn xác nhận trước được ưu tiên, đơn còn lại hủy kèm thông báo hết hàng (Ch4 §4.1.2, Ch5 §5.2).
- Ngưỡng đo: >= 50 yêu cầu đồng thời, 0% oversell (NFR1.2).
- **[Chưa có mã]** Mô-đun `inventory` rỗng, chưa có test chống bán vượt, chưa có số đo; kế hoạch tuần 6-7.
- Cẩn thận: `apps/api/README.md` nói luật này "có test đi kèm" - chưa đúng với mã hiện tại; đừng trích câu đó.

**Q50. Giữ chỗ 15 phút hoạt động ra sao? [Chưa có mã]**
- **Ý chính: đặt đơn là khóa dòng và giữ chỗ; quá 15 phút chưa thanh toán thì nhả và tự hủy.**
- Bảng `inventory.reservations`; trừ tồn thật chỉ sau thanh toán thành công (webhook hợp lệ, xử lý một lần).
- Vì sao 15 phút: đủ để thanh toán qua cổng nhưng không giữ hàng mau hỏng quá lâu (lý do chi tiết: cần xác nhận trong `DECISIONS.md`).
- Chưa có mã; giao diện thanh toán đã dựng nhưng `createOrder` trả 501.

**Q51. Vì sao dùng khóa bi quan mà không lạc quan hoặc hàng đợi?**
- **Ý chính: tranh chấp trên cùng dòng tồn cao khi mở bán lô mới; khóa bi quan đơn giản và đúng.**
- Prisma không hỗ trợ `FOR UPDATE` trực tiếp, nên là chỗ duy nhất cần SQL thô trong transaction (Ch5 §5.2.2).
- Cầu dồn khi mở bán lô mới là lý do mức 100 người dùng đồng thời của NFR1.1 (Phụ lục L).

**Q52. FEFO là gì và áp dụng ở đâu? [Chưa có mã]**
- **Ý chính: First-Expired, First-Out - xuất lô sắp hết hạn trước.**
- Giữ tỷ lệ hao hụt h thấp, một trong ba biện pháp ở điều kiện hòa vốn (Q6).
- Áp dụng khi chọn dòng tồn để giữ chỗ/xuất kho đơn lẻ.
- Chưa có mã (mô-đun `inventory` rỗng); `MVP.md` nói có test đi kèm nhưng chưa tồn tại.

**Q53. Vì sao COD có điều kiện? (câu bẫy)**
- **Ý chính: hàng tươi mau hỏng, đơn bị từ chối nhận là mất trắng.**
- COD chỉ mở cho đơn dưới ngưỡng cấu hình và tài khoản chưa từng từ chối nhận hàng (Ch4 §4.1.2 Bán lẻ); ngoài hai điều kiện đó phải trả trước.
- Ngưỡng nằm trong cấu hình do `platform_owner` quản (FR10.6), không ghi cứng.
- Báo giá `POST /checkout/quote` trả `codReason` để giao diện giải thích vì sao không có COD.
- **[Giao diện]**

**Q54. Nền tảng có giữ tiền không? Thanh toán thế nào? [Giao diện]**
- **Ý chính: không giữ tiền; cổng thanh toán được cấp phép giữ.**
- Farmery chỉ ghi trạng thái và mã giao dịch; webhook phải có chữ ký hợp lệ và xử lý một lần; không lưu dữ liệu thẻ (PCI-DSS ở cổng).
- VNPay môi trường thử nghiệm; prototype dùng `DemoPaymentGateway` (`apps/api`, theo `MVP.md` §6).
- Ký quỹ (escrow) cho sỉ là **[Chỉ thiết kế]** (FR7.3).

**Q55. Hoa hồng tính thế nào? (câu bẫy)**
- **Ý chính: hoa hồng áp cho đơn sỉ (3P), tỷ lệ cấu hình trong biểu phí công bố, không ghi cứng trong báo cáo.**
- Ch4 §4.1.1: tính trên mỗi đơn sỉ hoàn tất; Farmery xuất hóa đơn dịch vụ cho nhà cung cấp; nhà cung cấp xem hoa hồng đã trừ ở trang đối soát.
- Tỷ lệ cụ thể nằm trong "Biểu phí công bố" do quản trị viên cấu hình (FR10.6), công khai ở Phụ lục D.
- Bảng `payment.commission_settlements`, `payment.supplier_payouts`. Không bịa tỷ lệ phần trăm.

**Q56. Thuế xử lý thế nào? (câu bẫy)**
- **Ý chính: tính thuế trên báo giá; khấu trừ thay là chỉ thiết kế nhưng đã khai báo loại người bán.**
- Đơn lẻ nông sản chưa chế biến: 5% GTGT (VIVA-TOMTAT câu 10; kiểm nguồn trong `tab:phaply`).
- Khấu trừ thay cho NCC hộ/cá nhân (1% GTGT + 0,5% TNCN): **[Chỉ thiết kế]** (FR7.4, NFR8.4); đã có FR2.4 khai loại người bán để sẵn dữ liệu.
- Cẩn thận: báo cáo viết dè dặt ba điểm pháp lý (khấu trừ với nông dân tự sản xuất, hiệu lực NĐ 46/2026, ngưỡng doanh thu không chịu thuế để cấu hình); hóa đơn điện tử hiện là giả lập.

**Q57. Giao hàng ba chặng là gì? [Giao diện một phần]**
- **Ý chính: nông hộ đến kho Lâm Đồng, kho đến TP.HCM bằng xe lạnh, rồi 3PL nội thành đến khách.**
- Chặng 1: nhà cung cấp tự đưa hàng về kho sơ chế (xe gom chặng đầu là **[Chỉ thiết kế]**).
- Chặng 2: xe lạnh Lâm Đồng - TP.HCM theo chuyến, manifest chốt sau giờ chốt đơn (`fulfillment.transfer_trips`, `trip_orders`).
- Chặng 3: 3PL nội thành (GHN thử nghiệm), webhook (`shipments`, `shipment_events`).
- Hiện chỉ có phần nhân viên bấm chuyển trạng thái trong màn Vận hành.

**Q58. Vì sao không có đội giao riêng?**
- **Ý chính: chi phí cố định chia mỗi đơn còn cao hơn cước 3PL ở mật độ đơn hiện tại.**
- Ch8 §8.3: chỉ khi chi phí cố định/đơn < cước 3PL nội thành cho cùng chặng thì đội giao riêng mới đáng.
- **[Ngoài phạm vi]**

**Q59. Đổi trả và hoàn tiền xử lý thế nào? [Để sau prototype]**
- **Ý chính: yêu cầu trong hạn kèm ảnh, phân loại nguyên nhân, quyết định bốn kiểu, hoàn qua cổng.**
- Quyết định: hoàn toàn phần / một phần / giao bù / từ chối; hoàn không cần trả hàng dưới ngưỡng thì ghi bút toán hủy.
- Hạn: rau lá 24 h, củ quả 48 h, hàng khô 7 ngày; cam kết 24 h / 3 ngày làm việc / 7 ngày làm việc.
- Bảng `fulfillment.return_requests`, `fulfillment.messages`, `payment.refunds`; UC-C6; `fig:act-doi-tra`.
- Chưa có handler hay giao diện; `tab:kiemduyet-giaidoan` ghi *Để sau prototype*, làm khi mô-đun bán lẻ và thanh toán nối vào API.

**Q60. Thu mua theo lô vận hành thế nào? [Chưa có mã; nghiệm thu: Để sau prototype]**
- **Ý chính: chào giá lô, đơn thu mua, nhà cung cấp xác nhận, nghiệm thu, nhập dòng tồn, đóng gói một bước, đặt giá.**
- Đơn thu mua chỉ có hiệu lực khi nhà cung cấp xác nhận; từ đó phần sản lượng được giữ chỗ.
- Trả tiền nhà cung cấp theo sản lượng đạt sau nghiệm thu; dự báo giá hiển thị tại màn lập đơn thu mua.
- Bảng `supplier_offers`, `purchase_orders`, `goods_receipts`, `packing_runs`; `fig:act-thu-mua`; UC-B5.
- Màn Tồn kho của admin đã dựng theo hợp đồng nhưng `listStockHoldings` chưa có handler.

---

## G. Truy xuất nguồn gốc và kiểm duyệt ba giai đoạn (Q61-Q68)

**Q61. Truy xuất QR hoạt động thế nào? [Hiện thực]**
- **Ý chính: mã `TRC-...` theo lô, quét ra hồ sơ nhà cung cấp, chứng nhận và nhật ký canh tác.**
- `GET /public/trace/{traceCode}`; trang `/truy-xuất/{mã}`; dòng bị đính chính vẫn hiện (gạch ngang).
- Có test 404 và đầy đủ; có Playwright xuyên shop - admin (`kich-ban/lo-hang.spec.ts`).
- Mã truy xuất theo lô tuân nguyên lý GS1 (Ch2).

**Q62. Vì sao không dùng blockchain? (câu bẫy)**
- **Ý chính: blockchain chỉ bảo đảm không sửa sau khi ghi, không xác minh dữ liệu đưa vào.**
- Nông dân vẫn nhập tay; rào cản người dùng; ví dụ Walmart-IBM có tiền đề mà Farmery không có (Ch2).
- Farmery dùng CSDL tập trung + GS1 + kiểm duyệt của người + nhật ký chỉ nối thêm (NFR9.1).
- Lập luận dựa rào cản áp dụng, không dựa chi phí hạ tầng (đã sửa 24/09, `DECISIONS.md`).

**Q63. Kiểm duyệt ba giai đoạn là gì?**
- **Ý chính: ba giai đoạn của một lô hàng: trước giao hàng, trong giao hàng, sau giao hàng (`tab:kiemduyet-giaidoan`, Ch4 §4.1.2).**
- Trước giao hàng: hồ sơ NCC-eKYC-chứng nhận (kiểm duyệt viên, 5 ngày làm việc, *Để sau prototype*); sản phẩm bốn lớp L1-L4 (L1-L3 trong thiết kế, L4 báo cáo sai danh mục *để sau prototype*); **lô hàng, mặc định 48 giờ, cấu hình được, Đã hiện thực** (tạo việc duyệt, duyệt thì sinh mã truy xuất, từ chối kèm lý do); nghiệm thu nhập kho (*Để sau prototype*).
- Trong giao hàng: nhân viên chuyển trạng thái đơn (Đã hiện thực); kiểm khi xuất kho, bàn giao 3PL (*Chỉ thiết kế*).
- Sau giao hàng: khiếu nại-đổi trả (hạn 24 h/48 h/7 ngày, quyết định 3 ngày làm việc); đánh giá nghi vấn-báo cáo sai danh mục; vi phạm-thu hồi lô - cả ba *Để sau prototype*.
- Điểm uy tín 0-100, cửa sổ 6 tháng, hậu kiểm nhanh từ >= 80 (Ch4 mục Đánh giá).

**Q64. Bốn lớp bảo đảm "đúng là nông sản" (L1-L4)?**
- **Ý chính: danh mục lá đóng; danh sách loại trừ; kiểm duyệt trước hiển thị; hậu kiểm bằng báo cáo người mua.**
- L1-L3 thiết kế để chặn hàng không phải nông sản; L4 (báo cáo sai danh mục, FR4.7) là **[Để sau prototype]**.
- Nguồn: Ch4 §4.3.

**Q65. Chứng nhận được kiểm thế nào? [Để sau prototype]**
- **Ý chính: kiểm ba tầng, hai tầng sau do kiểm duyệt viên, tầng cuối thủ công.**
- Tầng 1: hệ thống kiểm định dạng mã vùng trồng. Tầng 2: kiểm duyệt viên đối chiếu mã với cổng công bố công khai của Bộ NN&MT và ghi kết quả. Tầng 3: giấy chứng nhận (VietGAP, GlobalGAP, hữu cơ) duyệt hồ sơ thủ công.
- Đối chiếu gián tiếp qua TraceViet là hướng phát triển; chương 3 (`tab:researchgap`) cũng ghi điểm khác biệt này là "kiểm duyệt chứng nhận ba tầng".
- Hết hạn chứng nhận: ẩn nhãn, không gỡ sản phẩm; giả mạo chứng nhận: khóa vĩnh viễn. Nhắc gia hạn (FR3.3) và cảnh báo sắp hết hạn (FR11.2) *Để sau prototype*.
- Chuẩn nền: VietGAP ~70 tiêu chí, GlobalGAP 252 tiêu chuẩn (Ch2). `supplier.certifications` có dữ liệu demo.

**Q66. Nhập liệu thay nhà cung cấp: nhân viên có quyền gì? (câu bẫy)**
- **Ý chính: nhân viên hỗ trợ vùng chỉ ghi nhật ký hộ nhà cung cấp được phân công, có dấu vết đầy đủ.**
- Dữ liệu: `supplier.support_assignments` (ai phụ trách ai), ghi `entered_by`, thời điểm, lý do, cờ `onBehalf`; nhà cung cấp xem lại được (FR4.2, FR10.7, NFR6.2).
- Nhân viên không sửa nhật ký đã công khai; muốn đính chính vẫn phải nối bản mới.
- Cẩn thận (trung thực): service đã gán `onBehalf` cho vai trò `staff_*`, nhưng `x-roles` của `appendFarmingLog` chỉ có `seller` nên đường này nhiều khả năng trả 403 trong mã hiện tại; không có test (suy từ đọc mã, chưa gọi thử).

**Q67. Nếu nhà cung cấp nhập gian dữ liệu thì QR có ý nghĩa gì? (câu bẫy)**
- **Ý chính: giới hạn mà blockchain cũng không giải; Farmery đặt lớp người và dấu vết.**
- Kiểm duyệt viên duyệt lô; chứng nhận kiểm 3 tầng; nhật ký đã công khai chỉ nối thêm, đính chính hiện công khai; nhập hộ có dấu vết.
- Khiếu nại lặp trên một lô tự gắn cờ; thu hồi lô; vi phạm xử phân cấp (nhắc nhở, cảnh cáo công khai, tạm khóa, khóa vĩnh viễn); vi phạm nghiêm trọng khóa ngay.
- Không nói QR "đảm bảo 100% đúng" - chỉ nói giảm bất cân xứng thông tin (Akerlof 1970).

**Q68. TraceViet là gì và Farmery liên quan thế nào? (câu bẫy)**
- **Ý chính: hệ thống truy xuất của Bộ NN&MT, ra mắt 26/12/2025; Farmery chỉ thiết kế lớp tích hợp, chưa nối.**
- Chuẩn kết nối chỉ mô tả chiều đẩy dữ liệu XML ký số, không có giao diện tra cứu cho bên ngoài (Ch2).
- FR4.8 đồng bộ TraceViet đã rút khỏi bộ FR, chuyển hướng phát triển (Ch8 §8.3), điều kiện: được cấp quyền + có chuẩn kết nối.
- Mã truy xuất theo lô của Farmery được thiết kế để đồng bộ sau.
- **[Ngoài phạm vi]**

---

## H. Bán sỉ: RFQ, hợp đồng (Q69-Q73)

**Q69. Luồng bán sỉ tối giản gồm những bước nào? [Chưa có mã]**
- **Ý chính: RFQ, báo giá/thương lượng, chốt, hợp đồng, xác nhận OTP, giao một đợt, nhận hàng, thanh toán, hoa hồng.**
- Trước đó, hồ sơ doanh nghiệp mua sỉ (giấy phép kinh doanh, mã số thuế) do **kiểm duyệt viên** xác minh mới được xem bảng giá sỉ và gửi RFQ (FR1.3, FR10.1).
- RFQ kiểm MOQ (chưa đạt thì gợi ý gộp đơn hoặc sang lẻ); nhà cung cấp báo giá bậc; trao đổi trong kênh RFQ.
- `fig:act-ban-si`, `fig:seq-hop-dong-si`, UC-D4 (Phụ lục S).
- Bảng: `rfqs`, `rfq_messages`, `price_tiers`, `contracts`, `contract_versions`, `contract_confirmations`, `wholesale_orders`.
- Mô-đun `wholesale` rỗng và không nằm trong 40 thao tác hợp đồng hiện tại.

**Q70. "Xác nhận giao kết" có giá trị pháp lý không, sao không ký số?**
- **Ý chính: OTP + lưu tài khoản, thời điểm, mã băm đúng phiên bản; ký số là hướng phát triển.**
- Hình thức xác nhận bằng phương tiện điện tử được công nhận theo Luật GDĐT 20/2023 Điều 22-23 (FR6.3).
- Ký số cần tổ chức chứng thực, nên FR6.6 đã rút sang Ch8.
- Cẩn thận: báo cáo tự ghi dè dặt ở phần pháp lý; đừng nói "tương đương chữ ký số".

**Q71. Vì sao sỉ chỉ giao một đợt và thanh toán thường?**
- **Ý chính: giữ sỉ tối giản để dành công sức cho trục bán lẻ.**
- Ký quỹ, giao nhiều đợt, khấu trừ thuế (FR6.5, FR7.3, FR7.4) là **[Chỉ thiết kế]**, điều kiện: có khách sỉ thật + quy định thuế rõ.
- Hạn chế được nêu ở Ch8 §8.2 (luồng sỉ tối giản).

**Q72. Chống bán vượt giữa sỉ và lẻ thế nào?**
- **Ý chính: dòng tồn tách chủ, hai luồng không giành cùng một dòng.**
- Hợp đồng sỉ giành dòng của nhà cung cấp; đơn lẻ giành dòng của Farmery; thu mua cận hạn là cầu nối một chiều (Q4, Q42).
- Cả hai đi qua giao dịch có khóa (thách thức Ch4 §4.2.4, NC5).
- **[Chưa có mã]**

**Q73. Doanh nghiệp mua sỉ được bảo vệ gì nếu nhà cung cấp không giao?**
- **Ý chính: bên mua xác nhận nhận hàng và chất lượng rồi mới thanh toán qua cổng.**
- Thanh toán thường sau khi bên mua xác nhận nhận hàng (không ký quỹ); điều khoản nghiệm thu và xử phạt ở bộ chính sách Phụ lục D và U.
- Cẩn thận: không có ký quỹ nên mức bảo vệ chỉ ở mức này; đừng nói "được ký quỹ".

---

## I. AI: tìm kiếm ngữ nghĩa, sản phẩm tương tự, dự báo giá (Q74-Q81)

**Q74. Hệ thống có những tính năng AI nào và đã chạy chưa?**
- **Ý chính: ba tính năng, đều chưa có dịch vụ AI thật; có bản tạm cho tìm kiếm và tương tự.**

| Tính năng | Thiết kế | Hiện trạng mã 28/10 |
|---|---|---|
| Tìm kiếm ngữ nghĩa lai (FR12.3) | FTS (`unaccent`, trigram) + vector BGE-M3, hợp nhất RRF | Bỏ dấu + Levenshtein trong bộ nhớ. **[Chưa có mã]** cho vector |
| Sản phẩm tương tự (FR12.1) | láng giềng cosine, loại sản phẩm đang xem, chỉ còn hàng | Cùng danh mục, lấy 4 sản phẩm đầu. Bản tạm [Hiện thực], vector [Chưa có mã]; gợi ý cá nhân hóa [Chỉ thiết kế] |
| Dự báo giá (FR12.2) | SARIMA/Prophet, đối chứng gradient boosting, chạy offline hằng tuần | Chưa có. **[Chưa có mã]** |

- Không có dịch vụ Python/FastAPI nào trong `apps/`; chưa có `product_embeddings`, `price_forecasts` thật.

**Q75. Tìm kiếm ngữ nghĩa lai hoạt động ra sao?**
- **Ý chính: chạy hai nhánh (từ khóa và vector) rồi hợp nhất bằng RRF.**
- Từ khóa: PostgreSQL full-text với `unaccent` và trigram (gõ sai, không dấu); vector: embedding BGE-M3 trong pgvector.
- RRF (Reciprocal Rank Fusion) trộn hai bảng xếp hạng không cần chuẩn hóa điểm (Ch2, Ch5 §5.2.3).
- Chạy được từ ngày đầu vì vector có sẵn, không cần dữ liệu hành vi (cold start).

**Q76. Số liệu ngưỡng AI lấy ở đâu khi chương 7 chưa có kết quả? (câu bẫy)**
- **Ý chính: ngưỡng đặt trước (Phụ lục L, `tab:nguongAI`); Ch7 mới là khung, chưa có số đo.**
- Search: nDCG@10 hơn từ khóa >= 15%, Recall@10 không thấp hơn, p95 < 1 s, trên >= 50 truy vấn gán nhãn tay.
- Tương tự: Precision@5 >= 0,6 trên >= 50 sản phẩm. Dự báo: MAPE < 20% (đặt thấp hơn ~82% của Farm2Market).
- Nguyên tắc: đặt ngưỡng trước hiện thực để không chọn chỉ số sau khi biết kết quả.
- Cẩn thận: nói "ngưỡng cần đạt", tuyệt đối không nói "đã đạt".

**Q77. Dữ liệu AI lấy ở đâu khi chưa có giao dịch thật? (câu bẫy)**
- **Ý chính: dùng dữ liệu công khai và bộ gán nhãn tay, ghi rõ giới hạn.**
- Dự báo giá chạy trên giá nông sản công khai (Phụ lục O), không phải dữ liệu giao dịch.
- Tìm kiếm/tương tự dùng bộ truy vấn và sản phẩm do nhóm gán nhãn tay (>= 50 mỗi loại), dữ liệu mô phỏng (Ch1 §1.3.2).
- Gợi ý cá nhân hóa theo hành vi, và tìm nhà cung cấp theo ngữ nghĩa cho khách sỉ, là **[Chỉ thiết kế]** vì cần dữ liệu tương tác.

**Q78. Vì sao không dùng học máy để phát hiện bất thường?**
- **Ý chính: thiếu lưu lượng và nhãn, nên dùng luật ngưỡng.**
- Học máy cần lưu lượng thật và tập nhãn gian lận; chưa có cả hai nên không đo được, trái nguyên tắc §1.2.3.
- Phán quyết của kiểm duyệt viên được tích lũy làm nhãn cho giai đoạn sau (Ch4 §4.3.3).
- ML bất thường là **[Ngoài phạm vi]** (Ch8 §8.2).

**Q79. Vì sao BGE-M3, không dùng API mô hình ngôn ngữ ngoài?**
- **Ý chính: mô hình embedding đa ngữ, có thể tự lưu trữ (cần xác nhận lý do chi tiết).**
- Chạy trong dịch vụ Python riêng; vector lưu trong pgvector cùng PostgreSQL, tránh đồng bộ hai nơi (Ch5 §5.2).
- Bảng so sánh phương án ở Phụ lục I.
- Cẩn thận: chưa chạy thật; mọi con số hiệu năng của BGE-M3 trong báo cáo là kỳ vọng.

**Q80. Dịch vụ AI gặp sự cố thì hệ thống ra sao?**
- **Ý chính: suy giảm êm - lùi về luật đơn giản.**
- Gợi ý: trang chủ lùi về "bán chạy"; tìm kiếm lùi về từ khóa (FTS). Giao dịch không phụ thuộc AI (Ch5).
- **[Chưa có mã]** nhưng hành vi lùi từ khóa đã tồn tại ở bản tạm.

**Q81. Dự báo giá dùng thế nào trong nghiệp vụ?**
- **Ý chính: hỗ trợ nhân viên thu mua quyết định giá và lượng khi lập đơn thu mua.**
- Chạy offline hằng tuần, kết quả lưu `procurement.price_forecasts`, hiển thị ở màn lập đơn thu mua.
- Rủi ro mức Challenging, xếp cắt sớm trong `kehoach.tex` (cắt sau các mục để sau prototype).
- **[Chưa có mã]**

---

## J. Bảo mật, phân quyền, riêng tư, 2FA, eKYC (Q82-Q87)

**Q82. Phân quyền thiết kế thế nào?**
- **Ý chính: RBAC đặc quyền tối thiểu, 6 vai trò nội bộ độc lập, quyền khai báo ngay trong hợp đồng.**
- `x-roles` trong `openapi.yaml`; sai quyền trả 403; mục tiêu NFR3.1: 100% endpoint trả 403 khi sai quyền.
- Đường nội bộ dưới `/api/admin`.
- [Hiện thực] một phần cho các endpoint đã chạy; kiểm RBAC tự động chưa làm (Ch7 TODO).

**Q83. Đăng nhập OTP hoạt động ra sao? [Hiện thực bản tạm]**
- **Ý chính: email, OTP, JWT.**
- Đăng nhập bằng email (FR1.1); số điện thoại chỉ khai để liên hệ, giao hàng, đăng nhập bằng số điện thoại là **[Chỉ thiết kế]**.
- `POST /auth/otp` rồi `POST /auth/login` rồi `GET /me`; prototype OTP cố định `123456` trả `devCode`, chỉ khi `DEMO_MODE`.
- Khóa 30 phút sau 5 lần nhập OTP sai (NFR3.5) - luật thiết kế.
- Cẩn thận: vai trò suy theo quy tắc email (email chứa "admin"/"staff"), email lạ thành cùng một người dùng `seller` + `buyer_retail`; token admin ở `localStorage` - chỉ là bản tạm.

**Q84. 2FA cho nhân sự nội bộ làm thế nào? [Chưa có mã]**
- **Ý chính: TOTP bằng ứng dụng xác thực, không dựa SMS (NFR3.6).**
- Cột `identity.users.totp_secret_enc` lưu bí mật đã mã hóa.
- Chưa hiện thực trong prototype; là việc của MVP.

**Q85. eKYC nhà cung cấp làm thế nào? [Để sau prototype]**
- **Ý chính: trong phạm vi đồ án eKYC là duyệt thủ công ảnh giấy tờ; đối chiếu khuôn mặt tự động là chỉ thiết kế.**
- Nhà cung cấp tải ảnh giấy tờ định danh và ảnh chân dung (`identity.ekyc_documents`); **kiểm duyệt viên** đối chiếu thủ công; đạt thì tài khoản thành "Đã xác thực" và mở quyền đăng bán (FR1.4, hạn 5 ngày làm việc).
- Đối chiếu khuôn mặt tự động, đăng nhập Google/Facebook, OTP SMS, đăng nhập bằng số điện thoại đều **[Chỉ thiết kế]**.
- Cẩn thận: khâu hồ sơ NCC/eKYC là *Để sau prototype* (`tab:kiemduyet-giaidoan`), chưa có mã.

**Q86. Quyền riêng tư dữ liệu cá nhân xử lý thế nào?**
- **Ý chính: theo Luật Bảo vệ dữ liệu cá nhân 91/2025 và NĐ 117/2025.**
- Ghi nhận đồng ý (`consent_records`), quyền xem/sửa/xóa (`data_requests`), mã hóa AES-256 dữ liệu nhạy cảm, tệp riêng tư qua URL ký hết hạn.
- bcrypt cost >= 10 (NFR3.3); không lưu dữ liệu thẻ.
- Cẩn thận: hiệu lực và nội dung chi tiết các văn bản 2026 trong `tab:phaply` là dè dặt; báo cáo tự nhận chưa đọc toàn văn NĐ 141/2026.

**Q87. Điểm yếu bảo mật của prototype hiện tại?**
- **Ý chính: nêu thẳng trước khi bị hỏi.**
- OTP cố định `123456` (sau `DEMO_MODE`), token admin ở `localStorage`, id sinh bằng `Date.now()` có thể trùng, URL ảnh gõ cứng `localhost:4000`.
- CI chưa chạy Playwright; `develop`/`main` chưa bật branch protection (`NOTES.md` 27/10).
- Chưa có TOTP, mã hóa, kiểm thử RBAC tự động.

---

## K. Công nghệ và lựa chọn (Q88-Q93)

**Q88. Bộ công nghệ gồm những gì?**
- **Ý chính: Next.js + React/Vite/Refine, NestJS + Prisma, PostgreSQL (pgvector), Redis, MinIO, Python/FastAPI cho AI.**
- Mua hàng: Next.js (SSR trang QR, PWA); nội bộ: React/Vite/Refine; máy chủ: NestJS + Prisma; monorepo pnpm + Turborepo.
- Dịch vụ ngoài (5 thuộc phạm vi MVP): VNPay thử nghiệm, GHN thử nghiệm, hóa đơn giả lập, email SMTP, dịch vụ đẩy của trình duyệt (Web Push, VAPID). Mã hiện chỉ có 2 đứng sau interface kèm bản giả (cổng thanh toán, gửi OTP qua email); 3 còn lại (GHN, hóa đơn, Web Push) để sau prototype. Năm hệ thống chỉ thiết kế: SMS, TraceViet, chữ ký số, Google, Facebook (tổng 10).
- So phương án theo 5 tiêu chí ở Ch5 §5.2; bảng đầy đủ Phụ lục I.

**Q89. Vì sao chọn PostgreSQL một mình mà không thêm Elasticsearch hay DB vector?**
- **Ý chính: một CSDL cho khóa dòng, JSON và vector, tránh đồng bộ hai nơi (Ch5 §5.2.2).**
- Transaction khóa dòng chống oversell; JSON cho nhật ký canh tác; pgvector cho ngữ nghĩa; full-text sẵn có thay Elasticsearch.
- Đánh đổi: không có tính năng tìm kiếm nâng cao của Elasticsearch; chấp nhận ở quy mô này.

**Q90. Vì sao NestJS và Prisma?**
- **Ý chính: NestJS có sẵn mô-đun hóa khớp RB1-RB3; Prisma cho kiểu dữ liệu an toàn.**
- Khóa dòng bằng SQL thô `SELECT ... FOR UPDATE` là điểm Prisma không có sẵn, dùng `$queryRaw` trong transaction.
- Cùng ngôn ngữ TypeScript với giao diện, chia sẻ hợp đồng.
- (Lý do nhóm biết NestJS: không có trong tài liệu - cần xác nhận nếu bị hỏi.)

**Q91. Vì sao Next.js cho ứng dụng mua hàng và Refine cho ứng dụng nội bộ?**
- **Ý chính: ứng dụng mua hàng cần SSR/SEO và PWA; ứng dụng nội bộ là CRUD quản trị nhiều, Refine dựng nhanh.**
- Trang QR công khai cần SSR; PWA (NFR7.3) cài được, ghi nhật ký canh tác khi mất mạng.
- Ứng dụng nội bộ chỉ có giao diện đáp ứng, không thao tác ngoại tuyến.

**Q92. MinIO để làm gì?**
- **Ý chính: lưu tệp (ảnh nhật ký, giấy tờ eKYC, ảnh khiếu nại), tương thích S3, tự lưu trữ.**
- Tệp riêng tư qua URL ký trước có thời hạn; bảng `media.media_files`.
- [Chưa có mã] cho MinIO ở prototype: tệp nhận trực tiếp (`MVP.md` §6, hạng mục "Tệp").

**Q93. Vì sao không làm app di động gốc, và Web Push là gì?**
- **Ý chính: PWA đủ cho nhu cầu hiện tại; thông báo đẩy dùng Web Push, một chuẩn mở của trình duyệt chứ không phải đối tác thương mại.**
- PWA cài được, ghi nhật ký canh tác ngoại tuyến, nhận thông báo đẩy (NFR7.3); app gốc là hướng phát triển khi nhu cầu ngoại tuyến vượt web (Ch8 §8.2). **[Ngoài phạm vi]**
- Web Push là gì: chuẩn W3C (Push API + Notifications API), khóa VAPID (RFC 8292) để máy chủ tự định danh, tải tin mã hóa (RFC 8291).
- Cơ chế: PWA đăng ký service worker; trình duyệt đăng ký với dịch vụ đẩy do hãng trình duyệt vận hành (Google, Mozilla, Apple; miễn phí, Farmery không có hợp đồng hay tài khoản riêng) và nhận subscription (địa chỉ + khóa); máy chủ nghiệp vụ lưu ở `notification.push_subscriptions`; khi đơn đổi trạng thái, máy chủ gửi yêu cầu HTTP ký VAPID tới địa chỉ đó; service worker hiển thị thông báo kể cả khi đã đóng tab.
- Trạng thái: prototype hỏi lại trạng thái đơn mỗi 5 giây; MVP dùng Web Push: **[Để sau prototype]** (FR11.1). Trong hình C4 ghi "Dịch vụ đẩy của trình duyệt (Web Push)", một trong 5 hệ thống thuộc phạm vi MVP.
- Cẩn thận: đừng nói Farmery "tích hợp với Google/Apple" hay "mua dịch vụ thông báo"; chưa có mã nào cho Web Push.

---

## L. Hiện thực, kiểm thử, đánh giá, hạn chế, hướng phát triển, trung thực (Q94-Q100)

**Q94. Prototype là gì, có bỏ đi không?**
- **Ý chính: nền của MVP, không bỏ - đúng stack, đúng hợp đồng, đúng 13 mô-đun, chỉ giả lập lưu trữ, OTP, thanh toán.**
- Bảng khác biệt prototype/MVP ở `MVP.md` §6 (lưu trữ, đăng nhập, thanh toán, giao hàng, theo dõi đơn, tìm kiếm, tệp, PWA).
- Bốn điều kiện giữ mã ở mốc 21/10: qua repository; luật nghiệp vụ có test; không lối tắt ngoài `DEMO_MODE`; API khớp hợp đồng.
- Cẩn thận: điều kiện 2 (luật có test) chưa thỏa với FEFO/giữ chỗ/máy trạng thái đơn.

**Q95. Quy trình kiểm thử và chất lượng mã?**
- **Ý chính: CI chạy test và độ phủ, SonarQube Cloud, k6 và Lighthouse chạy riêng (Ch6 §6.1.1).**
- GitHub Actions; SonarQube Cloud (kho riêng tư tới 50 nghìn dòng); monorepo pnpm + Turborepo.
- Hiện có 37 test e2e API (jest + supertest) + 10 Playwright (đếm bằng grep, chưa chạy lại ngày 28/10).
- Cẩn thận: không có test chống bán vượt; chưa có số độ phủ hay SonarQube trong tài liệu đã đọc.

**Q96. Đã test những luồng nào bằng e2e?**
- **Ý chính: đăng nhập, catalog công khai, lô - kiểm duyệt - QR.**
- API: 8 khung + 2 đăng nhập + 11 catalog + 16 lô/kiểm duyệt = 37.
- Playwright: 3 shop + 4 admin đăng nhập, 2 xuyên shop - admin về lô hàng, cộng các test khác = 10 (phân tách chi tiết: cần xác nhận).

**Q97. Chương 7 đánh giá thế nào, có kết quả gì? (câu bẫy)**
- **Ý chính: khung và ngưỡng đã chốt, chưa có số đo nào.**
- Sáu trụ cột: chức năng; chất lượng mã (SonarQube); hiệu năng + chống bán vượt (k6); bảo mật (RBAC tự động); khả dụng (Lighthouse, axe-core, thử với nhà cung cấp); AI offline. Sáu trụ cột gộp vào bốn nhóm mục tiêu đánh giá (Ch1 §1.2.3).
- Ch7 còn TODO: điều kiện đo, bảng test case, số đo tải, số đo chống bán vượt, RBAC, Lighthouse, usability, AI, kết chương.
- Nếu không đạt ngưỡng: phân tích nguyên nhân và phản ánh vào Hạn chế của Ch8.

**Q98. Chương nào của báo cáo còn dở, hội đồng sẽ thấy gì?**
- **Ý chính: nêu thẳng, kèm kế hoạch.**
- Ch6: chỉ có §6.1.1; thiếu kiến trúc triển khai, hiện thực 8 mô-đun, giải thuật, kết quả kiểm thử. Ch7: chưa có số đo. Ch8 §8.1: TODO.
- Ch5 TODO: thiết kế API, UI/UX, test case, sơ đồ luồng AI. Phụ lục A và C: TODO.
- Phương án: dùng prototype + e2e làm minh chứng, và đưa tư liệu từ `apps/api/README.md`, `MVP.md` §6, `DECISIONS.md` vào Ch6.

**Q99. Hạn chế và hướng phát triển chính?**
- **Ý chính: 5 hạn chế, 11 hướng phát triển, mỗi hướng có điều kiện kích hoạt.**
- Hạn chế (Ch8 §8.2): ML bất thường; phân quyền nội bộ trong tài khoản doanh nghiệp; mua trả sau; app di động + mạng xã hội; luồng sỉ tối giản.
- Hướng (Ch8 §8.3): điều phối nhiều kho; đội giao riêng; dịch vụ kho mở; chào sỉ tồn dư; ký số; cảnh báo khan hiếm; gói "Tài trợ"; giấy tờ xuất khẩu; đồng bộ TraceViet.
- Khi nào tách microservices: có thể không bao giờ cần ở quy mô này.

**Q100. Mỗi thành viên phải trả lời được những câu cơ bản nào, và ai làm phần nào?**
- **Ý chính: ai cũng phải nói được năm điều và chỉ ra phần mình phụ trách.**
- Năm điều: (1) hai luồng 3P/1P; (2) 13 mô-đun/65 bảng và RB1-RB3; (3) dòng tồn + giữ chỗ 15 phút + khóa dòng; (4) luồng lô - duyệt - QR đang chạy; (5) cái gì chưa làm và vì sao (Q11, Q14).
- Phân công: tài liệu ghi vai trò kỹ thuật BE1 (dựng `catalog`, trang `/nha-cung-cap`, chạy luồng lô - duyệt), BE2 (chủ mô-đun `identity` và luồng khách lẻ theo `NOTES.md`), FE (giao diện shop/admin và e2e). Tên người cụ thể: cần xác nhận.
- Mẹo: khi được hỏi ngoài phần mình, trả lời mức khái niệm rồi chuyển cho thành viên phụ trách; đừng bịa chi tiết mã.

---

## 10 thuật ngữ phải nhớ

| # | Thuật ngữ | Nghĩa ngắn |
|---|---|---|
| 1 | 3P / 1P | Bán sỉ nhà cung cấp tự bán, Farmery thu hoa hồng / bán lẻ Farmery thu mua rồi bán lại, gánh tồn kho |
| 2 | Dòng tồn (stock holding) | (lô, chủ sở hữu, nơi chứa); đổi số lượng chỉ qua sổ nhập xuất |
| 3 | Giữ chỗ 15 phút | Khóa số lượng khi đặt đơn, nhả nếu không thanh toán; trừ tồn sau thanh toán |
| 4 | Khóa dòng (`SELECT ... FOR UPDATE`) | Khóa bi quan trong transaction để chống bán vượt |
| 5 | FEFO | Hết hạn trước, xuất trước |
| 6 | Modular monolith + RB1-RB3 | Một khối triển khai, 13 mô-đun theo miền, gọi qua service, không join xuyên mô-đun |
| 7 | Nhật ký canh tác chỉ nối thêm (`supersedesId`) | Sửa = bản mới, bản cũ thành "đã đính chính" |
| 8 | Xác nhận giao kết | OTP + tài khoản, thời điểm, mã băm phiên bản hợp đồng; không phải chữ ký số |
| 9 | RRF | Reciprocal Rank Fusion, trộn xếp hạng từ khóa + vector |
| 10 | Nhập liệu thay (`onBehalf`) | Nhân viên hỗ trợ vùng ghi hộ nhà cung cấp được phân công, có dấu vết |

## 5 con số phải thuộc

| # | Con số | Ý nghĩa | Nguồn |
|---|---|---|---|
| 1 | 13 mô-đun / 13 schema / 65 bảng | Quy mô CSDL và kiến trúc (565 cột, 48 khóa ngoại) | Ch5 §5.3.5, `schema.dbml` |
| 2 | 20/40 | Thao tác hợp đồng API đã có handler | `packages/contract/openapi.yaml` + controller `apps/api/src/modules` (đếm 28/10) |
| 3 | 15 phút | Thời gian giữ chỗ tồn | Ch4 §4.1.2 |
| 4 | >= 50 yêu cầu đồng thời, 0% oversell | Ngưỡng chống bán vượt (chưa có số đo) | NFR1.2, Phụ lục L |
| 5 | 37 + 10 | Test e2e API + Playwright hiện có (đếm bằng grep) | `apps/api/test`, `apps/e2e` |

## Nếu chỉ có 10 phút

Ôn theo thứ tự:

1. **Q1** - Farmery là gì (30 giây).
2. **Q5** - Khác biệt 1P và 3P.
3. **Q11** - Hiện thực được bao nhiêu (20/40).
4. **Q27** - Vì sao modular monolith.
5. **Q49** - Chống bán vượt (và thật thà: chưa có mã).
6. **Q47** - Vì sao prototype dùng bộ nhớ.
7. **Q62** - Vì sao không blockchain.
8. **Q66** - Nhập liệu thay nhà cung cấp.
9. **Q76** - Ngưỡng AI khi Ch7 chưa có số đo.
10. **Q97** - Chương 7 chưa có kết quả, nói thế nào.

Dự phòng: Q31 (vì sao tách AI), Q53 (COD), Q55 (hoa hồng), Q68 (TraceViet).

---

## Phần M. Các phương án đã cân nhắc: chọn gì, bỏ gì, vì sao

Dùng khi hội đồng hỏi: "Ngoài giải pháp này còn giải pháp nào khác? Vì sao chọn, vì sao bỏ?". Phần này không đánh số Q.

**Quy tắc đọc**
- Mỗi hàng chỉ ghi phương án mà báo cáo hoặc `DECISIONS.md` hoặc `NOTES.md` thực sự nêu. Chỗ nào chỉ có một hai phương án thay thế thì ghi đúng như vậy; chỗ nào không có phương án thay thế được ghi thì đưa xuống mục M.14 (thiếu đối chiếu), không bịa thêm.
- Cột "Nhận xét" ở Phụ lục I là **nhận định của nhóm theo tài liệu công bố, chưa phải số đo** (Phụ lục I, đoạn dẫn). Khi trả lời, không nói "đã đo thấy X nhanh hơn Y".
- Viết tắt nguồn: Ch5 §5.2 = mục "Giải pháp công nghệ" (nhãn `sec:giaiphapcongnghe`); Ph.I = Phụ lục I (`tab:sosanh-congnghe`, `tab:sosanh-ai`); DEC = `DECISIONS.md` (ghi tiêu đề + ngày); NOTES = `NOTES.md`. Số mục suy từ thứ tự LaTeX, có thể lệch 1 so với PDF (xem đầu file).
- Thuật ngữ: **máy chủ nghiệp vụ** = khối NestJS; **chào giá lô** = nhà cung cấp công bố lô sắp thu hoạch kèm giá chào; **doanh nghiệp mua sỉ** = khách sỉ; **nhập liệu thay nhà cung cấp** = nhân viên hỗ trợ vùng ghi hộ.

### M.1. Kiến trúc tổng thể

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 1 | Kiểu kiến trúc | Modular monolith, 13 mô-đun, mỗi mô-đun một schema, ba ràng buộc RB1-RB3 | (a) monolith phân lớp thuần; (b) microservices | Giữ giao dịch trong một CSDL (khóa dòng chống bán vượt); vẫn có đường tách về sau nhờ RB1-RB3 và schema riêng | (a) đơn giản nhất nhưng không giữ được đường biên miền nghiệp vụ; (b) chi phí vận hành cao (nhiều dịch vụ, theo dõi phân tán), chỉ đáng khi nhiều đội làm song song; và phá giao dịch chống bán vượt, phải thay bằng saga/giao dịch bù | Ch5 §5.3.1 "Kiểu kiến trúc: modular monolith"; Ph.I dòng "Kiểu kiến trúc"; DEC "Kiến trúc: khối đơn chia mô-đun..." 2026-09-23 |
| 2 | Có tách dịch vụ AI không | Tách riêng duy nhất dịch vụ AI, viết Python/FastAPI, không đọc thẳng CSDL (nhận sự kiện hoặc lời gọi nội bộ) | (a) chạy mô hình ngay trong NestJS; (b) Flask thay FastAPI | Khác ngôn ngữ và đặc tính tài nguyên; mọi thư viện học máy ở hệ sinh thái Python; AI lỗi không làm gián đoạn giao dịch (trang chủ lùi về danh sách bán chạy); FastAPI có kiểu và tài liệu API tự sinh | (a) bớt một dịch vụ nhưng thư viện dự báo chuỗi thời gian trên Node rất hạn chế; (b) nhẹ nhưng phải tự thêm kiểm tra kiểu và tài liệu | Ch5 §5.2 "Thuật toán, công nghệ và mô hình AI"; Ch5 §5.3.1 "Các quyết định kiến trúc đáng chú ý"; Ph.I dòng "Dịch vụ AI" |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Nhóm cân nhắc ba kiểu: monolith phân lớp, modular monolith, microservices. Nghiệp vụ khó nhất là chống bán vượt, cần giao dịch có khóa dòng trong một CSDL, mà microservices phải thay bằng saga phức tạp hơn nhiều. Nên nhóm chọn khối đơn chia mô-đun, giữ ba ràng buộc để sau này tách được, và chỉ tách riêng dịch vụ AI vì khác ngôn ngữ."

### M.2. Front-end

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 3 | Khung cho ứng dụng mua hàng | Next.js (React), dạng PWA | Nuxt (Vue); Angular | Cần SSR cho trang QR và trang sản phẩm công khai (lập chỉ mục, không đăng nhập); đóng gói được PWA (NFR7.3) | Nuxt: năng lực tương đương nhưng hệ sinh thái thư viện thương mại điện tử mỏng hơn; Angular: cấu trúc chặt nhưng chi phí học cao, dư thừa so với quy mô đồ án | Ch5 §5.2 "Front-end"; Ph.I dòng "Ứng dụng mua hàng" |
| 4 | Khung cho ứng dụng nội bộ | React + Vite + Refine, tách khỏi Next.js | Dùng chung Next.js; React-Admin | Màn danh sách, biểu mẫu, hàng đợi duyệt theo vai trò; Refine có sẵn khung danh sách, biểu mẫu, kiểm soát truy cập, không ràng buộc thư viện giao diện; mã màn hình quyền cao không nằm trong gói tải của ứng dụng công khai | Dùng chung Next.js: ít công nghệ hơn nhưng màn quyền cao chung gói với ứng dụng công khai và SSR không cần; React-Admin: cùng mục đích nhưng gắn chặt với một thư viện giao diện | Ch5 §5.2 "Front-end"; Ph.I dòng "Ứng dụng nội bộ"; DEC "Phiên 2026-10-07", mục "Hai ứng dụng (#15)" |
| 5 | Thư viện giao diện | shadcn/ui + Tailwind cho shop; Ant Design 5 (qua `@refinedev/antd`) cho admin | Mantine, Chakra (cho admin); MUI (cho shop); shadcn/ui cho cả hai | shadcn/ui hợp Server Components; Ant Design tích hợp Refine đầy đủ nhất (bảng, form, trang đăng nhập, Inferencer), BE tự dựng được màn Kho, Cấu hình | Mantine, Chakra: gói Refine còn bám Mantine v5 và Chakra v2 tại 13/10; MUI cho shop: phải `use client` nhiều chỗ; shadcn/ui cho cả hai: admin phải ráp tay nhiều hơn trong 8 ngày. Đánh đổi nhận: hai hệ thiết kế | DEC "Thư viện giao diện: shadcn/ui cho shop, Ant Design 5 cho admin" 2026-10-13; NOTES "Chọn thư viện giao diện cho hai ứng dụng" (resolved) |
| 6 | Web hay app di động gốc | Web responsive + PWA | App di động gốc: báo cáo chỉ nói nằm ngoài phạm vi, không có bảng so sánh | PWA cài được, thông báo đẩy, nhật ký canh tác ngoại tuyến (NFR7.3) | Không có lý do so sánh trong báo cáo; chỉ ghi app gốc là hướng phát triển (Ch8). Xem M.14 | Ch4 mục "Kênh truy cập"; Ch8 §8.2 |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Hai ứng dụng có nhu cầu khác nhau nên chọn khác nhau. Mua hàng cần SSR cho trang QR công khai nên dùng Next.js; nội bộ chỉ là danh sách, biểu mẫu theo vai trò nên dùng React, Vite, Refine, và tách riêng để mã màn hình quyền cao không nằm trong gói tải của người dùng ngoài. Nuxt và Angular bị loại vì hệ sinh thái mỏng hơn và chi phí học cao."

### M.3. Back-end, truy cập dữ liệu, CSDL

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 7 | Khung back-end | NestJS (Node, TypeScript) | Spring Boot (Java); Django hoặc FastAPI (Python); Laravel (PHP) | Cùng TypeScript với giao diện, chia sẻ kiểu dữ liệu; mô-đun và guard phân quyền có sẵn, khớp mô hình nhiều vai trò. DEC ghi NestJS ban đầu là đề xuất, sau đó nhóm xác nhận (2026-10-07) | Spring Boot: trưởng thành nhưng thêm ngôn ngữ thứ hai; Django/FastAPI: trùng ngôn ngữ dịch vụ AI nhưng phần nghiệp vụ lõi cần cấu trúc mô-đun rõ hơn; Laravel: hợp thương mại điện tử truyền thống, hệ sinh thái AI hạn chế | Ch5 §5.2 "Back-end"; Ph.I dòng "Back-end"; DEC "Chọn PostgreSQL..." (dòng Lưu ý và SỬA 2026-10-07) |
| 8 | Truy cập dữ liệu (ORM) | Prisma; khóa dòng bằng SQL thô `SELECT ... FOR UPDATE` gom trong mô-đun tồn kho | TypeORM; Drizzle | Lược đồ khai báo một nơi, sinh kiểu và migration | TypeORM: có cú pháp khóa dòng nhưng kiểu sinh ra kém chặt hơn; Drizzle: gần SQL, nhẹ nhưng hệ sinh thái và tài liệu còn mỏng. Điểm yếu nhận: Prisma không có khóa dòng nên phải SQL thô (chỗ duy nhất) | Ch5 §5.2 "Back-end"; Ph.I dòng "Truy cập dữ liệu" |
| 9 | Hệ quản trị CSDL | PostgreSQL một mình (kèm pgvector) | MySQL; MongoDB. Cũng đã cân nhắc rồi bỏ: PostGIS | Gom ba nhu cầu vào một thành phần: giao dịch khóa dòng, JSON có chỉ mục (nhật ký canh tác khác trường theo cây), vector (tìm kiếm ngữ nghĩa, sản phẩm tương tự) | MySQL: đáp ứng giao dịch nhưng thiếu tìm kiếm vector; MongoDB: xử lý transaction khóa dòng kém hơn hẳn; PostGIS: bỏ ngày 2026-10-07 vì chặng cuối giao qua 3PL nội thành, không cần bán kính giao | Ch5 §5.2 "Back-end"; Ph.I dòng "Cơ sở dữ liệu"; DEC "Chọn PostgreSQL làm mắt xích công nghệ trung tâm" (SỬA 2026-09-30, 2026-10-07) |
| 10 | Tìm kiếm sản phẩm (hạ tầng) | Full-text của PostgreSQL + `unaccent` + trigram | Elasticsearch; Meilisearch ("để dành giai đoạn sau") | Đủ ở quy mô 100 người dùng đồng thời (NFR1.1); chịu gõ không dấu, gõ sai; không phát sinh đồng bộ dữ liệu | Mạnh hơn nhiều nhưng thêm hạ tầng phải đồng bộ và vận hành. Ngưỡng chuyển: khi truy vấn tìm kiếm vượt NFR1.1 | Ch5 §5.2 "Back-end" (đoạn Tìm kiếm và lọc nâng cao); Ph.I dòng "Tìm kiếm" |
| 11 | Lưu trữ tệp | Object storage tương thích S3 (MinIO tự vận hành), tải qua đường dẫn ký trước | Lưu trong CSDL; lưu trên đĩa máy chủ ứng dụng | Tách tệp khỏi CSDL, thuận lợi khi nhân bản máy chủ (mở rộng ngang, NFR2.2) | Trong CSDL: phình dung lượng, chậm sao lưu; trên đĩa: cản trở nhân bản khi mở rộng | Ch5 §5.2 "Back-end"; Ph.I dòng "Lưu trữ tệp"; DEC "Phiên 2026-10-07" mục "AI (#8), tệp (#12)" |
| 12 | Cache và hàng đợi | Redis dùng cho cả cache lẫn hàng đợi tác vụ nền và sự kiện | Message broker chuyên dụng ("để dành giai đoạn sau") | Một thành phần cho hai nhu cầu; mã phát sự kiện không phải sửa khi sau này đổi sang broker | Năng lực vượt nhu cầu hiện tại; không cần ở quy mô này | Ch5 §5.2 "Back-end"; Ch5 §5.3.1 (quyết định "event queue"); Ph.I dòng "Đệm và hàng đợi" |

**Nếu hội đồng hỏi: trả lời 20 giây.** "PostgreSQL một mình gom được ba nhu cầu: giao dịch khóa dòng để chống bán vượt, JSON có chỉ mục cho nhật ký canh tác, và vector cho tìm kiếm ngữ nghĩa. Chọn khác thì phải dựng thêm hạ tầng riêng rồi đồng bộ; MongoDB xử lý khóa dòng kém, MySQL thiếu vector. Nguyên tắc xuyên suốt của nhóm là giảm tối đa số thành phần phải vận hành, nên Elasticsearch và message broker để dành giai đoạn sau."

### M.4. Tổ chức kho mã và quy trình làm việc

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 13 | Tổ chức kho mã | Monorepo: pnpm workspaces + Turborepo | Nx; nhiều kho riêng | Chia sẻ kiểu dữ liệu sinh từ hợp đồng API và thành phần giao diện; Turborepo chỉ dựng lại phần bị ảnh hưởng | Nx: tương tự nhưng cấu hình nặng hơn so với quy mô nhóm; nhiều kho: phải đồng bộ kiểu dữ liệu giữa các kho bằng tay. Báo cáo cũng giữ chung một repo với tài liệu vì `MVP.md`, `DECISIONS.md` là nguồn chung | Ch5 §5.2 "Front-end" (đoạn Tổ chức kho mã); Ph.I dòng "Tổ chức kho mã"; DEC "Tách báo cáo vào report/..." 2026-10-13 |
| 14 | Cách gộp nhánh git | Squash vào `develop`; `develop` vào `main` bằng merge commit; đồng bộ bằng `git pull --rebase` | Merge commit cho nhánh nhiều người cùng làm (giữ làm ngoại lệ); merge `develop` ngược vào nhánh (bỏ) | Log sạch, một commit một mục đích | Merge `develop` ngược vào nhánh tạo nhiều merge commit rác (ví dụ `3e919e9`, `670de36`); đánh đổi nhận: squash gộp công của nhiều người nên có ngoại lệ merge commit | DEC "Quy trình git: squash vào develop..." 2026-10-27 |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Hai ứng dụng, máy chủ và các gói dùng chung nằm trong một monorepo để chia sẻ kiểu dữ liệu từ hợp đồng API, tránh phải đồng bộ tay giữa nhiều kho. Nx làm được tương tự nhưng cấu hình nặng hơn so với quy mô nhóm nên chọn pnpm với Turborepo."

### M.5. Xác thực, đăng nhập

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 15 | Kênh gửi OTP | OTP qua email (hợp đồng `POST /auth/otp` chỉ nhận email); đăng nhập bằng số điện thoại là chỉ thiết kế (số điện thoại chỉ khai để liên hệ, giao hàng) | SMS (chỉ thiết kế, kênh có trong mô-đun thông báo) | Không tốn phí theo tin, không phụ thuộc nhà cung cấp riêng | SMS: nhà cung cấp tính phí theo tin, cần ngân sách và hợp đồng; số điện thoại khai chỉ để giao hàng, chưa xác minh qua SMS | Ch4 §4.1.2 (đăng ký nhà cung cấp, bước OTP) và bảng `tab:chi-thiet-ke`; Ph.I dòng "Thông báo"; DEC "Hợp đồng API prototype..." (SỬA 2026-10-13) |
| 16 | Đăng nhập mạng xã hội | Không làm (chỉ thiết kế: Google, Facebook) | Đăng nhập Google, Facebook | Không nằm trên trục bán lẻ | Phụ thuộc dịch vụ bên ngoài, không nằm trên trục bán lẻ; điều kiện hiện thực: đăng ký ứng dụng OAuth với từng nhà cung cấp. Báo cáo không có bảng so sánh sâu hơn | Ch4 bảng `tab:chi-thiet-ke` |

**Nếu hội đồng hỏi: trả lời 20 giây.** "OTP gửi qua email vì SMS tính phí theo tin và cần hợp đồng nhà cung cấp, nên SMS để ở mức thiết kế. Đăng nhập Google, Facebook cũng chỉ thiết kế vì phụ thuộc dịch vụ ngoài và không nằm trên trục bán lẻ đầu-cuối."

### M.6. Thanh toán, vận chuyển, hóa đơn, thông báo

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 17 | Cổng thanh toán | VNPay (môi trường thử nghiệm) | MoMo; PayOS (VietQR, giữ làm phương án bổ sung) | Gom thẻ nội địa, mã QR, ví sau một lần tích hợp; có môi trường thử và tài liệu tiếng Việt | MoMo: phổ biến nhưng xoay quanh ví của chính MoMo; PayOS: chuyển khoản qua QR, tích hợp nhẹ, chỉ một phương thức, nên làm bổ sung | Ch5 §5.2 "Back-end" (Dịch vụ bên thứ ba); Ph.I dòng "Thanh toán" |
| 18 | Vận chuyển chặng cuối | GHN (môi trường thử nghiệm) | Giao Hàng Tiết Kiệm (dự phòng); Ahamove (để dành khung giờ gấp) | API tạo vận đơn, webhook trạng thái, môi trường thử công khai, đủ kiểm thử trọn dòng thời gian đơn | GHTK: năng lực API tương tự, chỉ nêu là đơn vị dự phòng (lý do chọn GHN hơn GHTK mỏng: xem M.14); Ahamove: giao tức thời nội thành, hợp đơn gấp hơn là giao theo khung giờ hằng ngày | Ch5 §5.2; Ph.I dòng "Vận chuyển chặng cuối" |
| 19 | Mô hình giao hàng đơn lẻ | Ba chặng: nhà cung cấp tự đưa hàng về kho sơ chế; xe lạnh theo chuyến cố định Lâm Đồng - TP.HCM; 3PL nội thành theo khung giờ | (a) "mô hình lai" có đội giao riêng chặng ngắn (bản 2026-09-30); (b) "chỉ điều phối 3PL" không vận hành kho (bản 2026-09-15); (c) Farmery thuê xe đi gom tại nông hộ | Tự giữ khâu 3PL làm kém với hàng tươi (nghiệm thu, đóng gói, dán tem, điều phối chuyến lạnh), thuê ngoài phần còn lại; đội giao riêng chỉ đáng khi mật độ đơn đủ lớn | (a) đội giao riêng chuyển Chương 8; (b) bị sửa ngày 2026-09-30 vì Farmery cần tự vận hành kho sơ chế; (c) chỉ thiết kế, bản hiện thực nhà cung cấp tự đưa hàng | Ch2 §2.2 "Quản lý tồn kho... 3PL"; Ch4 §4.1.2 "Giao hàng đơn lẻ ba chặng"; DEC "Bổ sung 5 mảng nội dung lớn..." (SỬA 2026-09-30) và "Phiên 2026-09-30" (SỬA 2026-10-07) |
| 20 | Hóa đơn điện tử | Lớp tích hợp + bản giả lập (PDF, mã tra cứu) | Nhà cung cấp thật: VNPT, Viettel, MISA ("chỉ thiết kế") | Kiểm thử được luồng phát hành, tra cứu mà không cần hợp đồng và chứng thư số | Nhà cung cấp thật cần hợp đồng và chứng thư số của doanh nghiệp vận hành | Ch5 §5.2 "Dịch vụ bên thứ ba"; Ph.I dòng "Hóa đơn điện tử"; Ch4 bảng `tab:chi-thiet-ke` |
| 21 | Thông báo | Web Push (chuẩn W3C, khóa VAPID) + email SMTP; Web Push là *Để sau prototype* (prototype hỏi lại trạng thái đơn mỗi 5 giây) | SMS (chỉ thiết kế) | Chuẩn mở của trình duyệt, dịch vụ đẩy do hãng trình duyệt vận hành miễn phí, Farmery không ký hợp đồng hay có tài khoản riêng, không tốn phí theo tin | SMS: tới được người không cài ứng dụng nhưng tính phí theo tin | Ch5 §5.2; Ph.I dòng "Thông báo" |
| 22 | Thanh toán đơn sỉ: tạm giữ hay thanh toán thường | Bản hiện thực: bên mua xác nhận nhận hàng rồi thanh toán thường qua cổng; ký quỹ qua cổng (FR7.3) chỉ thiết kế | Ký quỹ pháp lý thật; công nợ B2B, hạn mức tín dụng | Trả lời vấn đề niềm tin V4 bằng mã băm hợp đồng + QR lô; nền tảng không trực tiếp giữ tiền | Ký quỹ thật cần hạ tầng pháp lý; công nợ B2B và hạn mức tín dụng bị cắt xuống Ch8 vì là nghiệp vụ tài chính, không chứng minh luận điểm của đề tài | Ch4 §4.1.2 "Quy trình bán sỉ" (Phần chỉ thiết kế); Ch2 §2.2 "Nền tảng công nghệ... escrow"; DEC "Cắt phạm vi: bỏ phân quyền nội bộ DN, công nợ B2B..." 2026-09-23 |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Thanh toán chọn VNPay vì gom thẻ, QR, ví sau một lần tích hợp và có môi trường thử bằng tiếng Việt; PayOS giữ làm bổ sung. Chặng cuối chọn GHN vì có API vận đơn, webhook và môi trường thử công khai để kiểm thử trọn dòng thời gian đơn. Hóa đơn điện tử và SMS chỉ thiết kế vì cần hợp đồng, chứng thư số hoặc tính phí theo tin."

### M.7. Khóa tồn kho và chống bán vượt

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 23 | Cách chống bán vượt | Giao dịch có khóa dòng `SELECT ... FOR UPDATE` trên dòng tồn trong một CSDL; giữ chỗ 15 phút trước, trừ tồn sau thanh toán | Saga và giao dịch bù (khi tách dịch vụ) | Nghiệp vụ khó nhất (nhiều đơn lẻ cùng giành một dòng tồn; sỉ và thu mua cùng giành hàng một nhà cung cấp) dựa vào khóa dòng của một CSDL; đây là lý do tồn kho và đơn hàng phải chung CSDL | Saga/giao dịch bù: "phức tạp hơn nhiều mà gần như không được gì" (DEC). Báo cáo không so với khóa lạc quan, khóa trong Redis hay hàng đợi tuần tự: xem M.14 | Ch5 §5.3.1; Ch5 §5.2 "Back-end" (CSDL); DEC "Kiến trúc: khối đơn chia mô-đun..." 2026-09-23 |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Chống bán vượt dựa vào khóa dòng trong một giao dịch của PostgreSQL. Nếu tách tồn kho và đơn hàng sang hai dịch vụ thì phải thay bằng saga và giao dịch bù, phức tạp hơn mà không được gì thêm. Thật thà: logic này mới là thiết kế, chưa có mã (Q49)."

### M.8. Mô hình kinh doanh

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 24 | Ai sở hữu hàng: 1P, 3P, hay chỉ sàn | Hai luồng song song: bán sỉ 3P (nhà cung cấp giữ hàng, Farmery thu hoa hồng) + bán lẻ 1P (Farmery thu mua theo lô, tự định giá) | (a) sàn nhiều người bán thuần ở cả hai kênh (báo cáo cũ, nhà bán tự bán ở cả B2C và B2B); (b) chỉ 1P; (c) chỉ 3P | Nông dân, hợp tác xã không đủ năng lực phân loại, đóng gói đơn vài ki-lô-gam; 1P lấp khoảng trống đó, còn đơn sỉ giao thẳng hiệu quả hơn | (a) bị thay vì mô hình cũ thiên hẳn về B2B và thiếu hướng B2C kiểu "mua rồi bán lại"; (b)(c) báo cáo không nêu riêng phương án "chỉ 1P" hay "chỉ 3P" (xem M.14). Đánh đổi nhận: vốn lưu động, lỗ với lô không bán hết, vận hành hai mô hình; giảm bằng cách thu hẹp địa bàn thí điểm | Ch2 §2.2 "Mô hình thương mại điện tử: hai trục"; Ch4 §4.1.1 "Mô hình kinh doanh"; DEC "Mô hình kinh doanh hai luồng..." 2026-09-23 |
| 25 | Cách thu mua cho luồng 1P | Thu mua theo lô: nhà cung cấp công bố chào giá lô, nhân viên thu mua lập đơn, nhà cung cấp xác nhận, nghiệm thu, nhập dòng tồn của Farmery, trả tiền theo sản lượng nghiệm thu | "Mua đứt/bán đứt" là tên cũ, DEC ghi chỉ đổi chữ thành "thu mua theo lô"/"bán cả lô"; mô hình giữ nguyên. Báo cáo không nêu ký gửi | Nhà cung cấp có hai đầu ra thay vì phụ thuộc thương lái: tự bán sỉ giữ trọn giá, hoặc bán cả lô nhận tiền ngay | Không có phương án thay thế được so sánh, xem M.14 | Ch1 (lợi ích đối với nhà cung cấp); Ch4 §4.1.2 "Quy trình thu mua vào kho"; DEC "Phiên 2026-09-30" (mục Mô hình kinh doanh và vận hành) |
| 26 | Dòng thu | Hai dòng: hoa hồng đơn sỉ (3P) + chênh lệch giá mua - bán lẻ (1P); cước giao chỉ bù chi phí | Phí niêm yết/gói nổi bật, quảng cáo, phí dịch vụ giá trị gia tăng (nêu ở Ch2 như dòng thu phổ biến); phí xử lý đơn; "xác thực chứng nhận nhanh"; gói "Tài trợ"; thuê kho | Hoa hồng gắn trực tiếp giá trị giao dịch thật và ít cản người bán mới; không thu phí đăng ký để hạ rào cản gia nhập cho nông dân, hợp tác xã | Bán "xác thực nhanh": trả tiền để duyệt nhanh làm nhãn chứng nhận mất tính độc lập với người bán, trái lập luận niềm tin V4; gói "Tài trợ" và dịch vụ kho mở chuyển Chương 8; phí xử lý đơn bỏ ngày 2026-10-07 | Ch2 §2.2 "Mô hình doanh thu marketplace"; Ch4 §4.1.1 "Các dòng doanh thu"; DEC SỬA 2026-10-07 trong "Bổ sung 5 mảng nội dung lớn..." |
| 27 | Cho khách sỉ mua hàng của Farmery không | Không: Farmery không bán sỉ, kể cả tồn dư (không cạnh tranh với chính nhà cung cấp); tồn dư xả bằng giảm giá ở kênh lẻ | Chào sỉ tồn dư cho khách sỉ (bản 2026-09-30, FR13.7) | Giữ ranh giới 1P/3P và niềm tin của nhà cung cấp | Rút khỏi bộ FR ngày 2026-10-07, chuyển Chương 8 (hướng phát triển) | Ch4 §4.1.1; DEC "Phiên 2026-09-30" (SỬA 2026-10-07) |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Quyết định theo một câu hỏi: ai sở hữu hàng trong lúc giao dịch. Sỉ thì nhà cung cấp giữ hàng, Farmery thu hoa hồng; lẻ thì Farmery thu mua theo lô rồi bán lại, vì nông dân khó tự xử lý từng đơn vài ki-lô-gam. Cái giá phải trả là vốn lưu động và rủi ro hao hụt, nên có công thức hòa vốn và thu hẹp địa bàn về Lâm Đồng - TP.HCM."

### M.9. Tìm kiếm và AI

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 28 | Cách tìm kiếm ngữ nghĩa | Tìm kiếm lai: từ khóa (full-text + `unaccent` + trigram) và vector BGE-M3, hợp nhất bằng reciprocal rank fusion (RRF) | Vector thuần; mô hình ngôn ngữ lớn chuyển câu hỏi thành bộ lọc; tìm kiếm dạng hội thoại | Không tốn phí gọi API (mô hình mã nguồn mở chạy trong dịch vụ AI); giữ điểm mạnh từ khóa với tên riêng, vùng trồng; có sẵn đường cơ sở để so sánh (tìm từ khóa) | Vector thuần: dễ bỏ sót khớp chính xác tên sản phẩm, vùng trồng; LLM chuyển câu hỏi: cần API trả phí hoặc hạ tầng chạy mô hình lớn, khó đánh giá bằng số; hội thoại: thực chất là trợ lý ảo, đã bỏ khỏi phạm vi | Ch5 §5.2 "Thuật toán, công nghệ và mô hình AI"; Ph.I `tab:sosanh-ai`; DEC "Bỏ mô-đun trợ lý ảo khỏi phạm vi" 2026-09-23 |
| 29 | Mô hình nhúng văn bản | BGE-M3 | Multilingual-E5 (giữ làm đối chứng khi đo nDCG@10); SBERT huấn luyện riêng cho tiếng Việt | Đa ngôn ngữ có tiếng Việt, dùng cho cả truy vấn ngắn lẫn mô tả dài, mã nguồn mở | E5: nhẹ hơn, dùng làm đối chứng chứ không bị loại hẳn; SBERT tiếng Việt: tốt với tiếng Việt nhưng thường cần tách từ trước và kém với truy vấn trộn tiếng Anh | Ph.I `tab:sosanh-ai`; Ch2 §2.3 "Tìm kiếm theo ngữ nghĩa" |
| 30 | Gợi ý sản phẩm | Hybrid hai giai đoạn: hiện thực chỉ "sản phẩm tương tự" theo vector (Precision@5); phần hành vi bật sau khi đủ dữ liệu | Collaborative filtering thuần; content-based thuần; mạng nơ-ron | Chạy được ngay nhờ đặc trưng nông sản (mùa vụ, vùng, chứng nhận, danh mục), tăng dần trọng số hành vi khi có dữ liệu; giải quyết cold start (NC4) | CF thuần: không chạy khi chưa có lịch sử tương tác; content-based thuần: chạy ngay nhưng gợi ý đơn điệu khi dữ liệu tăng; mạng nơ-ron: cần lượng tương tác lớn hơn nhiều khả năng thu thập | Ch5 §5.2; Ph.I `tab:sosanh-ai`; Ch2 §2.3 "Hệ thống gợi ý" |
| 31 | Dự báo giá | Mô hình chuỗi thời gian có mùa vụ (ARIMA, SARIMA, Prophet) chạy offline, đối chứng với gradient boosting | Gradient boosting trên đặc trưng thời gian (đối chứng); RNN, LSTM | Chuỗi ngắn nhưng mùa vụ rõ, đúng đặc điểm giá nông sản; dễ giải thích; "chọn mô hình đơn giản hơn nhưng kiểm chứng được" | Gradient boosting: giữ làm đối chứng (khai thác biến ngoại sinh); RNN/LSTM: cần dữ liệu vượt xa khả năng thu thập trong đồ án | Ch5 §5.2; Ph.I `tab:sosanh-ai`; Ch2 §2.2 "Dự báo giá" |
| 32 | Giám sát bất thường | Luật ngưỡng cấu hình được (gọi đúng tên là luật ngưỡng, không gọi AI) | Unsupervised learning; supervised learning (cả hai để hướng phát triển) | Kiểm chứng được, minh bạch, không cần dữ liệu huấn luyện; hợp nguyên tắc "không đo được bằng số thì không đưa vào phạm vi" | Unsupervised: không đủ lưu lượng thật để học phân bố bình thường; supervised: không có tập nhãn gian lận đã xác nhận để đo chất lượng | Ch2 §2.3 "Giám sát dấu hiệu bất thường"; Ph.I `tab:sosanh-ai`; DEC "Cắt phạm vi..." 2026-09-23 |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Chọn theo dữ liệu có thể có, không theo độ mới của kỹ thuật. Nền tảng chưa có lịch sử nên gợi ý dùng đặc trưng sản phẩm trước; chuỗi giá ngắn, mùa vụ rõ nên dùng mô hình chuỗi thời gian thay vì LSTM; chưa có tập nhãn gian lận nên giám sát bất thường là luật ngưỡng, nói thẳng là không phải AI. Tìm kiếm lai vì vector thuần bỏ sót tên riêng, còn dùng LLM thì tốn API và khó đo."

### M.10. Truy xuất nguồn gốc, kiểm duyệt, ký số

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 33 | Cơ chế truy xuất nguồn gốc | QR theo lô trên CSDL tập trung theo nguyên lý định danh GS1; nhật ký canh tác bất biến sau khi công khai (NFR9.1); kèm kiểm duyệt chứng nhận của người | Blockchain (chủ yếu giải thích vì sao chưa dùng) | Blockchain chỉ bảo đảm dữ liệu không bị sửa sau khi ghi, không xác minh được dữ liệu đầu vào; Walmart/IBM thành công vì đủ lớn để buộc nhà cung cấp nhập đúng chuẩn, Farmery không có đòn bẩy đó | Nhóm nói thẳng **chi phí không phải lý do** (nghiên cứu Thái Lan 2025 cho thấy blockchain rẻ hơn khoảng 43%). Căn cứ thật: không xác minh đầu vào, và rào cản gia nhập: ba rào cản hàng đầu có "thiếu hạ tầng số", trùng với nhóm nhà cung cấp hạn chế kỹ năng số, thiết bị | Ch2 §2.2 "Truy xuất nguồn gốc thực phẩm: GS1 và blockchain"; Ch1 phạm vi giới hạn; DEC "Lập luận blockchain: bỏ căn cứ chi phí..." 2026-09-24 |
| 34 | Kết nối hệ thống nhà nước | Lớp tích hợp theo chuẩn kết nối đã công bố, hiện thực bằng bản giả lập; mở bán không phụ thuộc đồng bộ | Kết nối TraceViet thật ngay | Bảo đảm bán hàng không phụ thuộc hệ thống ngoài; dữ liệu đầu vào được cơ quan quản lý đối chiếu thêm khi có quyền | Phụ thuộc quyền kết nối chưa được cấp; văn bản chuẩn còn để trống số quyết định; chuẩn chỉ mô tả chiều đẩy dữ liệu (XML có ký số), không có giao diện tra cứu cho bên ngoài. Vì vậy chứng nhận, mã vùng trồng xác minh ba tầng (hệ thống kiểm định dạng mã vùng trồng; kiểm duyệt viên đối chiếu cổng công bố của Bộ; duyệt hồ sơ chứng nhận thủ công) | Ch2 §2.2 (đoạn TraceViet); Ph.I dòng "Truy xuất nhà nước"; Ch4 §4.1.2 (đăng ký nhà cung cấp, bước kiểm duyệt ba tầng); DEC "Phiên 2026-09-30" (mục Hợp đồng, QR, TraceViet) |
| 35 | Ký hợp đồng sỉ | Hai mức: xác nhận giao kết trong hệ thống (OTP + tài khoản + thời điểm + mã băm phiên bản), không gọi là chữ ký số | Ký số qua tổ chức chứng thực chữ ký số công cộng (FR6.6, hướng phát triển) | Tối giản được trong phạm vi; căn cứ Luật Giao dịch điện tử 2023 Điều 22-23 (DEC ghi đã đọc bản Công báo) | Ký số cần hợp đồng dịch vụ với tổ chức chứng thực và xét hiệu lực pháp lý của chữ ký; rút khỏi bộ FR ngày 2026-10-07 | Ph.I dòng "Ký số hợp đồng"; Ch4 bảng `tab:chi-thiet-ke`; DEC "Phiên 2026-09-30" (Hợp đồng, QR, TraceViet) và SỬA 2026-10-07 |
| 36 | Kiểm duyệt sản phẩm | Bốn lớp L1-L4: danh mục đóng, danh sách loại trừ, kiểm sơ bộ tự động rồi duyệt thủ công, hậu kiểm từ báo cáo người mua (L4 để sau prototype); nhà cung cấp lâu năm có thể hậu kiểm; hạn duyệt lô mặc định 48 giờ, cấu hình được; với danh tính nhà cung cấp (eKYC, FR1.4) kiểm duyệt viên đối chiếu thủ công ảnh giấy tờ + ảnh chân dung | Báo cáo không nêu phương án tự động hoàn toàn để so sánh; riêng eKYC, đối chiếu khuôn mặt tự động là chỉ thiết kế | Bảo đảm sàn chỉ có nông sản đúng loại, đúng chứng nhận | Không có đối chiếu, xem M.14 | Ch4 §4.1.2 (L1-L4, bảng `tab:kiemduyet-giaidoan`) |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Không dùng blockchain, và nhóm không lấy chi phí làm lý do vì có nghiên cứu cho thấy blockchain rẻ hơn. Lý do thật là blockchain chỉ giữ dữ liệu không bị sửa sau khi ghi, không kiểm chứng được dữ liệu nhập vào, mà nhà cung cấp nhỏ lại thiếu hạ tầng số. Nhóm dùng QR theo lô theo nguyên lý GS1 cộng kiểm duyệt chứng nhận của người, còn TraceViet thì thiết kế sẵn lớp tích hợp, chờ được cấp quyền."

### M.11. Lược đồ dữ liệu và cách trình bày ERD

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ từng phương án | Nguồn |
|---|---|---|---|---|---|---|
| 37 | Tổ chức lược đồ | 13 schema trùng 13 mô-đun (65 bảng); khóa ngoại vật lý chỉ trong cùng schema (DEC 2026-10-13 ghi 38 khóa ngoại, báo cáo hiện ghi 48: chưa khớp, xem Q40); tham chiếu xuyên schema chỉ bằng định danh, ghi `→ schema.bảng` trong note cột | Mô hình ERD và `schema.dbml` cũ của thành viên (các commit `65936c6`, `b4ce420`) | Thực thi RB3 với chi phí thấp: đường biên dữ liệu hiện rõ, vi phạm lộ ngay khi đọc mã; vẫn một CSDL nên giao dịch hoạt động | Mô hình cũ của thành viên bị "thay luôn" ngày 2026-10-13; khóa ngoại xuyên schema khóa chặt dữ liệu giữa các mô-đun (RB3: "thứ khóa chặt monolith là dữ liệu"). Đánh đổi: toàn vẹn xuyên schema do tầng ứng dụng giữ | Ch5 §5.3.1 (Ba ràng buộc); Ch5 §5.3.5 "Thiết kế cơ sở dữ liệu"; DEC "Lược đồ CSDL 13 schema, ERD và Phụ lục K..." 2026-10-13 |
| 38 | Cách trình bày ERD và từ điển dữ liệu | ERD 11 hình: tổng quan là ma trận phụ thuộc 9×7 giữa các schema, rồi 10 hình theo schema (khóa chính, khóa ngoại, 1-2 cột định danh, "+N cột khác"); nét liền = khóa ngoại thật, nét đứt = tham chiếu bằng định danh; Phụ lục K sinh tự động từ `schema.dbml` | (a) một hình xoay ngang 65 bảng (rồi hai hình `[p]`); (b) Phụ lục K viết tay 4 nhóm cốt lõi; (c) vẽ đường tới `identity.users`, `media.media_files` | Hình và phụ lục cùng sinh từ một tệp lược đồ nên không lệch nhau | (a) 65 bảng trên một trang thì chữ dưới 7pt; (b) dễ lệch lược đồ; (c) quá nhiều đường (đích có từ bốn bảng trỏ vào) làm hình khó đọc. Đánh đổi: phụ lục dài thêm khoảng 25 trang | DEC "Lược đồ CSDL 13 schema..." 2026-10-13; Ch5 §5.3.5 "Sơ đồ quan hệ thực thể (ERD)" |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Mỗi mô-đun một schema trong cùng một CSDL: giao dịch vẫn chạy bình thường, còn đường biên dữ liệu hiện rõ để sau này tách. Khóa ngoại thật chỉ trong cùng schema, xuyên schema chỉ tham chiếu bằng định danh, đó là chủ đích của RB3 chứ không phải thiếu sót. ERD và từ điển dữ liệu sinh tự động từ một tệp lược đồ nên không lệch nhau."

### M.12. Phạm vi và phương pháp triển khai

| # | Bài toán cần quyết | Đã chọn | Phương án khác đã cân nhắc | Vì sao chọn | Vì sao bỏ | Nguồn |
|---|---|---|---|---|---|---|
| 39 | Cắt phạm vi khi thêm luồng 1P | Nguyên tắc: cái gì không đánh giá được bằng số trong điều kiện đồ án thì không đưa vào phạm vi; hiện thực trục bán lẻ đầu-cuối + QR; sỉ tối giản (RFQ, hợp đồng xác nhận OTP, giao một đợt) | Giữ đầy đủ: phân quyền nội bộ tài khoản doanh nghiệp, công nợ B2B, mô-đun AI phát hiện gian lận, trợ lý ảo, ký quỹ, giao nhiều đợt | Mọi thứ còn lại đều kiểm chứng được: đổi bề rộng lấy khả năng bảo vệ; đồ án chuyên ngành có giới hạn thời gian | Chuyển xuống Chương 8 hoặc chỉ thiết kế. Chi tiết xem DEC | DEC "Cắt phạm vi..." 2026-09-23; "Phiên 2026-10-07 - 2026-10-08" mục Phạm vi (#1); "Bỏ mô-đun trợ lý ảo..." |
| 40 | Thứ tự ưu tiên khi thiếu thời gian | MoSCoW (Phụ lục M), xếp mô-đun khó nhất (chống bán vượt) vào tuần 6-7; kế hoạch hai giai đoạn theo hai mốc nộp 15/10 và 31/12 | Không có phương án thay thế được nêu | Giảm rủi ro tiến độ; tuần 14 không có dự phòng | Báo cáo không so sánh với Scrum, Kanban, thác nước: xem M.14 | DEC "Kế hoạch thực hiện viết lại theo hai giai đoạn..." 2026-09-23; Phụ lục M |

**Nếu hội đồng hỏi: trả lời 20 giây.** "Nhóm đặt nguyên tắc: không đo được bằng số trong điều kiện đồ án thì không đưa vào phạm vi. Vì vậy cắt phân quyền nội bộ doanh nghiệp, công nợ B2B, AI phát hiện gian lận và trợ lý ảo; chỉ giữ trục bán lẻ đầu-cuối và sỉ tối giản, phần còn lại thiết kế hoặc để Chương 8."

### M.13. Bảng tổng: "5 tiêu chí chọn" và nguyên tắc nền

Báo cáo nêu đúng **năm tiêu chí chung** ở đầu Ch5 §5.2 và một nguyên tắc xuyên suốt. Lưu ý: năm tiêu chí này **không** phải bộ "chi phí, độ phức tạp vận hành, quy mô đồ án, dữ liệu sẵn có, rủi ro pháp lý" mà đề bài gợi ý; bộ đó chỉ xuất hiện rải rác (xem cuối bảng).

| # | Tiêu chí (Ch5 §5.2) | Ý nghĩa | Ví dụ quyết định chịu chi phối (theo lý do báo cáo ghi) |
|---|---|---|---|
| 1 | Khả năng đáp ứng yêu cầu phi chức năng | Hiệu năng, toàn vẹn dữ liệu (NFR) | PostgreSQL (khóa dòng, NFR4.1); modular monolith; lưu tệp ngoài CSDL (NFR2.2) |
| 2 | Mức phù hợp với đặc thù nông sản | Dữ liệu theo lô, nhiều ảnh, tìm theo vùng, mùa vụ | JSON có chỉ mục cho nhật ký canh tác; dự báo giá chuỗi thời gian mùa vụ; gợi ý bằng đặc trưng mùa vụ, vùng, chứng nhận |
| 3 | Độ trưởng thành và hệ sinh thái | Tài liệu, thư viện, cộng đồng | Nuxt bị loại vì hệ sinh thái thương mại điện tử mỏng; Drizzle bị loại vì tài liệu mỏng; Mantine, Chakra loại vì gói Refine bám bản cũ |
| 4 | Chi phí | Ưu tiên mã nguồn mở hoặc gói miễn phí | BGE-M3 (không tốn phí gọi API); LLM chuyển câu hỏi bị loại (API trả phí); SMS để sau (phí theo tin) |
| 5 | Chi phí học của nhóm | Thời gian giới hạn, công nghệ mới hoàn toàn là điểm trừ | Angular bị loại; NestJS chung TypeScript với giao diện; admin dùng Ant Design vì "trong 8 ngày" |
| + | **Nguyên tắc xuyên suốt**: giảm tối đa số thành phần hạ tầng phải vận hành (mỗi thành phần kéo theo cài đặt, giám sát, đồng bộ) | Quyết định "thêm hay không thêm" thành phần | Không Elasticsearch, không DB vector riêng, không message broker chuyên dụng, không microservices |
| + | **Nguyên tắc phạm vi**: không đo được bằng số thì không đưa vào | Quyết định "làm hay chỉ thiết kế" | Giám sát bất thường dùng luật ngưỡng; bỏ trợ lý ảo; mạng nơ-ron bị loại vì thiếu dữ liệu |
| + | **Ràng buộc bên ngoài** (rải rác, không thành tiêu chí chung) | Hợp đồng, chứng thư số, quyền kết nối, tính phí theo tin | Hóa đơn điện tử thật, ký số, TraceViet, SMS, đăng nhập Google/Facebook đều "chỉ thiết kế" |

Mẹo trả lời: khi bị hỏi "tiêu chí là gì", nói năm tiêu chí ở trên rồi bổ sung hai nguyên tắc; đừng liệt kê "rủi ro pháp lý" như một tiêu chí chung.

### M.14. Quyết định chưa có đối chiếu trong báo cáo: nên chuẩn bị câu trả lời

Những mục dưới đây báo cáo, `DECISIONS.md` hoặc `NOTES.md` **không ghi** phương án thay thế (hoặc chỉ ghi phần chọn). Không bịa thêm; chuẩn bị câu trả lời theo hướng gợi ý và gắn nhãn là ý kiến nhóm khi trả lời.

| # | Quyết định | Báo cáo đã ghi gì | Câu hội đồng có thể hỏi | Hướng chuẩn bị |
|---|---|---|---|---|
| 1 | PWA hay app di động gốc | Chỉ ghi app gốc nằm ngoài phạm vi và là hướng phát triển; không có bảng so sánh | "Sao không làm app Android?" | Nêu NFR7.3 và Ch8; thừa nhận không có đối chiếu chi tiết |
| 2 | Khóa bi quan so với khóa lạc quan, khóa trong Redis, hàng đợi tuần tự | Chỉ so khóa dòng với saga | "Sao không dùng optimistic locking?" | Thừa nhận báo cáo không so sánh; tự lập luận từ yêu cầu 50 yêu cầu đồng thời, 0% bán vượt (NFR1.2) và chưa có số đo |
| 3 | Thanh toán khi nhận hàng (COD) có điều kiện | Chỉ ghi điều kiện (dưới ngưỡng, chưa từng từ chối nhận); không nêu phương án "không COD" hay "COD không điều kiện" | "Vì sao cho COD?" | Xem Q53; dựa vào ngưỡng 1.000.000đ và lịch sử từ chối nhận hàng |
| 4 | Kiểm duyệt: thủ công + sơ bộ tự động so với tự động hoàn toàn | Chỉ ghi quy trình L1-L4; không so sánh | "Sao không duyệt tự động bằng AI?" | Liên hệ nguyên tắc luật ngưỡng thay AI (M.9, hàng 32) và lập luận "dữ liệu đầu vào do con người xác minh" ở Ch2 |
| 5 | Phương pháp phát triển (Scrum, Kanban...) | Chỉ có MoSCoW và kế hoạch hai giai đoạn theo mốc nộp | "Nhóm làm theo quy trình nào?" | Nêu kế hoạch hai giai đoạn, MoSCoW, quy trình git, CI; không nhận là Scrum nếu không có tài liệu |
| 6 | Lý do chọn GHN hơn GHTK | Ph.I chỉ ghi GHTK "năng lực API tương tự, dùng làm dự phòng" | "Vì sao GHN?" | Dựa vào môi trường thử công khai, webhook (tiêu chí báo cáo ghi); đừng nói GHN rẻ hơn hay nhanh hơn |
| 7 | Lý do chọn VNPay hơn các cổng khác ngoài MoMo, PayOS | Chỉ có ba ứng viên (VNPay, MoMo, PayOS) | "Sao không ZaloPay, Stripe, ShopeePay?" | Thừa nhận chỉ so ba; nêu tiêu chí tích hợp một lần và môi trường thử |
| 8 | BGE-M3 so với các mô hình nhúng khác | Ph.I có ba mô hình (BGE-M3, Multilingual-E5, SBERT tiếng Việt); không có số đo so sánh; lý do ngoài báo cáo: cần xác nhận | "Đã so BGE-M3 với E5 chưa?" | Nêu E5 là đối chứng khi đo nDCG@10 ở Chương 7 (chưa có số đo) |
| 9 | Chọn "hybrid" cho gợi ý nhưng chỉ hiện thực sản phẩm tương tự | Đã ghi hai giai đoạn | "Vậy hybrid có thật không?" | Nói rõ: hybrid là thiết kế, phần chạy là sản phẩm tương tự theo vector (nhóm I, Q74-Q81) |
| 10 | Chọn giữa REST và GraphQL; JWT và phiên | Hợp đồng viết trước bằng OpenAPI (DEC 2026-10-13), phiên ngắn cho nội bộ (NFR3.6); không có so sánh với GraphQL, không có so sánh JWT/phiên | "Vì sao REST?" | Dựa vào hợp đồng OpenAPI sinh kiểu chung cho FE và BE (DEC); thừa nhận không so sánh |
| 11 | k6 so với JMeter; GitHub Actions + SonarQube Cloud so với công cụ khác | DEC (SỬA 2026-09-30) chỉ ghi chốt k6 thay cho cách ghi cũ "k6 hoặc JMeter", không nêu lý do; SonarQube Cloud chọn vì bản miễn phí cho kho riêng tư đến 50 nghìn dòng | "Vì sao k6?" | Thừa nhận không có đối chiếu; nêu tiêu chí chi phí và chạy trong CI |
| 12 | Cách chọn chuyển tách khỏi monolith (microservices) về sau | Có thứ tự tách dự kiến (trang truy xuất QR, thông báo, tìm kiếm) ở DEC và Ch8, nhưng không có ngưỡng đo | "Khi nào tách?" | Dùng thứ tự tách và Q99; thừa nhận không có ngưỡng định lượng |
| 13 | Tại sao dịch vụ AI nhận sự kiện thay vì đọc CSDL | Có ghi: không đọc trực tiếp CSDL, nhận `ProductChanged`, trả `ProductEmbedded`; không so sánh với cách đọc thẳng | "Sao không cho AI đọc thẳng DB?" | Dựa RB2/RB3 (không truy vấn thẳng vào bảng của mô-đun khác) |
| 14 | Lý do con số 15 phút giữ chỗ | Là tham số nạp sẵn (DEC 2026-10-13), không có phân tích phương án | "Sao 15 phút mà không 10 hay 30?" | Xem Q50; không có đối chiếu, nhóm tự lập luận |

**Tổng kết Phần M:** 40 quyết định trong 12 bảng (M.1-M.12), 1 bảng tiêu chí chung (M.13), 14 mục thiếu đối chiếu (M.14). Bốn quyết định (6 PWA/native; 25 thu mua theo lô; 36 kiểm duyệt; 40 phương pháp phát triển) không có phương án thay thế được nêu nên chỉ có hàng mô tả trong M.1-M.12 và nằm chính ở M.14.

---

## Danh sách "cần xác nhận"

- Q40: tách khóa ngoại nội schema và xuyên schema trong 48 khóa ngoại.
- Q50: lý do chọn con số 15 phút (kiểm `DECISIONS.md`).
- Q56: mức 5% GTGT và 1% + 0,5% lấy lại từ `tab:phaply` khi mở PDF.
- Q79, Q90: lý do chọn BGE-M3 và NestJS ngoài những gì báo cáo ghi.
- Q96: phân tách 10 test Playwright theo từng file.
- Q100: tên thành viên và phân công cụ thể (tài liệu chỉ nêu vai trò BE1/BE2/FE).
- Phần M: số mục trong cột "Nguồn" suy từ thứ tự LaTeX; đối chiếu PDF trước khi trích.
- Phần M, hàng 37: DEC 2026-10-13 ghi 38 khóa ngoại cùng schema, báo cáo ghi 48 khóa ngoại (trùng điểm cần xác nhận của Q40).
- Phần M, hàng 5 và 14: lý do chọn hai hệ thiết kế và chi tiết quy trình git lấy từ `DECISIONS.md`/`NOTES.md`, báo cáo LaTeX không nêu; hội đồng ít hỏi nhưng nên biết là nguồn nội bộ.
- Phần M.13: năm tiêu chí lấy đúng từ đầu Ch5 §5.2; bộ tiêu chí đề bài gợi ý (quy mô đồ án, dữ liệu sẵn có, rủi ro pháp lý) không có dạng tiêu chí chung trong báo cáo.
- Q14, Q15: nhãn dư âm trong báo cáo: PL-M dòng FR9 ghi "yêu thích (chỉ thiết kế)", Ch5 §5.3.5 và PL-K (`wishlist_items`, cột `channel` giá trị `push`) cũng ghi "chỉ thiết kế", trong khi Ch4 ghi FR9.2 và Web Push là "Để sau prototype". Nếu bị hỏi, nói theo Ch4.
- Q39, M hàng 38: Hình ERD tổng quan đã là ma trận phụ thuộc 9×7, nhưng văn bản/caption `fig:erd-tong-quan` trong `.tex` vẫn mô tả "đường nối gộp theo cặp"; đối chiếu hình và caption trong PDF.
- Nhãn **[Chưa có mã]** là nhãn riêng của file viva (bán sỉ, thu mua, tồn kho, AI, 2FA, MinIO, FR10.7...), báo cáo không có; đừng nói với hội đồng như nhãn của báo cáo.
- Mọi số mục "Ch4 §4.1.2..." suy từ thứ tự LaTeX, có thể lệch 1 so với PDF.
