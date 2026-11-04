import type { Schema } from "@farmery/contract";
import type { ProductSeedItem } from "./products";
import { suppliers } from "./suppliers";

// Dữ liệu bổ sung 05/11: sản phẩm cho danh mục thưa, lô đã duyệt cho sản phẩm chưa có tồn, bảng giá sỉ, ảnh danh mục.
// Ngày viết theo mốc demo 16/10/2026; createSeed() dời theo ngày chạy (xem index.ts).

const supplierMap = new Map(suppliers.map((s) => [s.id, s]));
const sup = (id: string) => supplierMap.get(id)!;
const img = (photo: string, w: number) => `https://images.unsplash.com/photo-${photo}?w=${w}`;

interface ExtraSpec {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  photo: string;
  description: string;
  unit: string;
  supplierId: string;
  certifications: Schema<"CertType">[];
  listingId: string;
  unitPrice: number;
  available: number;
  seasonality?: string;
}

const specs: ExtraSpec[] = [
  {
    id: "31", name: "Việt quất Đà Lạt (Hộp 125g)", categoryId: "13", categoryName: "Chanh dây & Quả mọng",
    photo: "1498557850523-fd3d118b962e", unit: "hộp 125g", supplierId: "101", certifications: ["VietGAP"],
    description: "Việt quất giống Mỹ trồng trong nhà màng ở Lâm Viên, quả tròn phủ phấn trắng, vị chua ngọt thanh, ăn tươi hoặc làm sinh tố.",
    listingId: "231", unitPrice: 95000, available: 60, seasonality: "Tháng 10 – tháng 4",
  },
  {
    id: "32", name: "Nấm mỡ trắng Đà Lạt (Khay 200g)", categoryId: "41", categoryName: "Nấm tươi hữu cơ",
    photo: "1504545102780-26774c1bb073", unit: "khay 200g", supplierId: "103", certifications: ["organic"],
    description: "Nấm mỡ trồng trên giá thể rơm ủ vi sinh, mũ nấm trắng chắc, thịt dày, hợp xào bơ tỏi hoặc nấu súp kem.",
    listingId: "232", unitPrice: 38000, available: 140,
  },
  {
    id: "33", name: "Bông cải xanh Đà Lạt (Kg)", categoryId: "22", categoryName: "Cải hữu cơ & Rau gia vị",
    photo: "1615485290382-441e4d049cb5", unit: "kg", supplierId: "102", certifications: ["VietGAP"],
    description: "Bông cải xanh trồng nhà màng Đơn Dương, bông chặt hạt nhỏ, màu xanh thẫm, thu hoạch buổi sáng và làm lạnh ngay tại vườn.",
    listingId: "233", unitPrice: 52000, available: 260,
  },
  {
    id: "34", name: "Bắp cải trái tim Đà Lạt (Kg)", categoryId: "22", categoryName: "Cải hữu cơ & Rau gia vị",
    photo: "1594282486552-05b4d80fbb9f", unit: "kg", supplierId: "102", certifications: ["VietGAP"],
    description: "Bắp cải trái tim lá mỏng, giòn ngọt, cuốn chặt; hợp làm gỏi, cuốn thịt hoặc luộc chấm kho quẹt.",
    listingId: "234", unitPrice: 26000, available: 520,
  },
  {
    id: "35", name: "Hành tây Đà Lạt (Kg)", categoryId: "32", categoryName: "Ớt chuông & Củ ôn đới",
    photo: "1518977956812-cd3dbadaaf31", unit: "kg", supplierId: "105", certifications: ["VietGAP", "GlobalGAP"],
    description: "Hành tây vỏ vàng củ to đều, phơi khô vỏ trước khi đóng bao, để được lâu ở nơi thoáng mát.",
    listingId: "235", unitPrice: 24000, available: 700,
  },
  {
    id: "36", name: "Tỏi tây baby Đơn Dương (Bó 500g)", categoryId: "22", categoryName: "Cải hữu cơ & Rau gia vị",
    photo: "1471193945509-9ad0617afabf", unit: "bó 500g", supplierId: "102", certifications: ["VietGAP"],
    description: "Tỏi tây thu non, thân trắng dài, thơm nhẹ; dùng xào, nấu canh hoặc nướng.",
    listingId: "236", unitPrice: 29000, available: 180,
  },
  {
    id: "37", name: "Hương thảo tươi Langbiang (Bó 100g)", categoryId: "42", categoryName: "Atisô & Thảo mộc",
    photo: "1515586000433-45406d8e6662", unit: "bó 100g", supplierId: "103", certifications: ["organic"],
    description: "Hương thảo trồng hữu cơ dưới chân núi Langbiang, lá kim xanh đậm, tinh dầu thơm; ướp thịt nướng hoặc pha trà.",
    listingId: "237", unitPrice: 22000, available: 90,
  },
  {
    id: "38", name: "Măng tây xanh Đức Trọng (Bó 500g)", categoryId: "32", categoryName: "Ớt chuông & Củ ôn đới",
    photo: "1595855759920-86582396756a", unit: "bó 500g", supplierId: "105", certifications: ["VietGAP"],
    description: "Măng tây xanh cắt mỗi sáng, thân mập giòn, đầu búp khép kín; hấp, xào tỏi hoặc nướng bơ.",
    listingId: "238", unitPrice: 85000, available: 75,
  },
  {
    id: "39", name: "Cà phê Arabica Cầu Đất hạt rang (Túi 1kg)", categoryId: "52", categoryName: "Cà phê Arabica",
    photo: "1447933601403-0c6688de566e", unit: "túi 1kg", supplierId: "104", certifications: ["VietGAP", "GlobalGAP"],
    description: "Arabica Cầu Đất hái chín, sơ chế mật ong, rang vừa; túi van một chiều. Hợp cho quán và văn phòng.",
    listingId: "239", unitPrice: 340000, available: 100,
  },
];

export const extraProducts: ProductSeedItem[] = specs.map((s) => ({
  id: s.id,
  name: s.name,
  categoryId: s.categoryId,
  categoryName: s.categoryName,
  imageUrl: img(s.photo, 500),
  imageUrls: [img(s.photo, 800)],
  description: s.description,
  unit: s.unit,
  ...(s.seasonality ? { seasonality: s.seasonality } : {}),
  inSeason: true,
  supplier: sup(s.supplierId),
  certifications: s.certifications,
  listing: { id: s.listingId, saleUnit: s.unit, unitPrice: s.unitPrice, available: s.available },
  batchesOnSale: [],
  similar: [],
}));

/** [productId, mã lô, tên sản phẩm, ngày thu hoạch, số ngày hạn sử dụng, sản lượng] */
const approvedBatchSpecs: [string, string, string, string, number, number][] = [
  ["3", "DTBT", "Dâu tây Bạch Tuyết má hồng (Hộp 300g)", "2026-10-14", 6, 80],
  ["4", "DTMD", "Dâu tây Mỹ đá truyền thống (Hộp 1kg)", "2026-10-15", 6, 40],
  ["7", "CCNV", "Cà chua Nova vàng giòn (Hộp 500g)", "2026-10-13", 10, 200],
  ["8", "CCBF", "Cà chua Beef Đà Lạt xuất khẩu (Kg)", "2026-10-13", 12, 400],
  ["10", "XLLL", "Xà lách Lô lô xanh giòn (Gói 300g)", "2026-10-15", 5, 250],
  ["13", "RBXV", "Rau bó xôi chân vịt Đà Lạt (Túi 500g)", "2026-10-15", 4, 150],
  ["14", "CCVS", "Cải cầu vồng Swiss Chard (Túi 500g)", "2026-10-14", 5, 140],
  ["16", "OCDD", "Ớt chuông ngọt đỏ Đà Lạt (Kg)", "2026-10-12", 14, 450],
  ["18", "CRBB", "Cà rốt baby Đơn Dương (Túi 500g)", "2026-10-13", 14, 300],
  ["19", "CDDL", "Củ dền đỏ Lạc Dương hữu cơ (Kg)", "2026-10-11", 20, 220],
  ["21", "HGFY", "Hồng giòn Fuyu Đà Lạt (Kg)", "2026-10-12", 12, 120],
  ["22", "CDTL", "Chanh dây tím Lạc Dương ngọt thanh (Kg)", "2026-10-11", 15, 300],
  ["26", "NMHK", "Nấm hoàng kim dinh dưỡng (Khay 200g)", "2026-10-15", 5, 150],
  ["28", "TXCT", "Trà xanh cổ thụ Cầu Đất (Hộp 200g)", "2026-09-20", 365, 100],
  ["30", "CFCL", "Cà phê Culi Arabica Đà Lạt chế biến ướt (Túi 500g)", "2026-09-10", 365, 120],
  ["31", "VQDL", "Việt quất Đà Lạt (Hộp 125g)", "2026-10-15", 7, 90],
  ["32", "NMTR", "Nấm mỡ trắng Đà Lạt (Khay 200g)", "2026-10-15", 5, 200],
  ["33", "BCXD", "Bông cải xanh Đà Lạt (Kg)", "2026-10-15", 7, 320],
  ["34", "BCTT", "Bắp cải trái tim Đà Lạt (Kg)", "2026-10-14", 14, 650],
  ["35", "HTDL", "Hành tây Đà Lạt (Kg)", "2026-10-08", 45, 900],
  ["36", "TTBB", "Tỏi tây baby Đơn Dương (Bó 500g)", "2026-10-15", 7, 220],
  ["37", "HTLB", "Hương thảo tươi Langbiang (Bó 100g)", "2026-10-15", 6, 120],
  ["38", "MTDT", "Măng tây xanh Đức Trọng (Bó 500g)", "2026-10-16", 5, 100],
  ["39", "CFRH", "Cà phê Arabica Cầu Đất hạt rang (Túi 1kg)", "2026-09-28", 270, 150],
];

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const extraBatches: Schema<"Batch">[] = [
  ...approvedBatchSpecs.map(([productId, prefix, productName, harvestDate, shelfDays, qty], i) => {
    const batchCode = `${prefix}-2610-${String(17 + i).padStart(2, "0")}`;
    const traceCode = `TRC-${batchCode}`;
    return {
      id: String(1017 + i),
      batchCode,
      productId,
      productName,
      harvestDate,
      bestBefore: addDays(harvestDate, shelfDays),
      declaredQuantity: qty,
      status: "approved" as const,
      rejectReason: null,
      traceCode,
      traceUrl: `http://localhost:3000/truy-xuat/${traceCode}`,
      recalledAt: null,
      createdAt: `${addDays(harvestDate, -2)}T02:00:00Z`,
    };
  }),
  // Lô bị từ chối của HTX Dâu tây Đà Lạt (seller@farmery.vn): khu nhà cung cấp có "việc cần làm" để demo.
  {
    id: "1041",
    batchCode: "DTBT-2610-41",
    productId: "3",
    productName: "Dâu tây Bạch Tuyết má hồng (Hộp 300g)",
    harvestDate: "2026-10-16",
    bestBefore: "2026-10-22",
    declaredQuantity: 60,
    status: "rejected",
    rejectReason: "Nhật ký chưa có lần thu hoạch và thiếu ảnh luống dâu. Vui lòng bổ sung nhật ký thu hoạch kèm ảnh rồi khai báo lại.",
    traceCode: null,
    traceUrl: null,
    recalledAt: null,
    createdAt: "2026-10-16T01:00:00Z",
  },
];

const PLANT_DAYS_BEFORE: Record<string, number> = { "28": 120, "30": 200, "39": 200, "35": 110 };

/** Hai dòng nhật ký (gieo trồng, thu hoạch) cho mỗi lô đã duyệt ở trên, để tab nhật ký không trống. */
export const extraLogs: Schema<"FarmingLog">[] = extraBatches
  .filter((b) => b.status === "approved")
  .flatMap((b, i) => {
    const plantedBefore = PLANT_DAYS_BEFORE[b.productId] ?? 60;
    const by = { userId: "201", displayName: "Kỹ thuật viên HTX", onBehalf: false };
    return [
      {
        id: String(6001 + i * 2),
        batchId: b.id,
        activityDate: addDays(b.harvestDate, -plantedBefore),
        activity: "planting" as const,
        description: `Xuống giống cho lô ${b.batchCode} theo quy trình của hợp tác xã; ghi lại nguồn giống và giá thể.`,
        imageUrls: [],
        supersedesId: null,
        superseded: false,
        enteredBy: by,
        createdAt: `${addDays(b.harvestDate, -plantedBefore)}T09:00:00Z`,
      },
      {
        id: String(6002 + i * 2),
        batchId: b.id,
        activityDate: b.harvestDate,
        activity: "harvest" as const,
        description: `Thu hoạch ${b.declaredQuantity.toLocaleString("vi-VN")} đơn vị bán, phân loại tại nhà sơ chế và làm lạnh trước khi giao kho Farmery.`,
        imageUrls: [],
        supersedesId: null,
        superseded: false,
        enteredBy: by,
        createdAt: `${b.harvestDate}T10:00:00Z`,
      },
    ];
  });

/** Bảng giá sỉ của nhà cung cấp theo productId (FR6.4). */
export const wholesaleOffers: Record<string, Schema<"WholesaleOffer">> = {
  "1": { saleUnit: "kg", minQuantity: 20, leadTimeDays: 2, tiers: [{ minQuantity: 20, unitPrice: 210000 }, { minQuantity: 50, unitPrice: 195000 }, { minQuantity: 100, unitPrice: 180000 }] },
  "9": { saleUnit: "kg", minQuantity: 30, leadTimeDays: 1, tiers: [{ minQuantity: 30, unitPrice: 52000 }, { minQuantity: 100, unitPrice: 47000 }] },
  "12": { saleUnit: "kg", minQuantity: 30, leadTimeDays: 2, tiers: [{ minQuantity: 30, unitPrice: 88000 }, { minQuantity: 100, unitPrice: 80000 }] },
  "15": { saleUnit: "kg", minQuantity: 100, leadTimeDays: 2, tiers: [{ minQuantity: 100, unitPrice: 46000 }, { minQuantity: 500, unitPrice: 42000 }, { minQuantity: 1000, unitPrice: 39000 }] },
  "17": { saleUnit: "kg", minQuantity: 200, leadTimeDays: 2, tiers: [{ minQuantity: 200, unitPrice: 21000 }, { minQuantity: 1000, unitPrice: 19000 }, { minQuantity: 5000, unitPrice: 17500 }] },
  "20": { saleUnit: "kg", minQuantity: 100, leadTimeDays: 3, tiers: [{ minQuantity: 100, unitPrice: 48000 }, { minQuantity: 500, unitPrice: 44000 }] },
  "29": { saleUnit: "kg", minQuantity: 20, leadTimeDays: 5, tiers: [{ minQuantity: 20, unitPrice: 330000 }, { minQuantity: 100, unitPrice: 300000 }] },
  "34": { saleUnit: "kg", minQuantity: 300, leadTimeDays: 2, tiers: [{ minQuantity: 300, unitPrice: 17000 }, { minQuantity: 1000, unitPrice: 15000 }, { minQuantity: 3000, unitPrice: 13500 }] },
  "35": { saleUnit: "kg", minQuantity: 500, leadTimeDays: 3, tiers: [{ minQuantity: 500, unitPrice: 16000 }, { minQuantity: 2000, unitPrice: 14500 }] },
  "39": { saleUnit: "túi 1kg", minQuantity: 10, leadTimeDays: 5, tiers: [{ minQuantity: 10, unitPrice: 310000 }, { minQuantity: 50, unitPrice: 285000 }] },
};

/** Ảnh ô danh mục ở trang chủ, theo id danh mục cấp 1. */
export const categoryImages: Record<string, string> = {
  "1": img("1464965911861-746a04b4bca6", 480),
  "2": img("1540420773420-3366772f4999", 480),
  "3": img("1597362925123-77861d3fbac7", 480),
  "4": img("1504545102780-26774c1bb073", 480),
  "5": img("1447933601403-0c6688de566e", 480),
};
