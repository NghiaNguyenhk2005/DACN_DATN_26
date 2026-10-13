export default function HomePage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Đang vào mùa</h1>
      <p className="text-muted-foreground">Khung trang chủ — danh sách sản phẩm theo mùa sẽ lấy từ GET /products?inSeason=true.</p>
    </section>
  );
}
