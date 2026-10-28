# -*- coding: utf-8 -*-
# Sinh 4 sơ đồ tuần tự UML mức mô-đun (seq-*.html) vào tools/design/; lane và màu cùng quy ước hình luồng đơn lẻ
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page, wrap, BLK

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
W = 1340
WHITE, INK, MUTED, ARR, EVT, GREY = '#ffffff', '#16241e', '#4d5c55', '#44524b', '#6b4fa0', '#7d8882'
PERSON = ('#1f5f3a', '#12351f')
STAFF = ('#3d4a43', '#1f2924')
EXT = ('#e4e7e5', '#3d4a43')
HH = 112          # cao hộp đầu lane
FS = 22           # cỡ chữ nhãn (≈7pt khi in)
LH = 25           # cao một dòng nhãn
SW = 430          # bề rộng nhãn của lời tự gọi


def bg(s, x, y, text, weight):
    w = len(text) * FS * (0.53 if weight >= 600 else 0.49) + 10
    s.add('<rect x="%g" y="%g" width="%g" height="%g" fill="#ffffff" opacity="0.92"/>' % (x, y, w, LH))


class Seq:
    """lanes: [(khóa, tên, dòng phụ, kiểu)] kiểu = person | staff | ext | mod:<khối>.
    Bước: ('call'|'ret'|'evt', từ, tới, nhãn) · ('self', lane, nhãn) · ('frag', loại, [(điều kiện, [bước])])."""

    def __init__(self, lanes):
        self.lanes = lanes
        n = len(lanes)
        self.lw = W / n
        self.x = {k: self.lw * i + self.lw / 2 for i, (k, _, _, _) in enumerate(lanes)}
        self.items = []   # (loại, dữ liệu, y) để vẽ sau khi biết chiều cao
        self.n = 0

    # ---- đo và đặt
    def lab_w(self, a, b):
        return max(380, min(abs(self.x[b] - self.x[a]) - 24, 620))

    def run(self, steps, y, depth=0):
        for st in steps:
            if st[0] == 'frag':
                y = self.frag(st, y, depth)
                continue
            self.n += 1
            if st[0] == 'self':
                lines = wrap('%d. %s' % (self.n, st[2]), SW, FS)
                h = max(len(lines) * LH + 22, 44)
                self.items.append(('self', (st[1], '%d. %s' % (self.n, st[2])), y, h))
            else:
                kind, a, b, lab = st
                txt = '%d. %s' % (self.n, lab)
                lines = wrap(txt, self.lab_w(a, b) - 12, FS)
                h = len(lines) * LH + 24
                self.items.append((kind, (a, b, txt), y, h))
            y += h
        return y

    def lanes_in(self, steps):
        ks = set()
        for st in steps:
            if st[0] == 'frag':
                for _, sub in st[2]:
                    ks |= self.lanes_in(sub)
            elif st[0] == 'self':
                ks.add(st[1])
            else:
                ks |= {st[1], st[2]}
        return ks

    def frag(self, st, y, depth):
        _, kind, ops = st
        ks = set()
        for _, sub in ops:
            ks |= self.lanes_in(sub)
        xs = [self.x[k] for k in ks]
        pad = 118 - depth * 14
        x0 = max(6 + depth * 10, min(xs) - pad)
        x1 = min(W - 6 - depth * 10, max(xs) + pad + (190 if any(s[0] == 'self' for _, sub in ops for s in sub) else 0))
        top = y + 6
        y += 6
        seps = []
        for i, (guard, sub) in enumerate(ops):
            if i:
                seps.append(y)
            gl = wrap('[%s]' % guard, x1 - x0 - 110, FS)
            gy = y
            y += len(gl) * LH + 10
            seps.append(('guard', gy, gl))
            y = self.run(sub, y, depth + 1)
        y += 8
        self.items.insert(0, ('frag', (kind, x0, x1, seps), top, y - top))
        return y + 8

    # ---- vẽ
    def draw(self, steps, fname, note):
        y_end = self.run(steps, HH + 26)
        H = int(y_end + 24)
        s = Svg(W, H)
        for k, name, sub, kind in self.lanes:
            x = self.x[k] - self.lw / 2 + 6
            w = self.lw - 12
            if kind in ('person', 'staff'):
                c = PERSON if kind == 'person' else STAFF
                s.box(x, 8, w, HH - 8, [(name, 23, 700, WHITE, False)] + ([(sub, FS, 400, '#e3f1e8', False)] if sub else []),
                      fill=c[0], stroke=c[1], rx=22, pad=6)
            elif kind == 'ext':
                s.box(x, 8, w, HH - 8, [(name, 23, 700, INK, False), (sub, FS, 400, MUTED, False)],
                      fill=EXT[0], stroke=EXT[1], pad=6)
            else:
                b = BLK[kind.split(':')[1]]
                s.box(x, 8, w, HH - 8, [(name, 23, 700, INK, False), (sub, FS, 400, b[1], True)],
                      fill=WHITE, stroke=b[1], pad=6)
            s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="#9aa39e" stroke-width="2" stroke-dasharray="6 6"/>'
                  % (self.x[k], HH, self.x[k], H - 8))
        for kind, d, y, h in self.items:
            if kind == 'frag':
                fk, x0, x1, seps = d
                s.later.append('<rect x="%g" y="%g" width="%g" height="%g" rx="4" fill="none" stroke="#5d6a63" stroke-width="2"/>'
                               % (x0, y, x1 - x0, h))
                tw = len(fk) * 14 + 26
                s.add('<path d="M%g,%g h%g v20 l-10,12 h%g z" fill="#e9ecea" stroke="#5d6a63" stroke-width="2"/>'
                      % (x0, y, tw, -(tw - 10)))
                s.text(x0 + 10, y + 24, fk, FS, 700, INK, 'start')
                for sp in seps:
                    if isinstance(sp, tuple):
                        _, gy, gl = sp
                        for j, ln in enumerate(gl):
                            bg(s, x0 + tw + 10, gy + 6 + j * LH, ln, 600)
                            s.text(x0 + tw + 14, gy + 25 + j * LH, ln, FS, 600, MUTED, 'start', italic=False)
                    else:
                        s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="#5d6a63" stroke-width="2" stroke-dasharray="10 6"/>'
                              % (x0, sp, x1, sp))
            elif kind == 'self':
                lane, txt = d
                xl = self.x[lane]
                ya, yb = y + 10, y + h - 8
                s.add('<polyline points="%g,%g %g,%g %g,%g %g,%g" fill="none" stroke="%s" stroke-width="2.4" marker-end="url(#sq-f)"/>'
                      % (xl, ya, xl + 44, ya, xl + 44, yb, xl + 4, yb, ARR))
                lines = wrap(txt, SW, FS)
                for j, ln in enumerate(lines):
                    bg(s, xl + 52, ya + 2 + j * LH, ln, 400)
                    s.text(xl + 56, ya + 20 + j * LH, ln, FS, 400, INK, 'start')
            else:
                a, b, txt = d
                xa, xb = self.x[a], self.x[b]
                yy = y + h - 10
                col = EVT if kind == 'evt' else (GREY if kind == 'ret' else ARR)
                dash = ' stroke-dasharray="10 6"' if kind in ('evt', 'ret') else ''
                mk = 'sq-o' if kind == 'ret' else ('sq-e' if kind == 'evt' else 'sq-f')
                s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.4"%s marker-end="url(#%s)"/>'
                      % (xa, yy, xb - (4 if xb > xa else -4), yy, col, dash, mk))
                wl = self.lab_w(a, b)
                mid = min(max((xa + xb) / 2, wl / 2 + 4), W - wl / 2 - 4)
                s.label(mid, yy, txt, wl, size=FS, color=EVT if kind == 'evt' else '#33413a', pos='above',
                        italic=kind != 'call')
        s.add('<defs>'
              '<marker id="sq-f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="%s"/></marker>'
              '<marker id="sq-e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="%s"/></marker>'
              '<marker id="sq-o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10" fill="none" stroke="%s" stroke-width="1.6"/></marker>'
              '</defs>' % (ARR, EVT, GREY))
        io.open(os.path.join(OUT, fname), 'w', encoding='utf-8').write(page('', '', s.svg(), LEGEND, note))
        print('ok', fname, H)


def icon(color, dash=False, open_=False):
    d = ' stroke-dasharray="7 5"' if dash else ''
    head = ('<path d="M34,1 L44,7 L34,13" fill="none" stroke="%s" stroke-width="2"/>' if open_
            else '<path d="M34,1 L44,7 L34,13 z" fill="%s"/>') % color
    return ('<svg width="46" height="14" style="flex:none"><line x1="0" y1="7" x2="42" y2="7" stroke="%s" '
            'stroke-width="3"%s/>%s</svg>' % (color, d, head))


LEGEND = (('<span><i class="sw" style="background:%s;border-color:%s;border-radius:14px"></i>Người dùng, nhân sự</span>' % PERSON) +
          ('<span><i class="sw" style="background:#fff;border-color:%s"></i>Mô-đun (màu theo khối)</span>' % BLK['gd'][1]) +
          ('<span><i class="sw" style="background:%s;border-color:%s"></i>Hệ thống ngoài, dịch vụ AI</span>' % EXT) +
          ('<span>%sGọi</span>' % icon(ARR)) + ('<span>%sTrả về</span>' % icon(GREY, True, True)) +
          ('<span>%sSự kiện qua Redis</span>' % icon(EVT, True)) +
          '<span>Khung alt: các nhánh loại trừ nhau · opt: tùy chọn · loop: lặp</span>')

# ======================= 1. ĐẶT HÀNG VÀ THANH TOÁN ĐƠN LẺ =======================
Seq([('kh', 'Khách lẻ', 'ứng dụng mua hàng', 'person'), ('rt', 'Bán lẻ', 'retail', 'mod:gd'),
     ('iv', 'Tồn kho', 'inventory', 'mod:cung'), ('pm', 'Thanh toán', 'payment', 'mod:gd'),
     ('tt', 'Cổng thanh toán', 'VNPay', 'ext'), ('nt', 'Thông báo', 'notification', 'mod:chung')]).draw([
    ('call', 'kh', 'rt', 'Đặt đơn: giỏ, địa chỉ, khung giờ, cách thanh toán'),
    ('self', 'rt', 'Kiểm tra giờ chốt, khung giờ còn chỗ, điều kiện COD'),
    ('call', 'rt', 'iv', 'Giữ chỗ các dòng hàng, hạn 15 phút'),
    ('self', 'iv', 'Chọn dòng tồn theo FEFO, khóa dòng (FOR UPDATE), ghi giữ chỗ'),
    ('ret', 'iv', 'rt', 'Mã giữ chỗ, hoặc lỗi không đủ hàng'),
    ('ret', 'rt', 'kh', 'Mã đơn, hạn giữ chỗ (đếm ngược)'),
    ('evt', 'rt', 'nt', 'OrderPlaced'),
    ('frag', 'alt', [
        ('trả trước, thanh toán thành công trong 15 phút', [
            ('call', 'rt', 'pm', 'Tạo giao dịch (đơn, số tiền)'),
            ('call', 'pm', 'tt', 'Lệnh thanh toán'),
            ('ret', 'tt', 'pm', 'Đường dẫn trang thanh toán'),
            ('ret', 'pm', 'kh', 'Chuyển hướng tới cổng'),
            ('call', 'kh', 'tt', 'Thanh toán trên trang của cổng'),
            ('call', 'tt', 'pm', 'Webhook kết quả: kiểm chữ ký, gửi lặp chỉ xử lý một lần'),
            ('evt', 'pm', 'rt', 'PaymentSucceeded'),
            ('call', 'rt', 'iv', 'Chuyển giữ chỗ thành trừ tồn, ghi sổ xuất'),
            ('evt', 'pm', 'nt', 'PaymentSucceeded'),
        ]),
        ('COD đủ điều kiện: dưới ngưỡng, chưa từng từ chối nhận', [
            ('call', 'rt', 'iv', 'Chuyển giữ chỗ thành trừ tồn, ghi sổ xuất'),
            ('self', 'rt', 'Đơn sang "Đã thanh toán (COD)"'),
        ]),
        ('thanh toán thất bại, hoặc quá 15 phút', [
            ('self', 'rt', 'Hủy đơn'),
            ('evt', 'rt', 'iv', 'OrderCancelled'),
            ('self', 'iv', 'Nhả giữ chỗ'),
            ('evt', 'rt', 'nt', 'OrderCancelled'),
        ]),
    ]),
], 'seq-dat-hang.html',
    'Phần sau khi đơn đã thanh toán (đóng gói, chuyến trung chuyển, 3PL, hóa đơn) ở Hình luồng một đơn bán lẻ, mục 5.3.1.')

# ======================= 2. RFQ, HỢP ĐỒNG, XÁC NHẬN GIAO KẾT =======================
Seq([('ks', 'Khách sỉ', 'ứng dụng mua hàng', 'person'), ('ws', 'Bán sỉ', 'wholesale', 'mod:gd'),
     ('nc', 'Nhà cung cấp', 'ứng dụng mua hàng', 'person'), ('id', 'Tài khoản', 'identity', 'mod:chung'),
     ('md', 'Tệp', 'media', 'mod:chung'), ('iv', 'Tồn kho', 'inventory', 'mod:cung'),
     ('nt', 'Thông báo', 'notification', 'mod:chung')]).draw([
    ('call', 'ks', 'ws', 'Gửi RFQ: sản phẩm, số lượng, tiêu chuẩn, ngày giao'),
    ('self', 'ws', 'Đối chiếu MOQ theo bảng giá bậc'),
    ('frag', 'alt', [
        ('dưới MOQ', [
            ('ret', 'ws', 'ks', 'Gợi ý gộp đơn hoặc chuyển sang kênh bán lẻ'),
        ]),
        ('đạt MOQ', [
            ('evt', 'ws', 'nt', 'RfqUpdated (báo nhà cung cấp)'),
            ('frag', 'loop', [
                ('tới khi hai bên thống nhất số lượng, đơn giá, ngày giao', [
                    ('call', 'nc', 'ws', 'Báo giá hoặc trao đổi trong kênh của RFQ'),
                    ('call', 'ks', 'ws', 'Phản hồi, đề xuất lại'),
                    ('evt', 'ws', 'nt', 'RfqUpdated (báo bên còn lại)'),
                ]),
            ]),
            ('call', 'ks', 'ws', 'Chốt RFQ theo báo giá cuối'),
            ('self', 'ws', 'Sinh hợp đồng từ mẫu chuẩn, áp giá sỉ theo bậc'),
            ('call', 'ws', 'md', 'Lưu tệp PDF riêng tư, nhận định danh tệp'),
            ('self', 'ws', 'Tính SHA-256, lưu phiên bản; mỗi lần sửa tạo phiên bản mới'),
            ('frag', 'loop', [
                ('lần lượt khách sỉ, rồi nhà cung cấp (thao tác như nhau)', [
                    ('call', 'ks', 'ws', 'Xác nhận giao kết phiên bản đang xem'),
                    ('call', 'ws', 'id', 'Phát OTP, mục đích contract_confirm'),
                    ('ret', 'id', 'ks', 'Mã OTP qua email'),
                    ('call', 'ks', 'ws', 'Nhập OTP'),
                    ('call', 'ws', 'id', 'Kiểm OTP'),
                    ('ret', 'id', 'ws', 'Hợp lệ'),
                    ('self', 'ws', 'Ghi xác nhận: tài khoản, thời điểm, mã băm'),
                ]),
            ]),
            ('call', 'ws', 'iv', 'Giữ chỗ phần hàng trên dòng tồn của nhà cung cấp'),
            ('ret', 'iv', 'ws', 'Mã giữ chỗ'),
            ('evt', 'ws', 'nt', 'ContractConcluded'),
        ]),
    ]),
], 'seq-hop-dong-si.html',
    'ContractConcluded còn được payment nhận để lập yêu cầu thanh toán. Ký số qua tổ chức chứng thực và giao nhiều đợt chỉ thiết kế.')

# ======================= 3. ĐĂNG LÔ, DUYỆT LÔ, SINH QR =======================
Seq([('nc', 'Nhà cung cấp', '', 'person'), ('md', 'Tệp', 'media', 'mod:chung'),
     ('ct', 'Sản phẩm, lô', 'catalog', 'mod:cung'), ('op', 'Vận hành', 'operations', 'mod:vh'),
     ('kd', 'Kiểm duyệt viên', '', 'staff'), ('iv', 'Tồn kho', 'inventory', 'mod:cung'),
     ('ai', 'Dịch vụ AI', 'FastAPI', 'ext'), ('nt', 'Thông báo', 'notification', 'mod:chung')]).draw([
    ('call', 'nc', 'md', 'Xin đường dẫn ký trước cho ảnh'),
    ('ret', 'md', 'nc', 'Đường dẫn ký trước'),
    ('self', 'nc', 'Tải ảnh thẳng lên kho tệp'),
    ('call', 'nc', 'ct', 'Tạo lô: sản phẩm, ngày thu hoạch, sản lượng, ảnh'),
    ('call', 'nc', 'ct', 'Ghi nhật ký canh tác (ít nhất một bản ghi)'),
    ('self', 'ct', 'Kiểm tự động: danh mục lá, đơn vị, từ khóa cấm, giá lệch, ảnh trùng'),
    ('call', 'kd', 'op', 'Mở hàng đợi duyệt'),
    ('call', 'op', 'ct', 'Lấy các lô chờ duyệt'),
    ('ret', 'ct', 'op', 'Lô, nhật ký, ảnh, chứng nhận'),
    ('frag', 'alt', [
        ('duyệt', [
            ('call', 'kd', 'op', 'Duyệt lô'),
            ('call', 'op', 'ct', 'Duyệt lô'),
            ('self', 'ct', 'Sinh mã QR, lô chuyển "đã duyệt"'),
            ('evt', 'ct', 'iv', 'BatchApproved'),
            ('self', 'iv', 'Mở dòng tồn của nhà cung cấp'),
            ('evt', 'ct', 'nt', 'BatchApproved'),
            ('evt', 'ct', 'ai', 'ProductChanged'),
            ('evt', 'ai', 'ct', 'ProductEmbedded (vector mới)'),
        ]),
        ('từ chối', [
            ('call', 'kd', 'op', 'Từ chối kèm lý do'),
            ('call', 'op', 'ct', 'Từ chối lô; lý do hiện ở trang lô của nhà cung cấp'),
        ]),
    ]),
    ('self', 'op', 'Ghi nhật ký thao tác nội bộ'),
], 'seq-duyet-lo.html',
    'Nhà cung cấp có điểm uy tín từ 80 được hậu kiểm: lô mở bán ngay, kiểm duyệt viên duyệt sau theo cùng luồng.')

# ======================= 4. GỬI VÀ DUYỆT ĐÁNH GIÁ =======================
Seq([('kh', 'Khách lẻ', 'ứng dụng mua hàng', 'person'), ('en', 'Đánh giá', 'engagement', 'mod:sau'),
     ('rt', 'Bán lẻ', 'retail', 'mod:gd'), ('op', 'Vận hành', 'operations', 'mod:vh'),
     ('kd', 'Kiểm duyệt viên', 'ứng dụng nội bộ', 'staff'), ('nt', 'Thông báo', 'notification', 'mod:chung')]).draw([
    ('call', 'kh', 'en', 'Gửi đánh giá: dòng hàng, số sao, nội dung, ảnh'),
    ('call', 'en', 'rt', 'Kiểm đơn đã hoàn tất, dòng hàng thuộc khách'),
    ('ret', 'rt', 'en', 'Hợp lệ, kèm sản phẩm và nhà cung cấp gốc của lô'),
    ('self', 'en', 'Chạy luật ngưỡng: từ khóa cấm, liên kết lạ, điểm dồn cụm'),
    ('frag', 'alt', [
        ('không bị gắn cờ', [
            ('self', 'en', 'Công khai; tính lại điểm uy tín (6 tháng, có trọng số)'),
            ('ret', 'en', 'kh', 'Đã đăng'),
            ('evt', 'en', 'nt', 'ReviewPosted (báo nhà cung cấp)'),
        ]),
        ('bị gắn cờ', [
            ('self', 'en', 'Giữ ở trạng thái chờ duyệt'),
            ('ret', 'en', 'kh', 'Đang chờ duyệt'),
            ('evt', 'en', 'op', 'ReviewPosted (gắn cờ)'),
            ('self', 'op', 'Tạo việc duyệt'),
            ('call', 'kd', 'op', 'Quyết định: công khai hoặc ẩn'),
            ('call', 'op', 'en', 'Áp quyết định'),
            ('self', 'en', 'Công khai thì tính lại điểm uy tín; ẩn thì không tính'),
            ('evt', 'en', 'nt', 'ReviewPosted (báo kết quả)'),
        ]),
    ]),
], 'seq-danh-gia.html',
    'Ẩn đánh giá thì báo lý do cho người mua. Nhà cung cấp hoặc Farmery phản hồi công khai một lần dưới mỗi đánh giá.')
