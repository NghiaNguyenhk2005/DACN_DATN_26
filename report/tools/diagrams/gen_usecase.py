# -*- coding: utf-8 -*-
# Sinh sơ đồ use case tổng quan và 5 sơ đồ chi tiết vào tools/design/.
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page, wrap

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
W = 1340
INK = '#16241e'
WIRE = '#55635c'
GREY = '#8a948f'
PK = {'A': ('#eaf7ef', '#1f8a4c'), 'B': ('#eef4fb', '#1a5fa8'), 'C': ('#fdf1dc', '#c98a1a'),
      'D': ('#fbe9e9', '#c23b3b'), 'E': ('#f1eef8', '#6b4fa0')}
UCH, PITCH = 60, 68
MARKERS = ('<marker id="open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto">'
           '<path d="M1,1 L11,6 L1,11" fill="none" stroke="#44524b" stroke-width="1.8"/></marker>'
           '<marker id="tri" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="13" markerHeight="13" orient="auto">'
           '<path d="M1,1 L13,7 L1,13 z" fill="#ffffff" stroke="#44524b" stroke-width="1.6"/></marker>')


def actor(s, cx, y, name, color='#12351f'):
    """Người que, đỉnh đầu tại y; trả về điểm nối trái/phải ngang tay và đáy nhãn."""
    s.add('<g stroke="%s" stroke-width="2.4" fill="none">'
          '<circle cx="%g" cy="%g" r="11"/><line x1="%g" y1="%g" x2="%g" y2="%g"/>'
          '<line x1="%g" y1="%g" x2="%g" y2="%g"/><line x1="%g" y1="%g" x2="%g" y2="%g"/>'
          '<line x1="%g" y1="%g" x2="%g" y2="%g"/></g>'
          % (color, cx, y + 11, cx, y + 22, cx, y + 46, cx - 17, y + 30, cx + 17, y + 30,
             cx, y + 46, cx - 14, y + 64, cx, y + 46, cx + 14, y + 64))
    s.label(cx, y + 64, name, 150, size=22, color=INK, bg='#fff', pos='top', weight=700, italic=False)
    return {'L': (cx - 20, y + 30), 'R': (cx + 20, y + 30), 'T': (cx, y), 'Lb': (cx - 16, y + 54)}


def sysactor(s, cx, y, name, design=False, w=190):
    """Tác nhân hệ thống: khung có nhãn «hệ thống»; nét đứt xám nếu chỉ thiết kế."""
    st, col = (GREY, GREY) if design else ('#3d4a43', INK)
    lines = [('«hệ thống»', 22, 400, col, False), (name, 22, 700, col, False)]
    if design:
        lines.append(('chỉ thiết kế', 22, 400, GREY, False))
    h = 96 if design else 84
    s.box(cx - w / 2, y, w, h, lines, fill='#f6f7f6' if design else '#e4e7e5', stroke=st, rx=8,
          dash='7 5' if design else None, pad=6)
    return {'L': (cx - w / 2, y + h / 2), 'R': (cx + w / 2, y + h / 2), 'T': (cx, y)}


def uc(s, x, y, w, text, stroke, style='n'):
    """style: n thường, b trục bán lẻ (đậm), d chỉ thiết kế (xám nét đứt)."""
    if style == 'd':
        s.rect(x, y, w, UCH, '#f6f7f6', GREY, 2.2, UCH / 2, '8 6')
        color, weight = GREY, 500
    else:
        s.rect(x, y, w, UCH, '#ffffff', stroke, 3.2 if style == 'b' else 2.2, UCH / 2)
        color, weight = INK, 700 if style == 'b' else 500
    lines = wrap(text, w - 44, 22, weight=weight)
    if len(lines) > 2:
        print('OVERFLOW %s' % ascii(text[:30]))
    top = y + (UCH - len(lines) * 22 * 1.18) / 2 - 4
    for i, ln in enumerate(lines):
        s.text(x + w / 2, top + (i + 1) * 22 * 1.18, ln, 22, weight, color)
    return {'L': (x, y + UCH / 2), 'R': (x + w, y + UCH / 2), 'y': y + UCH / 2}


def assoc(s, p, q, design=False):
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2"%s/>'
          % (p[0], p[1], q[0], q[1], GREY if design else WIRE, ' stroke-dasharray="7 5"' if design else ''))


def poly(s, pts, marker=None, dash=None, color=WIRE):
    s.add('<polyline points="%s" fill="none" stroke="%s" stroke-width="2"%s%s/>'
          % (' '.join('%g,%g' % p for p in pts), color, ' stroke-dasharray="%s"' % dash if dash else '',
             ' marker-end="url(#%s)"' % marker if marker else ''))


def dep(s, pts, kind):
    """«include»/«extend»: nét đứt, đầu mũi tên mở, nhãn trên đoạn dài nhất."""
    poly(s, pts, 'open', '8 6', '#44524b')
    segs = list(zip(pts, pts[1:]))
    (x0, y0), (x1, y1) = max(segs, key=lambda q: abs(q[1][0] - q[0][0]) + abs(q[1][1] - q[0][1]))
    s.label((x0 + x1) / 2, (y0 + y1) / 2, '«%s»' % kind, 120, size=22, pos='above' if y0 == y1 else 'on')


def finish(s):
    return s.svg().replace('<defs>', '<defs>' + MARKERS, 1)


LEG_UC = ('<span><svg width="60" height="28"><rect x="2" y="3" width="56" height="22" rx="11" fill="#fff" stroke="#c98a1a" stroke-width="3.4"/></svg>Trục bán lẻ</span>'
          '<span><svg width="60" height="28"><rect x="2" y="3" width="56" height="22" rx="11" fill="#fff" stroke="#55635c" stroke-width="2"/></svg>Use case khác</span>'
          '<span><svg width="60" height="28"><rect x="2" y="3" width="56" height="22" rx="11" fill="#f6f7f6" stroke="#8a948f" stroke-width="2" stroke-dasharray="6 4"/></svg>Chỉ thiết kế hoặc sau phần hiện thực</span>'
          '<span><svg width="60" height="16"><line x1="2" y1="8" x2="44" y2="8" stroke="#44524b" stroke-width="2"/><path d="M44,2 L57,8 L44,14 z" fill="#fff" stroke="#44524b" stroke-width="1.6"/></svg>Tổng quát hóa (con làm được mọi việc của cha)</span>')
LEG_DEP = ('<span><svg width="60" height="16"><line x1="2" y1="8" x2="54" y2="8" stroke="#44524b" stroke-width="2" stroke-dasharray="7 5"/><path d="M47,2 L57,8 L47,14" fill="none" stroke="#44524b" stroke-width="1.8"/></svg>'
           '«include»: luôn thực hiện; «extend»: chỉ khi thỏa điều kiện</span>')


# ============================== TỔNG QUAN ==============================
def overview():
    LX, LW, RXc, RW = 262, 370, 712, 380          # cột trái (người dùng ngoài), cột phải (nội bộ)
    PX0, PX1 = 244, 1110
    packs = [
        ('A', 'A. Nền tảng chung (FR1, FR11)',
         [('A1', 'Đăng ký tài khoản mua hàng', 'n')],
         [('A2', 'Đăng nhập hai lớp, nhận việc và thông báo', 'n')]),
        ('B', 'B. Nguồn cung (FR2–FR4)',
         [('B1', 'Tìm kiếm, quét QR xem truy xuất', 'b'), ('B2', 'UC-B2 Đăng sản phẩm, lô, nhật ký', 'n'),
          ('B3', 'Đăng ký, xác minh, khai báo chứng nhận', 'n')],
         [('B5', 'Hỗ trợ, nhập liệu hộ nhà cung cấp', 'n')]),
        ('C', 'C. Giao dịch (FR5–FR7, FR12.2, FR13)',
         [('C5', 'Gửi chào hàng, xác nhận đơn thu mua', 'n'), ('C3', 'UC-D4 Gửi RFQ, giao kết hợp đồng sỉ', 'n'),
          ('C8', 'Nộp ký quỹ đơn sỉ', 'd'), ('C1', 'UC-C4 Đặt hàng, thanh toán đơn lẻ', 'b'),
          ('C2', 'Mua lại, đăng ký báo vào mùa', 'b')],
         [('C9', 'Định giá bán lẻ, xem dự báo giá', 'n'), ('C6', 'UC-B5 Lập đơn thu mua, nghiệm thu', 'n'),
          ('C7', 'Đóng gói, in tem, quản lý dòng tồn', 'n')]),
        ('D', 'D. Sau bán (FR8, FR9)',
         [('D2', 'UC-C6 Yêu cầu đổi trả, hoàn tiền', 'b'), ('D1', 'Theo dõi đơn, nhận hóa đơn', 'b'),
          ('D5', 'Đánh giá sản phẩm', 'b')],
         [('D3', 'Lập chuyến trung chuyển, vận đơn', 'n'), ('D4', 'Xử lý khiếu nại, đổi trả', 'n')]),
        ('E', 'E. Vận hành (FR10)',
         [],
         [('E1', 'Thu hồi lô', 'n'), ('B4', 'UC-B4 Duyệt hồ sơ, sản phẩm và lô', 'n'),
          ('D6', 'UC-C7 Kiểm duyệt đánh giá nghi vấn', 'n'), ('E2', 'Xử lý vi phạm nội dung', 'n'),
          ('E3', 'Cấu hình nền tảng, tài khoản nội bộ', 'n')]),
    ]
    s = Svg(W, 1800)
    U = {}
    y = 14
    for key, title, lc, rc in packs:
        n = max(len(lc), len(rc))
        h = 56 + n * PITCH
        x0 = 700 if not lc else PX0               # gói chỉ có use case nội bộ thì thu về cột phải
        s.rect(x0, y, PX1 - x0, h, PK[key][0], PK[key][1], 1.6, 16)
        s.text(x0 + 16, y + 32, title, 24, 800, PK[key][1], 'start')
        for items, x, w in ((lc, LX, LW), (rc, RXc, RW)):
            for i, (k, t, st) in enumerate(items):
                U[k] = uc(s, x, y + 46 + i * PITCH, w, t, PK[key][1], st)
        y += h + 18
    PB = y - 18                                   # đáy gói cuối
    ymid = lambda *ks: sum(U[k]['y'] for k in ks) / len(ks)

    # Tác nhân trái
    ax = 100
    A = {}
    A['vl'] = actor(s, ax, ymid('A1', 'B1') - 40, 'Khách vãng lai')
    A['ncc'] = actor(s, ax, ymid('B2', 'C3') - 40, 'Nhà cung cấp')
    A['si'] = actor(s, ax, ymid('C3', 'C8') + 10, 'Khách sỉ')
    A['le'] = actor(s, ax, ymid('C2', 'D2') - 10, 'Khách lẻ')
    for a, ks in [('vl', ['A1', 'B1']), ('ncc', ['B2', 'B3', 'C5', 'C3']), ('si', ['C3', 'C8']),
                  ('le', ['C1', 'C2', 'D2', 'D1', 'D5'])]:
        for k in ks:
            assoc(s, A[a]['R'], U[k]['L'], design=k == 'C8')
    # Tổng quát hóa: khách lẻ, khách sỉ -> khách vãng lai (mỗi mũi tên một đường riêng)
    for a, gx, ty in [('si', 26, 20), ('le', 14, 52)]:
        (x0, y0), (x1, y1) = A[a]['L'], A['vl']['L']
        poly(s, [(x0, y0), (gx, y0), (gx, y1 - 30 + ty), (x1 + 4, y1 - 30 + ty)], 'tri')

    # Khung nhân sự nội bộ, 6 vai trò; quan hệ chung nối từ biên khung tới A2
    FX0, FY0 = 1126, U['B5']['y'] - 92
    rx = 1252
    roles = [('sup', 'Hỗ trợ vùng', ['B5']), ('src', 'Nhân viên thu mua', ['C9', 'C6']),
             ('wh', 'Nhân viên kho', ['C6', 'C7', 'D3']), ('ops', 'Nhân viên vận hành', ['D4', 'E1']),
             ('mod', 'Kiểm duyệt viên', ['B4', 'D6', 'E2']), ('own', 'Quản trị viên', ['E3'])]
    R = {}
    frame_at = len(s.parts)          # khung nền vẽ dưới các tác nhân
    for k, name, ks in roles:
        yy = ymid(*ks) - 40
        if k == 'sup':
            yy = U['B5']['y'] - 30
        if k == 'own':
            yy = U['E3']['y'] - 28
        R[k] = actor(s, rx, yy, name)
        for u in ks:
            assoc(s, R[k]['L'], U[u]['R'])
    FY1 = U['E3']['y'] + 112
    s.rect(FX0, FY0, W - 6 - FX0, FY1 - FY0, '#f3f8f5', '#12351f', 1.6, 16)
    s.parts.insert(frame_at, s.parts.pop())
    s.text((FX0 + W - 6) / 2, FY0 + 28, 'Nhân sự nội bộ', 22, 800, '#12351f')
    assoc(s, (FX0 + 60, FY0), (FX0 + 60, U['A2']['y']))
    assoc(s, (FX0 + 60, U['A2']['y']), U['A2']['R'])

    # Tác nhân hệ thống ở góc dưới trái; mỗi đường đi riêng trong khe giữa hai cột
    S = {'hd': sysactor(s, 430, U['E1']['y'] - 42, 'Dịch vụ HĐĐT', w=270),
         'tt': sysactor(s, 430, U['D6']['y'] - 42, 'Cổng thanh toán', w=270),
         '3pl': sysactor(s, 430, U['E3']['y'] - 42, 'Đơn vị vận chuyển', w=270)}
    chan = [('hd', 'D1', 652, 0, 'L'), ('tt', 'D2', 664, -16, 'L'), ('tt', 'C1', 676, 16, 'L'), ('3pl', 'D3', 690, 0, 'R')]
    for a, k, cxx, dy, side in chan:
        rx_, ry = S[a]['R']
        poly(s, [(rx_, ry + dy), (cxx, ry + dy), (cxx, U[k]['y']),
                 (U[k]['R'][0] if side == 'L' else U[k]['L'][0], U[k]['y'])])
    s.h = int(max(PB, FY1) + 16)
    leg = ''.join('<span><i class="sw" style="background:%s;border-color:%s;border-width:1.5px"></i>%s</span>'
                  % (PK[k][0], PK[k][1], t) for k, t in
                  [('A', 'Nền tảng chung'), ('B', 'Nguồn cung'), ('C', 'Giao dịch'), ('D', 'Sau bán'), ('E', 'Vận hành')]) + LEG_UC + \
        '<span><svg width="40" height="28"><rect x="2" y="3" width="36" height="22" rx="4" fill="#f3f8f5" stroke="#12351f" stroke-width="1.5"/></svg>Nối từ biên khung: áp cho mọi vai trò</span>'
    io.open(os.path.join(OUT, 'usecase-overview.html'), 'w', encoding='utf-8').write(page(
        '', '', finish(s), leg, 'Mã UC ghi cho các use case có bảng đặc tả.'))


# ============================== CHI TIẾT ==============================
def detail(fname, color, mains, sides, deps, left, right, gens=(), note=''):
    """mains: [(id, chữ, kiểu)] theo hàng; sides: {id: (hàng, chữ, kiểu)};
    deps: [(từ, tới, loại)]; left/right: [(khóa, tên, [id], hệ thống?, hàng đặt, chỉ thiết kế?)]."""
    MX, MW, SX, SW = 250, 420, 772, 326
    s = detail.s
    U = {}
    for r, (k, t, st) in enumerate(mains):
        U[k] = uc(s, MX, 16 + r * PITCH, MW, t, color, st)
    for k, (r, t, st) in sides.items():
        U[k] = uc(s, SX, 16 + r * PITCH, SW, t, '#55635c', st)
    for a, b, kind in deps:
        (xa, ya), (xb, yb) = (U[a]['R'], U[b]['L']) if U[a]['R'][0] < U[b]['L'][0] else (U[a]['L'], U[b]['R'])
        mid = (xa + xb) / 2
        dep(s, [(xa, ya), (xb, yb)] if ya == yb else [(xa, ya), (mid, ya), (mid, yb), (xb, yb)], kind)
    A = {}
    for side, lst in (('L', left), ('R', right)):
        for k, name, ks, sysf, row, des in lst:
            cx = 116 if side == 'L' else (1222 if sysf else 1236)
            yy = 16 + row * PITCH
            A[k] = (sysactor(s, cx, yy, name, des, w=226) if sysf else actor(s, cx, yy, name))
            for u in ks:
                p = A[k]['R'] if side == 'L' else A[k]['L']
                q = U[u]['L'] if side == 'L' else U[u]['R']
                assoc(s, p, q, design=des)
    for child, parent, gx in gens:
        (x0, y0), (x1, y1) = A[child]['L'], A[parent]['Lb']
        poly(s, [(x0, y0), (gx, y0), (gx, y1), (x1, y1)], 'tri')
    leg = LEG_UC + LEG_DEP
    io.open(os.path.join(OUT, fname), 'w', encoding='utf-8').write(page('', '', finish(s), leg, note))


def run_detail(fname, rows, *a, **kw):
    detail.s = Svg(W, 40 + rows * PITCH)
    detail(fname, *a, **kw)


def supplier():
    mains = [('m0', 'Đăng ký, xác minh danh tính (eKYC)', 'n'), ('m1', 'Tải, theo dõi chứng nhận', 'n'),
             ('m2', 'Theo dõi tồn kho của mình', 'n'), ('m3', 'Gửi chào hàng cho Farmery', 'n'),
             ('m4', 'Xác nhận đơn thu mua', 'n'), ('m5', 'Phản hồi RFQ, thương lượng', 'n'),
             ('m6', 'UC-D4 Xác nhận giao kết hợp đồng sỉ', 'n'), ('m7', 'Xem doanh thu, đối soát', 'n'),
             ('m8', 'Xem báo cáo thống kê', 'd'), ('m9', 'Đăng sản phẩm, khai báo lô', 'n'),
             ('m10', 'UC-B2 Ghi nhật ký canh tác theo lô', 'n')]
    sides = {'s0': (0, 'Khai báo loại người bán cho thuế', 'n'), 's2': (2, 'UC-B4 Duyệt sản phẩm và lô', 'n'),
             's9': (9, 'Kiểm tra tính hợp lệ sản phẩm', 'n'), 's10': (10, 'Đính chính bản ghi', 'n')}
    deps = [('m0', 's0', 'include'), ('m9', 's9', 'include'), ('s10', 'm10', 'extend')]
    left = [('ncc', 'Nhà cung cấp', ['m%d' % i for i in range(11)], False, 4.4, False),
            ('sup', 'Hỗ trợ vùng', ['m10'], False, 10.6, False)]
    right = [('mod', 'Kiểm duyệt viên', ['m1', 's2'], False, 0.9, False),
             ('src', 'Nhân viên thu mua', ['m4'], False, 3.4, False),
             ('si', 'Khách sỉ', ['m5', 'm6'], False, 5.2, False)]
    run_detail('usecase-nha-ban.html', 12.6, PK['A'][1], mains, sides, deps, left, right,
               note='Hỗ trợ vùng ghi nhật ký thay nhà cung cấp khi cần; hệ thống tự sinh mã QR khi lô được duyệt (bước của UC-B4, không phải use case riêng).')


def retail():
    mains = [('m0', 'Tìm kiếm sản phẩm', 'b'), ('m1', 'Quét QR, xem trang truy xuất', 'b'),
             ('m2', 'Xem chi tiết, sản phẩm tương tự', 'b'), ('m3', 'Đăng ký tài khoản', 'n'),
             ('m4', 'Quản lý giỏ hàng', 'b'), ('m5', 'UC-C4 Đặt hàng, thanh toán', 'b'),
             ('m6', 'Theo dõi đơn hàng', 'b'), ('m7', 'UC-C6 Yêu cầu đổi trả, hoàn tiền', 'b'),
             ('m8', 'Đánh giá sản phẩm', 'b'), ('m9', 'Mua lại đơn cũ', 'b'),
             ('m10', 'Nhận hóa đơn điện tử', 'n'), ('m11', 'Đăng ký báo vào mùa', 'b'),
             ('m12', 'Quản lý sổ địa chỉ, quyền dữ liệu', 'n'), ('m13', 'Danh sách yêu thích', 'd'),
             ('m14', 'Áp mã giảm giá', 'd')]
    sides = {'s4': (4, 'Trả khi nhận hàng (COD)', 'n'), 's7': (7, 'Trao đổi theo đơn', 'n')}
    deps = [('s4', 'm5', 'extend'), ('m7', 's7', 'include')]
    left = [('vl', 'Khách vãng lai', ['m0', 'm1', 'm2', 'm3'], False, 0.9, False),
            ('le', 'Khách lẻ', ['m%d' % i for i in range(4, 15)], False, 8.4, False)]
    right = [('tt', 'Cổng thanh toán', ['m5'], True, 4.75, False),
             ('ops', 'Nhân viên vận hành', ['s7'], False, 6.6, False),
             ('hd', 'Dịch vụ HĐĐT', ['m10'], True, 9.8, False)]
    run_detail('usecase-nguoi-mua-le.html', 15.2, PK['C'][1], mains, sides, deps, left, right,
               gens=[('le', 'vl', 20)],
               note='COD chỉ khi đơn dưới ngưỡng và tài khoản chưa từng từ chối nhận hàng; hoàn tiền đi qua cổng thanh toán.')


def wholesale():
    mains = [('m0', 'Xem giá sỉ theo MOQ', 'n'), ('m1', 'Gửi yêu cầu báo giá (RFQ)', 'n'),
             ('m2', 'Thương lượng báo giá', 'n'), ('m3', 'UC-D4 Chốt báo giá, giao kết hợp đồng', 'n'),
             ('m4', 'Theo dõi, nhận đơn sỉ một đợt', 'n'), ('m5', 'Thanh toán đơn sỉ', 'n'),
             ('m6', 'Nộp ký quỹ', 'd'), ('m7', 'Khiếu nại đơn sỉ', 'n'), ('m8', 'Giao nhận nhiều đợt', 'd')]
    sides = {'s1': (1, 'Kiểm tra đạt MOQ', 'n'), 's4': (4, 'Xác nhận giao kết bằng OTP', 'n')}
    deps = [('m1', 's1', 'include'), ('m3', 's4', 'include')]
    left = [('si', 'Khách sỉ', ['m%d' % i for i in range(9)], False, 3.4, False)]
    right = [('ncc', 'Nhà cung cấp', ['m2', 'm3'], False, 1.8, False),
             ('tt', 'Cổng thanh toán', ['m5', 'm6'], True, 5.0, False),
             ('ops', 'Nhân viên vận hành', ['m7'], False, 7.0, False)]
    run_detail('usecase-nguoi-mua-si.html', 9.6, PK['B'][1], mains, sides, deps, left, right,
               note='Luồng bán sỉ 3P tối giản: giao một đợt, thanh toán thường. Nhà cung cấp là actor chính cùng khách sỉ ở bước thương lượng và giao kết.')


def internal_supply():
    mains = [('m0', 'Xem chào hàng của nhà cung cấp', 'n'), ('m1', 'Định giá bán lẻ', 'n'),
             ('m2', 'UC-B5 Lập đơn thu mua và nghiệm thu', 'n'), ('m3', 'Đóng gói, in tem QR và nhãn', 'n'),
             ('m4', 'Quản lý dòng tồn, sổ nhập xuất', 'n'), ('m5', 'Lập chuyến trung chuyển', 'n'),
             ('m6', 'Tạo vận đơn chặng cuối', 'n'), ('m7', 'Sơ chế, phân loại nhiều bước', 'd'),
             ('m8', 'Kiểm kê định kỳ', 'd'), ('m9', 'Nhập liệu hộ nhà cung cấp', 'n')]
    sides = {'s1': (1, 'Xem dự báo giá', 'n')}
    deps = [('m1', 's1', 'include')]
    left = [('src', 'Nhân viên thu mua', ['m0', 'm1', 'm2'], False, 0.4, False),
            ('wh', 'Nhân viên kho', ['m2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'], False, 4.4, False),
            ('sup', 'Hỗ trợ vùng', ['m9'], False, 8.6, False)]
    right = [('ncc', 'Nhà cung cấp', ['m2'], False, 1.9, False),
             ('pl', 'Đơn vị vận chuyển', ['m6'], True, 5.5, False)]
    run_detail('usecase-noibo-nguonhang.html', 10.6, PK['E'][1], mains, sides, deps, left, right,
               note='Nhà cung cấp xác nhận đơn thu mua trên ứng dụng mua hàng; dự báo giá chỉ để tham khảo khi định giá.')


def internal_ops():
    mains = [('m0', 'Duyệt hồ sơ, loại thuế, chứng nhận', 'n'), ('m1', 'UC-B4 Duyệt sản phẩm và lô', 'n'),
             ('m2', 'UC-C7 Kiểm duyệt đánh giá nghi vấn', 'n'), ('m3', 'Xử lý vi phạm nội dung', 'n'),
             ('m4', 'Xử lý khiếu nại, đổi trả', 'n'), ('m5', 'Ra lệnh hoàn tiền', 'n'),
             ('m6', 'Giám sát đơn và giao hàng', 'n'), ('m7', 'Thu hồi lô', 'n'), ('m8', 'Xem báo cáo thống kê', 'd'),
             ('m9', 'Quản lý tài khoản nội bộ, vai trò', 'n'), ('m10', 'Cấu hình biểu phí, ngưỡng, thời hạn', 'n'),
             ('m11', 'Xem nhật ký thao tác', 'n')]
    sides = {'s3': (3, 'Hạn chế tài khoản người bán', 'n'), 's4': (4, 'Trao đổi theo đơn', 'n')}
    deps = [('s3', 'm3', 'extend'), ('m4', 's4', 'include')]
    left = [('mod', 'Kiểm duyệt viên', ['m0', 'm1', 'm2', 'm3'], False, 1.0, False),
            ('ops', 'Nhân viên vận hành', ['m4', 'm5', 'm6', 'm7', 'm8'], False, 5.5, False),
            ('own', 'Quản trị viên', ['m9', 'm10', 'm11'], False, 9.6, False)]
    right = [('le', 'Khách lẻ', ['s4'], False, 2.9, False),
             ('tt', 'Cổng thanh toán', ['m5'], True, 4.85, False)]
    run_detail('usecase-noibo-vanhanh.html', 12.6, PK['D'][1], mains, sides, deps, left, right,
               note='Hạn chế tài khoản người bán có hiệu lực sau 5 ngày báo trước, trừ khi cơ quan nhà nước yêu cầu; cấu hình gồm biểu phí, ngưỡng, thời hạn đổi trả, COD, giờ chốt đơn, khung giờ giao.')


overview()
supplier()
retail()
wholesale()
internal_supply()
internal_ops()
print('ok')
