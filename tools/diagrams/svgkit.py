# -*- coding: utf-8 -*-
# Bộ dựng SVG tối giản cho sơ đồ C4, use case, sitemap; xuất HTML cùng khuôn với tools/design/
import html

FONT = "'Segoe UI','Noto Sans',Arial,sans-serif"
MONO = "Consolas,'Courier New',monospace"
CW = 0.50  # bề rộng trung bình một ký tự / cỡ chữ (ước lượng cho Segoe UI tiếng Việt)


def wrap(text, width, size, mono=False, weight=400):
    cw = (0.6 if mono else (0.56 if weight >= 600 else CW)) * size
    maxc = max(4, int(width / cw))
    out, line = [], ''
    for w in text.split(' '):
        t = (line + ' ' + w).strip()
        if len(t) <= maxc:
            line = t
        else:
            if line:
                out.append(line)
            line = w
    if line:
        out.append(line)
    return out


class Svg:
    def __init__(self, w, h):
        self.w, self.h, self.parts, self.later = w, h, [], []

    def add(self, s):
        self.parts.append(s)

    def rect(self, x, y, w, h, fill='#fff', stroke='#333', sw=2, rx=10, dash=None):
        d = ' stroke-dasharray="%s"' % dash if dash else ''
        self.add('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="%s" stroke="%s" stroke-width="%g"%s/>'
                 % (x, y, w, h, rx, fill, stroke, sw, d))

    def text(self, x, y, s, size=22, weight=400, color='#16241e', anchor='middle', mono=False, italic=False):
        self.add('<text x="%g" y="%g" font-size="%g" font-weight="%s" fill="%s" text-anchor="%s" font-family="%s"%s>%s</text>'
                 % (x, y, size, weight, color, anchor, MONO if mono else FONT,
                    ' font-style="italic"' if italic else '', html.escape(s)))

    def block(self, x, y, w, lines, anchor='middle', pad=14, gap=6):
        """lines: list of (text, size, weight, color, mono). Trả về y cuối."""
        cy = y
        for (t, size, weight, color, mono) in lines:
            for ln in wrap(t, w - 2 * pad, size, mono, weight):
                cy += size * 1.18
                tx = x + w / 2 if anchor == 'middle' else x + pad
                self.text(tx, cy, ln, size, weight, color, anchor, mono)
            cy += gap
        return cy

    def box(self, x, y, w, h, lines, fill='#fff', stroke='#333', sw=2, rx=12, dash=None, anchor='middle', valign='middle', pad=14):
        self.rect(x, y, w, h, fill, stroke, sw, rx, dash)
        # đo chiều cao khối chữ để căn giữa theo chiều dọc
        tmp = Svg(0, 0)
        endy = tmp.block(x, 0, w, lines, anchor, pad)
        th = endy
        if th + 6 > h:
            print('OVERFLOW %s: need %d, have %d' % (ascii(lines[0][0][:30]), th + 6, h))
        top = y + (h - th) / 2 if valign == 'middle' else y + 8
        self.block(x, top, w, lines, anchor, pad)

    def arrow(self, pts, color='#44524b', sw=2.4, dash=None, head=True, both=False):
        d = ' stroke-dasharray="%s"' % dash if dash else ''
        p = ' '.join('%g,%g' % q for q in pts)
        m = ' marker-end="url(#ah-%s)"' % color.strip('#') if head else ''
        m += ' marker-start="url(#ah-%s)"' % color.strip('#') if both else ''
        self.add('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"%s%s/>' % (p, color, sw, d, m))
        self._markers = getattr(self, '_markers', set()) | {color}

    def label(self, cx, cy, text, width, size=22, color='#33413a', bg='#fff', pos='on', weight=400, italic=True):
        lines = wrap(text, width - 12, size, weight=weight)
        h = len(lines) * size * 1.2 + 10
        # pos='above'/'below': đặt nhãn sát trên/dưới đường mũi tên để thân mũi tên không bị che
        if pos == 'above':
            cy -= h / 2 + 4
        elif pos == 'below':
            cy += h / 2 + 4
        elif pos == 'top':
            cy += h / 2
        self.later.append('<rect x="%g" y="%g" width="%g" height="%g" rx="6" fill="%s" opacity="0.94"/>'
                 % (cx - width / 2, cy - h / 2, width, h, bg))
        y = cy - h / 2 + 5
        for ln in lines:
            y += size * 1.2
            n0 = len(self.parts)
            self.text(cx, y - size * 0.25, ln, size, weight, color, 'middle', False, italic)
            self.later.append(self.parts.pop())

    def svg(self):
        defs = ''.join('<marker id="ah-%s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="%s"/></marker>'
                       % (c.strip('#'), c) for c in sorted(getattr(self, '_markers', set())))
        return ('<svg xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%%;height:auto" width="%d" height="%d" viewBox="0 0 %d %d"><defs>%s</defs>%s</svg>'
                % (self.w, self.h, self.w, self.h, defs, '\n'.join(self.parts + self.later)))


def page(title, sub, svg, legend_html, note=''):
    return '''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<!-- Sinh tự động; cỡ chữ in ra (pt) = px x 16 / 1420 x 28,45 -> chữ 22px ~ 7pt. -->
<style>
  *{box-sizing:border-box;}
  body{margin:0; padding:30px 40px; width:1420px; background:#f4f6f5;
       font-family:%s; color:#16241e;}
  h1{font-size:34px; margin:0 0 6px; font-weight:800;}
  .sub{color:#4d5c55; font-size:22px; margin:0 0 18px; line-height:1.35;}
  .stage{background:#fff; border:1px solid #c7d1cb; border-radius:18px; padding:20px 0;}
  .legend{display:flex; flex-wrap:wrap; gap:10px 26px; margin-top:16px; font-size:22px; color:#33413a; align-items:center;}
  .legend span{display:inline-flex; align-items:center; gap:10px;}
  .sw{width:34px; height:24px; border-radius:6px; display:inline-block; border:2px solid; flex:none;}
  .ln{width:46px; height:0; border-top:3px solid #44524b; display:inline-block;}
  .note{margin-top:10px; font-size:22px; color:#4d5c55;}
</style>
</head>
<body>
  %s
  <div class="stage">%s</div>
  <div class="legend">%s</div>
  %s
</body>
</html>
''' % (FONT, ('<h1>%s</h1><p class="sub">%s</p>' % (html.escape(title), html.escape(sub))) if title else '', svg, legend_html,
       '<div class="note">%s</div>' % html.escape(note) if note else '')
