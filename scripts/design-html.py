# Dựng design/thiet-ke-fe.html từ design/*.md. Chạy ở gốc repo: python scripts/design-html.py (cần: pip install markdown).
import html, pathlib, re, sys
import markdown

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "design")
files = ["README.md"] + sorted(p.name for p in src.glob("0*.md"))
anchor = lambda name: "s-" + name.removesuffix(".md").lower()

sections, toc = [], []
for name in files:
    text = (src / name).read_text(encoding="utf8")
    # liên kết giữa các file .md → neo trong cùng trang
    text = re.sub(r"\]\((\d\d-[a-z0-9-]+\.md|README\.md)(#[^)]*)?\)", lambda m: f"](#{anchor(m.group(1))})", text)
    # python-markdown cần dòng trống trước danh sách
    text = re.sub(r"(?m)^((?![ \t]*(?:[-*] |\d+\. |\||>))\S.*)\n([ \t]*(?:- |\d+\. ))", r"\1\n\n\2", text)
    title = re.search(r"^# (.+)$", text, re.M).group(1)
    body = markdown.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])
    body = body.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")
    sections.append(f'<section id="{anchor(name)}">{body}</section>')
    toc.append(f'<li><a href="#{anchor(name)}">{html.escape(title)}</a></li>')

page = f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thiết kế FE Farmery</title>
<style>
:root {{ --bg:#fff; --ink:#1c211b; --ink2:#3d4a37; --muted:#68766a; --line:#e6ebe2; --surface:#f4f7f1; --primary:#1f5132; --cta:#c2410c; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#121712; --ink:#e7ece4; --ink2:#c5cfc1; --muted:#98a594; --line:#2a3429; --surface:#1a211a; --primary:#7dc286; --cta:#f08a5d; }} }}
* {{ box-sizing:border-box; }}
html {{ scroll-behavior:smooth; }}
body {{ margin:0; background:var(--bg); color:var(--ink); font:15px/1.65 "Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", sans-serif; }}
.wrap {{ max-width:1180px; margin:0 auto; padding:0 16px; display:grid; gap:32px; }}
@media (min-width:960px) {{ .wrap {{ grid-template-columns:260px minmax(0,1fr); padding:0 32px; }} nav.toc {{ position:sticky; top:0; max-height:100vh; overflow:auto; }} }}
header.top {{ border-bottom:1px solid var(--line); padding:20px 16px; text-align:center; }}
header.top h1 {{ margin:0; font-size:22px; color:var(--primary); }}
header.top p {{ margin:4px 0 0; color:var(--muted); font-size:13px; }}
nav.toc {{ padding:20px 0; }}
nav.toc ol {{ margin:0; padding-left:20px; }}
nav.toc li {{ margin:6px 0; font-size:14px; }}
a {{ color:var(--primary); }}
main {{ min-width:0; padding:8px 0 64px; }}
section {{ border-bottom:1px solid var(--line); padding:12px 0 28px; }}
h1 {{ font-size:24px; line-height:1.3; margin:24px 0 12px; }}
h2 {{ font-size:19px; margin:28px 0 10px; }}
h3 {{ font-size:16px; margin:22px 0 8px; }}
.tbl {{ overflow-x:auto; margin:12px 0; border:1px solid var(--line); border-radius:10px; }}
table {{ border-collapse:collapse; width:100%; font-size:13.5px; }}
th, td {{ text-align:left; vertical-align:top; padding:8px 10px; border-bottom:1px solid var(--line); }}
th {{ background:var(--surface); white-space:nowrap; }}
tr:last-child td {{ border-bottom:0; }}
code {{ background:var(--surface); padding:1px 5px; border-radius:5px; font-size:.9em; word-break:break-word; }}
pre {{ background:var(--surface); padding:12px 14px; border-radius:10px; overflow-x:auto; font-size:12.5px; line-height:1.5; }}
pre code {{ padding:0; background:none; word-break:normal; }}
ul, ol {{ padding-left:22px; }}
strong {{ color:var(--ink); }}
.top-link {{ position:fixed; right:16px; bottom:16px; background:var(--primary); color:var(--bg); width:44px; height:44px; border-radius:22px; display:grid; place-items:center; text-decoration:none; font-size:20px; }}
</style>
</head>
<body>
<header class="top"><h1>Tài liệu thiết kế giao diện Farmery</h1><p>Bản xem nhanh sinh từ <code>design/*.md</code> — bản .md là nguồn chính</p></header>
<div class="wrap">
<nav class="toc" aria-label="Mục lục"><strong>Mục lục</strong><ol>{''.join(toc)}</ol></nav>
<main>{''.join(sections)}</main>
</div>
<a class="top-link" href="#" aria-label="Lên đầu trang">↑</a>
</body>
</html>
"""
out = src / "thiet-ke-fe.html"
out.write_text(page, encoding="utf8", newline="\n")
print(out, len(page))
