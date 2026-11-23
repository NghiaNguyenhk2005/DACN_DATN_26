# -*- coding: utf-8 -*-
# Sinh sơ đồ luồng dữ liệu của ba mô-đun AI (năm bước × ba tính năng) vào tools/design/ai-luong-du-lieu.html.
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
INK = '#16241e'
LINE = '#44524b'
GREY = '#8a948f'
D = '*'      # tiền tố đánh dấu ô chỉ thiết kế

STEPS = [
    ('1. Thu thập', ('#eef4fb', '#1a5fa8')),
    ('2. Tiền xử lý', ('#eaf7ef', '#1f8a4c')),
    ('3. Tính và suy luận', ('#fdf1dc', '#c98a1a')),
    ('4. Phục vụ kết quả', ('#fbe9e9', '#b5372f')),
    ('5. Vòng phản hồi', ('#f1eef8', '#6b4fa0')),
]
ROWS = [
    ('Tìm kiếm ngữ nghĩa', 'FR12.3', [
        'Sản phẩm được duyệt hoặc sửa mô tả (sự kiện ProductChanged); câu truy vấn của khách',
        'Ghép tên, mô tả, danh mục, vùng trồng; chuẩn hóa tiếng Việt, bỏ dấu',
        'BGE-M3 tính vector khi sản phẩm đổi; suy luận trực tuyến khi có truy vấn, hợp nhất với full-text bằng RRF',
        'Danh sách sản phẩm xếp theo điểm hợp nhất, trả cho ô tìm kiếm',
        'Truy vấn không có kết quả, kết quả được nhấp: bổ sung bộ truy vấn đo nDCG@10']),
    ('Sản phẩm tương tự', 'FR12.1', [
        'Mã sản phẩm đang xem; vector sản phẩm dùng chung với tìm kiếm',
        'Lọc sản phẩm còn hàng, bỏ chính sản phẩm đang xem',
        'Láng giềng gần nhất theo cosine; gợi ý theo hành vi người dùng chỉ thiết kế',
        'Tối đa 5 sản phẩm gần nghĩa ở trang chi tiết sản phẩm',
        'Gợi ý được mở: bổ sung tập gán nhãn đo Precision@5']),
    ('Dự báo giá', 'FR12.2', [
        'Chuỗi giá theo tháng của FAOSTAT cho bốn mặt hàng, chạy offline',
        'Nội suy giá trị khuyết, làm mịn đột biến, gắn nhãn theo tháng',
        'SARIMA, Prophet, đối chứng gradient boosting; tính lại theo lô định kỳ',
        D + 'Hiển thị cho nhân viên thu mua khi lập đơn (chỉ thiết kế); bản hiện thực xuất tệp để đo MAPE',
        D + 'Giá thu mua thực tế so với giá dự báo, bổ sung tập đánh giá (chỉ thiết kế)']),
]

LW, CW, GAP = 175, 232, 26
X0, PAD = 24, 24
W = X0 + LW + GAP + 5 * CW + 4 * GAP + PAD
HH, RH, RG = 84, 250, 20
HY = 30
s = Svg(W, 10)

cx = [X0 + LW + GAP + i * (CW + GAP) for i in range(5)]
for i, (name, (fill, stroke)) in enumerate(STEPS):
    s.box(cx[i], HY, CW, HH, [(name, 25, 800, INK, False)], fill=fill, stroke=stroke, sw=2.5)
    if i:
        s.arrow([(cx[i] - GAP + 4, HY + HH / 2), (cx[i] - 4, HY + HH / 2)], color=LINE)

y = HY + HH + 26
for r, (name, code, cells) in enumerate(ROWS):
    s.box(X0, y, LW, RH, [(name, 25, 800, INK, False), (code, 23, 400, '#4d5c55', False)],
          fill='#f6f7f6', stroke='#8a948f', sw=2.5)
    for i, txt in enumerate(cells):
        design = txt.startswith(D)
        txt = txt[1:] if design else txt
        fill, stroke = STEPS[i][1]
        STEP_FILL = STEPS[i][1][0]
        if design:
            s.box(cx[i], y, CW, RH, [(txt, 24, 400, '#6b756f', False)], fill='#f6f7f6', stroke=GREY, sw=2, dash='7 5')
        else:
            s.box(cx[i], y, CW, RH, [(txt, 24, 400, INK, False)], fill='#ffffff', stroke=STEPS[i][1][1], sw=2.2)
        if i:
            s.arrow([(cx[i] - GAP + 4, y + RH / 2), (cx[i] - 4, y + RH / 2)], color=LINE,
                    dash='6 5' if design or cells[i - 1].startswith(D) else None)
    y += RH + RG
y_end = y - RG

# vòng phản hồi quay về bước 1
yb = y_end + 34
s.arrow([(cx[4] + CW / 2, y_end + 4), (cx[4] + CW / 2, yb), (cx[0] + CW / 2, yb), (cx[0] + CW / 2, y_end + 6)],
        color='#6b4fa0', dash='8 6')
s.label((cx[0] + cx[4] + CW) / 2, yb, 'phản ứng của người dùng được ghi lại để bổ sung dữ liệu cho lần tính lại sau', 1100, size=24,
        color='#6b4fa0', bg='#fff', pos='below')
s.h = int(yb + 70)

leg = ('<span><i class="sw" style="background:#fff;border-color:#1a5fa8"></i>Có trong bản hiện thực</span>'
       '<span><i class="sw" style="background:#f6f7f6;border-color:#8a948f;border-style:dashed"></i>Chỉ thiết kế</span>'
       )
io.open(os.path.join(OUT, 'ai-luong-du-lieu.html'), 'w', encoding='utf-8').write(page(
    '', '', s.svg(), leg,
    'Dịch vụ AI chạy tách khỏi máy chủ nghiệp vụ và không đọc cơ sở dữ liệu: nhận dữ liệu qua sự kiện hoặc lời gọi, '
    'trả vector và kết quả để mô-đun nghiệp vụ tự lưu. Khi dịch vụ AI ngừng, tìm kiếm lùi về từ khóa và trang chủ lùi về sản phẩm bán chạy.'))
print('ok')
