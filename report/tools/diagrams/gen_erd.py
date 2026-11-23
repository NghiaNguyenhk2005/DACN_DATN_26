# -*- coding: utf-8 -*-
# Đọc schema.dbml, sinh các hình ERD (tools/design/erd-*.html) và Phụ lục D (backmatter/phuluc-csdl.tex)
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
PAD, BW = 14, 410          # lề trong dải schema; bề rộng một bảng (rãnh giữa hai cột tự giãn theo số trục dọc)
STUB, STEP, MIN_GUT = 50, 18, 154   # đoạn thẳng tối thiểu ra khỏi mép bảng; bước giữa hai trục dọc; rãnh tối thiểu
LOOP_D, HALF, HOP, PARENT_GAP, CHK_STUB = 38, 8, 5, 22, 36
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
                     'card': c['ref'][0] if c['ref'] else 'n', 'nn': bool(c['nn'] or c['pk'])})
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
        s.text(x + 12, yy - 8, '… +%d cột khác (xem schema.dbml)' % c['more'], FS_DESC - 1, 400, '#7a8782', 'start',
               italic=True)


def layout_fig(schemas, gut):
    gx0 = PAD + BW
    bands, pos, y = [], {}, 8
    for sc in schemas:
        cells = [cell(t, BW) for t in ORDER if t.startswith(sc + '.')]
        y0 = y
        y += 46
        for i in range(0, len(cells), 2):
            row = cells[i:i + 2]
            for k, c in enumerate(row):
                pos[c['name']] = (PAD + k * (BW + gut), y, k, c)
            y += max(c['h'] for c in row) + 14
        bands.append((sc, y0, y + 2))
        y += 14
    return bands, pos, gx0, y


# Định tuyến trực giao: mỗi bảng cha một trục dọc trong rãnh giữa hai cột; đầu nối ra khỏi mép bảng
# thẳng ≥ STUB trước khi rẽ. Ký hiệu ER vẽ ở sym_svg; kiểm tra chất lượng ở check_routes.
def sym_zone(spec):
    kind, opt = spec
    if kind == 'many':
        return 25 if opt else 21
    return 21 if opt else 16


def sym_svg(p, u, spec, color):
    """Ký hiệu ER tại mép bảng p, u = hướng đơn vị đi vào đường nối; spec = (many|one, tùy chọn)."""
    kind, opt = spec
    nx, ny = -u[1], u[0]
    out = []

    def bar(d):
        cx, cy = p[0] + u[0] * d, p[1] + u[1] * d
        out.append('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.2"/>'
                   % (cx + nx * HALF, cy + ny * HALF, cx - nx * HALF, cy - ny * HALF, color))

    def ring(d):
        out.append('<circle cx="%g" cy="%g" r="4.5" fill="#ffffff" stroke="%s" stroke-width="2.2"/>'
                   % (p[0] + u[0] * d, p[1] + u[1] * d, color))

    if kind == 'many':
        bx, by = p[0] + u[0] * 14, p[1] + u[1] * 14
        for k in (-1, 0, 1):
            out.append('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="2.2"/>'
                       % (bx, by, p[0] + nx * HALF * k, p[1] + ny * HALF * k, color))
        if opt:
            ring(19.5)
        else:
            bar(19)
    else:
        bar(8)
        if opt:
            ring(16)
        else:
            bar(15)
    return ''.join(out)


def collect_edges(pos):
    """Cạnh con→cha (bỏ cạnh tới bảng có từ 4 con trỏ vào) và các khóa ngoại tự tham chiếu."""
    raw, selfs, seen = [], [], set()
    for t, (x, y, k, c) in pos.items():
        for i, r in enumerate(c['rows']):
            tgt = r['tgt']
            if tgt == t and r['ref']:
                pi = next((j for j, q in enumerate(c['rows']) if q['pk']), None)
                if pi is not None:
                    selfs.append({'t': t, 'fk_i': i, 'pk_i': pi, 'row': r})
            elif tgt in pos and tgt != t and (t, tgt) not in seen:
                seen.add((t, tgt))
                raw.append({'a': t, 'b': tgt, 'kind': 'fk' if r['ref'] else 'x', 'row': r, 'i': i})
    fan = {}
    for e in raw:
        fan[e['b']] = fan.get(e['b'], 0) + 1
    return [e for e in raw if fan[e['b']] < 4], selfs


def end_specs(row):
    child = ('one', True) if row['card'] == '1' else ('many', True)
    return child, ('one', not row['nn'])


def route_figure(pos, gx0, gut):
    """Trả về danh sách đường nối; None nếu rãnh gut không đủ chỗ cho các trục dọc."""
    edges, selfs = collect_edges(pos)
    gx1 = gx0 + gut

    def edge_x(t):
        return gx0 if pos[t][2] == 0 else gx1

    by_b = {}
    fixed = []                       # (bảng, y, cột) các đầu nối cố định: dòng FK của bảng con và hai đầu vòng
    for e in edges:
        x, y, k, c = pos[e['a']]
        e['yc'] = row_y(y, c, e['i'])
        fixed.append((e['a'], e['yc']))
        by_b.setdefault(e['b'], []).append(e)
    for s_ in selfs:
        x, y, k, c = pos[s_['t']]
        fixed += [(s_['t'], row_y(y, c, s_['fk_i'])), (s_['t'], row_y(y, c, s_['pk_i']))]
    placed = []
    for b, es in by_b.items():
        px, py, pk_, pc = pos[b]
        pi = next((j for j, q in enumerate(pc['rows']) if q['pk']), 0)
        base = row_y(py, pc, pi)
        top, bot = row_y(py, pc, 0) - 13, py + pc['h'] - 14
        for e in sorted(es, key=lambda e: e['yc']):
            hdr = list(range(int(top - 4), int(py + 15), -2))
            cands = [base] + hdr + [base + d for d in range(2, 200, 2)]
            cands = [c_ for c_ in cands if py + 16 <= c_ <= bot]

            def ok(c_, same_gap, other_gap):
                for (t_, y_) in fixed + placed:
                    if abs(c_ - y_) < (same_gap if t_ == b else other_gap):
                        return False
                return True
            e['ya'] = next((c_ for c_ in cands if ok(c_, PARENT_GAP - 2, 12)),
                           next((c_ for c_ in cands if ok(c_, PARENT_GAP - 2, 0)), base))
            placed.append((b, e['ya']))
    buses = {}
    for e in edges:
        buses.setdefault((e['b'], e['kind']), []).append(e)
    ext = {bk: (min(min(e['yc'], e['ya']) for e in es), max(max(e['yc'], e['ya']) for e in es))
           for bk, es in buses.items()}
    keys = sorted(buses, key=lambda k: ext[k][0])
    lmax = int((gut - 2 * STUB) // STEP) + 1

    def clash(o, k):
        return not (ext[o][1] + 10 < ext[k][0] - 10 or ext[k][1] + 10 < ext[o][0] - 10)

    def score(asg):
        lx = {bk: gx0 + STUB + asg[bk] * STEP for bk in keys}
        hs = []
        for e in edges:
            bk = (e['b'], e['kind'])
            hs.append((e['yc'], edge_x(e['a']), lx[bk], bk))
            hs.append((e['ya'], edge_x(e['b']), lx[bk], bk))
        cross = over = 0
        for (y, xa, xb, bk) in hs:
            for bj, (ylo, yhi) in ext.items():
                if bj != bk and min(xa, xb) < lx[bj] < max(xa, xb) and ylo < y < yhi:
                    cross += 1
        for i in range(len(hs)):
            for j in range(i + 1, len(hs)):
                p, q = hs[i], hs[j]
                if p[3] != q[3] and abs(p[0] - q[0]) < 10 and \
                        min(max(p[1], p[2]), max(q[1], q[2])) - max(min(p[1], p[2]), min(q[1], q[2])) > 2:
                    over += 1
        length = sum(abs(h[2] - h[1]) for h in hs)
        return over * 1000 + cross * 10 + length * 0.001 + (max(asg.values(), default=-1) + 1) * 2

    best, count = [None, None], [0]

    def rec(i, asg):
        if count[0] > 60000:
            return
        if i == len(keys):
            count[0] += 1
            sc = score(asg)
            if best[0] is None or sc < best[0]:
                best[0], best[1] = sc, dict(asg)
            return
        k = keys[i]
        for l in range(lmax):
            if all(not (asg[o] == l and clash(o, k)) for o in keys[:i]):
                asg[k] = l
                rec(i + 1, asg)
        asg.pop(k, None)

    rec(0, {})
    if keys and best[1] is None:
        return None
    used = sorted(set(best[1].values())) if keys else []
    rank = {l: r for r, l in enumerate(used)}
    lane = {bk: gx0 + gut / 2 + (rank[best[1][bk]] - (len(used) - 1) / 2) * STEP for bk in keys}
    routes = []
    for e in edges:
        bk = (e['b'], e['kind'])
        cs, ps = end_specs(e['row'])
        pts = [(edge_x(e['a']), e['yc']), (lane[bk], e['yc']), (lane[bk], e['ya']), (edge_x(e['b']), e['ya'])]
        routes.append({'owner': bk, 'pts': dedupe(pts), 'c': cs, 'p': ps, 'kind': e['kind']})
    for s in selfs:
        x, y, k, c = pos[s['t']]
        ex = edge_x(s['t'])
        d = LOOP_D if k == 0 else -LOOP_D
        y1, y0 = row_y(y, c, s['fk_i']), row_y(y, c, s['pk_i'])
        cs, ps = end_specs(s['row'])
        routes.append({'owner': ('self', s['t']), 'pts': [(ex, y1), (ex + d, y1), (ex + d, y0), (ex, y0)],
                       'c': cs, 'p': ps, 'kind': 'fk'})
    return routes


def dedupe(pts):
    out = [pts[0]]
    for p in pts[1:]:
        if p != out[-1]:
            out.append(p)
    return out


def segments(routes):
    out = []
    for ri, r in enumerate(routes):
        for i in range(len(r['pts']) - 1):
            (x0, y0), (x1, y1) = r['pts'][i], r['pts'][i + 1]
            out.append((ri, r['owner'], x0, y0, x1, y1))
    return out


def crossings(routes):
    """Các điểm cắt (đoạn ngang của đường này với đoạn dọc của đường khác chủ)."""
    sg = segments(routes)
    hops = {}
    n = 0
    loops = crossings.loops = [0]
    for (ri, ow, x0, y0, x1, y1) in sg:
        if y0 != y1:
            continue
        for (rj, ow2, a0, b0, a1, b1) in sg:
            if ow2 == ow or b0 == b1 or a0 != a1:
                continue
            if min(x0, x1) + HOP + 2 < a0 < max(x0, x1) - HOP - 2 and min(b0, b1) < y0 < max(b0, b1):
                hops.setdefault(ri, []).append((y0, a0))
                n += 1
                if ow2[0] == 'self':
                    loops[0] += 1
    return n, hops


def check_routes(routes, pos, name='', verbose=False):
    """V1 chỗ rẽ sát mép, V2 đoạn chồng/sát nhau, V3 ký hiệu chạm đường khác, V4 số điểm cắt, V5 xuyên bảng."""
    sg = segments(routes)
    v1 = v2 = v3 = v5 = 0

    def note(*a):
        if verbose:
            print('     ', *a)
    for r in routes:
        p = r['pts']
        for a, b in ((p[0], p[1]), (p[-1], p[-2])):
            if abs(a[0] - b[0]) + abs(a[1] - b[1]) < CHK_STUB - 0.5:
                v1 += 1
                note('V1', r['owner'], a, b)
    for i in range(len(sg)):
        for j in range(i + 1, len(sg)):
            s, t = sg[i], sg[j]
            if s[1] == t[1]:
                continue
            if s[3] == s[5] and t[3] == t[5] and abs(s[3] - t[3]) < 10 and \
                    min(max(s[2], s[4]), max(t[2], t[4])) - max(min(s[2], s[4]), min(t[2], t[4])) > 4:
                v2 += 1
                note('V2 ngang', s[1:], t[1:])
            elif s[2] == s[4] and t[2] == t[4] and abs(s[2] - t[2]) < 10 and \
                    min(max(s[3], s[5]), max(t[3], t[5])) - max(min(s[3], s[5]), min(t[3], t[5])) > 4:
                v2 += 1
                note('V2 doc', s[1:], t[1:])
    for ri, r in enumerate(routes):
        for spec, a, b in ((r['c'], r['pts'][0], r['pts'][1]), (r['p'], r['pts'][-1], r['pts'][-2])):
            L = sym_zone(spec)
            ux = 1 if b[0] > a[0] else -1
            rx0, rx1 = sorted((a[0] + 1 * ux, a[0] + ux * L))
            ry0, ry1 = a[1] - HALF - 1, a[1] + HALF + 1
            for (rj, ow, x0, y0, x1, y1) in sg:
                if rj == ri:
                    continue
                if min(x0, x1) < rx1 and max(x0, x1) > rx0 and min(y0, y1) < ry1 and max(y0, y1) > ry0:
                    v3 += 1
                    note('V3 ky hieu', routes[ri]['owner'], (a, b), 'cham', ow, (x0, y0, x1, y1))
    for t, (x, y, k, c) in pos.items():
        bx0, bx1, by0, by1 = x + 3, x + BW - 3, y + 3, y + c['h'] - 3
        for (ri, ow, x0, y0, x1, y1) in sg:
            if min(x0, x1) < bx1 and max(x0, x1) > bx0 and min(y0, y1) < by1 and max(y0, y1) > by0:
                v5 += 1
    v4, _ = crossings(routes)
    v4loop = crossings.loops[0]
    res = {'V1': v1, 'V2': v2, 'V3': v3, 'V4': v4, 'V5': v5, 'V4loop': v4loop}
    print('   check %-30s V1=%d V2=%d V3=%d V4(cross)=%d (loop %d) V5=%d' % (name, v1, v2, v3, v4, v4loop, v5))
    return res


def path_d(pts, hops):
    d = 'M%g,%g' % pts[0]
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        if y0 == y1:
            sgn = 1 if x1 > x0 else -1
            for hx in sorted((h[1] for h in hops if h[0] == y0 and min(x0, x1) < h[1] < max(x0, x1)),
                             reverse=sgn < 0):
                d += ' L%g,%g A%g,%g 0 0 %d %g,%g' % (hx - sgn * HOP, y0, HOP, HOP, 1 if sgn > 0 else 0,
                                                       hx + sgn * HOP, y0)
        d += ' L%g,%g' % (x1, y1)
    return d


def draw_figure(fname, schemas, verbose=False):
    for gut in range(MIN_GUT, MIN_GUT + 6 * STEP, STEP):
        bands, pos, gx0, H = layout_fig(schemas, gut)
        routes = route_figure(pos, gx0, gut)
        if routes is not None:
            break
    else:
        raise SystemExit('Không đủ chỗ cho các trục dọc ở ' + fname)
    fw = 2 * PAD + 2 * BW + gut
    s = Svg(fw, H)
    for sc, y0, y1 in bands:
        fill, stroke = BLOCK[SCHEMA_BLOCK[sc]]
        s.rect(2, y0, fw - 4, y1 - y0, fill=fill, stroke=stroke, sw=2.5, rx=14)
        n = sum(1 for t in pos if t.startswith(sc + '.'))
        s.text(PAD, y0 + 31, sc, 24, 800, stroke, 'start', mono=True)
        s.text(PAD + wmono(sc, 24) + 14, y0 + 30, '%d bảng' % n, 18, 400, '#4d5c55', 'start')
    _, hop_map = crossings(routes)
    for ri, r in enumerate(routes):
        color = '#44524b' if r['kind'] == 'fk' else '#6b7872'
        dash = ' stroke-dasharray="9 6"' if r['kind'] == 'x' else ''
        s.add('<path d="%s" fill="none" stroke="%s" stroke-width="%g" stroke-linejoin="round"%s/>'
              % (path_d(r['pts'], hop_map.get(ri, [])), color, 2.4 if r['kind'] == 'fk' else 2.2, dash))
        for spec, a, b in ((r['c'], r['pts'][0], r['pts'][1]), (r['p'], r['pts'][-1], r['pts'][-2])):
            L = max(1e-6, ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5)
            s.add(sym_svg(a, ((b[0] - a[0]) / L, (b[1] - a[1]) / L), spec, color))
    for t, (x, y, k, c) in pos.items():
        draw_cell(s, c, x, y, BW)
    res = check_routes(routes, pos, fname, verbose)
    io.open(os.path.join(OUT, fname), 'w', encoding='utf-8').write(
        page(s.svg(), legend(), NOTE, fw))
    print('ok', fname, len(pos), 'tables', 'H=%d' % H, 'W=%d' % fw, len(routes), 'routes', 'gut=%d' % gut)
    return res


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


def legend():
    def glyph(spec):
        col = '#44524b'
        return ('<svg width="54" height="24" viewBox="0 0 54 24"><line x1="0" y1="12" x2="52" y2="12" stroke="%s" '
                'stroke-width="2.4"/>%s</svg>' % (col, sym_svg((52, 12), (-1, 0), spec, col)))
    return ('<span><i class="sw" style="background:#fff;border-color:#1f8a4c"></i>Bảng (khung màu theo schema)</span>'
            '<span><i class="sw" style="background:#f6f7f6;border-color:#8a948f;border-style:dashed"></i>Bảng chỉ thiết kế</span>'
            '<span><i class="ln"></i>Khóa ngoại cùng schema</span>'
            '<span><i class="ln" style="border-top:3px dashed #6b7872"></i>Tham chiếu định danh (RB3)</span>'
            '<span>%sĐúng một (FK bắt buộc)</span>'
            '<span>%sKhông hoặc một (FK cho phép NULL)</span>'
            '<span>%sKhông hoặc nhiều</span>') % (glyph(('one', False)), glyph(('one', True)), glyph(('many', True)))


NOTE = ('PK: khóa chính; FK: khóa ngoại; dòng “→ schema.bảng”: tham chiếu bằng định danh tới bảng đích, '
        'vẽ nét đứt khi đích nằm trong cùng hình. Ký hiệu cạnh bảng cha: đúng một hoặc không hoặc một; cạnh bảng con: '
        'không hoặc nhiều. Vòng nhỏ sát mép bảng là khóa ngoại trỏ về chính bảng đó. '
        'Không vẽ đường tới bảng được từ 4 bảng trở lên trỏ vào (chỉ ghi ở cột bên phải).')


def page(svg, legend_html, note='', width=None):
    width = width or W
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
''' % (width + 20, width + 20, FONT, svg, legend_html, '<div class="note">%s</div>' % html.escape(note) if note else '')


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


# ---------------------------------------------------------------- Phụ lục D
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
    L.append('% Phụ lục D — từ điển dữ liệu. SINH TỰ ĐỘNG từ schema.dbml bằng tools/diagrams/gen_erd.py; không sửa tay.')
    L.append('')
    L.append('\\section*{Phụ lục D. Từ điển dữ liệu và sơ đồ ERD}')
    L.append('\\label{apdx:tudien}')
    L.append('\\addcontentsline{toc}{section}{Phụ lục D. Từ điển dữ liệu và sơ đồ ERD}')
    L.append('')
    L.append('Cơ sở dữ liệu gồm %d bảng, %d cột, chia thành 13 schema trùng tên và ranh giới với 13 mô-đun tại '
             'Bảng~\\ref{tab:module-io}; sơ đồ quan hệ ở Hình~\\ref{fig:erd-tong-quan} và các hình ERD theo miền cuối phụ lục này. '
             'Mỗi bảng dưới đây ghi mục đích, số cột và các cột khóa. Danh sách đầy đủ từng cột (kiểu, ràng buộc, giá trị hợp lệ) '
             'nằm trong tệp lược đồ \\texttt{report/schema.dbml} của dự án, nguồn sinh duy nhất của bảng này và các hình ERD nên luôn khớp nhau. '
             'Quy ước cột cuối:' % (n_tab, n_col))
    L.append('\\begin{itemize}')
    L.append('    \\item \\textbf{PK} --- khóa chính; \\textbf{FK $\\to$ bảng} --- khóa ngoại tới bảng trong cùng schema '
             '(%d khóa ngoại);' % n_fk)
    L.append('    \\item \\textbf{$\\to$ schema.bảng} --- tham chiếu sang schema khác bằng định danh, không tạo khóa '
             'ngoại vật lý, theo ràng buộc RB3 tại mục~\\ref{sec:kientruc}; tính nhất quán do mô-đun sở hữu bảng đích '
             'bảo đảm qua giao diện công khai và sự kiện.')
    L.append('\\end{itemize}')
    L.append('Bảng ghi \\emph{chỉ thiết kế} có trong lược đồ để không phải đổi cấu trúc khi mở rộng, nhưng bản '
             'hiện thực không ghi dữ liệu vào.')
    L.append('')
    for bname, schemas in BLOCKS:
        L.append('\\paragraph*{Khối %s}' % bname)
        L.append('')
        for sc in schemas:
            ts = [t for t in ORDER if t.startswith(sc + '.')]
            L.append('\\begingroup')
            L.append('\\tblsetup\\footnotesize\\renewcommand{\\arraystretch}{1.1}')
            L.append('\\begin{longtable}{L{3.20cm} L{5.60cm} L{1.10cm} L{5.00cm}}')
            L.append('\\caption{Các bảng của schema \\texttt{%s} (%d bảng)}' % (sc, len(ts)))
            L.append('\\label{tab:db-%s} \\\\' % sc)
            hdr = ['\\toprule', '\\rowcolor{tblheadbg}',
                   '\\textbf{Bảng} & \\textbf{Mục đích} & \\textbf{Số cột} & \\textbf{Khóa, tham chiếu} \\\\', '\\midrule']
            L += hdr + ['\\endfirsthead'] + hdr + ['\\endhead', '\\bottomrule', '\\endfoot']
            for t in ts:
                T = TABLES[t]
                keys = []
                for c in T['cols']:
                    if c['pk']:
                        keys.append('PK %s' % tt(c['name']))
                    elif c['ref']:
                        keys.append('%s FK $\\to$ %s' % (tt(c['name']), tt(c['ref'][1].split('.', 1)[1])))
                    elif xref(c):
                        keys.append('%s $\\to$ %s' % (tt(c['name']), tt(xref(c))))
                L.append('%s & %s & %d & %s \\\\' % (tt(t.split('.', 1)[1]), tex(T['note']), len(T['cols']),
                                                  '; '.join(keys)))
            L.append('\\end{longtable}')
            L.append('\\endgroup')
            L.append('')
    io.open(os.path.join(ROOT, 'backmatter', 'phuluc-csdl.tex'), 'w', encoding='utf-8', newline='\n').write(
        '\n'.join(L) + '\n')
    print('ok phuluc-csdl.tex', n_tab, n_col, n_fk)




if __name__ == '__main__':
    draw_overview('erd-tong-quan.html')
    bad = 0
    for fn, scs in FIGS:
        r = draw_figure(fn, scs, '-v' in sys.argv)
        bad += r['V1'] + r['V2'] + r['V3'] + r['V5']
    appendix()
    if bad:
        print('ERD CHECK FAILED: %d violations in V1/V2/V3/V5' % bad)
        sys.exit(1)
