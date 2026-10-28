# -*- coding: utf-8 -*-
# Đọc schema.dbml, sinh các hình ERD (tools/design/erd-*.html) và Phụ lục K (backmatter/phuluc-csdl.tex)
import html, io, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgkit import Svg, BLK, FONT

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
# Mỗi hình: schema xếp thành dải ngang, bảng chia 2 cột; chỉ hiện PK, FK và 1-2 cột định danh.
W = 960                    # bề rộng vùng vẽ (px); ảnh rộng W+20 co về 16 cm nên 1px ~ 0,46pt
PAD, GUT = 14, 112         # lề trong dải schema; rãnh giữa hai cột (chứa các đường nối)
FS_NAME, FS_ROW, FS_DESC = 20, 18.5, 17
INK = '#16241e'
BLOCK = BLK
SCHEMA_BLOCK = {'identity': 'chung', 'notification': 'chung', 'media': 'chung', 'supplier': 'cung',
                'catalog': 'cung', 'inventory': 'cung', 'procurement': 'gd', 'retail': 'gd', 'wholesale': 'gd',
                'payment': 'gd', 'fulfillment': 'sau', 'engagement': 'sau', 'operations': 'vh'}
BLOCK_NAME = {'chung': 'Nền tảng chung', 'cung': 'Nguồn cung', 'gd': 'Giao dịch', 'sau': 'Sau bán', 'vh': 'Vận hành'}
IDENT = ['code', 'status', 'name', 'title', 'type', 'kind', 'slug', 'sku', 'role', 'channel', 'method', 'key']
SKIP_X = ('identity.users', 'media.media_files')


def wmono(s, size):
    return len(s) * 0.58 * size


def wsans(s, size):
    return len(s) * 0.5 * size


def short_desc(note):
    s = re.sub(r'\s*\((?:FR|NFR|RB)[^)]*\)', '', note)
    s = re.split(r'; | — |\. ', s)[0].strip()
    if len(s) > 80:
        s = s[:77].rsplit(' ', 1)[0] + '…'
    return s


def wrap_px(text, width, size):
    out, line = [], ''
    for w in text.split(' '):
        t = (line + ' ' + w).strip()
        if wsans(t, size) <= width:
            line = t
        else:
            out.append(line)
            line = w
    if line:
        out.append(line)
    return out


def build_rows(name, inner):
    """PK, FK, tham chiếu xuyên schema (trừ users/media) và 1-2 cột định danh; trả (dòng, số cột còn lại)."""
    cols = TABLES[name]['cols']
    pk = [c for c in cols if c['pk']]
    fk = [c for c in cols if c['ref'] and not c['pk'] and c['ref'][1] != name]
    selfref = [c for c in cols if c['ref'] and not c['pk'] and c['ref'][1] == name]
    xs = [c for c in cols if xref(c) and not c['ref'] and not c['pk'] and xref(c) not in SKIP_X]
    chosen = list(pk)
    for c in fk + xs:
        if len(chosen) < 4:
            chosen.append(c)
    if not any(c['ref'] or xref(c) for c in chosen):
        us = [c for c in cols if xref(c) == 'identity.users' and not c['ref'] and not c['pk']]
        if us:
            chosen.append(us[0])
    for c in selfref:
        if len(chosen) < 4:
            chosen.append(c)
    ids = [c for n in IDENT for c in cols if c['name'] == n and c not in chosen]
    ids += [c for c in cols if c['name'].endswith(('_code', '_status')) and c not in chosen and c not in ids]
    room = 5 - len(chosen)
    chosen += ids[:max(0, min(2 if len(chosen) <= 3 else 1, room))]
    rows = []
    for c in chosen:
        tag, tgt = [], None
        if c['pk']:
            tag.append('PK')
        if c['ref']:
            tgt = c['ref'][1]
            tag.append('FK → ' + tgt.split('.', 1)[1])
        elif xref(c):
            tgt = xref(c)
            tag.append('→ ' + tgt)
        t = ', '.join(tag)
        if wmono(c['name'], FS_ROW) + wsans(t, FS_ROW - 1.5) + 18 > inner:
            t = 'PK' if c['pk'] else ('FK' if c['ref'] else '')
            if not t:
                continue
        rows.append({'name': c['name'], 'tag': t, 'tgt': tgt, 'ref': bool(c['ref']), 'pk': c['pk'],
                     'card': c['ref'][0] if c['ref'] else 'n'})
    return rows, len(cols) - len(rows)


def cell(name, bw):
    inner = bw - 24
    rows, more = build_rows(name, inner)
    note = TABLES[name]['note']
    desc = wrap_px(short_desc(note), inner, FS_DESC)[:2] if note else []
    h = 38 + len(desc) * 21 + 6 + len(rows) * 26 + (26 if more else 0) + 10
    return {'name': name, 'rows': rows, 'more': more, 'desc': desc, 'h': h}


def row_y(y, c, i):
    return y + 38 + len(c['desc']) * 21 + 6 + 13 + 26 * i


def draw_cell(s, c, x, y, bw):
    name = c['name']
    sc, short = name.split('.')
    fill, stroke = BLOCK[SCHEMA_BLOCK[sc]]
    design = bool(re.search(r'chỉ thiết kế\)$', TABLES[name]['note']))
    s.rect(x, y, bw, c['h'], fill='#f6f7f6' if design else '#ffffff', stroke='#8a948f' if design else stroke,
           sw=2.2, rx=8, dash='8 6' if design else None)
    s.text(x + 12, y + 27, short, FS_NAME, 800, '#7d8882' if design else INK, 'start', mono=True)
    yy = y + 38
    for ln in c['desc']:
        yy += 21
        s.text(x + 12, yy - 5, ln, FS_DESC, 400, '#4d5c55', 'start')
    yy += 6
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="#c7d1cb" stroke-width="1.4"/>' % (x + 8, yy, x + bw - 8, yy))
    for r in c['rows']:
        yy += 26
        s.text(x + 12, yy - 7, r['name'], FS_ROW, 700 if r['pk'] else 400, INK, 'start', mono=True)
        if r['tag']:
            strong = r['ref'] or r['pk']
            s.text(x + bw - 12, yy - 7, r['tag'], FS_ROW - 1.5, 600 if strong else 400,
                   '#44524b' if strong else '#6b7872', 'end')
    if c['more']:
        yy += 26
        s.text(x + 12, yy - 8, '… +%d cột khác (xem Phụ lục K)' % c['more'], FS_DESC - 1, 400, '#7a8782', 'start',
               italic=True)


def layout_fig(schemas):
    bw = (W - 2 * PAD - GUT) / 2
    bands, pos, y = [], {}, 8
    for sc in schemas:
        cells = [cell(t, bw) for t in ORDER if t.startswith(sc + '.')]
        y0 = y
        y += 46
        for i in range(0, len(cells), 2):
            row = cells[i:i + 2]
            for k, c in enumerate(row):
                pos[c['name']] = (PAD + k * (bw + GUT), y, k, c)
            y += max(c['h'] for c in row) + 14
        bands.append((sc, y0, y + 2))
        y += 14
    return bands, pos, bw, y


def draw_figure(fname, schemas):
    bands, pos, bw, H = layout_fig(schemas)
    s = Svg(W, H)
    for sc, y0, y1 in bands:
        fill, stroke = BLOCK[SCHEMA_BLOCK[sc]]
        s.rect(2, y0, W - 4, y1 - y0, fill=fill, stroke=stroke, sw=2.5, rx=14)
        n = sum(1 for t in pos if t.startswith(sc + '.'))
        s.text(PAD, y0 + 31, sc, 24, 800, stroke, 'start', mono=True)
        s.text(PAD + wmono(sc, 24) + 14, y0 + 30, '%d bảng' % n, 18, 400, '#4d5c55', 'start')
    edges, seen = [], set()
    for t, (x, y, k, c) in pos.items():
        for i, r in enumerate(c['rows']):
            if r['tgt'] in pos and r['tgt'] != t and (t, r['tgt']) not in seen:
                seen.add((t, r['tgt']))
                edges.append((t, r['tgt'], 'fk' if r['ref'] else 'x', r['card'], row_y(y, c, i)))
    fan = {}
    for e in edges:
        fan[e[1]] = fan.get(e[1], 0) + 1
    edges = [e for e in edges if fan[e[1]] < 4]
    tracks, used = [], {}
    for (a, b, kind, card, ya) in sorted(edges, key=lambda e: e[4]):
        yb = pos[b][1] + 20
        lo, hi = min(ya, yb) - 6, max(ya, yb) + 6
        ti = 0
        while ti < len(tracks) and any(not (hi < l or lo > h) for (l, h) in tracks[ti]):
            ti += 1
        if ti == len(tracks):
            tracks.append([])
        tracks[ti].append((lo, hi))
        used[(a, b)] = ti
    step = min(16, (GUT - 24) / max(1, len(tracks)))
    for (a, b, kind, card, ya) in edges:
        xa, ya0, ka, ca = pos[a]
        xb, yb0, kb, cb = pos[b]
        tx = PAD + bw + 12 + used[(a, b)] * step
        inc = [e[0] for e in edges if e[1] == b]
        yb = yb0 + 20 + (inc.index(a) - (len(inc) - 1) / 2) * 7
        pts = [(xa + bw if ka == 0 else xa, ya), (tx, ya), (tx, yb), (xb + bw if kb == 0 else xb, yb)]
        color = '#44524b' if kind == 'fk' else '#8a948f'
        dash = ' stroke-dasharray="9 6"' if kind == 'x' else ''
        s.add('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"%s/>'
              % (' '.join('%g,%g' % p for p in pts), color, 2.4 if kind == 'fk' else 2, dash))
        crow(s, pts[0], pts[1], color, many=(card == 'n'))
        crow(s, pts[-1], pts[-2], color, many=False)
    for t, (x, y, k, c) in pos.items():
        draw_cell(s, c, x, y, bw)
    io.open(os.path.join(OUT, fname), 'w', encoding='utf-8').write(page(s.svg(), LEGEND, NOTE))
    print('ok', fname, len(pos), 'tables', 'H=%d' % H, len(edges), 'edges', len(tracks), 'tracks')


def crow(s, p, q, color, many):
    """Ký hiệu chân chim tại đầu p của đoạn p-q: nhiều (chân chim) hoặc một (gạch ngang)."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = max(1e-6, (dx * dx + dy * dy) ** 0.5)
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux
    if many:
        bx, by = p[0] + ux * 14, p[1] + uy * 14
        for k in (-1, 0, 1):
            s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.2"/>'
                  % (bx, by, p[0] + nx * 8 * k, p[1] + ny * 8 * k, color))
        cx, cy = p[0] + ux * 19, p[1] + uy * 19
    else:
        cx, cy = p[0] + ux * 10, p[1] + uy * 10
    s.add('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.2"/>'
          % (cx + nx * 8, cy + ny * 8, cx - nx * 8, cy - ny * 8, color))


# ---------------------------------------------------------------- tổng quan 13 schema
SC_POS = {  # schema: (hàng, cột)
    'identity': (0, 0), 'notification': (0, 1), 'media': (0, 2),
    'supplier': (1, 0), 'catalog': (1, 1), 'inventory': (1, 2),
    'procurement': (2, 0), 'retail': (2, 1), 'wholesale': (2, 2), 'payment': (2, 3),
    'engagement': (3, 0), 'fulfillment': (3, 1), 'operations': (3, 3)}
OBW, OBH, OGX, OX0 = 188, 74, 44, 36
OROW_Y = {0: 44, 1: 214, 2: 446, 3: 760}      # đỉnh hàng hộp
OCH = {1: 172, 2: 380, 3: 650}                # trục kênh phía trên hàng i


def ov_box(sc):
    r, c = SC_POS[sc]
    return OX0 + c * (OBW + OGX), OROW_Y[r], OBW, OBH


def overview_pairs():
    cnt = {}
    for t in ORDER:
        for col in TABLES[t]['cols']:
            x = xref(col)
            if x and not col['ref']:
                a, b = t.split('.')[0], x.split('.')[0]
                if a != b and b not in ('identity', 'media'):
                    cnt[(a, b)] = cnt.get((a, b), 0) + 1
    return cnt


def draw_overview(fname):
    # Ma trận phụ thuộc: hàng = schema tham chiếu, cột = schema được tham chiếu; ô ghi số cột tham chiếu
    cnt = overview_pairs()
    nt = {}
    for t in ORDER:
        nt[t.split('.')[0]] = nt.get(t.split('.')[0], 0) + 1
    order = sorted(SC_POS, key=lambda k: (SCHEMA_BLOCK[k] != 'chung', list(BLOCK).index(SCHEMA_BLOCK[k]), SC_POS[k]))
    rows_ = [a for a in order if any((a, b) in cnt for b in order)]
    cols_ = [b for b in order if any((a, b) in cnt for a in order)]
    LW, CW, RH, HH = 190, 106, 50, 70
    H = 30 + HH + len(rows_) * RH + 20
    s = Svg(W, H)
    x0 = (W - LW - CW * len(cols_)) / 2
    y0 = 20
    for j, b in enumerate(cols_):
        fill, stroke = BLOCK[SCHEMA_BLOCK[b]]
        s.rect(x0 + LW + j * CW + 2, y0, CW - 4, HH - 6, fill=fill, stroke=stroke, sw=2, rx=8)
        s.text(x0 + LW + j * CW + CW / 2, y0 + 30, b, 16, 800, INK, 'middle', mono=True)
        s.text(x0 + LW + j * CW + CW / 2, y0 + 54, '%d bảng' % nt[b], 16, 400, '#4d5c55', 'middle')
    for i, a in enumerate(rows_):
        y = y0 + HH + i * RH
        fill, stroke = BLOCK[SCHEMA_BLOCK[a]]
        s.rect(x0, y + 2, LW - 6, RH - 4, fill=fill, stroke=stroke, sw=2, rx=8)
        s.text(x0 + 14, y + 24, a, 18, 800, INK, 'start', mono=True)
        s.text(x0 + 14, y + 42, '%d bảng' % nt[a], 15, 400, '#4d5c55', 'start')
        for j, b in enumerate(cols_):
            cx = x0 + LW + j * CW
            n = cnt.get((a, b))
            s.rect(cx + 2, y + 2, CW - 4, RH - 4, fill='#ffffff' if not n else BLOCK[SCHEMA_BLOCK[b]][0],
                   stroke='#dfe5e1' if not n else BLOCK[SCHEMA_BLOCK[b]][1], sw=1.4, rx=6)
            if n:
                s.text(cx + CW / 2, y + 33, str(n), 22, 800, INK, 'middle')
    leg = ('<span>Hàng: schema có cột tham chiếu; cột: schema được tham chiếu; số = số cột tham chiếu (bằng định danh, '
           'không phải khóa ngoại vật lý); màu ô theo khối của schema được tham chiếu</span>')
    note = ('Không đưa identity và media vào cột vì hầu hết schema đều tham chiếu tới hai schema này. '
            'Tên schema trùng với 13 mô-đun.')
    io.open(os.path.join(OUT, fname), 'w', encoding='utf-8').write(page(s.svg(), leg, note))
    print('ok', fname, len(rows_), 'x', len(cols_))


LEGEND = ('<span><i class="sw" style="background:#fff;border-color:#1f8a4c"></i>Bảng (khung màu theo schema)</span>'
          '<span><i class="sw" style="background:#f6f7f6;border-color:#8a948f;border-style:dashed"></i>Bảng chỉ thiết kế</span>'
          '<span><i class="ln"></i>Khóa ngoại cùng schema (chân chim ở phía nhiều)</span>'
          '<span><i class="ln" style="border-top:3px dashed #8a948f"></i>Tham chiếu sang schema khác (RB3)</span>')
NOTE = ('PK: khóa chính; FK: khóa ngoại; dòng “→ schema.bảng”: tham chiếu bằng định danh tới bảng đích, '
        'vẽ nét đứt khi đích nằm trong cùng hình. Không vẽ đường tới bảng được từ 4 bảng trở lên trỏ vào (chỉ ghi ở cột bên phải).')


def page(svg, legend_html, note=''):
    return '''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<!-- Sinh tự động bởi gen_erd.py; ảnh rộng %d px co về 16 cm, chữ 18,5px ~ 8,5pt. -->
<style>
  *{box-sizing:border-box;}
  body{margin:0; padding:10px; width:%dpx; background:#fff; font-family:%s; color:#16241e;}
  .legend{display:flex; flex-wrap:wrap; gap:6px 22px; margin-top:10px; font-size:17px; color:#33413a; align-items:center;}
  .legend span{display:inline-flex; align-items:center; gap:8px;}
  .sw{width:30px; height:20px; border-radius:5px; display:inline-block; border:2px solid; flex:none;}
  .ln{width:40px; height:0; border-top:3px solid #44524b; display:inline-block;}
  .note{margin-top:6px; font-size:17px; color:#4d5c55;}
</style>
</head>
<body>
  <div>%s</div>
  <div class="legend">%s</div>
  %s
</body>
</html>
''' % (W + 20, W + 20, FONT, svg, legend_html, '<div class="note">%s</div>' % html.escape(note) if note else '')


FIGS = [
    ('erd-dinh-danh.html', ['identity']),
    ('erd-thong-bao-tep.html', ['notification', 'media']),
    ('erd-nha-cung-cap-ton-kho.html', ['supplier', 'inventory']),
    ('erd-danh-muc.html', ['catalog']),
    ('erd-ban-le.html', ['retail']),
    ('erd-thu-mua.html', ['procurement']),
    ('erd-thanh-toan.html', ['payment']),
    ('erd-ban-si.html', ['wholesale']),
    ('erd-giao-hang-doi-tra.html', ['fulfillment']),
    ('erd-danh-gia-van-hanh.html', ['engagement', 'operations']),
]


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
    n_fk = sum(1 for t in ORDER for c in TABLES[t]['cols'] if c['ref'])
    L = []
    L.append('% Phụ lục K — từ điển dữ liệu. SINH TỰ ĐỘNG từ schema.dbml bằng tools/diagrams/gen_erd.py; không sửa tay.')
    L.append('')
    L.append('\\section*{Phụ lục K. Từ điển dữ liệu}')
    L.append('\\label{apdx:tudien}')
    L.append('\\addcontentsline{toc}{section}{Phụ lục K. Từ điển dữ liệu}')
    L.append('')
    L.append('Cơ sở dữ liệu gồm %d bảng, %d cột, chia thành 13 schema trùng tên và ranh giới với 13 mô-đun tại '
             'Bảng~\\ref{tab:module-io}; sơ đồ quan hệ từ Hình~\\ref{fig:erd-tong-quan} đến Hình~\\ref{fig:erd-danh-gia-van-hanh}. Mỗi bảng dưới '
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
    draw_overview('erd-tong-quan.html')
    for fn, scs in FIGS:
        draw_figure(fn, scs)
    appendix()
