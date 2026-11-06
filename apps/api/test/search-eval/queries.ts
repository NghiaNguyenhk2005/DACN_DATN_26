/**
 * Bộ đánh giá tìm kiếm: câu tìm + id sản phẩm liên quan trong dữ liệu mẫu (`@farmery/mock-data`).
 * `relevant` rỗng = câu ngoài danh mục, kỳ vọng không trả kết quả.
 */
export interface EvalQuery {
  group: string;
  q: string;
  relevant: string[];
}

const DAU_TAY = ["1", "2", "3", "4"];
const XA_LACH = ["9", "10", "11"];
const NAM = ["24", "25", "26", "32"];
const TRA = ["27", "28"];
const CA_PHE = ["29", "30", "39"];
const RAU_LA = ["9", "10", "11", "12", "13", "14", "33", "34", "36"];

export const EVAL_QUERIES: EvalQuery[] = [
  { group: "Tên chính xác", q: "dâu tây", relevant: DAU_TAY },
  { group: "Tên chính xác", q: "cà chua bi", relevant: ["5", "6"] },
  { group: "Tên chính xác", q: "nấm", relevant: NAM },
  { group: "Tên chính xác", q: "xà lách", relevant: XA_LACH },
  { group: "Tên chính xác", q: "cà phê arabica", relevant: CA_PHE },

  { group: "Không dấu, thiếu dấu", q: "dau tay", relevant: DAU_TAY },
  { group: "Không dấu, thiếu dấu", q: "ca rot", relevant: ["18"] },
  { group: "Không dấu, thiếu dấu", q: "ot chuong", relevant: ["15", "16"] },
  { group: "Không dấu, thiếu dấu", q: "măng tay", relevant: ["38"] },

  { group: "Viết liền", q: "dautay", relevant: DAU_TAY },
  { group: "Viết liền", q: "xalach", relevant: XA_LACH },

  { group: "Gõ sai", q: "xà láhc", relevant: XA_LACH },
  { group: "Gõ sai", q: "khoai tya", relevant: ["17"] },
  { group: "Gõ sai", q: "bong cia", relevant: ["33"] },

  { group: "Theo dấu", q: "ớt chuông đỏ", relevant: ["16"] },

  { group: "Danh mục", q: "trái cây", relevant: [...DAU_TAY, "20", "21", "22", "31"] },
  { group: "Danh mục", q: "củ", relevant: ["17", "18", "19", "35"] },
  { group: "Danh mục", q: "rau", relevant: RAU_LA },
  { group: "Danh mục", q: "trà", relevant: TRA },

  { group: "Ý định", q: "đồ uống", relevant: [...TRA, ...CA_PHE] },
  { group: "Ý định", q: "salad", relevant: [...XA_LACH, "12"] },
  { group: "Ý định", q: "nướng", relevant: ["15", "16", ...NAM, "37", "38"] },
  { group: "Ý định", q: "nấu lẩu", relevant: ["13", "14", "34", ...NAM] },
  { group: "Ý định", q: "ăn kiêng", relevant: [...XA_LACH, "12", "31", "33", "38"] },
  { group: "Ý định", q: "trẻ em", relevant: ["17", "18", "33"] },
  { group: "Ý định", q: "quà biếu", relevant: ["1", "20", "22", "23", ...TRA, ...CA_PHE] },
  { group: "Ý định", q: "nước ép", relevant: [...DAU_TAY, "12", "18", "19", "22", "31"] },
  { group: "Ý định", q: "rau sạch", relevant: RAU_LA },

  { group: "Tiếng Anh", q: "coffee", relevant: CA_PHE },
  { group: "Tiếng Anh", q: "strawberry", relevant: DAU_TAY },
  { group: "Tiếng Anh", q: "mushroom", relevant: NAM },

  { group: "Có cụm lọc", q: "rau hữu cơ", relevant: ["11", "12", "13", "14"] },
  { group: "Có cụm lọc", q: "cà phê ocop", relevant: ["30"] },

  { group: "Ngoài danh mục", q: "thịt bò", relevant: [] },
  { group: "Ngoài danh mục", q: "điện thoại", relevant: [] },
  { group: "Ngoài danh mục", q: "sữa tươi", relevant: [] },
];

/**
 * Bộ kiểm tra độc lập: viết và gán nhãn sau khi xong bản cài đặt đầu, KHÔNG dùng để chỉnh từ điển/tham số.
 * Đo khả năng tổng quát; số ở đây thấp hơn bộ chính là bình thường.
 */
export const HELDOUT_QUERIES: EvalQuery[] = [
  { group: "Độc lập", q: "cà chua", relevant: ["5", "6", "7", "8"] },
  { group: "Độc lập", q: "dâu", relevant: DAU_TAY },
  { group: "Độc lập", q: "nam huong", relevant: ["25"] },
  { group: "Độc lập", q: "tra o long", relevant: ["27"] },
  { group: "Độc lập", q: "cai xoan", relevant: ["12"] },
  { group: "Độc lập", q: "bơ", relevant: ["20"] },
  { group: "Độc lập", q: "atiso", relevant: ["23"] },
  { group: "Độc lập", q: "huong thoa", relevant: ["37"] },
  { group: "Độc lập", q: "hành", relevant: ["35"] },
  { group: "Độc lập", q: "làm sinh tố", relevant: [...DAU_TAY, "20", "22", "31"] },
  { group: "Độc lập", q: "đồ chay", relevant: ["23", ...NAM] },
  { group: "Độc lập", q: "món nướng bbq", relevant: ["15", "16", ...NAM, "37", "38"] },
  { group: "Độc lập", q: "tomato", relevant: ["5", "6", "7", "8"] },
  { group: "Độc lập", q: "rau thơm", relevant: ["37"] },
  { group: "Độc lập", q: "quà tết", relevant: ["1", "20", "22", "23", ...TRA, ...CA_PHE] },
  { group: "Độc lập", q: "gạo", relevant: [] },
  { group: "Độc lập", q: "cá hồi", relevant: [] },
  { group: "Độc lập", q: "bánh mì", relevant: [] },
];
