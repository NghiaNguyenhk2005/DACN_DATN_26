# -*- coding: utf-8 -*-
"""Sinh Phụ lục I (backmatter/phuluc-quanhe.tex): lược đồ quan hệ 65 bảng và chiến lược chỉ mục.

Đọc schema.dbml qua gen_erd.parse và các migration Prisma. Chạy trong report/: python tools/diagrams/gen_quanhe.py
"""
import collections
import glob
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.chdir(os.path.join(HERE, "..", ".."))
import gen_erd as g  # noqa: E402  (nạp parse DBML; phần vẽ chỉ chạy khi gọi trực tiếp)

TABLES, ORDER, ENUMS = g.TABLES, g.ORDER, g.ENUMS
BS = "\\"


def esc(name):
    return name.replace("_", BS + "_" + BS + "allowbreak{}")


def short(full):
    return full.split(".", 1)[1]


def column_tex(table, col):
    n = esc(col["name"])
    if col["name"] in table["pk"] or col["pk"]:
        n = BS + "underline{" + n + "}"
    if col["ref"]:
        return BS + "textit{" + n + "}$" + BS + "rightarrow$" + esc(short(col["ref"][1]))
    x = g.xref(col)
    if x:
        return BS + "textit{" + n + "}$" + BS + "dashrightarrow$" + esc(x)
    return n


def relational_rows():
    rows = []
    by_schema = collections.OrderedDict()
    for name in ORDER:
        by_schema.setdefault(name.split(".")[0], []).append(name)
    for schema, names in by_schema.items():
        rows.append(BS + "rowcolor{tblheadbg}")
        rows.append(BS + "multicolumn{2}{l}{" + BS + "textbf{Schema " + BS + "texttt{" + schema + "}}} " + BS + BS)
        for name in names:
            t = TABLES[name]
            cols = ", ".join(column_tex(t, c) for c in t["cols"])
            rows.append(BS + "texttt{" + esc(short(name)) + "} & (" + cols + ") " + BS + BS)
    return rows


def stats():
    fk = sum(1 for t in TABLES.values() for c in t["cols"] if c["ref"])
    xr = sum(1 for t in TABLES.values() for c in t["cols"] if g.xref(c) and not c["ref"])
    comp = [n for n, t in TABLES.items() if len(t["pk"]) > 1]
    uq = sum(1 for t in TABLES.values() for c in t["cols"] if c["uq"])
    arr = sum(1 for t in TABLES.values() for c in t["cols"] if c["type"].endswith("[]"))
    return {"tables": len(TABLES), "cols": sum(len(t["cols"]) for t in TABLES.values()), "fk": fk, "xref": xr,
            "composite": comp, "unique_cols": uq, "arrays": arr, "enums": len(ENUMS)}


def existing_indexes():
    out = []
    pat = re.compile(r'CREATE (UNIQUE )?INDEX "([^"]+)" ON "(\w+)"\."(\w+)"\s*(USING (\w+) )?\(([^;]*)\);', re.S)
    for f in sorted(glob.glob("../apps/api/prisma/migrations/*/migration.sql")):
        sql = io.open(f, encoding="utf-8").read()
        for m in pat.finditer(sql):
            uniq, _, schema, table, _, using, cols = m.groups()
            out.append({"unique": bool(uniq), "schema": schema, "table": table, "using": (using or "btree"),
                        "cols": re.sub(r"\s+", " ", cols.replace('"', "")).strip()})
    return out


# (truy vấn thực tế, bảng, cột, loại, vì sao) — chỉ mục đề xuất, chưa khai trong schema.prisma
PROPOSED = [
    ("Người mua xem danh sách đơn của mình, mới nhất trước", "retail.orders", ["buyer_user_id", "placed_at"], "B-tree (placed_at giảm dần)", "Lọc theo người mua rồi sắp xếp, phân trang bằng cursor."),
    ("Vận hành lọc đơn theo trạng thái", "retail.orders", ["status", "placed_at"], "B-tree", "Bảng vận hành đơn lọc theo trạng thái, mới nhất trước."),
    ("Quét đơn trả trước quá hạn giữ chỗ để tự hủy", "retail.orders", ["reserve_expires_at"], "B-tree một phần (chỉ đơn đang giữ chỗ)", "Chỉ cần các đơn chưa thanh toán; chỉ mục một phần nhỏ và nhanh."),
    ("Mở một đơn thì lấy các dòng của đơn", "retail.order_items", ["order_id"], "B-tree", "Khóa ngoại thường dùng trong phép nối; PostgreSQL không tự tạo chỉ mục cho khóa ngoại."),
    ("Tìm dòng tồn của một lô khi đặt hàng, duyệt, thu hồi", "inventory.stock_holdings", ["batch_id"], "B-tree", "Chọn dòng tồn theo lô trong giao dịch giữ chỗ và trừ tồn."),
    ("Xem sổ nhập xuất của một dòng tồn theo thời gian", "inventory.stock_movements", ["holding_id", "created_at"], "B-tree", "Sổ chỉ ghi thêm, luôn đọc theo dòng tồn rồi theo thời gian."),
    ("Nhà cung cấp xem sản phẩm của mình", "catalog.products", ["supplier_id"], "B-tree", "Khu nhà cung cấp lọc theo chủ sản phẩm."),
    ("Duyệt danh mục: sản phẩm đã duyệt của một danh mục", "catalog.products", ["category_id", "status"], "B-tree", "Trang danh mục và đếm số sản phẩm theo danh mục."),
    ("Lô đang bán của một sản phẩm", "catalog.batches", ["product_id", "status"], "B-tree", "Trang chi tiết lấy lô đã duyệt của sản phẩm."),
    ("Xem nhật ký canh tác của lô theo ngày", "catalog.farming_logs", ["batch_id", "activity_date"], "B-tree", "Trang truy xuất đọc nhật ký theo lô và ngày hoạt động."),
    ("Tra giao dịch theo đơn hoặc yêu cầu nguồn", "payment.payments", ["source_type", "source_id"], "B-tree", "Mọi lần thanh toán và hoàn tiền tra theo nguồn."),
    ("Chuông thông báo: thông báo chưa đọc của người dùng", "notification.notifications", ["user_id", "read_at", "created_at"], "B-tree", "Đếm chưa đọc và liệt kê mới nhất trước."),
    ("Điểm uy tín: đánh giá đã duyệt của một sản phẩm", "engagement.reviews", ["product_id", "status"], "B-tree", "Trang sản phẩm tổng hợp đánh giá hiển thị."),
    ("Nhà cung cấp xem yêu cầu báo giá gửi cho mình", "wholesale.rfqs", ["supplier_id", "status"], "B-tree", "Danh sách báo giá của nhà cung cấp lọc theo trạng thái."),
]


def check_proposed():
    bad = []
    for _, tbl, cols, _, _ in PROPOSED:
        t = TABLES.get(tbl)
        names = [c["name"] for c in t["cols"]] if t else []
        for c in cols:
            if c not in names:
                bad.append((tbl, c))
    return bad


def main():
    bad = check_proposed()
    if bad:
        print("CỘT KHÔNG CÓ TRONG DBML:", bad)
        sys.exit(1)
    s = stats()
    ex = existing_indexes()
    rel = "\n".join(relational_rows())
    uniq = collections.defaultdict(list)
    special = []
    for i in ex:
        label = f"{i['schema']}.{i['table']}({i['cols']})"
        if i["unique"]:
            uniq[i["schema"]].append(BS + "texttt{" + esc(i["table"]) + "}(" + esc(i["cols"]) + ")")
        else:
            special.append(i)
    uniq_lines = "\n".join(
        BS + "texttt{" + sch + "}: " + "; ".join(v) + " " + BS + BS for sch, v in uniq.items()
    )
    special_rows = []
    for i in special:
        what = {"hnsw": "HNSW, độ đo cosine", "gin": "GIN"}.get(i["using"], i["using"])
        special_rows.append(
            BS + "texttt{" + esc(i["schema"] + "." + i["table"]) + "} & " + esc(i["cols"].replace("public.", "")) + " & " + what + " " + BS + BS
        )
    prop_rows = []
    for q, tbl, cols, kind, why in PROPOSED:
        prop_rows.append(f"{q} & " + BS + "texttt{" + esc(tbl).replace(".", "." + BS + "allowbreak{}") + "}(" + BS + "allowbreak{}" + ", ".join(esc(c) for c in cols) + f") & {kind.replace('_', BS + '_')} & {why} " + BS + BS)

    tex = r"""% Phụ lục I — lược đồ quan hệ và chiến lược chỉ mục (sinh bởi tools/diagrams/gen_quanhe.py).

\section*{Phụ lục I. Lược đồ quan hệ và chiến lược chỉ mục}
\label{apdx:quanhe}
\addcontentsline{toc}{section}{Phụ lục I. Lược đồ quan hệ và chiến lược chỉ mục}

Phụ lục này là kết quả ánh xạ sơ đồ ERD ở mục~\ref{sec:csdl} sang lược đồ quan hệ, theo quy tắc nêu ở đó. Cột \underline{gạch chân} là khóa chính; cột \textit{in nghiêng} kèm $\rightarrow$ là khóa ngoại vật lý tới bảng cha trong cùng schema; cột \textit{in nghiêng} kèm $\dashrightarrow$ là tham chiếu logic sang schema khác (chỉ lưu định danh, không có khóa ngoại vật lý). Kiểu dữ liệu, ràng buộc và ý nghĩa từng cột ở Phụ lục~D.

\subsection*{I.1. Lược đồ quan hệ}

\begingroup
\tblsetup\tblzebra
\begin{longtable}{L{3.10cm} L{11.90cm}}
\caption{Lược đồ quan hệ của 65 bảng theo 13 schema}
\label{tab:luocdoquanhe} \\
\toprule
\rowcolor{tblheadbg}
\textbf{Bảng} & \textbf{Lược đồ quan hệ (khóa chính, khóa ngoại, thuộc tính)} \\
\midrule
\endfirsthead
\toprule
\rowcolor{tblheadbg}
\textbf{Bảng} & \textbf{Lược đồ quan hệ (khóa chính, khóa ngoại, thuộc tính)} \\
\midrule
\endhead
\bottomrule
\endfoot
%REL%
\end{longtable}
\endgroup

\subsection*{I.2. Chiến lược chỉ mục}

Chỉ mục được chọn theo truy vấn thực tế của hệ thống, không theo từng cột. Khóa chính và ràng buộc duy nhất luôn có chỉ mục B-tree đi kèm; PostgreSQL không tự tạo chỉ mục cho khóa ngoại nên các cột khóa ngoại dùng thường xuyên được liệt kê ở bảng đề xuất.

\noindent\textbf{Chỉ mục đã có} (tạo bằng migration Prisma). Các ràng buộc duy nhất (B-tree):

\begin{flushleft}
%UNIQ%
\end{flushleft}

\noindent Các chỉ mục chuyên dụng phục vụ tìm kiếm:

\begingroup
\tblsetup\tblzebra
\begin{longtable}{L{4.50cm} L{7.00cm} L{3.50cm}}
\caption{Chỉ mục chuyên dụng đã tạo bằng migration}
\label{tab:chimucdaco} \\
\toprule
\rowcolor{tblheadbg}
\textbf{Bảng} & \textbf{Cột hoặc biểu thức} & \textbf{Loại} \\
\midrule
\endfirsthead
\toprule
\rowcolor{tblheadbg}
\textbf{Bảng} & \textbf{Cột hoặc biểu thức} & \textbf{Loại} \\
\midrule
\endhead
\bottomrule
\endfoot
%SPECIAL%
\end{longtable}
\endgroup

Chỉ mục \texttt{HNSW} của vector sản phẩm đã tạo ở migration nhưng bản hiện thực hiện giữ chỉ mục vector trong bộ nhớ của máy chủ, nên chỉ mục này chưa được dùng.

\noindent\textbf{Chỉ mục đề xuất} theo truy vấn thực tế. Các chỉ mục dưới đây chưa khai trong \texttt{schema.prisma}; mỗi chỉ mục chỉ nên thêm sau khi kiểm bằng \texttt{EXPLAIN} hoặc \texttt{pg\_\allowbreak{}stat\_\allowbreak{}statements} trên dữ liệu đủ lớn (Chương~\ref{chap:danhgia}).

\begingroup
\tblsetup\tblzebra
\begin{longtable}{L{3.20cm} L{4.80cm} L{2.40cm} L{4.60cm}}
\caption{Chỉ mục đề xuất theo truy vấn}
\label{tab:chimucdexuat} \\
\toprule
\rowcolor{tblheadbg}
\textbf{Truy vấn} & \textbf{Bảng (cột)} & \textbf{Loại} & \textbf{Lý do} \\
\midrule
\endfirsthead
\toprule
\rowcolor{tblheadbg}
\textbf{Truy vấn} & \textbf{Bảng (cột)} & \textbf{Loại} & \textbf{Lý do} \\
\midrule
\endhead
\bottomrule
\endfoot
%PROP%
\end{longtable}
\endgroup
"""
    tex = (tex.replace("%REL%", rel).replace("%UNIQ%", uniq_lines).replace("%SPECIAL%", "\n".join(special_rows))
           .replace("%PROP%", "\n".join(prop_rows)).replace("chimucdaco", "chimucdaco"))
    io.open(os.path.join("backmatter", "phuluc-quanhe.tex"), "w", encoding="utf-8", newline="").write(tex)
    print("stats:", s)
    print("unique index:", sum(len(v) for v in uniq.values()), "| chuyên dụng:", len(special), "| đề xuất:", len(PROPOSED))


if __name__ == "__main__":
    main()
