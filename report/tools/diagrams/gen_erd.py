# -*- coding: utf-8 -*-
# Đọc schema.dbml, sinh 2 hình ERD (tools/design/erd-*.html) và Phụ lục K (backmatter/phuluc-csdl.tex)
import io, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, page, MONO, FONT

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(ROOT, 'tools', 'design')


# ---------------------------------------------------------------- đọc DBML
def split_attrs(s):
    out, cur, q = [], '', False
    for ch in s:
        if ch == "'":
            q = not q
        if ch == ',' and not q:
            out.append(cur.strip())
            cur = ''
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


def parse(path):
    enums, tables, order = {}, {}, []
    lines = io.open(path, encoding='utf-8').read().split('\n')
    i = 0
    while i < len(lines):
        ln = lines[i]
        m = re.match(r'^Enum ([\w.]+) \{', ln)
        if m:
            vals = []
            i += 1
            while lines[i].strip() != '}':
                v = re.match(r"^\s+(\w+)(?:\s+\[note: '(.*)'\])?", lines[i])
                if v:
                    vals.append((v.group(1), v.group(2)))
                i += 1
            enums[m.group(1)] = vals
        m = re.match(r'^Table ([\w.]+) \{', ln)
        if m:
            name = m.group(1)
            t = {'name': name, 'cols': [], 'note': '', 'pk': []}
            i += 1
            while lines[i] != '}':
                l = lines[i]
                if l.strip() == 'indexes {':
                    i += 1
                    while lines[i].strip() != '}':
                        k = re.match(r'^\s+\(([^)]*)\) \[pk\]', lines[i])
                        if k:
                            t['pk'] = [c.strip() for c in k.group(1).split(',')]
                        i += 1
                elif l.strip().startswith('Note:'):
                    t['note'] = re.match(r"^\s+Note: '(.*)'", l).group(1)
                else:
                    c = re.match(r'^  (\w+) (\S+)(?: \[(.*)\])?$', l)
                    if c:
                        col = {'name': c.group(1), 'type': c.group(2), 'pk': False, 'nn': False, 'uq': False,
                               'ref': None, 'note': '', 'default': None}
                        for a in split_attrs(c.group(3) or ''):
                            if a == 'pk':
                                col['pk'] = True
                            elif a == 'not null':
                                col['nn'] = True
                            elif a == 'unique':
                                col['uq'] = True
                            elif a.startswith('ref:'):
                                col['ref'] = ('1' if '-' in a.split()[1] else 'n', a.split()[2].rsplit('.', 1)[0])
                            elif a.startswith('note:'):
                                col['note'] = re.match(r"note: '(.*)'", a).group(1)
                            elif a.startswith('default:'):
                                col['default'] = a.split(':', 1)[1].strip().strip("'")
                        t['cols'].append(col)
                i += 1
            for c in t['cols']:
                if c['name'] in t['pk']:
                    c['pk'] = True
            tables[name] = t
            order.append(name)
        i += 1
    return enums, tables, order


ENUMS, TABLES, ORDER = parse(os.path.join(ROOT, 'schema.dbml'))


def xref(col):
    m = re.match(r'→ ([\w]+\.[\w]+)', col['note'])
    return m.group(1) if m else None


def edges():
    """(bảng con, bảng cha, kiểu) — kiểu 'fk' trong schema, 'x' tham chiếu logic xuyên schema."""
    seen, out = set(), []
    for name in ORDER:
        for c in TABLES[name]['cols']:
            if c['ref']:
                tgt, kind = c['ref'][1], 'fk'
            else:
                tgt, kind = xref(c), 'x'
            if not tgt or tgt == name or (name, tgt) in seen:
                continue
            seen.add((name, tgt))
            out.append((name, tgt, kind, c['ref'][0] if c['ref'] else 'n'))
    return out


EDGES = edges()


# ---------------------------------------------------------------- ERD
BW, BH = 300, 58          # hộp bảng; tên bảng mono 22px ≈ 7pt
PX, PY = 336, 116         # bước lưới
X0, Y0 = 16, 54
INK = '#16241e'
BLOCK = {  # khối chức năng -> màu (nền cụm, viền)
    'chung': ('#eef4fb', '#1a5fa8'), 'cung': ('#eef7f0', '#1f8a4c'), 'gd': ('#fdf4e8', '#b86a12'),
    'sau': ('#f3eff9', '#6b4fa0'), 'vh': ('#f2f3f2', '#4d5c55')}
SCHEMA_BLOCK = {'identity': 'chung', 'notification': 'chung', 'media': 'chung', 'supplier': 'cung',
                'catalog': 'cung', 'inventory': 'cung', 'procurement': 'gd', 'retail': 'gd', 'wholesale': 'gd',
                'payment': 'gd', 'fulfillment': 'sau', 'engagement': 'sau', 'operations': 'vh'}


def rect_of(pos):
    c, r = pos
    return X0 + c * PX, Y0 + r * PY, BW, BH


def draw_figure(fname, layout, ghosts, show_x=()):
    """layout: {bảng: (cột, hàng)}; ghosts: {bảng ở hình kia: (cột, hàng)}."""
    allpos = dict(layout)
    allpos.update(ghosts)
    r0 = min(r for (_, r) in allpos.values())
    allpos = {t: (c, r - r0) for t, (c, r) in allpos.items()}
    layout = {t: allpos[t] for t in layout}
    W = 1340
    H = int(max(Y0 + r * PY + BH for (_, r) in allpos.values()) + 30)
    s = Svg(W, H)
    # cụm schema
    schemas = []
    for t in layout:
        sc = t.split('.')[0]
        if sc not in schemas:
            schemas.append(sc)
    for sc in schemas:
        rs = [rect_of(p) for t, p in allpos.items() if t.split('.')[0] == sc and t in layout]
        x0 = min(r[0] for r in rs) - 10
        y0 = min(r[1] for r in rs) - 44
        x1 = max(r[0] + r[2] for r in rs) + 10
        y1 = max(r[1] + r[3] for r in rs) + 16
        fill, stroke = BLOCK[SCHEMA_BLOCK[sc]]
        s.rect(x0, y0, x1 - x0, y1 - y0, fill=fill, stroke=stroke, sw=2.5, rx=16)
        s.text(x0 + 12, y0 + 29, sc, 23, 800, stroke, 'start', mono=True)
    # đường nối (vẽ trước hộp)
    used = {}
    for (child, parent, kind, card) in EDGES:
        if child not in layout and parent not in layout:
            continue
        if child not in allpos or parent not in allpos:
            continue
        if kind == 'x' and (child, parent) not in show_x:
            continue
        route(s, rect_of(allpos[child]), rect_of(allpos[parent]), kind, card, used)
    # hộp bảng
    for t, p in allpos.items():
        x, y, w, h = rect_of(p)
        ghost = t not in layout
        sc = t.split('.')[0]
        fill, stroke = BLOCK[SCHEMA_BLOCK[sc]]
        label = t if ghost else t.split('.', 1)[1]
        design = bool(re.search(r'chỉ thiết kế\)$', TABLES[t]['note']))
        if ghost:
            s.rect(x, y, w, h, fill='#ffffff', stroke='#8a948f', sw=2, rx=8, dash='8 6')
            s.text(x + w / 2, y + h / 2 - 4, label.split('.')[0] + '.', 22, 600, '#5d6a63', mono=True)
            s.text(x + w / 2, y + h / 2 + 20, label.split('.')[1], 22, 600, '#5d6a63', mono=True)
        else:
            s.rect(x, y, w, h, fill='#f6f7f6' if design else '#ffffff', stroke='#8a948f' if design else stroke,
                   sw=2.4, rx=8, dash='8 6' if design else None)
            s.text(x + w / 2, y + h / 2 + 8, label, 22, 700, '#7d8882' if design else INK, mono=True)
    io.open(os.path.join(OUT, fname), 'w', encoding='utf-8').write(page('', '', s.svg(), LEGEND, NOTE))
    print('ok', fname, W, H)


def port(r, side, k, n):
    x, y, w, h = r
    f = (k + 1) / (n + 1)
    return {'top': (x + w * f, y), 'bottom': (x + w * f, y + h),
            'left': (x, y + h * f), 'right': (x + w, y + h * f)}[side]


def route(s, a, b, kind, card, used):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    if ay + ah <= by:
        sa, sb = 'bottom', 'top'
    elif by + bh <= ay:
        sa, sb = 'top', 'bottom'
    elif ax + aw <= bx:
        sa, sb = 'right', 'left'
    else:
        sa, sb = 'left', 'right'
    ka = used.setdefault((a, sa), [])
    kb = used.setdefault((b, sb), [])
    ka.append(1)
    kb.append(1)
    # chia điểm nối dọc cạnh: tối đa 3 vị trí mỗi cạnh
    pa = port(a, sa, (len(ka) - 1) % 3 if len(ka) > 1 else 1, 3)
    pb = port(b, sb, (len(kb) - 1) % 3 if len(kb) > 1 else 1, 3)
    if sa in ('bottom', 'top'):
        if abs(pa[0] - pb[0]) < 1:
            pts = [pa, pb]
        else:
            my = (pa[1] + pb[1]) / 2
            pts = [pa, (pa[0], my), (pb[0], my), pb]
    else:
        if abs(pa[1] - pb[1]) < 1:
            pts = [pa, pb]
        else:
            mx = (pa[0] + pb[0]) / 2
            pts = [pa, (mx, pa[1]), (mx, pb[1]), pb]
    color = '#44524b' if kind == 'fk' else '#8a948f'
    dash = ' stroke-dasharray="9 6"' if kind == 'x' else ''
    s.add('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"%s/>'
          % (' '.join('%g,%g' % p for p in pts), color, 2.4 if kind == 'fk' else 2, dash))
    crow(s, pts[0], pts[1], color, many=(card == 'n'))
    crow(s, pts[-1], pts[-2], color, many=False)


def crow(s, p, q, color, many):
    """Ký hiệu chân chim tại đầu p của đoạn p-q: nhiều (chân chim) hoặc một (gạch ngang)."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = max(1e-6, (dx * dx + dy * dy) ** 0.5)
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux
    if many:
        bx, by = p[0] + ux * 16, p[1] + uy * 16
        for k in (-1, 0, 1):
            s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.2"/>'
                  % (bx, by, p[0] + nx * 10 * k, p[1] + ny * 10 * k, color))
        cx, cy = p[0] + ux * 22, p[1] + uy * 22
    else:
        cx, cy = p[0] + ux * 12, p[1] + uy * 12
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.2"/>'
          % (cx + nx * 9, cy + ny * 9, cx - nx * 9, cy - ny * 9, color))


LEGEND = ('<span><i class="sw" style="background:#fff;border-color:#1f8a4c"></i>Bảng trong schema (khung màu)</span>'
          '<span><i class="sw" style="background:#f6f7f6;border-color:#8a948f;border-style:dashed"></i>Bảng chỉ thiết kế</span>'
          '<span><i class="sw" style="background:#fff;border-color:#8a948f;border-style:dashed;border-width:2px"></i>Bảng ở hình còn lại</span>'
          '<span><i class="ln"></i>Khóa ngoại trong schema, chân chim ở phía nhiều</span>'
          '<span><i class="ln" style="border-top:3px dashed #8a948f"></i>Tham chiếu bằng định danh sang schema khác (RB3)</span>')
NOTE = ('Đường nét đứt chỉ vẽ các tham chiếu xuyên schema chính; không vẽ tham chiếu tới identity.users, '
        'media.media_files (gần như mọi bảng đều có) và quan hệ tự tham chiếu. Danh sách đầy đủ ở Phụ lục K.')

FIG1 = {
    # identity
    'identity.user_roles': (0, 0), 'identity.otp_challenges': (1, 0), 'identity.addresses': (2, 0),
    'identity.businesses': (0, 1), 'identity.users': (1, 1), 'identity.ekyc_documents': (2, 1),
    'identity.consent_records': (0, 2), 'identity.data_requests': (1, 2),
    # notification
    'notification.notifications': (3, 0), 'notification.deliveries': (3, 1),
    'notification.preferences': (3, 2), 'notification.push_subscriptions': (3, 3),
    # supplier + catalog
    'supplier.suppliers': (0, 3.65), 'supplier.certifications': (0, 4.65), 'supplier.support_assignments': (0, 5.65),
    'catalog.categories': (2, 3.65), 'catalog.products': (1, 3.65), 'catalog.product_embeddings': (1, 4.65),
    'catalog.batches': (2, 4.65), 'catalog.farming_logs': (1, 5.65),
    # media
    'media.media_files': (3, 4.65),
    # inventory
    'inventory.stock_holdings': (2, 7.05), 'inventory.batch_recalls': (3, 7.05), 'inventory.reservations': (1, 7.05),
    'inventory.stock_movements': (2, 8.05), 'inventory.packing_runs': (1, 8.05),
    # operations
    'operations.review_tasks': (0, 9.45), 'operations.violation_records': (1, 9.45),
    'operations.platform_settings': (2, 9.45), 'operations.threshold_alerts': (3, 9.45),
    'operations.staff_audit_logs': (0, 10.45),
}
FIG2 = {
    # procurement
    'procurement.supplier_offers': (0, 0.4), 'procurement.purchase_orders': (0, 1.4),
    'procurement.goods_receipts': (0, 2.4), 'procurement.price_forecasts': (0, 3.4),
    # retail
    'retail.restock_subscriptions': (2, 0.4), 'retail.carts': (3, 0.4), 'retail.listings': (2, 1.4),
    'retail.cart_items': (3, 1.4), 'retail.order_items': (2, 2.4), 'retail.orders': (2, 3.4),
    'retail.vouchers': (3, 3.4), 'retail.order_status_events': (3, 4.4),
    # payment
    'payment.supplier_payouts': (0, 5.8), 'payment.invoices': (1, 5.8), 'payment.payments': (2, 5.8),
    'payment.refunds': (3, 5.8), 'payment.commission_settlements': (1, 6.8),
    # wholesale
    'wholesale.price_tiers': (0, 8.2), 'wholesale.rfqs': (0, 9.2), 'wholesale.rfq_messages': (0, 10.2),
    'wholesale.wholesale_orders': (1, 8.2), 'wholesale.contracts': (1, 9.2), 'wholesale.contract_versions': (1, 10.2),
    'wholesale.contract_confirmations': (1, 11.2),
    # fulfillment
    'fulfillment.transfer_trips': (2, 8.2), 'fulfillment.trip_orders': (3, 8.2), 'fulfillment.shipments': (2, 9.2),
    'fulfillment.shipment_events': (3, 9.2), 'fulfillment.return_requests': (2, 10.2), 'fulfillment.messages': (3, 10.2),
    # engagement
    'engagement.reviews': (2, 11.6), 'engagement.review_replies': (3, 11.6),
    'engagement.supplier_reputation': (2, 12.6), 'engagement.wishlist_items': (3, 12.6),
}
X1 = {('catalog.products', 'supplier.suppliers'), ('inventory.stock_holdings', 'catalog.batches'),
      ('inventory.batch_recalls', 'catalog.batches')}
X2 = {('procurement.supplier_offers', 'catalog.batches'), ('retail.listings', 'catalog.products'),
      ('retail.order_items', 'inventory.stock_holdings'), ('payment.payments', 'retail.orders'),
      ('payment.commission_settlements', 'wholesale.wholesale_orders')}
GHOST2 = {'catalog.batches': (1, 0.4), 'catalog.products': (1, 1.4), 'inventory.stock_holdings': (1, 2.4)}


# ---------------------------------------------------------------- Phụ lục K
def tex(s):
    s = s.replace('\\', '\\textbackslash{}')
    for a, b in (('&', '\\&'), ('%', '\\%'), ('#', '\\#'), ('_', '\\_'), ('$', '\\$'), ('{', '\\{'), ('}', '\\}')):
        s = s.replace(a, b)
    s = s.replace('\\textbackslash\\{\\}', '\\textbackslash{}')
    return (s.replace('→', '$\\to$').replace('≤', '$\\le$').replace('–', '--').replace('…', '\\ldots{}')
            .replace('`', ''))


def tt(s):
    # cho phép ngắt dòng sau dấu gạch dưới trong tên dài
    return '\\texttt{%s}' % tex(s).replace('\\_', '\\_\\allowbreak{}')


BLOCKS = [
    ('Nền tảng chung', ['identity', 'notification', 'media']),
    ('Nguồn cung', ['supplier', 'catalog', 'inventory']),
    ('Giao dịch', ['procurement', 'retail', 'wholesale', 'payment']),
    ('Sau bán', ['fulfillment', 'engagement']),
    ('Vận hành', ['operations']),
]


def col_rows(t):
    rows = []
    for c in t['cols']:
        typ = c['type']
        kind = []
        if c['pk']:
            kind.append('PK')
        if c['ref']:
            kind.append('FK $\\to$ %s' % tt(c['ref'][1].split('.', 1)[1]))
        x = xref(c)
        if x and not c['ref']:
            kind.append('$\\to$ %s' % tt(x))
        if c['uq']:
            kind.append('duy nhất')
        if c['nn'] and not c['pk']:
            kind.append('bắt buộc')
        desc = re.sub(r'^→ [\w.]+(?: \|)?\s*', '', c['note'])
        if typ in ENUMS:
            vals = ', '.join(v + (' (%s)' % n if n else '') for v, n in ENUMS[typ])
            desc = (desc + '. ' if desc else '') + 'Giá trị: ' + vals
            typ = 'enum'
        if c['default'] and c['default'] != '`now()`' and not c['default'].startswith('`'):
            desc = (desc + '. ' if desc else '') + 'Mặc định: ' + c['default']
        second = tt(typ) + ('; ' + ', '.join(kind) if kind else '')
        rows.append('%s & %s & %s \\\\' % (tt(c['name']), second, tex(desc) if desc else ''))
    return rows


def appendix():
    n_tab = len(ORDER)
    n_col = sum(len(TABLES[t]['cols']) for t in ORDER)
    n_fk = sum(1 for e in EDGES if e[2] == 'fk')
    L = []
    L.append('% Phụ lục K — từ điển dữ liệu. SINH TỰ ĐỘNG từ schema.dbml bằng tools/diagrams/gen_erd.py; không sửa tay.')
    L.append('')
    L.append('\\section*{Phụ lục K. Từ điển dữ liệu}')
    L.append('\\label{apdx:tudien}')
    L.append('\\addcontentsline{toc}{section}{Phụ lục K. Từ điển dữ liệu}')
    L.append('')
    L.append('Cơ sở dữ liệu gồm %d bảng, %d cột, chia thành 13 schema trùng tên và ranh giới với 13 mô-đun tại '
             'Bảng~\\ref{tab:module-io}; sơ đồ quan hệ ở Hình~\\ref{fig:erd} và Hình~\\ref{fig:erd2}. Mỗi bảng dưới '
             'đây có một dòng tiêu đề kèm mục đích, sau đó là từng cột. Quy ước ở cột thứ hai:' % (n_tab, n_col))
    L.append('\\begin{itemize}')
    L.append('    \\item \\textbf{PK} --- khóa chính; \\textbf{FK $\\to$ bảng} --- khóa ngoại tới bảng trong cùng schema '
             '(%d khóa ngoại);' % n_fk)
    L.append('    \\item \\textbf{$\\to$ schema.bảng} --- tham chiếu sang schema khác bằng định danh, không tạo khóa '
             'ngoại vật lý, theo ràng buộc RB3 tại mục~\\ref{sec:kientruc}; tính nhất quán do mô-đun sở hữu bảng đích '
             'bảo đảm qua giao diện công khai và sự kiện;')
    L.append('    \\item \\textbf{bắt buộc} --- \\texttt{NOT NULL}; \\textbf{duy nhất} --- \\texttt{UNIQUE}. Cột kiểu '
             '\\texttt{bigint[]} lưu danh sách định danh tệp của schema \\texttt{media}.')
    L.append('\\end{itemize}')
    L.append('Bảng, cột ghi \\emph{chỉ thiết kế} có trong lược đồ để không phải đổi cấu trúc khi mở rộng, nhưng bản '
             'hiện thực không ghi dữ liệu vào. Từ điển này sinh tự động từ tệp lược đồ \\texttt{schema.dbml} của '
             'dự án, nên luôn khớp với lược đồ.')
    L.append('')
    for bname, schemas in BLOCKS:
        L.append('\\paragraph*{Khối %s}' % bname)
        L.append('')
        for sc in schemas:
            ts = [t for t in ORDER if t.startswith(sc + '.')]
            L.append('\\begingroup')
            L.append('\\tblsetup\\footnotesize\\renewcommand{\\arraystretch}{1.1}')
            L.append('\\begin{longtable}{L{3.60cm} L{4.40cm} L{6.90cm}}')
            L.append('\\caption{Từ điển dữ liệu schema \\texttt{%s} (%d bảng)}' % (sc, len(ts)))
            L.append('\\label{tab:db-%s} \\\\' % sc)
            hdr = ['\\toprule', '\\rowcolor{tblheadbg}',
                   '\\textbf{Cột} & \\textbf{Kiểu; ràng buộc} & \\textbf{Mô tả, giá trị} \\\\', '\\midrule']
            L += hdr + ['\\endfirsthead'] + hdr + ['\\endhead', '\\bottomrule', '\\endfoot']
            for k, t in enumerate(ts):
                T = TABLES[t]
                if k:
                    L.append('\\midrule')
                L.append('\\multicolumn{3}{@{}L{15.30cm}}{\\cellcolor{tblaltbg}\\textbf{%s} --- %s} \\\\'
                         % (tt(t.split('.', 1)[1]), tex(T['note'])))
                L += col_rows(T)
            L.append('\\end{longtable}')
            L.append('\\endgroup')
            L.append('')
    io.open(os.path.join(ROOT, 'backmatter', 'phuluc-csdl.tex'), 'w', encoding='utf-8', newline='\n').write(
        '\n'.join(L) + '\n')
    print('ok phuluc-csdl.tex', n_tab, n_col, n_fk)


if __name__ == '__main__':
    missing = set(ORDER) - set(FIG1) - set(FIG2)
    if missing:
        print('THIẾU TRONG HÌNH:', sorted(missing))
    draw_figure('erd-nen-tang.html', FIG1, {}, X1)
    draw_figure('erd-giao-dich.html', FIG2, GHOST2, X2)
    appendix()
