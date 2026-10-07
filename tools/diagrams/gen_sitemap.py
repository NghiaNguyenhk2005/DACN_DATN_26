# -*- coding: utf-8 -*-
# Sinh sitemap tổng quan (cấp 1–2, hai ứng dụng) vào tools/design/sitemap-tong-quan.html.
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page, wrap

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
W = 1340
INK = '#16241e'
GREY = '#8a948f'
LINE = '#44524b'
D = '*'          # tiền tố đánh dấu trang chỉ thiết kế / sau phần hiện thực

SHOP = [
    ('Công khai', 'không cần đăng nhập', ('#e9edeb', '#4d5c55'), [
        'Trang chủ theo mùa', 'Tìm kiếm', 'Danh mục', 'Chi tiết sản phẩm', 'Trang truy xuất QR',
        'Hồ sơ nguồn gốc nhà cung cấp', 'Sàn sỉ', 'Đăng ký, đăng nhập', 'Chính sách (10 trang)']),
    ('Khách lẻ', 'sau đăng nhập', ('#fdf1dc', '#c98a1a'), [
        'Giỏ hàng', 'Thanh toán', 'Đơn hàng', 'Đổi trả, khiếu nại', 'Đánh giá',
        'Thông báo, báo vào mùa', 'Tài khoản, quyền dữ liệu', D + 'Yêu thích']),
    ('Khách sỉ', 'sau đăng nhập', ('#eef4fb', '#1a5fa8'), [
        'Hồ sơ doanh nghiệp', 'Yêu cầu báo giá', 'Hợp đồng', 'Đơn sỉ một đợt', 'Thanh toán',
        'Khiếu nại', D + 'Ký quỹ']),
    ('Nhà cung cấp', 'sau đăng nhập', ('#eaf7ef', '#1f8a4c'), [
        'Hồ sơ, xác minh, loại thuế', 'Chứng nhận', 'Sản phẩm và lô', 'Nhật ký canh tác',
        'Tồn kho của tôi', 'Chào hàng, đơn thu mua', 'Báo giá, hợp đồng sỉ', 'Đơn sỉ', 'Đối soát',
        'Đánh giá, uy tín', D + 'Tổng quan thống kê']),
]
STAFF = [
    ('Kiểm duyệt', 'staff_moderation', ['Hàng đợi duyệt', 'Đánh giá nghi vấn', 'Vi phạm']),
    ('Vận hành', 'staff_operations', ['Khiếu nại, đổi trả', 'Giám sát đơn, giao hàng', 'Thu hồi lô', D + 'Báo cáo thống kê']),
    ('Thu mua', 'staff_sourcing', ['Chào hàng', 'Đơn thu mua', 'Định giá, dự báo']),
    ('Kho', 'staff_warehouse', ['Nghiệm thu', 'Đóng gói, in tem', 'Tồn kho, sổ nhập xuất', 'Chuyến trung chuyển']),
    ('Hỗ trợ vùng', 'staff_support', ['Nhà cung cấp phụ trách', 'Nhập liệu hộ']),
    ('Quản trị', 'platform_owner', ['Tài khoản, vai trò', 'Danh mục', 'Cấu hình', 'Nhật ký thao tác']),
]


def hline(s, x1, x2, y, color=LINE):
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.4"/>' % (x1, y, x2, y, color))


def vline(s, x, y1, y2, color=LINE):
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.4"/>' % (x, y1, x, y2, color))


def pages_col(s, x, y, colw, stroke, pages):
    """Cột trang cấp 2 treo trên một trục dọc bên trái; trả về đáy cột."""
    spine, pw = x + 14, colw - 30
    last = y
    for pg in pages:
        des = pg.startswith(D)
        txt = pg[1:] if des else pg
        h = len(wrap(txt, pw - 12, 22, weight=500)) * 26 + 20
        s.box(x + 30, y, pw, h, [(txt, 22, 500, GREY if des else INK, False)],
              fill='#f6f7f6' if des else '#ffffff', stroke=GREY if des else stroke, rx=8, pad=6,
              dash='7 5' if des else None)
        hline(s, spine, x + 30, y + h / 2, stroke)
        last = y + h / 2
        y += h + 10
    return spine, last, y


def app(s, x0, x1, y, title, sub, fill, stroke):
    s.box(x0, y, x1 - x0, 78, [(title, 24, 800, '#ffffff', False), (sub, 22, 400, '#e6eef8', False)],
          fill=fill, stroke=stroke, rx=12)


s = Svg(W, 2000)

# ---- ứng dụng mua hàng ----
COLW, GAP, X0 = 318, 16, 20
A1Y = 10
app(s, X0, X0 + 4 * COLW + 3 * GAP, A1Y, 'Ứng dụng mua hàng', 'Next.js, PWA; trang công khai dựng phía máy chủ', '#1a5fa8', '#0f3d6e')
BY = A1Y + 78 + 22
AY = BY + 22
hline(s, X0 + COLW / 2, X0 + 3 * (COLW + GAP) + COLW / 2, BY)
vline(s, 670, A1Y + 78, BY)
bottom = 0
for i, (name, sub, (fill, stroke), pages) in enumerate(SHOP):
    x = X0 + i * (COLW + GAP)
    vline(s, x + COLW / 2, BY, AY)
    s.box(x, AY, COLW, 80, [(name, 24, 800, INK, False), (sub, 22, 400, stroke, False)], fill=fill, stroke=stroke, sw=2.5)
    spine, last, yb = pages_col(s, x, AY + 80 + 16, COLW, stroke, pages)
    vline(s, spine, AY + 80, last, stroke)
    bottom = max(bottom, yb)

# ---- ứng dụng nội bộ ----
I1Y = bottom + 30
CW2, G2 = 210, 12
X2 = (W - 6 * CW2 - 5 * G2) / 2
app(s, X2, X2 + 6 * CW2 + 5 * G2, I1Y, 'Ứng dụng nội bộ', 'React, Vite, Refine; đăng nhập 2FA, menu theo vai trò', '#6b4fa0', '#4a3672')
BY2 = I1Y + 78 + 22
RY = BY2 + 22
hline(s, X2 + CW2 / 2, X2 + 5 * (CW2 + G2) + CW2 / 2, BY2)
vline(s, 670, I1Y + 78, BY2)
bottom2 = 0
for i, (name, code, pages) in enumerate(STAFF):
    x = X2 + i * (CW2 + G2)
    vline(s, x + CW2 / 2, BY2, RY)
    s.box(x, RY, CW2, 80, [(name, 24, 800, INK, False), (code, 22, 400, '#6b4fa0', True)],
          fill='#f1eef8', stroke='#6b4fa0', sw=2.5, pad=4)
    spine, last, yb = pages_col(s, x, RY + 80 + 16, CW2, '#6b4fa0', pages)
    vline(s, spine, RY + 80, last, '#6b4fa0')
    bottom2 = max(bottom2, yb)
s.h = int(bottom2 + 6)

leg = ('<span><i class="sw" style="background:#1a5fa8;border-color:#0f3d6e"></i>Ứng dụng</span>'
       '<span><i class="sw" style="background:#eaf7ef;border-color:#1f8a4c;border-width:3px"></i>Cấp 1: khu vực hoặc vai trò</span>'
       '<span><i class="sw" style="background:#fff;border-color:#1f8a4c"></i>Cấp 2: trang, nhóm trang (cấp 3 ở Phụ lục T)</span>'
       '<span><i class="sw" style="background:#f6f7f6;border-color:#8a948f;border-style:dashed"></i>Chỉ thiết kế hoặc sau phần hiện thực</span>')
io.open(os.path.join(OUT, 'sitemap-tong-quan.html'), 'w', encoding='utf-8').write(page(
    '', '', s.svg(), leg,
    'Hai ứng dụng gọi chung một API. Trao đổi theo đơn nằm trong trang Đơn hàng và Đổi trả, không có trang tin nhắn chung; hỗ trợ chung qua Zalo OA.'))
print('ok')
