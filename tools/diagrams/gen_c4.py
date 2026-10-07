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
EXT = ('#e4e7e5', '#3d4a43')        # hệ thống ngoài có trong bản hiện thực
DES = ('#f6f7f6', '#9aa39e')        # hệ thống ngoài chỉ thiết kế
INK = '#16241e'
MUTED = '#4d5c55'
GREY = '#7d8882'
HOT = '#b8322a'
ARR = '#44524b'

# (tên, mô tả/công nghệ, chỉ thiết kế?, hai chiều?)
EXTS = [
    ('Cổng thanh toán', 'VNPay, môi trường thử nghiệm', False, True),
    ('Đơn vị vận chuyển nội thành', 'GHN, môi trường thử nghiệm', False, True),
    ('Dịch vụ hóa đơn điện tử', 'Bản hiện thực: giả lập', False, True),
    ('Dịch vụ email', 'SMTP', False, False),
    ('Dịch vụ đẩy của trình duyệt', 'Web Push, chuẩn VAPID', False, False),
    ('Dịch vụ SMS', 'OTP, thông báo qua tin nhắn', True, False),
    ('TraceViet', 'Truy xuất nguồn gốc quốc gia (Bộ NN&MT)', True, True),
    ('Tổ chức chứng thực chữ ký số', 'Ký số hợp đồng sỉ', True, True),
    ('Google', 'Đăng nhập OAuth 2.0', True, True),
    ('Facebook', 'Đăng nhập OAuth 2.0', True, True),
]

SHORT = ['Cổng thanh toán', 'Vận chuyển nội thành', 'Hóa đơn điện tử', 'Email', 'Web Push',
         'SMS', 'TraceViet', 'Chữ ký số', 'Google', 'Facebook']


def person(s, x, y, w, h, name, desc, size=26):
    s.box(x, y, w, h, [(name, size, 700, WHITE, False), (desc, 22, 400, '#e3f1e8', False)],
          fill=PERSON[0], stroke=PERSON[1], rx=26)


def ext(s, x, y, w, h, name, desc, design, name_size=24, tag=True):
    lines = [(name, name_size, 700, GREY if design else INK, False)]
    if tag:
        lines.append(('[Chỉ thiết kế]' if design else '[Hệ thống ngoài]', 22, 400, GREY if design else MUTED, False))
    if desc:
        lines.append((desc, 22, 400, GREY if design else INK, False))
    c = DES if design else EXT
    s.box(x, y, w, h, lines, fill=c[0], stroke=c[1], dash='9 6' if design else None)


def link(s, pts, design=False, both=True, color=ARR, sw=2.4):
    s.arrow(pts, color=GREY if design else color, dash='10 7' if design else None, both=both, sw=sw)


def icon(both=False, dash=False, color=ARR, w=3):
    d = ' stroke-dasharray="7 5"' if dash else ''
    head = '<path d="M%s,1 L%s,7 L%s,13 z" fill="%s"/>'
    out = '<svg width="58" height="14" viewBox="0 0 58 14"><line x1="%d" y1="7" x2="46" y2="7" stroke="%s" stroke-width="%d"%s/>' % (12 if both else 2, color, w, d)
    out += head % (44, 57, 44, color)
    if both:
        out += head % (14, 1, 14, color)
    return out + '</svg>'


LEG_ARROWS = ('<span>%sMột chiều: chỉ gửi đi</span>' % icon() +
              '<span>%sHai chiều: có dữ liệu trả về, nhãn ghi "phần gửi; phần nhận về" theo bên gọi</span>' % icon(both=True) +
              '<span>%sTới hệ thống chỉ thiết kế</span>' % icon(both=True, dash=True, color=GREY))
LEG_EXT = ('<span><i class="sw" style="background:%s;border-color:%s"></i>Hệ thống ngoài có trong bản hiện thực</span>' % EXT +
           '<span><i class="sw" style="background:%s;border-color:%s;border-style:dashed"></i>Hệ thống ngoài chỉ thiết kế</span>' % DES)
LEG_PERSON = '<span><i class="sw" style="background:%s;border-color:%s;border-radius:14px"></i>Người dùng</span>' % PERSON

# ======================= MỨC 1: NGỮ CẢNH =======================
s = Svg(W, 1290)
SX, SY, SW_, SH = 560, 360, 260, 580
s.box(SX, SY, SW_, SH, [('Farmery', 32, 800, WHITE, False), ('[Hệ thống phần mềm]', 22, 400, '#d6e6f7', False),
      ('Ứng dụng mua hàng và ứng dụng nội bộ trên một API: bán lẻ 1P, sàn sỉ 3P, thu mua, kho, giao hàng, truy xuất nguồn gốc theo lô', 22, 400, WHITE, False)],
      fill=SYSTEM[0], stroke=SYSTEM[1], rx=16)

persons = [
    ('Khách vãng lai', 'Chưa đăng nhập', 'Tìm kiếm, quét QR; nhận kết quả, trang truy xuất'),
    ('Khách lẻ', 'Người tiêu dùng TP.HCM', 'Gửi đơn, đổi trả, đánh giá; nhận trạng thái đơn, hóa đơn'),
    ('Khách sỉ', 'Doanh nghiệp thu mua', 'Gửi RFQ, xác nhận hợp đồng; nhận báo giá, hợp đồng'),
    ('Nhà cung cấp', 'Nông dân, hợp tác xã', 'Gửi sản phẩm, lô, nhật ký, chào hàng; nhận đơn thu mua, đối soát'),
]
for i, (n, d, lab) in enumerate(persons):
    y = SY + i * 151
    person(s, 10, y, 250, 125, n, d)
    my = y + 62
    link(s, [(260, my), (SX, my)])
    s.label(410, my, lab, 226)

# Nhân sự nội bộ: một khung, mũi tên xuất phát từ biên khung
FX, FY, FW, FH = 1065, SY, 265, SH
s.rect(FX, FY, FW, FH, '#eef6f1', PERSON[1], 2.5, 18, '9 6')
s.text(FX + FW / 2, FY + 34, 'Nhân sự nội bộ', 26, 700, INK)
s.text(FX + FW / 2, FY + 64, '[Ứng dụng nội bộ, 2FA]', 22, 400, MUTED)
roles = [('Kiểm duyệt viên', 'staff_moderation'), ('Nhân viên vận hành', 'staff_operations'),
         ('Nhân viên thu mua', 'staff_sourcing'), ('Nhân viên kho', 'staff_warehouse'),
         ('Hỗ trợ vùng', 'staff_support'), ('Quản trị viên', 'platform_owner')]
for i, (n, c) in enumerate(roles):
    y = FY + 86 + i * 81
    s.box(FX + 10, y, FW - 20, 74, [(n, 22, 700, INK, False), (c, 22, 400, '#1f5f3a', True)], fill=WHITE, stroke=PERSON[0], rx=18, pad=8)
link(s, [(FX, SY + SH / 2), (SX + SW_, SY + SH / 2)])
s.label((FX + SX + SW_) / 2, SY + SH / 2, 'Duyệt, lập đơn thu mua, nghiệm thu, lập chuyến, xử lý khiếu nại, cấu hình; nhận hàng đợi việc, báo cáo', 200)

bw, gap = 248, 20
labs = ['Gửi lệnh thanh toán, hoàn tiền; nhận kết quả qua webhook',
        'Tạo vận đơn chặng cuối; nhận trạng thái qua webhook',
        'Gửi dữ liệu hóa đơn; nhận số hóa đơn, mã tra cứu',
        'Gửi mã OTP, thư thông báo', 'Gửi thông báo đẩy',
        'Gửi OTP, thông báo', 'Gửi dữ liệu lô; nhận mã truy xuất',
        'Gửi hợp đồng; nhận bản ký số', 'Xác thực đăng nhập; nhận định danh', 'Xác thực đăng nhập; nhận định danh']
for i, (n, d, des, two) in enumerate(EXTS):
    col = i % 5
    x = 10 + col * (bw + gap)
    cx = x + bw / 2
    sx = SX + 30 + col * (SW_ - 60) / 4
    t = 0.36
    if not des:
        ext(s, x, 10, bw, 160, n, d, des)
        link(s, [(sx, SY), (cx, 170)], both=two)
        s.label(cx + t * (sx - cx), 170 + t * (SY - 170), labs[i], 182)
    else:
        ext(s, x, 1120, bw, 160, n, d, des)
        link(s, [(sx, SY + SH), (cx, 1120)], design=True, both=two)
        s.label(cx + t * (sx - cx), 1120 - t * (1120 - SY - SH), labs[i], 182, color=GREY)

leg = ('<span><i class="sw" style="background:%s;border-color:%s"></i>Hệ thống đang thiết kế</span>' % SYSTEM) + LEG_PERSON + LEG_EXT + LEG_ARROWS
io.open(os.path.join(OUT, 'c4-ngu-canh.html'), 'w', encoding='utf-8').write(page(
    '', '', s.svg(), leg,
    'Nhãn mũi tên của người dùng viết theo góc nhìn người dùng; nhãn mũi tên tới hệ thống ngoài viết theo góc nhìn Farmery.'))

# ======================= MỨC 2: CONTAINER =======================
RHT = 186
s = Svg(W, 6 * RHT + 300 + 80)
BX, BY, BW, BH = 180, 10, 715, 6 * RHT + 300 + 60
s.rect(BX, BY, BW, BH, 'none', SYSTEM[1], 2.5, 18, '12 8')
s.text(BX + 20, BY + 34, 'Hệ thống Farmery  [ranh giới hệ thống]', 24, 700, SYSTEM[1], 'start')

def cont(x, y, w, h, name, tech, desc, hot=False, extra=None):
    lines = [(name, 24, 700, INK, False), ('[Container: %s]' % tech, 22, 400, '#1a4f86', False), (desc, 22, 400, INK, False)]
    if extra:
        lines += extra
    s.box(x, y, w, h, lines, fill=CONT[0], stroke=HOT if hot else CONT[1], sw=3 if hot else 2,
          valign='top' if extra else 'middle')

LX, LW = 200, 290          # cột container bên trái
CX, CW_ = 625, 250         # ứng dụng lõi
rows = {}
y = 60
for key, h, gap_after in [('app', RHT, 70), ('minio', RHT, 70), ('staff', RHT, 40), ('pg', RHT, 40), ('redis', RHT, 80), ('ai', RHT, 0)]:
    rows[key] = (y, h)
    y += h + gap_after
CY0, CY1 = rows['app'][0], rows['ai'][0] + rows['ai'][1]

cont(LX, rows['app'][0], LW, RHT, 'Ứng dụng mua hàng', 'Next.js, PWA', 'Người dùng bên ngoài; trang truy xuất dựng phía máy chủ')
cont(LX, rows['minio'][0], LW, RHT, 'Lưu trữ tệp', 'MinIO, chuẩn S3', 'Ảnh công khai; giấy tờ riêng tư mã hóa')
cont(LX, rows['staff'][0], LW, RHT, 'Ứng dụng nội bộ', 'React, Vite, Refine', 'Sáu vai trò nội bộ; 2FA, phiên ngắn')
cont(LX, rows['pg'][0], LW, RHT, 'Cơ sở dữ liệu', 'PostgreSQL, pgvector', '13 schema theo mô-đun; vector sản phẩm')
cont(LX, rows['redis'][0], LW, RHT, 'Sự kiện và cache', 'Redis', 'Hàng đợi sự kiện, tác vụ nền, cache')
cont(LX, rows['ai'][0], LW, RHT, 'Dịch vụ AI', 'Python, FastAPI', 'Tìm kiếm ngữ nghĩa, sản phẩm tương tự, dự báo giá')

blocks = [('Nền tảng chung:', 'identity, notification, media'), ('Nguồn cung:', 'supplier, catalog, inventory'),
          ('Giao dịch:', 'procurement, retail, wholesale, payment'), ('Sau bán:', 'fulfillment, engagement'),
          ('Vận hành:', 'operations')]
extra = [('', 8, 400, INK, False), ('13 mô-đun, 5 khối (mức 3):', 22, 700, INK, False)]
for b, m in blocks:
    extra += [(b, 22, 700, '#1a4f86', False), (m, 22, 400, INK, True)]
cont(CX, CY0, CW_, CY1 - CY0, 'Ứng dụng lõi (modular monolith)', 'NestJS',
     'API REST: /api cho ứng dụng mua hàng, /staff cho ứng dụng nội bộ; nhận webhook của cổng thanh toán và 3PL', hot=True, extra=extra)

# Người dùng (ngoài ranh giới) -> hai ứng dụng
for key, name, desc in [('app', 'Người dùng bên ngoài', 'Vãng lai, khách lẻ, khách sỉ, nhà cung cấp'),
                        ('staff', 'Nhân sự nội bộ', 'Sáu vai trò')]:
    y0, h = rows[key]
    person(s, 10, y0 - 30, 128, h + 60, name, desc, size=22)
    link(s, [(138, y0 + h / 2), (LX, y0 + h / 2)])

# Hai ứng dụng tải tệp thẳng lên MinIO
mx = LX + LW / 2
link(s, [(mx, rows['app'][0] + RHT), (mx, rows['minio'][0])], both=False)
s.label(mx + 108, rows['app'][0] + RHT + 35, 'Tải tệp [URL ký trước]', 200)
link(s, [(mx, rows['staff'][0]), (mx, rows['minio'][0] + RHT)], both=False)
s.label(mx + 108, rows['staff'][0] - 35, 'Tải tệp [URL ký trước]', 200)
# Redis <-> dịch vụ AI
link(s, [(mx, rows['redis'][0] + RHT), (mx, rows['ai'][0])])
s.label(mx + 108, rows['ai'][0] - 40, 'ProductChanged; vector', 200)

# Container bên trái <-> ứng dụng lõi, nhãn đặt trên đường
labs = {'app': 'Gọi /api; nhận JSON [HTTPS]', 'minio': 'Cấp URL ký trước; xác nhận tệp, sinh WebP',
        'staff': 'Gọi /staff; nhận JSON [HTTPS]', 'pg': 'Đọc/ghi, khóa dòng tồn [SQL]',
        'redis': 'Phát sự kiện; nhận sự kiện, cache', 'ai': 'Truy vấn, chuỗi giá; vector, dự báo'}
for key, (y0, h) in rows.items():
    yy = y0 + h / 2 + 30
    link(s, [(CX, yy), (LX + LW, yy)], both=True)
    s.label((CX + LX + LW) / 2, yy, labs[key], 128, pos='above')

# Hệ thống ngoài: mỗi hệ thống một khung, một mũi tên riêng
ex_labs = ['Lệnh thanh toán; webhook kết quả', 'Vận đơn; webhook trạng thái', 'Dữ liệu hóa đơn; số HĐ, mã tra cứu',
           'Thư, OTP [SMTP]', 'Thông báo đẩy', 'OTP, thông báo', 'Dữ liệu lô; mã truy xuất',
           'Hợp đồng; bản ký số', 'Đăng nhập; định danh', 'Đăng nhập; định danh']
n = len(EXTS)
eh = 100
eg = (CY1 - CY0 - n * eh) / (n - 1)
for i, (nm, d, des, two) in enumerate(EXTS):
    y0 = CY0 + i * (eh + eg)
    ext(s, 1110, y0, 220, eh, SHORT[i], '', des, name_size=22)
    yy = y0 + eh / 2 + 18
    link(s, [(CX + CW_, yy), (1110, yy)], design=des, both=two)
    s.label(992, yy, ex_labs[i], 200, color=GREY if des else '#33413a', pos='above')

leg = ('<span><i class="sw" style="background:%s;border-color:%s"></i>Container của Farmery</span>' % CONT) + \
      ('<span><i class="sw" style="background:%s;border-color:%s;border-width:3px"></i>Khối chứa lõi nghiệp vụ</span>' % (CONT[0], HOT)) + \
      LEG_PERSON + LEG_EXT + LEG_ARROWS
io.open(os.path.join(OUT, 'c4-container.html'), 'w', encoding='utf-8').write(page(
    '', '', s.svg(), leg,
    'Người dùng truy cập hai ứng dụng qua trình duyệt [HTTPS]. Tệp đi thẳng từ trình duyệt lên kho tệp, không qua ứng dụng lõi; chỉ dịch vụ AI tách khỏi ứng dụng lõi.'))

# ======================= MỨC 3: MÔ-ĐUN (COMPONENT) =======================
COLX = [232, 458, 684, 910]; CWD = 196
BLK = {'chung': ('#eaf7ef', '#1f8a4c'), 'cung': ('#eef4fb', '#1a5fa8'), 'gd': ('#fdf1dc', '#c98a1a'),
       'sau': ('#fbe9e9', '#c23b3b'), 'vh': ('#f1eef8', '#6b4fa0')}
MH = 176
R = {1: 226}
R[2] = R[1] + MH + 140
R[3] = R[2] + MH + 185
R[4] = R[3] + MH + 70
RH = {1: MH, 2: MH, 3: MH, 4: 200}
MF_BOT = R[4] + RH[4] + 30            # đáy khung 13 mô-đun
CF_BOT = MF_BOT + 16                  # đáy ranh giới ứng dụng lõi
YB = CF_BOT + 60                      # hàng container phía dưới
s = Svg(W, YB + 104)

s.rect(200, 10, 944, CF_BOT - 10, 'none', HOT, 2.5, 18, '12 8')
s.text(218, 42, 'Ứng dụng lõi  [Container: NestJS]', 24, 700, HOT, 'start')
s.box(COLX[0], 54, COLX[3] + CWD - COLX[0], 76,
      [('Lớp API: /api (ứng dụng mua hàng), /staff (ứng dụng nội bộ, 2FA), webhook; guard theo vai trò', 22, 600, INK, False)],
      fill=CONT[0], stroke=CONT[1])
MFX, MFY = 214, 156
s.rect(MFX, MFY, 916, MF_BOT - MFY, 'none', MUTED, 2, 14, '6 6')
s.text(MFX + 916 - 16, MF_BOT - 16, '13 mô-đun nghiệp vụ', 22, 700, MUTED, 'end')
link(s, [(COLX[1] + CWD / 2, 130), (COLX[1] + CWD / 2, MFY)], both=False)
s.label(COLX[1] + CWD / 2 + 140, 143, 'Định tuyến tới mô-đun', 250)

def frame(c0, c1, row, title, key):
    x = COLX[c0] - 10; w = COLX[c1] + CWD + 10 - x
    y = R[row] - 44
    s.rect(x, y, w, RH[row] + 56, BLK[key][0], BLK[key][1], 2.5, 14, '10 7')
    s.text(x + 14, y + 30, title, 24, 800, BLK[key][1], 'start')

def mod(c, row, name, schema, fr, resp, key):
    s.box(COLX[c], R[row], CWD, RH[row],
          [(name, 23, 700, INK, False), (schema, 22, 400, BLK[key][1], True), (fr, 22, 400, MUTED, False), (resp, 22, 400, INK, False)],
          fill=WHITE, stroke=BLK[key][1], pad=10)

frame(0, 2, 1, 'Nguồn cung', 'cung'); frame(3, 3, 1, 'Vận hành', 'vh')
frame(0, 3, 2, 'Giao dịch', 'gd')
frame(2, 3, 3, 'Sau bán', 'sau')
frame(0, 2, 4, 'Nền tảng chung', 'chung')
mod(0, 1, 'Sản phẩm, lô', 'catalog', 'FR4', 'Lô, nhật ký, QR, tìm kiếm', 'cung')
mod(1, 1, 'Tồn kho', 'inventory', 'FR13.2–13.6', 'Dòng tồn, sổ kho, đóng gói', 'cung')
mod(2, 1, 'Nhà cung cấp', 'supplier', 'FR2, FR3', 'Hồ sơ, chứng nhận, loại thuế', 'cung')
mod(3, 1, 'Vận hành', 'operations', 'FR10', 'Duyệt, leo thang, cấu hình', 'vh')
mod(0, 2, 'Thu mua', 'procurement', 'FR13.1–13.2', 'Chào hàng, đơn thu mua', 'gd')
mod(1, 2, 'Bán lẻ', 'retail', 'FR5', 'Giỏ, đơn lẻ, mua lại, báo vào mùa', 'gd')
mod(2, 2, 'Thanh toán', 'payment', 'FR7', 'Thanh toán, hoàn tiền, HĐĐT', 'gd')
mod(3, 2, 'Bán sỉ', 'wholesale', 'FR6', 'RFQ, hợp đồng, giao 1 đợt', 'gd')
mod(2, 3, 'Đánh giá', 'engagement', 'FR5.5, FR9.2', 'Đánh giá, điểm uy tín', 'sau')
mod(3, 3, 'Giao hàng', 'fulfillment', 'FR8, FR9.1', 'Chuyến, vận đơn, khiếu nại', 'sau')
mod(0, 4, 'Tài khoản', 'identity', 'FR1', 'OTP, eKYC, vai trò, đồng ý dữ liệu, 2FA', 'chung')
mod(1, 4, 'Tệp', 'media', 'NFR1, NFR3', 'URL ký trước, kiểm tra tệp, WebP, hạn lưu', 'chung')
mod(2, 4, 'Thông báo', 'notification', 'FR11', 'Web, đẩy, email theo kênh đăng ký', 'chung')

cx = lambda c: COLX[c] + CWD / 2
# Ba lời gọi khóa dòng tồn: mỗi mô-đun một mũi tên riêng, chạm ba điểm khác nhau của Tồn kho
ib = R[1] + MH
top2 = R[2] - 44
ya, yb_ = ib + 36, ib + 66
s.arrow([(cx(0), top2), (cx(0), ya), (COLX[1] + 30, ya), (COLX[1] + 30, ib)], color=HOT, sw=3.2)
s.arrow([(COLX[1] + 98, top2), (COLX[1] + 98, ib)], color=HOT, sw=3.2)
s.arrow([(cx(3), top2), (cx(3), yb_), (COLX[1] + 166, yb_), (COLX[1] + 166, ib)], color=HOT, sw=3.2)
# Bán lẻ, bán sỉ -> thanh toán (liền kề)
ym = R[2] + MH / 2
s.arrow([(COLX[1] + CWD, ym), (COLX[2], ym)])
s.arrow([(COLX[3], ym), (COLX[2] + CWD, ym)])
# Bán lẻ -> giao hàng (dải dưới cùng giữa hàng 2 và 3)
yr = R[3] - 54
s.arrow([(cx(1), R[2] + MH), (cx(1), yr), (cx(3) - 40, yr), (cx(3) - 40, R[3])])
s.label((cx(1) + cx(2) - 30) / 2, yr, 'tạo giao hàng khi đơn đã thanh toán', 190, pos='above')

# Cột trái: TraceViet, dịch vụ AI, Redis, Google, Facebook
LXc, LWc = 10, 180
ext(s, LXc, R[1] + 10, LWc, 100, 'TraceViet', '', True, name_size=22)
link(s, [(COLX[0], R[1] + 60), (LXc + LWc, R[1] + 60)], design=True)
s.box(LXc, R[2] - 30, LWc, 236, [('Dịch vụ AI', 23, 700, INK, False), ('[Container: FastAPI]', 22, 400, '#1a4f86', False),
      ('vector truy vấn, dự báo giá', 22, 400, INK, False)], fill=CONT[0], stroke=CONT[1])
link(s, [(COLX[0], R[2] + 120), (LXc + LWc, R[2] + 120)])                     # thu mua <-> AI
link(s, [(COLX[0], R[1] + 150), (LXc + 130, R[1] + 150), (LXc + 130, R[2] - 30)])  # catalog <-> AI
s.box(LXc, R[3], LWc, MH, [('Sự kiện', 23, 700, INK, False), ('[Container: Redis]', 22, 400, '#1a4f86', False),
      ('phát, nhận (Phụ lục V)', 22, 400, INK, False)], fill=CONT[0], stroke=CONT[1])
link(s, [(LXc + LWc, R[3] + MH / 2), (MFX, R[3] + MH / 2)])                    # chạm biên khung 13 mô-đun
link(s, [(LXc + 50, R[2] + 206), (LXc + 50, R[3])])                              # Redis <-> AI
ext(s, LXc, R[4], LWc, 96, 'Google', '', True, name_size=22)
ext(s, LXc, R[4] + 104, LWc, 96, 'Facebook', '', True, name_size=22)
link(s, [(COLX[0], R[4] + 47), (LXc + LWc, R[4] + 47)], design=True)
link(s, [(COLX[0], R[4] + 153), (LXc + LWc, R[4] + 153)], design=True)

# Cột phải: chữ ký số, cổng thanh toán, HĐĐT, 3PL, email, Web Push, SMS
RX, RW = 1160, 170
ext(s, RX, R[2] + 30, RW, 120, 'Chữ ký số', '', True, name_size=22)
link(s, [(COLX[3] + CWD, R[2] + 90), (RX, R[2] + 90)], design=True)
ytt, yhd = R[2] + MH + 4, R[2] + MH + 82
ext(s, RX, ytt, RW, 70, 'Cổng thanh toán', '', False, name_size=22, tag=False)
ext(s, RX, yhd, RW, 70, 'HĐĐT (giả lập)', '', False, name_size=22, tag=False)
link(s, [(cx(2) - 30, R[2] + MH), (cx(2) - 30, ytt + 35), (RX, ytt + 35)])
link(s, [(cx(2) + 30, R[2] + MH), (cx(2) + 30, yhd + 35), (RX, yhd + 35)])
ext(s, RX, R[3] + 40, RW, 110, '3PL (GHN)', '', False, name_size=22)
link(s, [(COLX[3] + CWD, R[3] + 95), (RX, R[3] + 95)])
for j, (nm, des) in enumerate([('Email', False), ('Web Push', False), ('SMS', True)]):
    yy = R[4] + j * 70
    ext(s, RX, yy, RW, 60, nm, '', des, name_size=22, tag=False)
    link(s, [(COLX[2] + CWD, yy + 30), (RX, yy + 30)], design=des, both=False)

# Hàng dưới: kho tệp dưới mô-đun Tệp, CSDL nối từ biên khung 13 mô-đun
s.box(COLX[1] - 20, YB, CWD + 40, 92, [('Kho tệp', 23, 700, INK, False), ('[Container: MinIO]', 22, 400, '#1a4f86', False)], fill=CONT[0], stroke=CONT[1])
link(s, [(cx(1), R[4] + RH[4]), (cx(1), YB)])
s.label(cx(1) + 125, CF_BOT + 30, 'URL ký trước; tệp', 200)
s.box(COLX[2] + 40, YB, 2 * CWD + 30, 100, [('Cơ sở dữ liệu', 23, 700, INK, False), ('[Container: PostgreSQL] mỗi mô-đun một schema', 22, 400, '#1a4f86', False)], fill=CONT[0], stroke=CONT[1])
link(s, [(cx(3), MF_BOT), (cx(3), YB)])
s.label(cx(3) + 105, CF_BOT + 30, 'đọc/ghi [SQL]', 160)

leg = ''.join('<span><i class="sw" style="background:%s;border-color:%s;border-style:dashed"></i>%s</span>' % (BLK[k][0], BLK[k][1], t)
              for k, t in [('cung', 'Nguồn cung'), ('gd', 'Giao dịch'), ('sau', 'Sau bán'), ('chung', 'Nền tảng chung'), ('vh', 'Vận hành')]) + \
      ('<span><i class="sw" style="background:%s;border-color:%s"></i>Container</span>' % CONT) + \
      ('<span><i class="sw" style="background:%s;border-color:%s"></i>Hệ thống ngoài</span>' % EXT) + \
      ('<span><i class="sw" style="background:%s;border-color:%s;border-style:dashed"></i>Chỉ thiết kế</span>' % DES) + \
      ('<span>%sGọi có khóa dòng tồn</span>' % icon(color=HOT, w=4)) + \
      ('<span>%sMột chiều</span><span>%sHai chiều</span>' % (icon(), icon(both=True)))
io.open(os.path.join(OUT, 'c4-module.html'), 'w', encoding='utf-8').write(page(
    '', '', s.svg(), leg,
    'Chữ đơn cách: tên schema. Mũi tên chạm biên khung "13 mô-đun" áp cho mọi mô-đun; phụ thuộc khác đi qua sự kiện.'))

# ======================= LUỒNG ĐẦU–CUỐI MỘT ĐƠN LẺ =======================
# (khóa, tên, schema/ghi chú, kiểu): kiểu = person | mod:<khối> | ext
LANES = [('kh', 'Khách lẻ', 'ứng dụng mua hàng', 'person'), ('rt', 'Bán lẻ', 'retail', 'mod:gd'),
         ('iv', 'Tồn kho', 'inventory', 'mod:cung'), ('pm', 'Thanh toán', 'payment', 'mod:gd'),
         ('tt', 'Cổng thanh toán', 'VNPay', 'ext'), ('fu', 'Giao hàng', 'fulfillment', 'mod:sau'),
         ('pl', '3PL', 'GHN', 'ext'), ('nt', 'Thông báo', 'notification', 'mod:chung')]
LWD = W / len(LANES)
LX_ = {k: LWD * i + LWD / 2 for i, (k, _, _, _) in enumerate(LANES)}
# bước: ('call'|'event', từ, tới, nhãn, hai chiều?) hoặc ('self', lane, nhãn)
STEPS = [
    ('call', 'kh', 'rt', 'Đặt đơn (địa chỉ, khung giờ); nhận mã đơn', True),
    ('call', 'rt', 'iv', 'Giữ chỗ 15 phút, khóa dòng tồn; kết quả', True),
    ('event', 'rt', 'nt', 'OrderPlaced', False),
    ('call', 'rt', 'pm', 'Tạo giao dịch; đường dẫn thanh toán', True),
    ('call', 'pm', 'tt', 'Lệnh thanh toán; mã giao dịch', True),
    ('call', 'kh', 'tt', 'Khách thanh toán trên trang của cổng', False),
    ('call', 'tt', 'pm', 'Webhook kết quả', False),
    ('event', 'pm', 'rt', 'PaymentSucceeded', False),
    ('event', 'pm', 'nt', 'PaymentSucceeded', False),
    ('call', 'rt', 'iv', 'Chuyển giữ chỗ thành trừ tồn, ghi sổ xuất', False),
    ('call', 'rt', 'fu', 'Tạo giao hàng cho đơn đã thanh toán', False),
    ('self', 'fu', 'NV kho đóng gói, in tem QR'),
    ('self', 'fu', 'Sau giờ chốt: xếp lên chuyến'),
    ('call', 'fu', 'pl', 'Tạo vận đơn chặng cuối; mã vận đơn', True),
    ('call', 'pl', 'fu', 'Webhook: đã nhận, đang giao, đã giao', False),
    ('event', 'fu', 'rt', 'ShipmentStatusChanged', False),
    ('event', 'fu', 'nt', 'ShipmentStatusChanged', False),
    ('call', 'nt', 'kh', 'Thông báo đẩy, email ở mỗi trạng thái', False),
    ('call', 'rt', 'pm', 'Đơn hoàn tất: phát hành HĐĐT giả lập', False),
]
HH, RH_ = 120, 70
H_ = HH + 30 + len(STEPS) * RH_ + 20
s = Svg(W, H_)
for k, name, sub, kind in LANES:
    x = LX_[k] - LWD / 2 + 6
    if kind == 'person':
        s.box(x, 10, LWD - 12, HH - 10, [(name, 23, 700, WHITE, False), (sub, 22, 400, '#e3f1e8', False)], fill=PERSON[0], stroke=PERSON[1], rx=22, pad=8)
    elif kind == 'ext':
        s.box(x, 10, LWD - 12, HH - 10, [(name, 23, 700, INK, False), (sub, 22, 400, MUTED, False)], fill=EXT[0], stroke=EXT[1], pad=8)
    else:
        b = BLK[kind.split(':')[1]]
        s.box(x, 10, LWD - 12, HH - 10, [(name, 23, 700, INK, False), (sub, 22, 400, b[1], True)], fill=WHITE, stroke=b[1], pad=6)
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="#9aa39e" stroke-width="2" stroke-dasharray="6 6"/>' % (LX_[k], HH, LX_[k], H_ - 10))
y = HH + 30
for i, st in enumerate(STEPS, 1):
    yy = y + RH_ - 14
    if st[0] == 'self':
        cxs = LX_[st[1]]
        s.box(cxs - 200, y + 4, 400, RH_ - 16, [('%d. %s' % (i, st[2]), 22, 400, INK, False)], fill='#fbe9e9', stroke=BLK['sau'][1], rx=8, pad=6)
    else:
        kind, a, b, lab, two = st
        xa, xb = LX_[a], LX_[b]
        ev = kind == 'event'
        s.arrow([(xa, yy), (xb, yy)], color='#6b4fa0' if ev else ARR, dash='9 6' if ev else None, both=two)
        mid = (xa + xb) / 2
        wl = max(330, min(abs(xb - xa) - 20, 520))
        mid = min(max(mid, wl / 2 + 4), W - wl / 2 - 4)
        s.label(mid, yy, '%d. %s' % (i, lab), wl, color='#6b4fa0' if ev else '#33413a', pos='above')
    y += RH_

leg = (LEG_PERSON + ('<span><i class="sw" style="background:#fff;border-color:%s"></i>Mô-đun của ứng dụng lõi</span>' % BLK['gd'][1]) +
       ('<span><i class="sw" style="background:%s;border-color:%s"></i>Hệ thống ngoài</span>' % EXT) +
       ('<span>%sGọi trực tiếp</span>' % icon()) + ('<span>%sGọi và nhận kết quả</span>' % icon(both=True)) +
       ('<span>%sSự kiện qua Redis, mỗi bên nhận một mũi tên</span>' % icon(dash=True, color='#6b4fa0')))
io.open(os.path.join(OUT, 'luong-don-le.html'), 'w', encoding='utf-8').write(page(
    '', '', s.svg(), leg,
    'Ngoại lệ: thanh toán thất bại hoặc quá 15 phút thì Bán lẻ hủy đơn, phát OrderCancelled, Tồn kho nhả giữ chỗ. COD đủ điều kiện bỏ qua bước 4–9.'))
print('ok')
