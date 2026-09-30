# -*- coding: utf-8 -*-
# Sinh sitemap tổng quan (cấp 1–2) vào tools/design/sitemap-tong-quan.html.
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page, wrap

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
W = 1340
INK = '#16241e'
AREAS = [
    ('Công khai', 'không cần đăng nhập', ('#e9edeb', '#4d5c55'), [
        'Trang chủ', 'Tìm kiếm', 'Danh mục sản phẩm (chuyển Mua lẻ / Mua sỉ)', 'Chi tiết sản phẩm',
        'Gian hàng nhà cung cấp', 'Trang truy xuất QR', 'Đăng ký, đăng nhập', 'Điều khoản, chính sách']),
    ('Khách lẻ', 'sau đăng nhập', ('#fdf1dc', '#c98a1a'), [
        'Giỏ hàng', 'Thanh toán', 'Đơn hàng của tôi', 'Khiếu nại, đổi trả', 'Đánh giá của tôi',
        'Yêu thích, theo dõi', 'Sổ địa chỉ']),
    ('Khách sỉ', 'sau đăng nhập', ('#eef4fb', '#1a5fa8'), [
        'Hồ sơ doanh nghiệp', 'Yêu cầu báo giá', 'Hợp đồng', 'Đơn sỉ và đợt giao', 'Ký quỹ, thanh toán',
        'Khiếu nại', 'Nhà cung cấp theo dõi']),
    ('Nhà cung cấp', 'sau đăng nhập', ('#eaf7ef', '#1f8a4c'), [
        'Tổng quan', 'Hồ sơ gian hàng, xác minh', 'Chứng nhận', 'Sản phẩm và lô', 'Nhật ký canh tác',
        'Tồn kho', 'Báo giá và hợp đồng sỉ', 'Đơn sỉ và đợt giao', 'Chào bán cho Farmery',
        'Dịch vụ kho, đóng gói', 'Doanh thu, đối soát', 'Đánh giá, uy tín']),
    ('Nội bộ', 'menu hiện theo vai trò', ('#f1eef8', '#6b4fa0'), [
        'Kiểm duyệt', 'Vận hành', 'Thu mua', 'Kho', 'Giao hàng (chỉ thiết kế)', 'Hỗ trợ vùng',
        'Quản trị hệ thống']),
]
COLW, GAP, X0 = 250, 16, 20
PW = COLW - 34
s = Svg(W, 1380)
# gốc
s.box(400, 10, 540, 80, [('Farmery — ứng dụng web cài đặt được', 24, 800, '#ffffff', False)],
      fill='#1a5fa8', stroke='#0f3d6e')
AY = 160
s.add('<line x1="670" y1="90" x2="670" y2="125" stroke="#44524b" stroke-width="2.4"/>')
s.add('<line x1="%g" y1="125" x2="%g" y2="125" stroke="#44524b" stroke-width="2.4"/>'
      % (X0 + COLW / 2, X0 + 4 * (COLW + GAP) + COLW / 2))
maxy = 0
for i, (name, sub, (fill, stroke), pages) in enumerate(AREAS):
    x = X0 + i * (COLW + GAP)
    s.add('<line x1="%g" y1="125" x2="%g" y2="%g" stroke="#44524b" stroke-width="2.4"/>' % (x + COLW / 2, x + COLW / 2, AY))
    s.box(x, AY, COLW, 100, [(name, 26, 800, INK, False), (sub, 22, 400, stroke, False)], fill=fill, stroke=stroke, sw=2.5)
    y = AY + 100 + 22
    spine = x + 16
    last = y
    for pg in pages:
        n = len(wrap(pg, PW - 8, 22))
        h = n * 26 + 22
        s.box(x + 34, y, PW, h, [(pg, 22, 500, INK, False)], fill='#ffffff', stroke=stroke, rx=8, pad=4)
        s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2"/>' % (spine, y + h / 2, x + 34, y + h / 2, stroke))
        last = y + h / 2
        y += h + 12
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2"/>' % (spine, AY + 100, spine, last, stroke))
    maxy = max(maxy, y)
s.h = int(maxy + 10)
leg = ('<span><i class="sw" style="background:#1a5fa8;border-color:#0f3d6e"></i>Gốc</span>'
       '<span><i class="sw" style="background:#eaf7ef;border-color:#1f8a4c;border-width:3px"></i>Cấp 1: khu vực</span>'
       '<span><i class="sw" style="background:#fff;border-color:#1f8a4c"></i>Cấp 2: trang, nhóm trang (cấp 3 ở Phụ lục T)</span>')
io.open(os.path.join(OUT, 'sitemap-tong-quan.html'), 'w', encoding='utf-8').write(page(
    '', '', s.svg(), leg,
    'Mọi khu sau đăng nhập có chung ba trang: Tài khoản, Thông báo, Tin nhắn. Khách sỉ xem danh mục ở chế độ Mua sỉ (giá bậc theo MOQ, nút gửi yêu cầu báo giá).'))
print('ok')
