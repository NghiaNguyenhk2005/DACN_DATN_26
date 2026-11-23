"""Vẽ hai hình cho báo cáo từ results/: dự báo kiểm tra ngược theo từng mặt hàng và MAPE theo mô hình.

Đầu ra (PNG): du-bao-gia-kiem-tra-nguoc.png, du-bao-gia-mape-mo-hinh.png.
Chạy: python plot_forecast.py [--results DIR] [--out DIR]
"""
import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

HERE = Path(__file__).resolve().parent
INK, MUTED, GRID = "#0b0b0b", "#52514e", "#e5e4e0"
# Màu theo thứ tự cố định của bảng màu tham chiếu (xanh dương, cam, xanh ngọc); mốc seasonal naive là xám.
COLOR = {"seasonal_naive": "#8a8985", "sarima": "#2a78d6", "prophet": "#eb6834", "lightgbm": "#1baf7a"}
STYLE = {"seasonal_naive": ":", "sarima": "-", "prophet": "--", "lightgbm": "-."}
LABEL = {"seasonal_naive": "Seasonal naive", "sarima": "SARIMA", "prophet": "Prophet", "lightgbm": "LightGBM"}
MODELS = list(LABEL)

plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 8, "axes.edgecolor": MUTED, "axes.labelcolor": MUTED,
    "xtick.color": MUTED, "ytick.color": MUTED, "text.color": INK, "axes.spines.top": False, "axes.spines.right": False,
})


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def fig_backtest(results: Path, out: Path) -> None:
    forecasts = {r["commodity"]: r for r in json.loads((results / "forecasts.json").read_text(encoding="utf-8"))}
    bt = read_csv(results / "backtest.csv")
    fig, axes = plt.subplots(2, 2, figsize=(6.4, 4.6), sharex=False)
    for ax, (name, info) in zip(axes.flat, forecasts.items(), strict=False):
        rows = [r for r in bt if r["commodity"] == name and r["model"] == info["model"]]
        months = sorted({r["month"] for r in rows})
        actual = {r["month"]: float(r["actual"]) for r in rows}
        xs = list(range(len(months)))
        pos = {m: i for i, m in enumerate(months)}
        ax.plot(xs, [actual[m] / 1e6 for m in months], color=INK, lw=1.4, label="Giá thực tế")
        by_origin = defaultdict(list)
        for r in rows:
            by_origin[r["origin"]].append(r)
        for i, seg in enumerate(by_origin.values()):
            seg.sort(key=lambda r: int(r["horizon"]))
            ax.plot([pos[r["month"]] for r in seg], [float(r["forecast"]) / 1e6 for r in seg], color=COLOR[info["model"]], lw=1.6,
                    marker="o", ms=2.5, label="Dự báo 3 tháng của mô hình được chọn" if i == 0 else None)
        last = len(months) - 1
        fx = [last + k for k in range(1, len(info["forecast"]) + 1)]
        ax.fill_between(fx, [f["lower"] / 1e6 if f["lower"] else f["price"] / 1e6 for f in info["forecast"]],
                        [f["upper"] / 1e6 if f["upper"] else f["price"] / 1e6 for f in info["forecast"]], color=COLOR[info["model"]], alpha=0.18, lw=0)
        ax.plot(fx, [f["price"] / 1e6 for f in info["forecast"]], color=COLOR[info["model"]], lw=1.2, ls="--")
        ticks = [i for i, m in enumerate(months) if m.endswith("-01")]
        ax.set_xticks(ticks, [months[i][:4] for i in ticks])
        ax.set_title(f"{name} (mô hình chọn: {LABEL[info['model']]}, MAPE {info['mape']:.1f}%)", fontsize=8, loc="left", color=INK)
        ax.grid(axis="y", color=GRID, lw=0.6)
        ax.set_ylabel("triệu đồng/tấn")
    handles, labels = axes.flat[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower center", ncol=2, frameon=False, fontsize=8)
    fig.tight_layout(rect=(0, 0.06, 1, 1))
    fig.savefig(out / "du-bao-gia-kiem-tra-nguoc.png", dpi=200)
    plt.close(fig)


def fig_mape(results: Path, out: Path) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(6.4, 2.9), sharey=True)
    for ax, (title, sub) in zip(axes, [("Chuỗi đã nối điểm gãy", "."), ("Chuỗi thô", "raw")], strict=True):
        path = results / sub / "metrics.csv" if sub != "." else results / "metrics.csv"
        rows = read_csv(path)
        commodities = list(dict.fromkeys(r["commodity"] for r in rows))
        width = 0.2
        for j, m in enumerate(MODELS):
            vals = [float(next(r["mape"] for r in rows if r["commodity"] == c and r["model"] == m)) for c in commodities]
            ax.bar([i + (j - 1.5) * (width + 0.02) for i in range(len(commodities))], vals, width=width, color=COLOR[m], label=LABEL[m])
        ax.axhline(20, color=MUTED, lw=0.8, ls=(0, (4, 3)))
        ax.set_xticks(range(len(commodities)), commodities)
        ax.set_title(title, fontsize=8, loc="left", color=INK)
        ax.grid(axis="y", color=GRID, lw=0.6)
        ax.set_axisbelow(True)
    axes[0].set_ylabel("MAPE (%)")
    axes[1].text(2.45, 20.8, "ngưỡng 20%", color=MUTED, fontsize=7, ha="right")
    axes[0].legend(frameon=False, fontsize=7, loc="upper left")
    fig.tight_layout()
    fig.savefig(out / "du-bao-gia-mape-mo-hinh.png", dpi=200)
    plt.close(fig)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", default=str(HERE / "results"))
    ap.add_argument("--out", default=str(HERE / "results"))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    fig_backtest(Path(args.results), out)
    fig_mape(Path(args.results), out)


if __name__ == "__main__":
    main()
