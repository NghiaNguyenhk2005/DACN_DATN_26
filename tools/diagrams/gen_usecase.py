# -*- coding: utf-8 -*-
# Sinh 3 sơ đồ use case (tổng quan, nhà cung cấp, khách sỉ) vào tools/design/.
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
W = 1340
INK = '#16241e'
WIRE = '#6f7c76'
PK = {'A': ('#eaf7ef', '#1f8a4c'), 'B': ('#eef4fb', '#1a5fa8'), 'C': ('#fdf1dc', '#c98a1a'),
      'D': ('#fbe9e9', '#c23b3b'), 'E': ('#f1eef8', '#6b4fa0')}
UCH, PITCH = 60, 70


def person(s, cx, y, name, color='#12351f'):
    s.add('<g stroke="%s" stroke-width="2.4" fill="none">'
          '<circle cx="%g" cy="%g" r="11"/><line x1="%g" y1="%g" x2="%g" y2="%g"/>'
          '<line x1="%g" y1="%g" x2="%g" y2="%g"/><line x1="%g" y1="%g" x2="%g" y2="%g"/>'
          '<line x1="%g" y1="%g" x2="%g" y2="%g"/></g>'
          % (color, cx, y + 11, cx, y + 22, cx, y + 46, cx - 17, y + 30, cx + 17, y + 30,
             cx, y + 46, cx - 14, y + 64, cx, y + 46, cx + 14, y + 64))
    yy = s.block(cx - 75, y + 68, 150, [(name, 22, 700, INK, False)], pad=0, gap=0)
    return yy


def system_actor(s, cx, y, name):
    s.rect(cx - 30, y, 60, 50, '#ffffff', '#5b6b63', 2.2, 8, '5 4')
    return s.block(cx - 80, y + 52, 160, [(name, 22, 700, '#33413a', False)], pad=0, gap=0)


def uc(s, x, y, w, text, stroke, bold=False, fill='#ffffff', dash=None):
    from svgkit import wrap
    s.rect(x, y, w, UCH, fill, stroke, 2.2, UCH / 2, dash)
    tw = w - (70 if bold else 30)
    lines = wrap(text, tw, 22)
    top = y + (UCH - len(lines) * 22 * 1.18) / 2 - 4
    for i, ln in enumerate(lines):
        s.text(x + w / 2, top + (i + 1) * 22 * 1.18, ln, 22, 700 if bold else 500, INK)


def line(s, pts, dash=None, color=WIRE, sw=2):
    d = ' stroke-dasharray="%s"' % dash if dash else ''
    s.add('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"%s/>'
          % (' '.join('%g,%g' % p for p in pts), color, sw, d))


def dep(s, pts, kind):
    """«include»/«extend»: nét đứt, đầu mũi tên mở, nhãn ở đoạn đầu."""
    s.add('<polyline points="%s" fill="none" stroke="#44524b" stroke-width="2" stroke-dasharray="8 6" marker-end="url(#open)"/>'
          % ' '.join('%g,%g' % p for p in pts))
    (x0, y0), (x1, y1) = pts[0], pts[1]
    s.label((x0 + x1) / 2, (y0 + y1) / 2 - 16, '«%s»' % kind, 130, size=22)


OPEN = ('<marker id="open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto">'
        '<path d="M1,1 L11,6 L1,11" fill="none" stroke="#44524b" stroke-width="1.8"/></marker>')


def finish(s):
    svg = s.svg()
    return svg.replace('<defs>', '<defs>' + OPEN, 1)


# ============================== TỔNG QUAN ==============================
def overview():
    # (khóa, tiêu đề, [UC cột trái: (id, chữ, đậm)], [UC cột phải])
    packs = [
        ('A', 'A. Nền tảng chung (FR1, FR11)',
         [('a1', 'Đăng ký và xác thực tài khoản', False)],
         [('a2', 'Quản lý tài khoản, vai trò nội bộ', False)]),
        ('B', 'B. Nguồn cung (FR2–FR4)',
         [('b1', 'Tải và theo dõi chứng nhận', False), ('b2', 'UC-B1 Đăng sản phẩm, khai báo lô', False),
          ('b3', 'UC-B2 Ghi nhật ký canh tác', True), ('b4', 'Tìm kiếm, tra cứu truy xuất', False)],
         [('b5', 'Duyệt hồ sơ và chứng nhận', False), ('b6', 'UC-B4 Duyệt sản phẩm và lô hàng', True),
          ('b7', 'Hỗ trợ, nhập liệu hộ nhà cung cấp', False)]),
        ('C', 'C. Giao dịch (FR5–FR7, FR13)',
         [('c1', 'UC-C4 Đặt hàng, thanh toán bán lẻ', True), ('c2', 'Gửi yêu cầu báo giá, thương lượng', False),
          ('c3', 'UC-D4 Giao kết hợp đồng bán sỉ', True), ('c4', 'UC-D7 Nhận hàng, thanh toán đợt', True),
          ('c5', 'Mua chào sỉ tồn dư của Farmery', False), ('c6', 'Xác nhận đơn thu mua', False)],
         [('c7', 'Lập đơn thu mua, định giá bán lẻ', False), ('c8', 'Nghiệm thu, nhập xuất kho, đóng gói', False),
          ('c9', 'Thu hồi lô', False)]),
        ('D', 'D. Sau bán (FR8, FR9)',
         [('d1', 'Theo dõi đơn và vận chuyển', False), ('d2', 'Gửi khiếu nại', False),
          ('d3', 'Đánh giá sản phẩm, nhà cung cấp', False), ('d4', 'Nhắn tin, theo dõi gian hàng', False)],
         [('d5', 'Giao hàng chặng ngắn', False), ('d6', 'Phân xử khiếu nại, tranh chấp', False),
          ('d7', 'UC-C7 Kiểm duyệt đánh giá nghi vấn', True)]),
        ('E', 'E. Vận hành và hỗ trợ ra quyết định (FR10, FR12)',
         [('e1', 'Xem báo cáo bán hàng, đối soát', False)],
         [('e2', 'Xử lý vi phạm theo phân cấp', False), ('e3', 'Giám sát tồn kho, vận chuyển', False),
          ('e4', 'Cấu hình danh mục, ngưỡng, biểu phí', False)]),
    ]
    left = [('Nhà cung cấp', ['a1', 'b1', 'b2', 'b3', 'c2', 'c3', 'c6', 'd4', 'e1']),
            ('Khách lẻ', ['a1', 'b4', 'c1', 'd1', 'd2', 'd3', 'd4']),
            ('Khách sỉ', ['a1', 'b4', 'c2', 'c3', 'c4', 'c5', 'd1', 'd2', 'd3', 'd4'])]
    right = [('Kiểm duyệt viên', ['b5', 'b6', 'd7', 'e2']), ('Nhân viên hỗ trợ vùng', ['b7']),
             ('Nhân viên thu mua', ['c7']), ('Nhân viên kho', ['c8', 'c9']),
             ('Nhân viên giao hàng', ['d5']), ('Nhân viên vận hành', ['d6', 'e3']),
             ('Quản trị viên hệ thống', ['a2', 'e4'])]
    PX, PW = 218, 902           # khung gói
    LX, RX, UW = PX + 20, PX + PW - 20 - 421, 421
    pos = {}
    y = 20
    s = Svg(W, 2000)
    for key, title, lc, rc in packs:
        n = max(len(lc), len(rc))
        h = 50 + n * PITCH
        s.rect(PX, y, PW, h, PK[key][0], PK[key][1], 2.2, 16, '10 7')
        s.text(PX + 18, y + 34, title, 24, 800, PK[key][1], 'start')
        for col, items, x in ((0, lc, LX), (1, rc, RX)):
            for i, (k, t, b) in enumerate(items):
                yy = y + 44 + i * PITCH
                uc(s, x, yy, UW, t, PK[key][1], b)
                pos[k] = (x, yy + UCH / 2, x + UW)
        y += h + 14
    H = y
    # actor trái: mỗi actor một trục dọc
    spines = [170, 186, 202]
    ay = [H * 0.18, H * 0.48, H * 0.76]
    for (name, ucs), sx, yy in zip(left, spines, ay):
        person(s, 80, yy - 40, name)
        ys = [pos[k][1] for k in ucs]
        line(s, [(sx, min(ys + [yy])), (sx, max(ys + [yy]))])
        line(s, [(100, yy), (sx, yy)])
        for k in ucs:
            line(s, [(sx, pos[k][1]), (pos[k][0], pos[k][1])])
    # actor phải
    rsp = [PX + PW + 12 + i * 10 for i in range(len(right))]
    step = (H - 120) / len(right)
    for i, ((name, ucs), sx) in enumerate(zip(right, rsp)):
        yy = 70 + i * step
        person(s, 1264, yy - 40, name)
        ys = [pos[k][1] for k in ucs]
        line(s, [(sx, min(ys + [yy])), (sx, max(ys + [yy]))])
        line(s, [(sx, yy), (1242, yy)])
        for k in ucs:
            line(s, [(pos[k][2], pos[k][1]), (sx, pos[k][1])])
    s.h = int(H)
    leg = ''.join('<span><i class="sw" style="background:%s;border-color:%s;border-style:dashed"></i>%s</span>'
                  % (PK[k][0], PK[k][1], t) for k, t in
                  [('A', 'Nền tảng chung'), ('B', 'Nguồn cung'), ('C', 'Giao dịch'), ('D', 'Sau bán'), ('E', 'Vận hành, hỗ trợ ra quyết định')])
    io.open(os.path.join(OUT, 'usecase-overview.html'), 'w', encoding='utf-8').write(page(
        '', '',
        finish(s), leg))


# ============================== CHI TIẾT ==============================
def detail(fname, title, sub, color, mains, sides, deps, left, right, height):
    """mains/sides: {id: (hàng, chữ, đậm)}; deps: [(từ, tới, kiểu)];
    left/right: [(tên, [id], là_hệ_thống)]."""
    s = Svg(W, height)
    MX, MW = 240, 440
    SX, SW = 740, 390
    pos = {}
    for k, (r, t, b) in mains.items():
        y = 20 + r * PITCH
        uc(s, MX, y, MW, t, color, b)
        pos[k] = (MX, y + UCH / 2, MX + MW)
    for k, (r, t, b, st) in sides.items():
        y = 20 + r * PITCH
        uc(s, SX, y, SW, t, st, b, fill='#fbfcfb', dash=None)
        pos[k] = (SX, y + UCH / 2, SX + SW)
    for a, b_, kind in deps:
        xa, ya, xa2 = pos[a]
        xb, yb, xb2 = pos[b_]
        if xa > xb:     # bên phải -> bên trái
            mid = (xb2 + xa) / 2
            pts = [(xa, ya), (mid, ya), (mid, yb), (xb2, yb)] if ya != yb else [(xa, ya), (xb2, yb)]
        else:
            mid = (xa2 + xb) / 2
            pts = [(xa2, ya), (mid, ya), (mid, yb), (xb, yb)] if ya != yb else [(xa2, ya), (xb, yb)]
        dep(s, pts, kind)
    for i, (name, ucs, sysf, *yo) in enumerate(left):
        sx = 190 + i * 18
        ys = [pos[k][1] for k in ucs]
        yy = 20 + yo[0] * PITCH + UCH / 2 if yo else (min(ys) + max(ys)) / 2
        (system_actor if sysf else person)(s, 80, yy - 40, name)
        line(s, [(sx, min(ys + [yy])), (sx, max(ys + [yy]))])
        line(s, [(104, yy), (sx, yy)])
        for k in ucs:
            line(s, [(sx, pos[k][1]), (pos[k][0], pos[k][1])])
    for i, (name, ucs, sysf, *yo) in enumerate(right):
        sx = SX + SW + 22 + i * 16
        ys = [pos[k][1] for k in ucs]
        yy = 20 + yo[0] * PITCH + UCH / 2 if yo else (min(ys) + max(ys)) / 2
        (system_actor if sysf else person)(s, 1240, yy - 40, name)
        line(s, [(sx, min(ys + [yy])), (sx, max(ys + [yy]))])
        line(s, [(sx, yy), (1214, yy)])
        for k in ucs:
            line(s, [(pos[k][2], pos[k][1]), (sx, pos[k][1])])
    leg = ('<span><i class="sw" style="border-color:%s;border-radius:12px"></i>Use case của actor chính</span>' % color +
           '<span><i class="sw" style="border-color:#6f7c76;border-radius:12px"></i>Use case liên quan</span>'
           '<span><i class="ln" style="border-top-style:dashed"></i>«include»: luôn thực hiện · «extend»: chỉ khi thỏa điều kiện</span>'
           '<span><svg width="34" height="28"><rect x="3" y="3" width="28" height="22" rx="5" fill="none" stroke="#5b6b63" stroke-width="2" stroke-dasharray="5 4"/></svg>Hệ thống bên ngoài (actor phụ)</span>')
    io.open(os.path.join(OUT, fname), 'w', encoding='utf-8').write(page(title, sub, finish(s), leg))


def supplier():
    G = '#1f8a4c'
    mains = {
        'm1': (0, 'Đăng ký, xác minh gian hàng (eKYC)', False),
        'm2': (1, 'Tải và theo dõi chứng nhận', False),
        'm3': (2, 'UC-B1 Đăng sản phẩm, khai báo lô', True),
        'm4': (4, 'UC-B2 Ghi nhật ký canh tác theo lô', True),
        'm5': (6, 'Công bố khung giá sỉ theo MOQ', False),
        'm6': (7, 'Theo dõi tồn kho theo lô', False),
        'm7': (8, 'Xác nhận đơn thu mua của Farmery', False),
        'm8': (9, 'Thuê kho, dịch vụ đóng gói', False),
        'm9': (10, 'Xem doanh thu, đối soát', False),
        'm10': (11, 'Xem dự báo giá theo mùa vụ', False),
    }
    sides = {
        's1': (2, 'Kiểm tra tính hợp lệ sản phẩm', False, '#6f7c76'),
        's2': (3, 'UC-B4 Duyệt sản phẩm và lô hàng', True, '#1a5fa8'),
        's3': (5, 'Đính chính bản ghi nhật ký', False, '#6f7c76'),
    }
    deps = [('m3', 's1', 'include'), ('s3', 'm4', 'extend')]
    left = [('Nhà cung cấp', ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10'], False, 2.5),
            ('Nhân viên hỗ trợ vùng', ['m4'], False, 7.5)]
    right = [('Kiểm duyệt viên', ['m2', 's2'], False, 0.6), ('TraceViet', ['s2'], True, 5),
             ('Hệ thống AI', ['m10'], True)]
    detail('usecase-nha-ban.html', 'Sơ đồ Use Case chi tiết — Nhà cung cấp',
           'Nhóm nguồn cung (FR2–FR4) và các việc của nhà cung cấp ở luồng bán sỉ và thu mua. Nhân viên hỗ trợ vùng ghi nhật ký thay nhà cung cấp khi cần; kiểm duyệt viên duyệt chứng nhận, sản phẩm và lô; hệ thống tự sinh mã QR khi lô được duyệt (không phải use case riêng).',
           G, mains, sides, deps, left, right, 60 + 12 * PITCH)


def wholesale():
    B = '#1a5fa8'
    mains = {
        'm1': (0, 'Xem giá sỉ theo MOQ', False),
        'm2': (1, 'Gửi yêu cầu báo giá (RFQ)', False),
        'm3': (2, 'Thương lượng báo giá', False),
        'm4': (3, 'UC-D4 Chốt báo giá, giao kết hợp đồng', True),
        'm5': (5, 'Nộp ký quỹ', False),
        'm6': (6, 'Theo dõi lịch giao theo đợt', False),
        'm7': (7, 'UC-D7 Xác nhận nhận hàng, thanh toán theo đợt', True),
        'm8': (9, 'Đặt mua chào sỉ tồn dư của Farmery', False),
    }
    sides = {
        's1': (1, 'Kiểm tra đạt MOQ', False, '#6f7c76'),
        's2': (3, 'Xác nhận giao kết bằng OTP', False, '#6f7c76'),
        's3': (4, 'Ký số hợp đồng', False, '#6f7c76'),
        's4': (8, 'Khiếu nại đợt giao', False, '#6f7c76'),
    }
    deps = [('m2', 's1', 'include'), ('m4', 's2', 'include'), ('s3', 'm4', 'extend'), ('s4', 'm7', 'extend')]
    left = [('Khách sỉ', ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'], False, 1.5),
            ('Nhà cung cấp', ['m3', 'm4'], False, 6.5)]
    right = [('Tổ chức chứng thực chữ ký số', ['s3'], True), ('Cổng thanh toán', ['m5', 'm7'], True)]
    detail('usecase-nguoi-mua-si.html', 'Sơ đồ Use Case chi tiết — Khách sỉ',
           'Luồng bán sỉ (FR6, FR7): yêu cầu báo giá, thương lượng, giao kết hợp đồng (nhà cung cấp cùng là actor chính), ký quỹ, nhận hàng và thanh toán theo đợt. Ký số chỉ khi hợp đồng vượt ngưỡng và hai bên chọn; khiếu nại chỉ khi đợt giao không đạt.',
           B, mains, sides, deps, left, right, 50 + 10 * PITCH)


overview()
supplier()
wholesale()
print('ok')
