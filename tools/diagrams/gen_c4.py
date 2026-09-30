# -*- coding: utf-8 -*-
# Sinh 3 sơ đồ C4 (ngữ cảnh, container, mô-đun) vào tools/design/.
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
W = 1340
WHITE = '#ffffff'
PERSON = ('#1f5f3a', '#12351f')
SYSTEM = ('#1a5fa8', '#0f3d6e')
CONT = ('#dcebf8', '#1a5fa8')
EXT = ('#eceeed', '#5f6b65')
INK = '#16241e'
HOT = '#b8322a'

def person(s, x, y, w, h, name, desc):
    s.box(x, y, w, h, [(name, 26, 700, WHITE, False), ('[Người dùng]', 22, 400, '#cfe6d8', False),
                       (desc, 22, 400, WHITE, False)], fill=PERSON[0], stroke=PERSON[1], rx=28)

def ext(s, x, y, w, h, name, desc):
    s.box(x, y, w, h, [(name, 24, 700, INK, False), ('[Hệ thống ngoài]', 22, 400, '#4d5c55', False),
                       (desc, 22, 400, INK, False)], fill=EXT[0], stroke=EXT[1], dash='9 6')

LEG_BASE = ('<span><i class="sw" style="background:%s;border-color:%s;border-radius:14px"></i>Người dùng</span>' % PERSON +
            '<span><i class="sw" style="background:%s;border-color:%s;border-style:dashed"></i>Hệ thống bên ngoài</span>' % EXT +
            '<span><i class="ln"></i>Quan hệ một chiều: bên gọi → bên được gọi, nhãn ghi mục đích [công nghệ]</span>')

# ======================= MỨC 1: NGỮ CẢNH =======================
s = Svg(W, 1250)
SX, SY, SW_, SH = 560, 150, 320, 520
s.box(SX, SY, SW_, SH, [('Farmery', 32, 800, WHITE, False), ('[Hệ thống phần mềm]', 22, 400, '#d6e6f7', False),
      ('Nền tảng thương mại điện tử nông sản: sàn bán sỉ (3P) và gian hàng bán lẻ của Farmery (1P), truy xuất nguồn gốc theo lô, thu mua và kho', 22, 400, WHITE, False)],
      fill=SYSTEM[0], stroke=SYSTEM[1], rx=16)

persons = [
    ('Nhà cung cấp', 'Nông dân, hợp tác xã', 'Đăng sản phẩm, lô, nhật ký canh tác; báo giá; xác nhận đơn thu mua'),
    ('Khách sỉ', 'Doanh nghiệp thu mua', 'Gửi yêu cầu báo giá, giao kết hợp đồng, nhận hàng theo đợt'),
    ('Khách lẻ', 'Người tiêu dùng', 'Tìm kiếm, đặt hàng, tra cứu truy xuất, đánh giá'),
]
for i, (n, d, lab) in enumerate(persons):
    y = 130 + i * 205
    person(s, 20, y, 270, 160, n, d)
    my = y + 80
    s.arrow([(290, my), (SX, my)])
    s.label(422, my - 60, lab, 236)

# Nhân sự nội bộ
FX, FY, FW, FH = 1050, 30, 272, 780
s.rect(FX - 10, FY, FW + 20, FH, '#eef6f1', PERSON[1], 2, 18, '9 6')
s.text(FX + FW / 2, FY + 34, 'Nhân sự nội bộ', 24, 700, INK)
s.text(FX + FW / 2, FY + 62, '[Người dùng, 7 vai trò]', 22, 400, '#4d5c55')
roles = [('Kiểm duyệt viên', 'staff_moderation'), ('Nhân viên vận hành', 'staff_operations'),
         ('Nhân viên thu mua', 'staff_sourcing'), ('Nhân viên kho', 'staff_warehouse'),
         ('Nhân viên giao hàng', 'staff_delivery'), ('Nhân viên hỗ trợ vùng', 'staff_support'),
         ('Quản trị viên hệ thống', 'platform_owner')]
for i, (n, c) in enumerate(roles):
    y = FY + 84 + i * 97
    s.box(FX, y, FW, 88, [(n, 22, 700, INK, False), (c, 20.5, 400, '#1f5f3a', True)], fill=WHITE, stroke=PERSON[0], rx=20)
s.arrow([(FX - 10, 410), (SX + SW_, 410)])
s.label(962, 330, 'Kiểm duyệt, thu mua, xuất nhập kho, phân xử, cấu hình', 150)

exts = [
    ('Cổng thanh toán', 'Thanh toán, tạm giữ tiền (ký quỹ)', 'Thanh toán, tạm giữ và giải ngân [HTTPS]'),
    ('Đơn vị vận chuyển (3PL)', 'Giao hàng chặng dài', 'Tạo vận đơn, nhận trạng thái [HTTPS]'),
    ('TraceViet', 'Hệ thống truy xuất quốc gia (Bộ NN&MT)', 'Đẩy dữ liệu lô, nhận mã truy xuất [XML ký số]'),
    ('Tổ chức chứng thực chữ ký số', 'Ký số hợp đồng sỉ', 'Ký số hợp đồng tùy chọn [HTTPS]'),
    ('Dịch vụ SMS / Email', 'Gửi tin nhắn và thư', 'Gửi OTP và thông báo [HTTPS]'),
    ('Google / Facebook', 'Nhà cung cấp danh tính', 'Xác thực đăng nhập [OAuth 2.0]'),
]
bw, gap = 200, 16
for i, (n, d, lab) in enumerate(exts):
    x = 30 + i * (bw + gap)
    cx = x + bw / 2
    ext(s, x, 1000, bw, 230, n, d)
    sx = SX + 30 + i * (SW_ - 60) / 5
    s.arrow([(sx, SY + SH), (cx, 1000)], dash='10 7')
    s.label(cx, 905, lab, bw - 4)
leg = ('<span><i class="sw" style="background:%s;border-color:%s"></i>Hệ thống đang thiết kế</span>' % SYSTEM) + LEG_BASE + \
      '<span><i class="ln" style="border-top-style:dashed"></i>Lời gọi ra hệ thống bên ngoài</span>'
io.open(os.path.join(OUT, 'c4-ngu-canh.html'), 'w', encoding='utf-8').write(page(
    '',
    'Farmery ở giữa; người dùng bên ngoài ở trái, nhân sự nội bộ ở phải, sáu hệ thống bên ngoài ở dưới. Sơ đồ không đi vào công nghệ bên trong hệ thống.',
    s.svg(), leg))

# ======================= MỨC 2: CONTAINER =======================
s = Svg(W, 1330)
person(s, 20, 10, 400, 130, 'Người dùng bên ngoài', 'Nhà cung cấp, khách sỉ, khách lẻ')
person(s, 450, 10, 400, 130, 'Nhân sự nội bộ', 'Bảy vai trò')
BX, BY, BW, BH = 10, 200, 920, 1110
s.rect(BX, BY, BW, BH, 'none', SYSTEM[1], 2.5, 18, '12 8')
s.text(BX + 20, BY + BH - 18, 'Hệ thống Farmery  [ranh giới hệ thống]', 24, 700, SYSTEM[1], 'start')

def cont(x, y, w, h, name, tech, desc, hot=False):
    s.box(x, y, w, h, [(name, 24, 700, INK, False), ('[Container: %s]' % tech, 22, 400, '#1a4f86', False),
                       (desc, 22, 400, INK, False)], fill=CONT[0], stroke=HOT if hot else CONT[1], sw=3 if hot else 2)

cont(40, 300, 860, 150, 'Ứng dụng web cài đặt được (PWA)', 'Next.js',
     'Giao diện mua hàng, nhà cung cấp, nội bộ; trang truy xuất công khai được cache; service worker cho thông báo đẩy và thao tác ngoại tuyến')
s.arrow([(220, 140), (220, 300)]); s.label(220, 170, 'Dùng qua trình duyệt [HTTPS]', 360)
s.arrow([(650, 140), (650, 300)]); s.label(650, 170, 'Dùng qua trình duyệt [HTTPS]', 360)
cont(40, 560, 860, 200, 'Ứng dụng lõi (modular monolith)', 'NestJS',
     'API REST, xác thực và phân quyền theo vai trò; 12 mô-đun nghiệp vụ, mỗi mô-đun một schema dữ liệu (xem hình mô-đun)', hot=True)
s.arrow([(470, 450), (470, 560)]); s.label(470, 505, 'Gọi API [JSON/HTTPS]', 250)

row = [('PostgreSQL', 'PostgreSQL, pgvector', 'Dữ liệu nghiệp vụ, 12 schema; vector nhúng'),
       ('Lưu trữ tệp', 'MinIO, chuẩn S3', 'Ảnh sản phẩm, chứng nhận, hợp đồng'),
       ('Cache và hàng đợi', 'Redis', 'Cache đọc nhiều; hàng đợi sự kiện và tác vụ nền'),
       ('Dịch vụ AI', 'Python', 'Tìm kiếm ngữ nghĩa, gợi ý sản phẩm, dự báo giá')]
labs = ['Đọc/ghi, khóa dòng tồn [SQL]', 'Lưu, lấy tệp [S3 API]', 'Cache; phát sự kiện', 'Tạo vector, lấy gợi ý [HTTP nội bộ]']
cw, cg = 200, 20
for i, (n, t, d) in enumerate(row):
    x = 40 + i * (cw + cg)
    cont(x, 930, cw, 270, n, t, d)
    s.arrow([(x + cw / 2, 760), (x + cw / 2, 930)])
    s.label(x + cw / 2, 845, labs[i], cw)
# AI đọc sự kiện từ Redis
ax = 40 + 3 * (cw + cg)
rx_ = ax - cg - cw / 2
s.arrow([(ax + 60, 1200), (ax + 60, 1240), (rx_, 1240), (rx_, 1200)])
s.label((ax + 60 + rx_) / 2, 1272, 'Đọc sự kiện hành vi [hàng đợi]', 300)

# Hệ thống ngoài: cột phải, nối qua một trục
names = [('Cổng thanh toán', 'Thanh toán, ký quỹ [HTTPS]'), ('Đơn vị vận chuyển (3PL)', 'Vận đơn, trạng thái giao [HTTPS]'),
         ('TraceViet', 'Đồng bộ lô, mã truy xuất [XML ký số]'), ('Tổ chức chứng thực chữ ký số', 'Ký số hợp đồng [HTTPS]'),
         ('Dịch vụ SMS / Email', 'OTP, thông báo [HTTPS]'), ('Google / Facebook', 'Đăng nhập [OAuth 2.0]')]
ey, eh, eg = 205, 160, 25
BUSX = 965
for i, (n, d) in enumerate(names):
    y = ey + i * (eh + eg)
    ext(s, 1000, y, 330, eh, n, d)
    s.arrow([(BUSX, y + eh / 2), (1000, y + eh / 2)], dash='10 7')
s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="#44524b" stroke-width="2.4" stroke-dasharray="10 7"/>'
      % (BUSX, ey + eh / 2, BUSX, ey + 5 * (eh + eg) + eh / 2))
s.arrow([(900, 660), (BUSX, 660)], dash='10 7', head=False)
leg = ('<span><i class="sw" style="background:%s;border-color:%s"></i>Container của Farmery</span>' % CONT) + \
      ('<span><i class="sw" style="background:%s;border-color:%s;border-width:3px"></i>Khối chứa lõi nghiệp vụ</span>' % (CONT[0], HOT)) + LEG_BASE + \
      '<span><i class="ln" style="border-top-style:dashed"></i>Ứng dụng lõi gọi API hệ thống bên ngoài (mục đích và công nghệ ghi trong từng khối)</span>'
io.open(os.path.join(OUT, 'c4-container.html'), 'w', encoding='utf-8').write(page(
    '',
    'Phóng to khối Farmery của sơ đồ ngữ cảnh: các thành phần chạy độc lập và công nghệ của từng thành phần. Ứng dụng lõi là một modular monolith; chỉ dịch vụ AI được tách riêng.',
    s.svg(), leg))

# ======================= MỨC 3: MÔ-ĐUN (COMPONENT) =======================
s = Svg(W, 1545)
COLX = [30, 355, 680, 1005]; CWD = 305
BLK = {'chung': ('#eaf7ef', '#1f8a4c'), 'cung': ('#eef4fb', '#1a5fa8'), 'gd': ('#fdf1dc', '#c98a1a'),
       'sau': ('#fbe9e9', '#c23b3b'), 'vh': ('#f1eef8', '#6b4fa0')}

def frame(c0, c1, y, h, title, key):
    x = COLX[c0] - 8; w = COLX[c1] + CWD + 8 - x
    s.rect(x, y, w, h, BLK[key][0], BLK[key][1], 2.5, 16, '10 7')
    s.text(x + 16, y + 32, title, 26, 800, BLK[key][1], 'start')

def mod(c, y, name, schema, fr, resp, calls, key, h=272):
    lines = [(name, 24, 700, INK, False), ('[Mô-đun] %s' % fr, 22, 400, '#4d5c55', False), ('schema ' + schema, 22, 400, '#4d5c55', True),
             (resp, 22, 400, INK, False)]
    if calls:
        lines.append((calls, 22, 400, BLK[key][1], False))
    s.box(COLX[c], y, CWD, h, lines, fill=WHITE, stroke=BLK[key][1])

s.box(30, 10, 1280, 80, [('Lớp API — bộ điều khiển REST, xác thực và phân quyền theo vai trò [NestJS]; nhận yêu cầu từ ứng dụng web PWA', 22, 600, INK, False)],
      fill=CONT[0], stroke=CONT[1])

R1, R2, R3 = 120, 566, 938
frame(0, 2, R1, 336, 'Nguồn cung', 'cung'); frame(3, 3, R1, 336, 'Vận hành', 'vh')
frame(0, 3, R2, 336, 'Giao dịch', 'gd')
frame(0, 1, R3, 336, 'Nền tảng chung', 'chung'); frame(2, 3, R3, 336, 'Sau bán', 'sau')
b1, b2, b3 = R1 + 48, R2 + 48, R3 + 48
mod(0, b1, 'Nhà cung cấp và chứng nhận', 'supplier', 'FR2, FR3', 'Hồ sơ gian hàng, chứng nhận và hạn hiệu lực', '', 'cung')
mod(1, b1, 'Sản phẩm, lô và truy xuất', 'catalog', 'FR4', 'Sản phẩm, lô, nhật ký canh tác, mã QR, tìm kiếm', 'Gọi: Nhà cung cấp, Dịch vụ AI; ngoài: TraceViet', 'cung')
mod(2, b1, 'Tồn kho', 'inventory', 'FR13.3–13.6', 'Dòng tồn, sổ nhập xuất, sơ chế đóng gói, thu hồi lô', 'Gọi: Sản phẩm, lô', 'cung')
mod(3, b1, 'Vận hành và quản trị', 'operations', 'FR10', 'Kiểm duyệt, vi phạm, báo cáo, cấu hình, nhật ký thao tác', 'Gọi: các mô-đun khác', 'vh')
mod(0, b2, 'Thu mua', 'procurement', 'FR13.1–13.2, 13.7', 'Chào hàng, đơn thu mua, nghiệm thu, chào sỉ tồn dư', 'Gọi: Tồn kho, Thanh toán', 'gd')
mod(1, b2, 'Bán lẻ', 'retail', 'FR5', 'Giỏ hàng, đơn bán lẻ, mã giảm giá', 'Gọi: Tồn kho, Thanh toán, Vận chuyển', 'gd')
mod(2, b2, 'Bán sỉ', 'wholesale', 'FR6', 'Báo giá, hợp đồng, đợt giao', 'Gọi: Tồn kho, Thanh toán, Vận chuyển; ngoài: ký số', 'gd')
mod(3, b2, 'Thanh toán', 'payment', 'FR7', 'Thanh toán, ký quỹ, hóa đơn điện tử', 'Ngoài: cổng thanh toán', 'gd')
mod(0, b3, 'Tài khoản và phân quyền', 'identity', 'FR1', 'Đăng ký, OTP, eKYC, vai trò, sổ địa chỉ', 'Ngoài: SMS/Email, Google/Facebook', 'chung')
mod(1, b3, 'Thông báo', 'notification', 'FR11', 'Thông báo web, đẩy, email, SMS', 'Ngoài: SMS/Email', 'chung')
mod(2, b3, 'Vận chuyển và khiếu nại', 'fulfillment', 'FR8', 'Vận đơn, giao chặng ngắn, khiếu nại', 'Ngoài: 3PL', 'sau')
mod(3, b3, 'Đánh giá và uy tín', 'engagement', 'FR9, FR5.5', 'Đánh giá, điểm uy tín, tin nhắn, theo dõi', 'Gọi: Bán lẻ, Bán sỉ', 'sau')

# Điểm khóa dòng tồn: ba luồng cùng đi vào mô-đun Tồn kho
cx = [c + CWD / 2 for c in COLX]
yl = R1 + 336 + 30
s.arrow([(cx[0], b2), (cx[0], yl), (cx[2], yl), (cx[2], b1 + 272)], color=HOT, sw=3.4)
s.arrow([(cx[1], b2), (cx[1], yl)], color=HOT, sw=3.4, head=False)
s.arrow([(cx[2], b2), (cx[2], yl)], color=HOT, sw=3.4, head=False)
s.label(1085, yl + 50, 'Giữ chỗ, trừ tồn, chuyển lượng: khóa dòng tồn trong cùng một giao dịch', 440, color=HOT)

# Tầng dưới: PostgreSQL, hàng đợi sự kiện, dịch vụ AI trên một hàng
yb = R3 + 336 + 92
s.box(30, yb, 400, 150, [('PostgreSQL', 24, 700, INK, False), ('[Container] 12 schema trùng tên mô-đun; không JOIN xuyên schema (RB3)', 22, 400, INK, False)], fill=CONT[0], stroke=CONT[1])
s.box(460, yb, 400, 150, [('Hàng đợi sự kiện', 24, 700, INK, False), ('[Container: Redis] mọi mô-đun phát sự kiện nghiệp vụ vào đây', 22, 400, INK, False)], fill=CONT[0], stroke=CONT[1])
s.box(890, yb, 420, 150, [('Dịch vụ AI', 24, 700, INK, False), ('[Container: Python] đọc sự kiện hành vi; tìm kiếm ngữ nghĩa, gợi ý, dự báo giá (FR12)', 22, 400, INK, False)], fill=CONT[0], stroke=CONT[1])
s.arrow([(890, yb + 75), (860, yb + 75)])
s.arrow([(cx[0], b3 + 272), (cx[0], yb)]); s.label(cx[0] + 150, (b3 + 272 + yb) / 2, 'Đọc/ghi schema riêng [SQL]', 290)
s.arrow([(cx[1], b3 + 272), (cx[1], yb)]); s.label(cx[1] + 100, (b3 + 272 + yb) / 2, 'Đọc sự kiện', 160)
s.arrow([(cx[3], b3 + 272), (cx[3], b3 + 330), (820, b3 + 330), (820, yb)])
s.label(1000, b3 + 330 - 24, 'Phát sự kiện', 170)

leg = ''.join('<span><i class="sw" style="background:%s;border-color:%s;border-style:dashed"></i>%s</span>' % (BLK[k][0], BLK[k][1], t)
              for k, t in [('cung', 'Nguồn cung'), ('gd', 'Giao dịch'), ('sau', 'Sau bán'), ('chung', 'Nền tảng chung'), ('vh', 'Vận hành')]) +       ('<span><i class="sw" style="background:%s;border-color:%s"></i>Container</span>' % CONT) +       ('<span><i class="ln" style="border-top-color:%s;border-top-width:4px"></i>Điểm khóa dòng tồn</span>' % HOT) +       '<span><i class="ln"></i>Quan hệ một chiều, nhãn ghi mục đích</span>'
io.open(os.path.join(OUT, 'c4-module.html'), 'w', encoding='utf-8').write(page(
    '',
    'Phóng to khối Ứng dụng lõi: 12 mô-đun chia theo miền nghiệp vụ (RB1), gom theo 5 khối chức năng. Mỗi mô-đun sở hữu một schema; mô-đun gọi nhau qua giao diện công khai (RB2).',
    s.svg(), leg, 'Dòng "Gọi" trong mỗi mô-đun liệt kê các phụ thuộc chính; "ngoài" là hệ thống bên ngoài mà mô-đun đó gọi tới.'))
print('ok')
