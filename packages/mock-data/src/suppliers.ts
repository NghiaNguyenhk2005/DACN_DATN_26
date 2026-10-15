import type { Schema } from "@farmery/contract";

export interface SupplierSeedItem extends Schema<"SupplierRef"> {
  description: string;
  avatarUrl: string | null;
  growingAreaCode: string | null;
  reputationScore: number | null;
  certifications: Schema<"Certification">[];
}

export const suppliersData: SupplierSeedItem[] = [
  {
    id: "101",
    displayName: "HTX Dâu tây Đà Lạt",
    growingRegion: "Phường 8, TP. Đà Lạt, Lâm Đồng",
    description: "Hợp tác xã chuyên canh dâu tây giống Nhật Bản (Hana) và New Zealand ứng dụng công nghệ tưới nhỏ giọt Israel và giá thể xơ dừa hữu cơ trên giàn treo.",
    growingAreaCode: "VN-35-DL-DT01",
    avatarUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXqOE7YCwT-oOHkXtVG-TH3HxtwuzgpaKsnKkSB9n9HHPaqai_4xH707U&s=10&w=300",
    reputationScore: 4.9,
    certifications: [
      {
        type: "VietGAP",
        certificateNumber: "VG-2025-LD-0842",
        issuingAuthority: "Chi cục Trồng trọt & Bảo vệ Thực vật Lâm Đồng",
        issuedDate: "2025-03-15",
        expiryDate: "2027-03-15",
        valid: true,
      },
      {
        type: "OCOP",
        certificateNumber: "OCOP-4S-DL-019",
        issuingAuthority: "UBND Tỉnh Lâm Đồng (OCOP 4 sao)",
        issuedDate: "2024-11-20",
        expiryDate: "2027-11-20",
        valid: true,
      },
    ],
  },
  {
    id: "102",
    displayName: "HTX Rau sạch Công nghệ cao Đơn Dương",
    growingRegion: "Thị trấn Thạnh Mỹ, Huyện Đơn Dương, Lâm Đồng",
    description: "Vựa rau chủ lực của tỉnh Lâm Đồng với quy mô 35ha nhà màng, chuyên cung cấp các loại xà lách thủy canh, cải xoăn kale và cà chua bi cherry cao cấp.",
    growingAreaCode: "VN-35-DD-RC02",
    avatarUrl: "https://vnn.1cdn.vn/2024/10/03/uploads-2024-thang-10-ngay-3-cuong-1a1.jpg?w=300",
    reputationScore: 4.8,
    certifications: [
      {
        type: "VietGAP",
        certificateNumber: "VG-2024-LD-1105",
        issuingAuthority: "Trung tâm Khảo kiểm nghiệm Giống & Cây trồng Lâm Đồng",
        issuedDate: "2024-06-10",
        expiryDate: "2027-06-10",
        valid: true,
      },
      {
        type: "GlobalGAP",
        certificateNumber: "GG-VN-2025-00412",
        issuingAuthority: "Control Union Vietnam",
        issuedDate: "2025-01-12",
        expiryDate: "2027-01-12",
        valid: true,
      },
    ],
  },
  {
    id: "103",
    displayName: "Nông trại Sinh thái Langbiang Organic Farm",
    growingRegion: "Thị trấn Lạc Dương, Huyện Lạc Dương, Lâm Đồng",
    description: "Nông trại hữu cơ dưới chân đỉnh Langbiang hùng vĩ, độ cao 1.500m, không sử dụng thuốc BVTV hoá học, chuyên canh nấm tươi, atisô và củ quả ôn đới.",
    growingAreaCode: "VN-35-LD-OG03",
    avatarUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=300",
    reputationScore: 4.9,
    certifications: [
      {
        type: "organic",
        certificateNumber: "VN-ORG-2024-0089",
        issuingAuthority: "Tổ chức Chứng nhận Nông nghiệp Hữu cơ Quốc tế",
        issuedDate: "2024-09-05",
        expiryDate: "2027-09-05",
        valid: true,
      },
      {
        type: "HACCP",
        certificateNumber: "HACCP-CODEX-2024-551",
        issuingAuthority: "Quacert Chứng nhận Hệ thống An toàn Thực phẩm",
        issuedDate: "2024-10-18",
        expiryDate: "2027-10-18",
        valid: true,
      },
    ],
  },
  {
    id: "104",
    displayName: "HTX Nông nghiệp Hữu cơ Cầu Đất Xanh",
    growingRegion: "Xã Xuân Trường, TP. Đà Lạt, Lâm Đồng",
    description: "Đồi trà Cầu Đất trứ danh với thổ nhưỡng bazan màu mỡ và sương mù bao phủ quanh năm, sản xuất trà Ô Long thuần, cà phê Arabica đặc sản và bơ sáp 034.",
    growingAreaCode: "VN-35-CD-TC04",
    avatarUrl: "https://i.ex-cdn.com/danviet.vn/files/content/2026/03/25/htx-co-doanh-thu-khung-3-2129.jpg?w=300",
    reputationScore: 4.7,
    certifications: [
      {
        type: "VietGAP",
        certificateNumber: "VG-2024-LD-0988",
        issuingAuthority: "Sở Nông nghiệp & PTNT Tỉnh Lâm Đồng",
        issuedDate: "2024-04-10",
        expiryDate: "2027-04-10",
        valid: true,
      },
      {
        type: "OCOP",
        certificateNumber: "OCOP-4S-CD-008",
        issuingAuthority: "Hội đồng đánh giá OCOP Tỉnh Lâm Đồng",
        issuedDate: "2024-12-01",
        expiryDate: "2027-12-01",
        valid: true,
      },
    ],
  },
  {
    id: "105",
    displayName: "HTX Nông sản An toàn Đức Trọng Farm",
    growingRegion: "Xã Hiệp An, Huyện Đức Trọng, Lâm Đồng",
    description: "Liên minh nông dân công nghệ cao Đức Trọng, chuyên cung ứng ớt chuông ngọt nhiều màu, khoai tây vàng, cà rốt baby cho các chuỗi phân phối cao cấp.",
    growingAreaCode: "VN-35-DT-AT05",
    avatarUrl: "https://scontent.fsgn2-8.fna.fbcdn.net/v/t39.30808-6/470229948_619664327060303_4610780822718131710_n.jpg?stp=dst-jpg_tt6&cstp=mx1024x576&ctp=s960x960&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=KXKFLrv_mLwQ7kNvwGedWeb&_nc_oc=AdpGcQBnCNIiM-xSvqi9MzfQyG_NlaQgro-go22vLJdR1x_GPHPc6lGutJYCNB5pw-A&_nc_zt=23&_nc_ht=scontent.fsgn2-8.fna&_nc_gid=w348qPCTw5Rg5TNQfuODCw&_nc_ss=7b289&oh=00_AQMQ7P49P0N1bzfcpdzvWpkwYJQpKp4ChQMJdCnTTPjDXw&oe=6AD67A38&w=300",
    reputationScore: 4.8,
    certifications: [
      {
        type: "VietGAP",
        certificateNumber: "VG-2025-LD-0412",
        issuingAuthority: "Chi cục Quản lý Chất lượng Nông Lâm Sản Lâm Đồng",
        issuedDate: "2025-02-14",
        expiryDate: "2027-02-14",
        valid: true,
      },
      {
        type: "GlobalGAP",
        certificateNumber: "GG-VN-2024-00911",
        issuingAuthority: "TUV Nord Vietnam",
        issuedDate: "2024-08-20",
        expiryDate: "2027-08-20",
        valid: true,
      },
    ],
  },
];

export const suppliers: Schema<"SupplierRef">[] = suppliersData.map((s) => ({
  id: s.id,
  displayName: s.displayName,
  growingRegion: s.growingRegion,
}));
