# -*- coding: utf-8 -*-
# Sinh sơ đồ lớp miền của trục bán lẻ và nguồn cung (class-mien.html) vào tools/design/; bám schema.dbml
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page, BLK

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
W = 1340
INK, MUTED, ARR, GREY = '#16241e', '#4d5c55', '#44524b', '#8a948f'
BW, PX, GAPY, X0, Y0 = 270, 352, 54, 10, 14
LH = 25
MOD = {'supplier': 'cung', 'catalog': 'cung', 'inventory': 'cung', 'retail': 'gd', 'payment': 'gd',
       'fulfillment': 'sau', 'engagement': 'sau'}

# tên lớp: (mô-đun, (cột, hàng), [thuộc tính], [phương thức])
CLS = {
    'Certification': ('supplier', (0, 0), ['type: CertType', 'expiryDate: Date', 'approvalStatus'],
                      ['isValidAt(d): bool', 'renew(): Certification']),
    'Supplier': ('supplier', (1, 0), ['displayName', 'taxType: SellerTaxType', 'status'],
                 ['approve()', 'suspend(reason)']),
    'Product': ('catalog', (2, 0), ['name', 'unit', 'categoryId', 'status'],
                ['submitForReview()', 'approve()']),
    'Listing': ('retail', (3, 0), ['saleUnit', 'unitPrice: Money', 'status'],
                ['setPrice(p)', 'pause()']),
    'FarmingLog': ('catalog', (1, 1), ['activityDate: Date', 'activity', 'publishedAt'],
                   ['publish()', 'correct(): FarmingLog']),
    'Batch': ('catalog', (2, 1), ['batchCode', 'bestBefore: Date', 'qrToken', 'recalledAt'],
              ['approve(): QrToken', 'recall(reason)']),
    'CartItem': ('retail', (3, 1), ['quantity: Decimal'], ['changeQty(q)']),
    'Reservation': ('inventory', (1, 2), ['quantity: Decimal', 'status', 'expiresAt'],
                    ['consume()', 'release()']),
    'StockHolding': ('inventory', (2, 2), ['ownerType', 'qtyOnHand', 'qtyReserved', 'isLocked'],
                     ['reserve(q): Reservation', 'lock()']),
    'Cart': ('retail', (3, 2), [], ['add(listing, q)', 'checkout(): Order']),
    'StockMovement': ('inventory', (1, 3), ['movementType', 'quantity', 'source'], ['«chỉ thêm, không sửa»']),
    'OrderItem': ('retail', (2, 3), ['quantity', 'unitPrice: Money', 'batchId', 'holdingId'], []),
    'Review': ('engagement', (3, 3), ['rating: 1..5', 'status'], ['flag()', 'publish()', 'hide()']),
    'Payment': ('payment', (0, 3), ['method', 'amount: Money', 'status'],
                ['applyWebhook(e)', 'refund(amount)']),
    'Order': ('retail', (2, 4), ['orderCode', 'status: OrderStatus', 'deliverySlot', 'total: Money'],
              ['place()', 'advance(to)', 'cancel()', 'complete()']),
    'Shipment': ('fulfillment', (3, 4), ['carrierOrderCode', 'slot', 'status'], ['applyCarrierEvent(e)']),
    'ReturnRequest': ('fulfillment', (1, 4), ['requestType', 'claimDeadline', 'decision'],
                      ['decide(d)', 'escalate()']),
}
# (lớp nguồn, lớp đích, kiểu, bội số phía nguồn, bội số phía đích); kiểu: comp | assoc | ref (xuyên mô-đun)
REL = [
    ('Supplier', 'Certification', 'comp', '1', '0..*'),
    ('Supplier', 'Product', 'ref', '1', '0..*'),
    ('Product', 'Listing', 'ref', '1', '0..*'),
    ('Product', 'Batch', 'assoc', '1', '0..*'),
    ('Batch', 'FarmingLog', 'comp', '1', '1..*'),
    ('Batch', 'StockHolding', 'ref', '1', '1..*'),
    ('Listing', 'CartItem', 'assoc', '1', '0..*'),
    ('Cart', 'CartItem', 'comp', '1', '0..*'),
    ('StockHolding', 'Reservation', 'comp', '1', '0..*'),
    ('StockHolding', 'StockMovement', 'comp', '1', '0..*'),
    ('StockHolding', 'OrderItem', 'ref', '1', '0..*'),
    ('Order', 'OrderItem', 'comp', '1', '1..*'),
    ('OrderItem', 'Review', 'ref', '1', '0..1'),
    ('Order', 'Payment', 'ref', '1', '0..*'),
    ('Order', 'Shipment', 'ref', '1', '0..1'),
    ('Order', 'ReturnRequest', 'ref', '1', '0..*'),
]


def height(c):
    _, _, at, me = CLS[c]
    return 70 + max(len(at), 1) * LH + 14 + max(len(me), 1) * LH + 10


ROWH = {}
for c, (_, (col, row), _, _) in CLS.items():
    ROWH[row] = max(ROWH.get(row, 0), height(c))
ROWY = {}
y = Y0
for r in sorted(ROWH):
    ROWY[r] = y
    y += ROWH[r] + GAPY
H = int(y)


def rect(c):
    _, (col, row), _, _ = CLS[c]
    return X0 + col * PX, ROWY[row], BW, height(c)


s = Svg(W, H)
used = {}


def port(r, side, k):
    x, y, w, h = r
    f = (0.5, 0.3, 0.7)[k % 3]
    return {'top': (x + w * f, y), 'bottom': (x + w * f, y + h), 'left': (x, y + 40),
            'right': (x + w, y + 40)}[side]


for a, b, kind, ma, mb in REL:
    ra, rb = rect(a), rect(b)
    if ra[1] + ra[3] <= rb[1]:
        sa, sb = 'bottom', 'top'
    elif rb[1] + rb[3] <= ra[1]:
        sa, sb = 'top', 'bottom'
    elif ra[0] + ra[2] <= rb[0]:
        sa, sb = 'right', 'left'
    else:
        sa, sb = 'left', 'right'
    ka = used.setdefault((a, sa), [0]); kb = used.setdefault((b, sb), [0])
    pa, pb = port(ra, sa, ka[0]), port(rb, sb, kb[0])
    ka[0] += 1; kb[0] += 1
    if sa in ('top', 'bottom'):
        pts = [pa, pb] if abs(pa[0] - pb[0]) < 1 else [pa, (pa[0], (pa[1] + pb[1]) / 2), (pb[0], (pa[1] + pb[1]) / 2), pb]
    else:
        pts = [pa, pb]
    col = GREY if kind == 'ref' else ARR
    dash = ' stroke-dasharray="10 6"' if kind == 'ref' else ''
    s.add('<polyline points="%s" fill="none" stroke="%s" stroke-width="2.4"%s/>' % (' '.join('%g,%g' % p for p in pts), col, dash))
    if kind == 'comp':  # hình thoi đặc ở phía lớp chứa
        (x0, y0), (x1, y1) = pts[0], pts[1]
        dx, dy = x1 - x0, y1 - y0
        L = (dx * dx + dy * dy) ** 0.5
        ux, uy = dx / L, dy / L
        nx, ny = -uy, ux
        q = [(x0, y0), (x0 + ux * 13 + nx * 8, y0 + uy * 13 + ny * 8), (x0 + ux * 26, y0 + uy * 26),
             (x0 + ux * 13 - nx * 8, y0 + uy * 13 - ny * 8)]
        s.add('<polygon points="%s" fill="%s"/>' % (' '.join('%g,%g' % p for p in q), ARR))
    # đầu nguồn: trái đường dọc / trên đường ngang; đầu đích: phải / dưới — hai nhãn không chồng nhau
    for (p, nxt, m, src) in ((pts[0], pts[1], ma, True), (pts[-1], pts[-2], mb, False)):
        dx, dy = nxt[0] - p[0], nxt[1] - p[1]
        if abs(dy) > abs(dx):
            d = 26 if src and kind == 'comp' else 0
            ty = p[1] + (24 + d if dy > 0 else -8 - d)
            s.text(p[0] - 10 if src else p[0] + 10, ty, m, 22, 600, MUTED, 'end' if src else 'start')
        else:
            d = 34 if src and kind == 'comp' else 8
            tx = p[0] + (d if dx > 0 else -d)
            s.text(tx, p[1] - 8 if src else p[1] + 24, m, 22, 600, MUTED, 'start' if dx > 0 else 'end')

for c, (mod, _, at, me) in CLS.items():
    x, y, w, h = rect(c)
    fill, stroke = BLK[MOD[mod]]
    s.rect(x, y, w, h, fill='#ffffff', stroke=stroke, sw=2.4, rx=6)
    s.rect(x, y, w, 64, fill=fill, stroke=stroke, sw=2.4, rx=6)
    s.text(x + w / 2, y + 28, c, 23, 800, INK)
    s.text(x + w / 2, y + 54, mod, 22, 400, stroke, mono=True)
    yy = y + 64
    for i, t in enumerate(at):
        s.text(x + 12, yy + 24 + i * LH, t, 22, 400, INK, 'start')
    yy += max(len(at), 1) * LH + 14
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="1.6"/>' % (x, yy - 6, x + w, yy - 6, stroke))
    for i, t in enumerate(me):
        s.text(x + 12, yy + 20 + i * LH, t, 22, 400, MUTED if t.startswith('«') else INK, 'start', italic=t.startswith('«'))

leg = ''.join('<span><i class="sw" style="background:%s;border-color:%s"></i>%s</span>' % (BLK[k][0], BLK[k][1], t)
              for k, t in [('cung', 'Nguồn cung'), ('gd', 'Giao dịch'), ('sau', 'Sau bán')]) + \
      ('<span><svg width="46" height="16"><line x1="0" y1="8" x2="46" y2="8" stroke="%s" stroke-width="3"/>'
       '<polygon points="0,8 12,2 24,8 12,14" fill="%s"/></svg>Hợp thành (thoi ở lớp chứa)</span>' % (ARR, ARR)) + \
      ('<span><svg width="46" height="16"><line x1="0" y1="8" x2="46" y2="8" stroke="%s" stroke-width="3"/></svg>'
       'Liên kết trong mô-đun</span>' % ARR) + \
      ('<span><svg width="46" height="16"><line x1="0" y1="8" x2="46" y2="8" stroke="%s" stroke-width="3" '
       'stroke-dasharray="8 5"/></svg>Tham chiếu bằng định danh sang mô-đun khác</span>' % GREY)
io.open(os.path.join(OUT, 'class-mien.html'), 'w', encoding='utf-8').write(page(
    '', '', s.svg(), leg,
    'Thuộc tính rút gọn; đủ cột ở Phụ lục K. Money, Decimal, Date là kiểu giá trị. Mỗi lớp thuộc đúng một mô-đun, '
    'đổi trạng thái chỉ qua phương thức của chính lớp đó.'))
print('ok class-mien.html', H)
