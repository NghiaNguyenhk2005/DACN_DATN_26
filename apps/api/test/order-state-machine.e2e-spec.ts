import {
  ALLOWED_TRANSITIONS,
  canStaffAdvanceTo,
  isCancellable,
  isTransitionAllowed,
  nextStaffStep,
  TIMELINE,
} from "../src/modules/retail/order-state-machine";

describe("máy trạng thái đơn", () => {
  it("dòng thời gian có đúng tám bước và nhân viên đi lần lượt từ paid tới completed", () => {
    expect(TIMELINE).toHaveLength(8);
    const walked = ["paid"];
    for (let s = nextStaffStep("paid"); s; s = nextStaffStep(s)) walked.push(s);
    expect(walked).toEqual(["paid", "packing", "on_trip", "handed_to_3pl", "delivering", "delivered", "completed"]);
  });

  it("đơn chờ thanh toán và đơn đã kết thúc không có bước kế tiếp", () => {
    for (const s of ["placed", "completed", "cancelled", "returned", "disputed"] as const) expect(nextStaffStep(s)).toBeNull();
  });

  it("mọi bước nhân viên đi đều là cạnh hợp lệ của máy trạng thái", () => {
    for (const from of TIMELINE) {
      const to = nextStaffStep(from);
      if (to) expect(isTransitionAllowed(from, to)).toBe(true);
    }
    expect(isTransitionAllowed("packing", "paid")).toBe(false);
    expect(isTransitionAllowed("completed", "cancelled")).toBe(false);
    expect(ALLOWED_TRANSITIONS.delivered).toContain("disputed");
  });

  it("chỉ hủy được khi placed hoặc paid", () => {
    expect(["placed", "paid"].every((s) => isCancellable(s as never))).toBe(true);
    expect(["packing", "on_trip", "delivered", "completed", "cancelled"].some((s) => isCancellable(s as never))).toBe(false);
  });

  it("vận hành chuyển mọi bước, kho chỉ các bước phía kho", () => {
    expect(canStaffAdvanceTo(["staff_operations"], "completed")).toBe(true);
    expect(canStaffAdvanceTo(["staff_warehouse"], "packing")).toBe(true);
    expect(canStaffAdvanceTo(["staff_warehouse"], "handed_to_3pl")).toBe(true);
    expect(canStaffAdvanceTo(["staff_warehouse"], "delivering")).toBe(false);
    expect(canStaffAdvanceTo(["staff_support"], "packing")).toBe(false);
  });
});
