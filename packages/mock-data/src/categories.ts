import type { Schema } from "@farmery/contract";

export const categories: Schema<"Category">[] = [
  {
    id: "1",
    name: "Trái cây",
    isLeaf: false,
    children: [
      { id: "11", name: "Dâu tây Đà Lạt", isLeaf: true, children: [] },
      { id: "12", name: "Bơ & Trái cây ôn đới", isLeaf: true, children: [] },
      { id: "13", name: "Chanh dây & Quả mọng", isLeaf: true, children: [] },
    ],
  },
  {
    id: "2",
    name: "Rau ăn lá thủy canh",
    isLeaf: false,
    children: [
      { id: "21", name: "Xà lách thủy canh", isLeaf: true, children: [] },
      { id: "22", name: "Cải hữu cơ & Rau gia vị", isLeaf: true, children: [] },
    ],
  },
  {
    id: "3",
    name: "Củ quả & Cà chua",
    isLeaf: false,
    children: [
      { id: "31", name: "Cà chua đặc sản", isLeaf: true, children: [] },
      { id: "32", name: "Ớt chuông & Củ ôn đới", isLeaf: true, children: [] },
    ],
  },
  {
    id: "4",
    name: "Nấm sạch & Dược liệu",
    isLeaf: false,
    children: [
      { id: "41", name: "Nấm tươi hữu cơ", isLeaf: true, children: [] },
      { id: "42", name: "Atisô & Thảo mộc", isLeaf: true, children: [] },
    ],
  },
  {
    id: "5",
    name: "Trà & Cà phê đặc sản",
    isLeaf: false,
    children: [
      { id: "51", name: "Trà Ô Long Cầu Đất", isLeaf: true, children: [] },
      { id: "52", name: "Cà phê Arabica", isLeaf: true, children: [] },
    ],
  },
];
