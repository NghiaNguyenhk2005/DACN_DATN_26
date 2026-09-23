# 03 — Nghiên cứu sâu: có nên gắn nhật ký canh tác với blockchain?

> File làm việc độc lập, CHƯA merge. Theo quyết định đã chốt: **đào sâu thêm
> lập luận đã có, giữ nguyên kết luận "chưa dùng blockchain ở MVP"**. Mục
> tiêu file này là thay thế/mở rộng đoạn hiện tại ở `subsec:gs1blockchain`
> (hiện chỉ ~1 đoạn, 1 nguồn `bath_blockchain`) bằng lập luận có nhiều nguồn
> hơn, đặc biệt phân tích riêng kịch bản xuất khẩu.

## 1. Lập luận hiện tại trong báo cáo (tóm tắt để đối chiếu)

Đoạn hiện có ở `chuong2-kienthuc-nentang.tex` (`subsec:gs1blockchain`) lập
luận:
1. Blockchain đảm bảo dữ liệu **không sửa được sau khi ghi**, nhưng không xác
   minh được dữ liệu đầu vào có đúng không ("Garbage In, Garbage Out").
2. Nông dân/cơ sở nhỏ vẫn phải nhập liệu thủ công hoặc gắn thẻ RFID/QR —
   gian lận tại nguồn (tráo hàng trước đóng gói) vẫn xảy ra mà blockchain
   không phát hiện được.
3. Kết luận: dùng CSDL tập trung theo chuẩn định danh GS1 khả thi và tiết
   kiệm chi phí hơn ở giai đoạn đầu; blockchain có thể xem xét sau nếu cần
   tăng tin cậy cho đối tác xuất khẩu hoặc khi số bên tham gia độc lập đủ lớn.

**Đây là lập luận đúng hướng nhưng còn mỏng** — chỉ dựa vào 1 nguồn, và câu
"có thể xem xét sau cho xuất khẩu" chưa được phân tích cụ thể. Phần dưới đây
bổ sung case study thực tế + phân tích riêng kịch bản xuất khẩu.

## 2. Case study thực tế bổ sung

### 2.1 Trường hợp thành công có điều kiện — Walmart (leafy greens, IBM Food Trust)
Walmart triển khai blockchain (IBM Food Trust) cho rau lá xanh: thời gian
truy vết nguồn gốc khi có sự cố an toàn thực phẩm giảm từ hơn 6 ngày xuống
còn 2,2 giây. Đây là minh chứng giá trị thật của blockchain — nhưng lưu ý
bối cảnh: Walmart là nhà bán lẻ lớn, có quyền lực áp đặt toàn bộ nhà cung cấp
trong chuỗi phải nhập liệu đúng chuẩn lên cùng một hệ thống — điều kiện tiên
quyết mà một sàn TMĐT mới như Farmery (nhiều nhà bán nhỏ lẻ, không có đòn
bẩy đàm phán) chưa có ở giai đoạn MVP.

### 2.2 Trường hợp gần với bối cảnh Việt Nam — TE-FOOD
TE-FOOD dùng blockchain để xử lý truy xuất cho quy mô lớn (hàng ngày ~18.000
heo, ~200.000 gà), với khách hàng chính tại **Việt Nam** — bối cảnh gian lận
phổ biến ở nhiều khâu (giấy chứng nhận tiêm phòng giả, pha tạp chất). Điểm
mấu chốt được chính nguồn này thừa nhận: **blockchain không giải quyết được
vấn đề "garbage in, garbage out"** — nếu dữ liệu đưa vào vô giá trị, câu
chuyện blockchain kể ra cũng vô giá trị. Đây là bằng chứng trực tiếp, cùng
ngành, cùng thị trường, củng cố thêm cho lập luận đã có trong báo cáo.

### 2.3 So sánh chi phí định lượng — nghiên cứu chuỗi gia cầm Thái Lan (2025)
Nghiên cứu so sánh chi phí hạ tầng CNTT giữa hệ thống tập trung (centralized)
và blockchain cho chuỗi cung ứng gà thịt Thái Lan (Journal of Innovation and
Entrepreneurship, 2025) chỉ ra rào cản chính khi cân nhắc blockchain là chi
phí hạ tầng CNTT cảm nhận cao hơn đáng kể so với hệ thống tập trung đã có —
dù blockchain có ưu điểm minh bạch/tin cậy phân tán. Đây là bằng chứng định
lượng gần đây (2025), khác thời điểm và ngành so với nguồn `bath_blockchain`
gốc, giúp lập luận chi phí không chỉ dựa vào 1 nguồn duy nhất.

### 2.4 Rào cản áp dụng — nghiên cứu chuỗi thực phẩm dễ hư hỏng (2025)
Một nghiên cứu khác (Environment, Development and Sustainability, 2025) xác
định 14 rào cản áp dụng blockchain cho chuỗi cung ứng thực phẩm dễ hư hỏng
(perishable food supply chain — cùng đặc thù "dễ hư hỏng" mà Farmery đang
phục vụ), trong đó 3 rào cản lớn nhất là: lo ngại bảo mật dữ liệu/thiếu
trưởng thành công nghệ, đe dọa quyền riêng tư dữ liệu, và thiếu hạ tầng số —
đúng với đặc điểm nhóm nông dân/HTX Việt Nam đã phân tích ở persona (Ch.3,
"hạn chế kỹ năng số... internet ổn định ở vùng sâu vùng xa").

## 3. Phân tích riêng: kịch bản xuất khẩu có thay đổi kết luận không?

Đây là phần trả lời trực tiếp câu hỏi "đào sâu use case xuất khẩu cụ thể".

### 3.1 Vì sao xuất khẩu là kịch bản có khả năng đổi bài toán nhất
Giá trị lớn nhất của blockchain là khi **nhiều bên độc lập, không tin tưởng
lẫn nhau** cần cùng xác nhận một chuỗi sự kiện mà không có một bên trung
gian đủ uy tín để tất cả cùng tin. Trong kịch bản xuất khẩu (đặc biệt sang
Trung Quốc theo Lệnh 280 GACC, hoặc EU theo General Food Law), các bên gồm:
nhà bán → cơ sở đóng gói (có thể là bên thứ ba) → đơn vị kiểm dịch thực vật
→ hải quan Việt Nam → đơn vị vận chuyển quốc tế → hải quan/GACC nước nhập
khẩu → nhà nhập khẩu nước ngoài. Đây **đúng là mô hình nhiều bên độc lập
xuyên biên giới** mà lý thuyết blockchain thường viện dẫn làm ví dụ lý tưởng
— khác hẳn bối cảnh trong nước hiện tại của Farmery, nơi chỉ có 2 lớp
(nhà bán ↔ Farmery).

### 3.2 Nhưng vẫn chưa đủ để đảo ngược kết luận cho MVP, vì 3 lý do
1. **"Garbage in, garbage out" không biến mất khi thêm actor xuyên biên
   giới** — ngược lại, càng nhiều bên độc lập tham gia nhập liệu ban đầu
   (nhà bán, cơ sở đóng gói) thì rủi ro dữ liệu đầu vào sai/gian lận càng
   cao, trong khi đây chính là khâu yếu nhất theo TE-FOOD (mục 2.2) và theo
   lập luận gốc đã có trong báo cáo.
2. **Nhà nước đã và đang xây chính hệ thống tập trung** (`traceviet.mae.gov.vn`
   /CheckVN, vận hành từ 1/7/2026) làm đầu mối truy xuất quốc gia, đã được
   chia sẻ trực tiếp với GACC để phục vụ phê duyệt mã vùng trồng/cơ sở đóng
   gói. Nói cách khác, **bên trung gian đủ uy tín đã tồn tại** (chính là Nhà
   nước) — làm giảm phần lớn lý do "cần blockchain vì không có bên trung
   gian nào được tin tưởng" trong bối cảnh cụ thể của nông sản Việt Nam xuất
   khẩu, khác với bối cảnh chuỗi cung ứng toàn cầu phi tập trung mà lý thuyết
   blockchain thường giả định.
3. **Chi phí vận hành blockchain tăng dọc theo các tầng chuỗi cung ứng**
   (theo nghiên cứu sữa Ý, Longo et al. 2020) và rào cản hạ tầng số/kỹ năng
   công nghệ (mục 2.4) đúng là điểm yếu nhất của nhóm nông dân/HTX Việt Nam
   — nhóm mà Farmery xác định là đối tượng trung tâm cần giảm rào cản gia
   nhập (Ch.3, mục tiêu MT1-MT2), nên áp thêm blockchain ở giai đoạn MVP đi
   ngược lại chính mục tiêu giảm rào cản đó.

### 3.3 Kết luận giữ nguyên, nhưng làm rõ điều kiện khi nào nên xem xét lại
Giữ nguyên kết luận đã chốt trong báo cáo: **CSDL tập trung theo chuẩn GS1 +
mã số vùng trồng nhà nước là phương án phù hợp cho MVP**, kể cả khi tính đến
kịch bản xuất khẩu — vì Nhà nước đã đứng ra làm vai trò bên trung gian tin
cậy mà lẽ ra blockchain mới cần giải quyết. Điều kiện cụ thể để xem xét lại
trong tương lai (làm rõ hơn câu "có thể xem xét sau" đã có sẵn):
- Khi Farmery mở rộng sang **nhiều đối tác xuất khẩu tại nhiều quốc gia
  khác nhau, mỗi quốc gia có hệ thống truy xuất riêng không liên thông** —
  lúc đó lợi thế "đồng nhất giữa các hệ thống blockchain dễ tích hợp hơn hệ
  thống điện tử truyền thống" (Nofima, 2019) mới thực sự phát huy.
- Khi khối lượng giao dịch xuất khẩu đủ lớn để chi phí hạ tầng blockchain
  (đã biết là tăng theo số tầng chuỗi cung ứng) không còn là rào cản đáng
  kể so với giá trị lô hàng.
- Khi hạ tầng số của nhóm nông dân/HTX đã cải thiện đủ để không còn là điểm
  nghẽn kỹ thuật (liên hệ NFR6, các khó khăn đã nêu ở persona Ch.3).

## 4. Việc cần nhóm xác nhận trước khi merge

1. Bổ sung `references.bib`: case Walmart/IBM Food Trust (techbullion — nên
   tìm thêm 1 nguồn học thuật/báo chí uy tín hơn để thay thế nếu cần), case
   TE-FOOD (decrypt.co — tương tự, có thể cần nguồn chính thống hơn), nghiên
   cứu Thai broiler 2025 (Springer, DOI có sẵn), nghiên cứu roadblocks 2025
   (Springer/UTS repository).
2. Đề xuất thay thế toàn bộ đoạn `subsec:gs1blockchain` hiện tại bằng bản mở
   rộng (giữ nguyên 2 luận điểm gốc + thêm case study + thêm mục 3 phân tích
   xuất khẩu) hay chỉ nối thêm đoạn mới phía sau? Đề xuất cá nhân: viết lại
   liền mạch thành 1 đoạn dài hơn thay vì nối, để dòng lập luận không bị rời
   rạc.
3. Mục 3.2-3.3 hơi dài — khi merge có thể cân nhắc tách bullet theo đúng
   nguyên tắc trình bày đã thống nhất trong `DECISIONS.md` ("tự động tách
   bullet cho nội dung mới").
