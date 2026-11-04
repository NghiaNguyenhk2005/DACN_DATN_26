import { Injectable } from "@nestjs/common";
import { removeVietnameseTones } from "../utils/vietnamese-search.util";

/**
 * Mở rộng nghĩa câu tìm thành các cụm từ liên quan để khớp thêm sản phẩm (FR12.3).
 * Prototype: từ điển khái niệm nông sản. Giai đoạn 2 thay bằng vector BGE-M3 của dịch vụ AI, giữ nguyên interface.
 */
export abstract class SemanticSearch {
  abstract expand(query: string): string[];
}

/** Khóa và cụm mở rộng đều ở dạng bỏ dấu, chữ thường. */
const CONCEPTS: [string[], string[]][] = [
  [["rau sach", "rau an toan"], ["huu co", "vietgap", "thuy canh"]],
  [["salad", "sa lat", "rau tron", "xa lat"], ["xa lach", "kale", "cai xoan"]],
  [["trai cay", "hoa qua", "qua tuoi", "fruit"], ["dau tay", "viet quat", "chanh day", "hong gion", "bo sap"]],
  [["do uong", "thuc uong", "giai khat", "pha che"], ["tra", "ca phe"]],
  [["qua tang", "lam qua", "qua bieu", "bieu tang"], ["ocop", "tra", "ca phe"]],
  [["an kieng", "giam can", "eat clean", "healthy", "it calo"], ["xa lach", "kale", "bong cai", "mang tay", "viet quat"]],
  [["nuoc ep", "sinh to", "smoothie"], ["ca rot", "cu den", "viet quat", "dau tay", "chanh day", "cai xoan"]],
  [["lau", "nau lau"], ["nam", "cai", "bap cai", "bo xoi"]],
  [["nuong", "bbq", "do nuong"], ["huong thao", "ot chuong", "nam", "mang tay"]],
  [["an chay", "do chay", "chay"], ["nam", "atiso", "dau hu"]],
  [["tre em", "em be", "an dam", "tre nho"], ["ca rot", "khoai tay", "bong cai", "bi"]],
  [["vitamin c", "tang de khang"], ["ot chuong", "chanh day", "dau tay", "cai xoan"]],
  [["gia vi", "rau thom", "thao moc", "herb"], ["huong thao", "toi tay", "hanh tay"]],
  [["cu", "cu qua"], ["khoai tay", "ca rot", "cu den", "hanh tay"]],
  [["coffee", "cafe", "caphe"], ["ca phe"]],
  [["tea"], ["tra"]],
  [["strawberry"], ["dau tay"]],
  [["blueberry"], ["viet quat"]],
  [["mushroom"], ["nam"]],
  [["avocado"], ["bo sap"]],
  [["tomato"], ["ca chua"]],
  [["lettuce"], ["xa lach"]],
  [["potato"], ["khoai tay"]],
  [["carrot"], ["ca rot"]],
  [["broccoli"], ["bong cai"]],
  [["cabbage"], ["bap cai"]],
];

const containsPhrase = (text: string, phrase: string) => ` ${text} `.includes(` ${phrase} `);

@Injectable()
export class ConceptSemanticSearch extends SemanticSearch {
  expand(query: string): string[] {
    const q = removeVietnameseTones(query).replace(/\s+/g, " ");
    if (!q) return [];
    const terms = new Set<string>();
    for (const [keys, related] of CONCEPTS) {
      if (keys.some((k) => containsPhrase(q, k))) related.forEach((r) => terms.add(r));
    }
    return [...terms];
  }
}
