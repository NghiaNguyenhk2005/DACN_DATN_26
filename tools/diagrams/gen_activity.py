# -*- coding: utf-8 -*-
# Sinh 10 sơ đồ hoạt động UML có swimlane (act-*.html) vào tools/design/.
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page, wrap

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
W = 1340
INK = '#16241e'
LINE = '#3d4a43'
LANE = {'person': ('#1f5f3a', '#eef6f1'), 'staff': ('#6b4fa0', '#f4f1fa'),
        'sys': ('#1a5fa8', '#eef4fb'), 'ext': ('#5f6b65', '#f0f2f1')}
HEAD, TOP, GAP = 58, 30, 44


class Act:
    """Sơ đồ hoạt động: nút đặt theo (lane, hàng), cạnh đi vuông góc, nhãn điều kiện có nền."""

    def __init__(self, lanes):
        self.lanes = lanes
        self.lw = (W - 20) / len(lanes)
        self.nodes, self.edges = {}, []

    def n(self, nid, lane, row, kind, text='', dx=0, w=None):
        self.nodes[nid] = dict(lane=lane, row=row, kind=kind, text=text, dx=dx, w=w)

    def e(self, a, b, guard=None, out='b', into='t', y=None, x=None, gpos=None):
        self.edges.append(dict(a=a, b=b, guard=guard, out=out, into=into, y=y, x=x, gpos=gpos))

    # ---- kích thước nút ----
    def _size(self, nd):
        k, bw = nd['kind'], nd['w'] or (self.lw - 70)
        if k == 'start':
            return 30, 30
        if k == 'end':
            return 34, 34
        if k == 'bar':
            return (nd['w'] or self.lw - 70), 9
        if k == 'time':
            return 30, 42
        if k == 'merge':
            return 40, 40
        lines = wrap(nd['text'], bw - (60 if k in ('dec', 'accept') else 30), 22)
        nd['lines'] = lines
        h = len(lines) * 27 + (30 if k == 'dec' else 24)
        return bw, max(h, 56 if k == 'dec' else 50)

    def layout(self):
        for nd in self.nodes.values():
            nd['bw'], nd['bh'] = self._size(nd)
        rows = sorted(set(nd['row'] for nd in self.nodes.values()))
        rh = {r: max(nd['bh'] for nd in self.nodes.values() if nd['row'] == r) for r in rows}
        y, self.rowy = HEAD + TOP, {}
        for r in rows:
            self.rowy[r] = y + rh[r] / 2
            y += rh[r] + GAP
        self.h = y - GAP + 30
        for nd in self.nodes.values():
            nd['cx'] = 10 + self.lw * (nd['lane'] + 0.5) + nd['dx']
            nd['cy'] = self.rowy[nd['row']]

    def port(self, nd, side):
        x, y, w, h = nd['cx'], nd['cy'], nd['bw'], nd['bh']
        if nd['kind'] == 'time':
            w = 30
        return {'t': (x, y - h / 2), 'b': (x, y + h / 2), 'l': (x - w / 2, y), 'r': (x + w / 2, y)}[side]

    # ---- vẽ ----
    def draw_node(self, s, nd):
        k, x, y, w, h = nd['kind'], nd['cx'], nd['cy'], nd['bw'], nd['bh']
        if k == 'start':
            s.add('<circle cx="%g" cy="%g" r="15" fill="%s"/>' % (x, y, INK))
        elif k == 'end':
            s.add('<circle cx="%g" cy="%g" r="17" fill="#fff" stroke="%s" stroke-width="2.4"/>'
                  '<circle cx="%g" cy="%g" r="10" fill="%s"/>' % (x, y, INK, x, y, INK))
        elif k == 'bar':
            s.add('<rect x="%g" y="%g" width="%g" height="9" rx="2" fill="%s"/>' % (x - w / 2, y - 4.5, w, INK))
        elif k == 'merge':
            s.add('<polygon points="%g,%g %g,%g %g,%g %g,%g" fill="#fdf1dc" stroke="#c98a1a" stroke-width="2.2"/>'
                  % (x, y - 20, x + 20, y, x, y + 20, x - 20, y))
        elif k == 'time':
            s.add('<path d="M%g,%g L%g,%g L%g,%g L%g,%g Z" fill="#fff" stroke="%s" stroke-width="2.4"/>'
                  % (x - 15, y - 21, x + 15, y - 21, x - 15, y + 21, x + 15, y + 21, INK))
            s.label(x + 26 + (self.lw / 2 - 30) / 2, y, nd['text'], self.lw / 2 - 30, color=INK, bg='#ffffff', italic=False)
            return
        else:
            if k == 'dec':
                s.add('<polygon points="%g,%g %g,%g %g,%g %g,%g %g,%g %g,%g" fill="#fdf1dc" stroke="#c98a1a" stroke-width="2.2"/>'
                      % (x - w / 2, y, x - w / 2 + 22, y - h / 2, x + w / 2 - 22, y - h / 2, x + w / 2, y,
                         x + w / 2 - 22, y + h / 2, x - w / 2 + 22, y + h / 2))
            elif k == 'accept':
                s.add('<polygon points="%g,%g %g,%g %g,%g %g,%g %g,%g" fill="#fff" stroke="%s" stroke-width="2.4"/>'
                      % (x - w / 2, y - h / 2, x + w / 2, y - h / 2, x + w / 2, y + h / 2, x - w / 2, y + h / 2,
                         x - w / 2 + 22, y, '#1a5fa8'))
            else:
                s.rect(x - w / 2, y - h / 2, w, h, '#ffffff', '#1a5fa8', 2.4, 16)
            lines = nd['lines']
            top = y - len(lines) * 27 / 2 - 4
            for i, ln in enumerate(lines):
                s.text(x + (8 if k == 'accept' else 0), top + (i + 1) * 27 - 2, ln, 22, 500, INK)

    def draw_edge(self, s, ed):
        A, B = self.nodes[ed['a']], self.nodes[ed['b']]
        (xa, ya), (xb, yb) = self.port(A, ed['out']), self.port(B, ed['into'])
        if A['kind'] == 'bar' and ed['out'] == 'b':
            xa = min(max(xb, A['cx'] - A['bw'] / 2 + 6), A['cx'] + A['bw'] / 2 - 6)
        if B['kind'] == 'bar' and ed['into'] == 't':
            xb = min(max(xa, B['cx'] - B['bw'] / 2 + 6), B['cx'] + B['bw'] / 2 - 6)
        if ed['out'] == 'b' and ed['into'] == 't':
            if abs(xa - xb) < 1:
                pts = [(xa, ya), (xb, yb)]
            else:
                ym = ed['y'] if ed['y'] is not None else yb - 16
                pts = [(xa, ya), (xa, ym), (xb, ym), (xb, yb)]
        elif ed['out'] in 'lr' and ed['into'] == 't':
            pts = [(xa, ya), (xb, ya), (xb, yb)]
        elif ed['out'] in 'lr' and ed['into'] in 'lr':
            if abs(ya - yb) < 1:
                pts = [(xa, ya), (xb, yb)]
            else:
                xm = ed['x'] if ed['x'] is not None else (xa + xb) / 2
                pts = [(xa, ya), (xm, ya), (xm, yb), (xb, yb)]
        elif ed['out'] == 'b' and ed['into'] in 'lr':
            pts = [(xa, ya), (xa, yb), (xb, yb)]
        else:
            pts = [(xa, ya), (xb, yb)]
        if ed['x'] is not None and ed['out'] == 'b' and ed['into'] == 't':
            ym1, ym2 = ya + GAP / 2, yb - GAP / 2
            pts = [(xa, ya), (xa, ym1), (ed['x'], ym1), (ed['x'], ym2), (xb, ym2), (xb, yb)]
        s.add('<polyline points="%s" fill="none" stroke="%s" stroke-width="2.2" marker-end="url(#ah)"/>'
              % (' '.join('%g,%g' % p for p in pts), LINE))
        if ed['guard']:
            g = '[%s]' % ed['guard']
            lines = wrap(g, 230, 22)
            wl = max(len(l) for l in lines) * 11 + 16
            if ed['gpos']:
                gx, gy = ed['gpos']
                gx, gy = xa + gx, ya + gy
            elif ed['out'] == 'b':
                # nhãn nằm phía ngược hướng gấp để không đè đoạn ngang
                sgn = -1 if pts[-1][0] > xa + 1 else 1
                if not (wl / 2 + 8 < xa + sgn * (10 + wl / 2) < W - wl / 2 - 8):
                    sgn = -sgn
                gx, gy = xa + sgn * (10 + wl / 2), ya + 4 + len(lines) * 13
            else:
                sgn = 1 if ed['out'] == 'r' else -1
                gx, gy = xa + sgn * (12 + wl / 2), ya + 8 + len(lines) * 13
            s.label(gx, gy, g, wl, color='#7a4d00', bg='#ffffff')

    def render(self, fname, note=''):
        self.layout()
        s = Svg(W, self.h)
        for i, (name, kind) in enumerate(self.lanes):
            hc, fc = LANE[kind]
            x = 10 + i * self.lw
            s.add('<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (x, 10, self.lw, self.h - 10, fc))
            s.add('<rect x="%g" y="10" width="%g" height="%g" fill="%s"/>' % (x, self.lw, HEAD, hc))
            s.text(x + self.lw / 2, 10 + HEAD / 2 + 8, name, 23, 700, '#ffffff')
        for i in range(1, len(self.lanes)):
            x = 10 + i * self.lw
            s.add('<line x1="%g" y1="10" x2="%g" y2="%g" stroke="#ffffff" stroke-width="6"/>' % (x, x, self.h))
        for ed in self.edges:
            self.draw_edge(s, ed)
        for nd in self.nodes.values():
            self.draw_node(s, nd)
        svg = s.svg().replace('<defs>', '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" '
                              'markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="%s"/></marker>' % LINE, 1)
        io.open(os.path.join(OUT, fname + '.html'), 'w', encoding='utf-8').write(page('', '', svg, LEGEND, note))


LEGEND = ('<span><svg width="30" height="30"><circle cx="15" cy="15" r="11" fill="#16241e"/></svg>Bắt đầu</span>'
          '<span><svg width="30" height="30"><circle cx="15" cy="15" r="12" fill="#fff" stroke="#16241e" stroke-width="2"/><circle cx="15" cy="15" r="7" fill="#16241e"/></svg>Kết thúc</span>'
          '<span><svg width="44" height="28"><polygon points="2,14 10,3 34,3 42,14 34,25 10,25" fill="#fdf1dc" stroke="#c98a1a" stroke-width="2"/></svg>Quyết định [điều kiện]</span>'
          '<span><svg width="44" height="14"><rect x="2" y="3" width="40" height="8" fill="#16241e"/></svg>Song song</span>'
          '<span><svg width="24" height="30"><path d="M3,2 L21,2 L3,28 L21,28 Z" fill="#fff" stroke="#16241e" stroke-width="2"/></svg>Thời gian</span>'
          '<span><svg width="44" height="28"><polygon points="2,3 42,3 42,25 2,25 12,14" fill="#fff" stroke="#1a5fa8" stroke-width="2"/></svg>Nhận tín hiệu ngoài</span>')


def thu_mua():
    a = Act([('Nhà cung cấp', 'person'), ('NV thu mua', 'staff'), ('NV kho', 'staff'), ('Hệ thống', 'sys')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Gửi chào hàng cho lô đã duyệt')
    a.n('a2', 1, 2, 'act', 'Xem chào hàng, tồn kho, giá dự báo')
    a.n('a3', 1, 3, 'act', 'Lập đơn thu mua')
    a.n('d1', 0, 4, 'dec', 'Xác nhận đơn?')
    a.n('x1', 1, 4, 'end')
    a.n('a4', 3, 5, 'act', 'Giữ chỗ trên dòng tồn của nhà cung cấp')
    a.n('a5', 0, 6, 'act', 'Đưa hàng về kho (chặng đầu)')
    a.n('a6', 2, 7, 'act', 'Nghiệm thu theo tiêu chuẩn')
    a.n('d2', 2, 8, 'dec', 'Có phần đạt?')
    a.n('x2', 3, 8, 'end')
    a.n('a7', 3, 9, 'act', 'Phần đạt sang dòng tồn Farmery; ghi khoản phải trả')
    a.n('a8', 2, 10, 'act', 'Đóng gói một bước, in tem QR và nhãn')
    a.n('a9', 1, 11, 'act', 'Đặt giá bán lẻ')
    a.n('a10', 3, 12, 'act', 'Mở bán')
    a.n('e', 3, 13, 'end')
    a.e('s', 'a1'); a.e('a1', 'a2'); a.e('a2', 'a3'); a.e('a3', 'd1')
    a.e('d1', 'x1', 'không', out='r', into='l')
    a.e('d1', 'a4', 'đồng ý'); a.e('a4', 'a5'); a.e('a5', 'a6'); a.e('a6', 'd2')
    a.e('d2', 'x2', 'không', out='r', into='l')
    a.e('d2', 'a7', 'có'); a.e('a7', 'a8'); a.e('a8', 'a9'); a.e('a9', 'a10'); a.e('a10', 'e')
    a.render('act-thu-mua', 'Nhà cung cấp từ chối hoặc quá hạn xác nhận thì đơn tự hủy; phần bị từ chối khi nghiệm thu ở lại dòng tồn của nhà cung cấp, kèm biên bản.')


def dat_hang():
    a = Act([('Khách lẻ', 'person'), ('Hệ thống', 'sys'), ('Cổng thanh toán', 'ext')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Chọn địa chỉ, khung giờ, cách thanh toán')
    a.n('a2', 1, 2, 'act', 'Hiện tiền hàng, thuế, cước giao')
    a.n('a3', 0, 3, 'act', 'Xác nhận đặt hàng')
    a.n('a4', 1, 4, 'act', 'Khóa dòng tồn, giữ chỗ 15 phút')
    a.n('d1', 1, 5, 'dec', 'Đủ tồn?')
    a.n('x1', 2, 5, 'end')
    a.n('d2', 1, 6, 'dec', 'Cách thanh toán?')
    a.n('a5', 2, 7, 'act', 'Khách thanh toán trên trang của cổng')
    a.n('a6', 1, 8, 'accept', 'Nhận webhook kết quả')
    a.n('d3', 1, 9, 'dec', 'Thành công trong 15 phút?')
    a.n('a7', 2, 9, 'act', 'Hủy đơn, nhả giữ chỗ')
    a.n('x2', 2, 10, 'end')
    a.n('m', 1, 10, 'merge')
    a.n('a8', 1, 11, 'act', 'Trừ tồn, đơn "Đã thanh toán"')
    a.n('f1', 1, 12, 'bar', dx=-a.lw / 2, w=a.lw * 1.6)
    a.n('a9', 0, 13, 'act', 'Nhận thông báo')
    a.n('a10', 1, 13, 'act', 'Đưa vào hàng đóng gói')
    a.n('e', 1, 14, 'end')
    a.e('s', 'a1'); a.e('a1', 'a2'); a.e('a2', 'a3'); a.e('a3', 'a4'); a.e('a4', 'd1')
    a.e('d1', 'x1', 'không', out='r', into='l')
    a.e('d1', 'd2', 'có')
    a.e('d2', 'a5', 'trả trước', out='r', into='t')
    a.e('d2', 'm', 'COD', out='l', into='l', x=10 + a.lw + 40, gpos=(-48, 26))
    a.e('a5', 'a6', y=None)
    a.e('a6', 'd3')
    a.e('d3', 'a7', 'không', out='r', into='l')
    a.e('a7', 'x2')
    a.e('d3', 'm', 'có'); a.e('m', 'a8'); a.e('a8', 'f1')
    a.e('f1', 'a9'); a.e('f1', 'a10'); a.e('a10', 'e')
    a.render('act-dat-hang', 'Không đủ tồn: báo hết hàng. COD chỉ khi đơn dưới ngưỡng và tài khoản chưa từng từ chối nhận hàng. Đơn xác nhận sau giờ chốt vào chuyến trung chuyển ngày kế tiếp.')


def giao_hang():
    a = Act([('Hệ thống', 'sys'), ('NV kho', 'staff'), ('3PL', 'ext'), ('Khách lẻ', 'person')])
    a.n('s', 0, 0, 'start')
    a.n('t1', 0, 1, 'time', 'Đến giờ chốt đơn')
    a.n('a1', 0, 2, 'act', 'Lập danh sách đơn cho chuyến trung chuyển')
    a.n('a2', 1, 3, 'act', 'Đóng gói, dán tem QR')
    a.n('a3', 1, 4, 'act', 'Xếp lên xe lạnh: "Lên chuyến"')
    a.n('a4', 1, 5, 'act', 'Bàn giao tại TP.HCM')
    a.n('a5', 0, 6, 'act', 'Tạo vận đơn chặng cuối theo khung giờ')
    a.n('a6', 2, 7, 'act', 'Nhận hàng, giao theo khung giờ')
    a.n('a7', 3, 8, 'act', 'Đồng kiểm khi nhận')
    a.n('d1', 3, 9, 'dec', 'Hàng đạt?')
    a.n('a8', 2, 10, 'act', 'Hoàn hàng về kho')
    a.n('x1', 2, 11, 'end')
    a.n('a9', 0, 10, 'accept', 'Nhận webhook "Đã giao"')
    a.n('t2', 0, 11, 'time', 'Hết thời hạn khiếu nại')
    a.n('a10', 0, 12, 'act', 'Hoàn tất, phát hành HĐĐT giả lập')
    a.n('e', 0, 13, 'end')
    a.e('s', 't1'); a.e('t1', 'a1'); a.e('a1', 'a2'); a.e('a2', 'a3'); a.e('a3', 'a4'); a.e('a4', 'a5')
    a.e('a5', 'a6'); a.e('a6', 'a7'); a.e('a7', 'd1')
    a.e('d1', 'a8', 'từ chối', y=None)
    a.e('d1', 'a9', 'nhận', out='l', into='t')
    a.e('a8', 'x1'); a.e('a9', 't2'); a.e('t2', 'a10'); a.e('a10', 'e')
    a.render('act-giao-hang', 'Khách từ chối vì hàng hỏng được hoàn 100% kể cả cước giao.')


def doi_tra():
    a = Act([('Khách lẻ', 'person'), ('Hệ thống', 'sys'), ('NV vận hành', 'staff'), ('Cổng thanh toán', 'ext')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Gửi yêu cầu kèm ảnh hoặc video')
    a.n('d1', 1, 2, 'dec', 'Trong thời hạn?')
    a.n('x1', 0, 2, 'end')
    a.n('a2', 1, 3, 'act', 'Tiếp nhận trong 24 giờ, đưa vào hàng đợi')
    a.n('a3', 2, 4, 'act', 'Xem minh chứng, trao đổi với khách')
    a.n('a4', 2, 5, 'act', 'Quyết định trong 3 ngày làm việc')
    a.n('d2', 2, 6, 'dec', 'Quyết định?')
    a.n('a7', 3, 7, 'act', 'Hoàn tiền trong 7 ngày làm việc')
    a.n('m2', 2, 8, 'merge')
    a.n('a8', 1, 9, 'act', 'Đóng yêu cầu, ghi sổ, thông báo')
    a.n('e', 1, 10, 'end')
    a.e('s', 'a1'); a.e('a1', 'd1')
    a.e('d1', 'x1', 'không', out='l', into='r')
    a.e('d1', 'a2', 'có'); a.e('a2', 'a3'); a.e('a3', 'a4'); a.e('a4', 'd2')
    a.e('d2', 'a7', 'hoàn tiền', out='r', into='t')
    a.e('d2', 'm2', 'từ chối')
    a.e('a7', 'm2', out='b', into='r')
    a.e('m2', 'a8'); a.e('a8', 'e')
    a.render('act-doi-tra', 'Quá thời hạn của nhóm hàng hoặc đổi ý với hàng tươi: không tạo yêu cầu. Dưới ngưỡng: hoàn tiền không cần trả hàng, ghi bút toán hủy; trên ngưỡng: nhận hàng trả về trước. Quá hạn xử lý thì tự nâng mức ưu tiên.')


def dang_ky_ncc():
    a = Act([('Nhà cung cấp', 'person'), ('Hệ thống', 'sys'), ('Kiểm duyệt viên', 'staff')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Đăng ký, khai báo loại người bán')
    a.n('a2', 1, 2, 'act', 'Gửi OTP')
    a.n('a3', 0, 3, 'act', 'Nhập OTP')
    a.n('d1', 1, 4, 'dec', 'OTP đúng?')
    a.n('x1', 2, 4, 'end')
    a.n('a4', 0, 5, 'act', 'Tải giấy tờ eKYC, chứng nhận')
    a.n('a5', 2, 6, 'act', 'Đối chiếu eKYC, mã vùng trồng')
    a.n('a6', 2, 7, 'act', 'Duyệt chứng nhận, loại người bán')
    a.n('d2', 2, 8, 'dec', 'Đạt?')
    a.n('a7', 1, 9, 'act', '"Đã xác thực", mở quyền đăng bán (UserVerified)')
    a.n('a8', 0, 9, 'act', 'Nhận lý do, bổ sung hồ sơ')
    a.n('e', 1, 10, 'end')
    a.e('s', 'a1'); a.e('a1', 'a2'); a.e('a2', 'a3'); a.e('a3', 'd1')
    a.e('d1', 'x1', 'sai 5 lần', out='r', into='l')
    a.e('d1', 'a4', 'đúng'); a.e('a4', 'a5'); a.e('a5', 'a6'); a.e('a6', 'd2')
    a.e('d2', 'a7', 'đạt')
    a.e('d2', 'a8', 'không đạt', out='l', into='t')
    a.e('a8', 'a4', out='l', into='l', x=30)
    a.e('a7', 'e')
    a.render('act-dang-ky-ncc', 'Nhập sai OTP 5 lần: khóa 30 phút. Hồ sơ không đạt quay lại bước tải giấy tờ; xác minh trong 5 ngày làm việc.')


def dang_san_pham():
    a = Act([('Nhà cung cấp', 'person'), ('Hệ thống', 'sys'), ('Kiểm duyệt viên', 'staff')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Tạo sản phẩm, khai báo lô')
    a.n('a2', 0, 2, 'act', 'Ghi nhật ký canh tác')
    a.n('a3', 1, 3, 'act', 'Kiểm tra tự động: danh mục lá, loại trừ, ảnh, giá')
    a.n('d1', 1, 4, 'dec', 'Hợp lệ?')
    a.n('x1', 0, 4, 'end')
    a.n('d2', 1, 5, 'dec', 'Uy tín từ 80?')
    a.n('a4', 2, 6, 'act', 'Duyệt thủ công')
    a.n('d3', 2, 7, 'dec', 'Đạt?')
    a.n('x2', 2, 8, 'end')
    a.n('m', 1, 8, 'merge')
    a.n('f1', 1, 9, 'bar')
    a.n('a5', 1, 10, 'act', 'Sinh mã lô, mã QR', dx=-100, w=170)
    a.n('a6', 1, 10, 'act', 'Mở dòng tồn', dx=100, w=170)
    a.n('f2', 1, 11, 'bar')
    a.n('a7', 1, 12, 'act', 'Hiển thị công khai')
    a.n('e', 1, 13, 'end')
    a.e('s', 'a1'); a.e('a1', 'a2'); a.e('a2', 'a3'); a.e('a3', 'd1')
    a.e('d1', 'x1', 'không', out='l', into='r')
    a.e('d1', 'd2', 'có')
    a.e('d2', 'a4', 'không', out='r', into='t')
    a.e('d2', 'm', 'có')
    a.e('a4', 'd3')
    a.e('d3', 'x2', 'không')
    a.e('d3', 'm', 'đạt', out='l', into='r')
    a.e('m', 'f1'); a.e('f1', 'a5'); a.e('f1', 'a6'); a.e('a5', 'f2'); a.e('a6', 'f2'); a.e('f2', 'a7'); a.e('a7', 'e')
    a.render('act-dang-san-pham', 'Không hợp lệ hoặc không đạt: báo lý do cho nhà cung cấp. Uy tín từ 80 điểm: hậu kiểm, hiển thị trước rồi kiểm duyệt sau. Mở dòng tồn qua sự kiện BatchApproved.')


def ban_si():
    a = Act([('Khách sỉ', 'person'), ('Hệ thống', 'sys'), ('Nhà cung cấp', 'person')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Xem bảng giá, gửi RFQ')
    a.n('d1', 1, 2, 'dec', 'Đạt MOQ?')
    a.n('x1', 0, 2, 'end')
    a.n('a2', 2, 3, 'act', 'Phản hồi báo giá')
    a.n('a3', 0, 4, 'act', 'Thương lượng trong kênh RFQ')
    a.n('a4', 1, 5, 'act', 'Sinh hợp đồng nháp từ mẫu')
    a.n('f1', 1, 6, 'bar', w=a.lw * 2.2)
    a.n('a5', 0, 7, 'act', 'Xác nhận bằng OTP')
    a.n('a6', 2, 7, 'act', 'Xác nhận bằng OTP')
    a.n('f2', 1, 8, 'bar', w=a.lw * 2.2)
    a.n('a7', 1, 9, 'act', 'Lưu mã băm, giữ chỗ dòng tồn của nhà cung cấp')
    a.n('a8', 2, 10, 'act', 'Giao một đợt, xuất hóa đơn')
    a.n('d2', 0, 11, 'dec', 'Nhận đủ, đạt?')
    a.n('a9', 0, 12, 'act', 'Thanh toán qua cổng')
    a.n('a10', 1, 12, 'act', 'Khiếu nại theo hợp đồng')
    a.n('x2', 1, 13, 'end')
    a.n('a11', 1, 14, 'act', 'Ghi hoa hồng, đối soát')
    a.n('e', 1, 15, 'end')
    a.e('s', 'a1'); a.e('a1', 'd1')
    a.e('d1', 'x1', 'chưa đạt', out='l', into='r')
    a.e('d1', 'a2', 'đạt'); a.e('a2', 'a3'); a.e('a3', 'a4'); a.e('a4', 'f1')
    a.e('f1', 'a5'); a.e('f1', 'a6'); a.e('a5', 'f2'); a.e('a6', 'f2'); a.e('f2', 'a7'); a.e('a7', 'a8'); a.e('a8', 'd2')
    a.e('d2', 'a9', 'đạt'); a.e('d2', 'a10', 'không', out='r', into='t')
    a.e('a9', 'a11', out='b', into='l'); a.e('a11', 'e')
    a.e('a10', 'x2')
    a.render('act-ban-si', 'Chưa đạt MOQ: gợi ý gộp đơn hoặc chuyển sang bán lẻ. Giao nhiều đợt và ký quỹ chỉ thiết kế; khiếu nại đơn sỉ theo điều khoản hợp đồng.')


def danh_gia():
    a = Act([('Khách lẻ', 'person'), ('Hệ thống', 'sys'), ('Kiểm duyệt viên', 'staff'), ('Nhà cung cấp', 'person')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Đánh giá đơn đã hoàn tất')
    a.n('a2', 1, 2, 'act', 'Kiểm tra tự động, luật ngưỡng')
    a.n('d1', 1, 3, 'dec', 'Nghi vấn?')
    a.n('a3', 2, 4, 'act', 'Xem xét thủ công')
    a.n('d2', 2, 5, 'dec', 'Hợp lệ?')
    a.n('a4', 2, 6, 'act', 'Ẩn, báo lý do')
    a.n('x1', 2, 7, 'end')
    a.n('m', 1, 6, 'merge')
    a.n('a5', 1, 7, 'act', 'Công khai, cập nhật điểm uy tín')
    a.n('a6', 3, 8, 'act', 'Phản hồi công khai một lần')
    a.n('e', 3, 9, 'end')
    a.e('s', 'a1'); a.e('a1', 'a2'); a.e('a2', 'd1')
    a.e('d1', 'a3', 'có', out='r', into='t')
    a.e('d1', 'm', 'không')
    a.e('a3', 'd2'); a.e('d2', 'a4', 'không'); a.e('a4', 'x1')
    a.e('d2', 'm', 'có', out='l', into='r')
    a.e('m', 'a5'); a.e('a5', 'a6'); a.e('a6', 'e')
    a.render('act-danh-gia', 'Chỉ người đã mua được đánh giá; đánh giá bị ẩn không tính vào điểm uy tín.')


def thu_hoi():
    a = Act([('NV vận hành', 'staff'), ('Hệ thống', 'sys'), ('Người mua', 'person')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Phát hiện vấn đề ở một lô')
    a.n('a2', 0, 2, 'act', 'Ra lệnh thu hồi')
    a.n('f1', 1, 3, 'bar', dx=180, w=790)
    a.n('a3', 1, 4, 'act', 'Khóa mọi dòng tồn của lô', dx=-110, w=200)
    a.n('a4', 1, 4, 'act', 'Lập danh sách đơn đã bán', dx=110, w=200)
    a.n('a5', 2, 4, 'act', 'Cảnh báo trên trang truy xuất', w=260)
    a.n('f2', 1, 5, 'bar', dx=180, w=790)
    a.n('a6', 1, 6, 'act', 'Phát BatchRecalled')
    a.n('a7', 2, 7, 'act', 'Nhận thông báo thu hồi')
    a.n('a8', 0, 8, 'act', 'Đổi trả, hoàn tiền đơn bị ảnh hưởng')
    a.n('e', 0, 9, 'end')
    a.e('s', 'a1'); a.e('a1', 'a2'); a.e('a2', 'f1')
    a.e('f1', 'a3'); a.e('f1', 'a4'); a.e('f1', 'a5')
    a.e('a3', 'f2'); a.e('a4', 'f2'); a.e('a5', 'f2'); a.e('f2', 'a6'); a.e('a6', 'a7'); a.e('a7', 'a8'); a.e('a8', 'e')
    a.render('act-thu-hoi', 'Khi thu hồi, dòng tồn của lô bị khóa ở cả hai luồng dù thuộc chủ nào.')


def vi_pham():
    a = Act([('Hệ thống', 'sys'), ('Người bán', 'person'), ('Nhân sự xử lý', 'staff')])
    a.n('s', 0, 0, 'start')
    a.n('a1', 0, 1, 'act', 'Cảnh báo luật ngưỡng hoặc báo cáo vi phạm')
    a.n('a2', 2, 2, 'act', 'Xem xét: kiểm duyệt viên (nội dung) hoặc NV vận hành (đơn hàng)')
    a.n('d2', 2, 3, 'dec', 'Nghiêm trọng?')
    a.n('a4', 0, 4, 'act', 'Ẩn ngay tin, lô; rà soát đơn đang xử lý')
    a.n('a7', 2, 4, 'act', 'Nhắc nhở, cảnh cáo hoặc tạm khóa')
    a.n('a5', 1, 5, 'act', 'Nhận thông báo trước 5 ngày')
    a.n('t1', 0, 6, 'time', 'Hết 5 ngày')
    a.n('a6', 0, 7, 'act', 'Khóa tài khoản')
    a.n('m2', 2, 8, 'merge')
    a.n('a8', 2, 9, 'act', 'Lưu vết lý do, quyết định')
    a.n('e', 2, 10, 'end')
    a.e('s', 'a1'); a.e('a1', 'a2'); a.e('a2', 'd2')
    a.e('d2', 'a4', 'có', out='l', into='t')
    a.e('d2', 'a7', 'không')
    a.e('a4', 'a5'); a.e('a5', 't1'); a.e('t1', 'a6'); a.e('a6', 'm2', out='b', into='l')
    a.e('a7', 'm2')
    a.e('m2', 'a8'); a.e('a8', 'e')
    a.render('act-vi-pham', 'Khóa tài khoản người bán có hiệu lực sau 5 ngày báo trước, trừ khi cơ quan nhà nước yêu cầu.')


for f in (thu_mua, dat_hang, giao_hang, doi_tra, dang_ky_ncc, dang_san_pham, ban_si, danh_gia, thu_hoi, vi_pham):
    f()
print('ok')
