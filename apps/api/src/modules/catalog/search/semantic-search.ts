import { Injectable } from "@nestjs/common";
import { categoryKey, SearchCorpus, type SearchHit } from "./search-corpus";
import { fold } from "./text-match";

/**
 * Bộ tìm theo nghĩa (FR12.3, nhánh ngữ nghĩa): trả sản phẩm liên quan về nghĩa dù không chứa từ khóa.
 * Prototype: từ điển khái niệm nông sản. Bản BGE-M3 + pgvector thay lớp cài đặt, giữ interface.
 */
export abstract class SemanticSearch {
  abstract rank(query: string): Promise<SearchHit[]>;
}

/**
 * Khái niệm: khi câu tìm chứa một `keys` (bỏ dấu, nguyên cụm từ), sản phẩm liên quan là sản phẩm thuộc `categories`
 * (tên danh mục cha hoặc lá — gồm cả sản phẩm đăng sau), có tên chứa một `terms`, hoặc có chứng nhận trong `certs`.
 */
interface Concept {
  keys: string[];
  categories?: string[];
  terms?: string[];
  certs?: string[];
}

const RAU_LA = ["Rau ăn lá thủy canh", "Cải hữu cơ & Rau gia vị"];

const CONCEPTS: Concept[] = [
  { keys: ["rau", "rau xanh", "rau an la", "rau sach", "rau an toan", "vegetable", "vegetables", "veggie"], categories: RAU_LA },
  { keys: ["trai cay", "hoa qua", "qua tuoi", "fruit", "fruits"], categories: ["Trái cây"] },
  { keys: ["cu", "cu qua"], terms: ["khoai tay", "khoai lang", "ca rot", "cu den", "cu cai", "hanh tay"] },
  { keys: ["do uong", "thuc uong", "giai khat", "pha che", "drink", "drinks"], categories: ["Trà & Cà phê đặc sản"] },
  { keys: ["qua tang", "lam qua", "qua bieu", "bieu tang", "dac san", "gift"], certs: ["OCOP"], categories: ["Trà & Cà phê đặc sản"] },
  { keys: ["salad", "sa lat", "xa lat", "rau tron"], terms: ["xa lach", "kale", "cai xoan", "rau mam"] },
  {
    keys: ["an kieng", "giam can", "eat clean", "healthy", "it calo", "keto"],
    terms: ["xa lach", "kale", "cai xoan", "bong cai", "mang tay", "viet quat", "khoai lang"],
  },
  { keys: ["nuoc ep", "sinh to", "smoothie", "juice"], terms: ["ca rot", "cu den", "viet quat", "dau tay", "chanh day", "cai xoan", "cam", "dua hau"] },
  { keys: ["lau", "nau lau", "hotpot"], terms: ["nam", "cai thao", "cai ngot", "bap cai", "bo xoi", "rau muong", "tan o", "dau hu"] },
  { keys: ["nuong", "bbq", "do nuong", "barbecue"], terms: ["ot chuong", "nam", "mang tay", "huong thao", "bap ngo", "ngo ngot", "ca tim"] },
  { keys: ["an chay", "do chay", "chay", "vegan", "vegetarian"], terms: ["nam", "atiso", "dau hu"] },
  { keys: ["tre em", "em be", "an dam", "tre nho"], terms: ["ca rot", "khoai tay", "khoai lang", "bong cai", "bi do"] },
  { keys: ["vitamin c", "tang de khang"], terms: ["ot chuong", "chanh day", "dau tay", "cai xoan", "cam", "oi"] },
  { keys: ["gia vi", "rau thom", "thao moc", "herb", "herbs"], terms: ["huong thao", "toi tay", "hanh tay", "rau thom", "sa"] },
  { keys: ["coffee", "cafe", "caphe"], terms: ["ca phe"] },
  { keys: ["tea"], terms: ["tra"] },
  { keys: ["strawberry", "strawberries"], terms: ["dau tay"] },
  { keys: ["blueberry", "blueberries"], terms: ["viet quat"] },
  { keys: ["mushroom", "mushrooms"], terms: ["nam"] },
  { keys: ["avocado"], terms: ["bo sap"] },
  { keys: ["tomato", "tomatoes"], terms: ["ca chua"] },
  { keys: ["lettuce"], terms: ["xa lach"] },
  { keys: ["potato", "potatoes"], terms: ["khoai tay"] },
  { keys: ["carrot", "carrots"], terms: ["ca rot"] },
  { keys: ["broccoli"], terms: ["bong cai"] },
  { keys: ["cabbage"], terms: ["bap cai"] },
  { keys: ["passion fruit"], terms: ["chanh day"] },
  { keys: ["persimmon"], terms: ["hong"] },
  { keys: ["artichoke"], terms: ["atiso"] },
];

const words = (s: string) => fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Cụm `phrase` nằm liền mạch, đúng ranh giới từ trong `target` (cả hai đã bỏ dấu, tách từ). */
function hasPhrase(target: string[], phrase: string[]): boolean {
  for (let i = 0; i + phrase.length <= target.length; i++) {
    if (phrase.every((w, j) => target[i + j] === w)) return true;
  }
  return false;
}

@Injectable()
export class ConceptSemanticSearch extends SemanticSearch {
  constructor(private readonly corpus: SearchCorpus) {
    super();
  }

  async rank(query: string): Promise<SearchHit[]> {
    const q = words(query);
    const hit = CONCEPTS.filter((c) => c.keys.some((k) => hasPhrase(q, words(k))));
    if (!hit.length) return [];
    const categories = new Set(hit.flatMap((c) => c.categories ?? []).map(categoryKey));
    const terms = hit.flatMap((c) => c.terms ?? []).map(words);
    const certs = new Set(hit.flatMap((c) => c.certs ?? []).map((c) => c.toLowerCase()));

    const docs = await this.corpus.docs();
    const hits: SearchHit[] = [];
    for (const doc of docs) {
      const name = doc.name.map((t) => t.folded);
      let score = 0;
      if (terms.some((t) => hasPhrase(name, t))) score = 2;
      else if (doc.categoryKeys.some((k) => categories.has(k)) || doc.certifications.some((c) => certs.has(c))) score = 1;
      if (score) hits.push({ productId: doc.id, score });
    }
    return hits.sort((a, b) => b.score - a.score);
  }
}
