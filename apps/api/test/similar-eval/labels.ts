/**
 * Bộ đánh giá sản phẩm tương tự (FR12.1): với mỗi sản phẩm trong dữ liệu mẫu, các sản phẩm khác coi là "tương tự hợp lệ"
 * (cho phép khác danh mục: cùng nhóm trái cây, rau lá, củ, đồ uống). Nhãn do người gán tay theo tên và loại sản phẩm.
 */
const DAU_TAY = ["1", "2", "3", "4"];
const CA_CHUA = ["5", "6", "7", "8"];
const XA_LACH = ["9", "10", "11"];
const TRAI_CAY = ["20", "21", "22", "31", ...DAU_TAY];
const CU = ["17", "18", "19", "35"];
const NAM = ["24", "25", "26", "32"];
const TRA = ["27", "28"];
const CA_PHE = ["29", "30", "39"];

const without = (ids: string[], self: string) => ids.filter((id) => id !== self);
const group = (ids: string[], extra: string[] = []) => Object.fromEntries(ids.map((id) => [id, [...new Set([...without(ids, id), ...extra])]]));

export const SIMILAR_LABELS: Record<string, string[]> = {
  ...group(DAU_TAY, ["31", "22", "21", "20"]),
  ...group(CA_CHUA, ["15", "16"]),
  ...group(XA_LACH, ["12", "13", "14"]),
  "12": ["9", "10", "11", "13", "14", "33", "34"],
  "13": ["12", "14", "9", "10", "11", "33", "34"],
  "14": ["12", "13", "9", "10", "11"],
  "15": ["16", ...CA_CHUA],
  "16": ["15", ...CA_CHUA],
  ...group(CU),
  "20": without(TRAI_CAY, "20"),
  "21": without(TRAI_CAY, "21"),
  "22": without(TRAI_CAY, "22"),
  "31": without(TRAI_CAY, "31"),
  "23": ["37"],
  ...group(NAM),
  "27": ["28", ...CA_PHE],
  "28": ["27", ...CA_PHE],
  "29": ["30", "39", ...TRA],
  "30": ["29", "39", ...TRA],
  "39": ["29", "30", ...TRA],
  "33": ["34", "12", "13", "14", "36", "38"],
  "34": ["33", "12", "13", "14", "36"],
  "35": ["17", "18", "19", "36"],
  "36": ["35", "37", "33", "34"],
  "37": ["23", "36", "35"],
  "38": ["33", "34", "36"],
};
