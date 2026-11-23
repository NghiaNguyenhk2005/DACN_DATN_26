"""Trích chuỗi giá nhà sản xuất THÁNG của Việt Nam từ gói dữ liệu hàng loạt FAOSTAT (Producer Prices).

Đầu ra: faostat_vn_monthly.csv với cột month, commodity, price, unit, source.
Chỉ lấy bốn mặt hàng khớp sản phẩm của Farmery; chỉ dùng thư viện chuẩn.
Chạy: python collect_faostat.py [đường dẫn tới Prices_E_All_Data_(Normalized).zip]
Nếu không truyền đường dẫn, tải về thư mục .cache/ cạnh script (đã gitignore).
"""
import csv
import io
import sys
import urllib.request
import zipfile
from pathlib import Path

URL = "https://bulks-faostat.fao.org/production/Prices_E_All_Data_(Normalized).zip"
HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache" / "Prices_E_All_Data_(Normalized).zip"
OUT = HERE / "faostat_vn_monthly.csv"
MEMBER = "Prices_E_All_Data_(Normalized).csv"
ELEMENT = "Producer Price (LCU/tonne)"
ITEMS = {
    "Potatoes": "Khoai tây",
    "Mushrooms and truffles": "Nấm",
    "Tea leaves": "Chè",
    "Coffee, green": "Cà phê",
}
# Months Code 7001..7012 là tháng 1..12; 7021 là giá trị cả năm, bỏ qua.
MONTH_CODES = {str(7000 + m): m for m in range(1, 13)}


def ensure_zip(arg: str | None) -> Path:
    if arg:
        return Path(arg)
    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, CACHE)
    return CACHE


def main() -> None:
    zpath = ensure_zip(sys.argv[1] if len(sys.argv) > 1 else None)
    rows = []
    with zipfile.ZipFile(zpath) as z, z.open(MEMBER) as raw:
        reader = csv.DictReader(io.TextIOWrapper(raw, encoding="latin-1", newline=""))
        for x in reader:
            if x["Area"] != "Viet Nam" or x["Element"] != ELEMENT:
                continue
            item = x["Item"].encode("latin-1").decode("utf-8", errors="replace")
            if item not in ITEMS or x["Months Code"] not in MONTH_CODES or x["Value"] == "":
                continue
            month = f'{x["Year"]}-{MONTH_CODES[x["Months Code"]]:02d}'
            rows.append((month, ITEMS[item], round(float(x["Value"])), "VND/tấn", "FAOSTAT Producer Prices"))
    rows.sort(key=lambda r: (r[1], r[0]))
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["month", "commodity", "price", "unit", "source"])
        w.writerows(rows)
    by = {}
    for r in rows:
        by.setdefault(r[1], []).append(r[0])
    for k, v in by.items():
        print(k.encode("ascii", "replace").decode(), len(v), min(v), max(v))


if __name__ == "__main__":
    main()
