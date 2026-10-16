export default function HomePage() {
  return (
    <section className="space-y-2 py-8">
      <h1 className="font-serif text-h1-sm font-bold text-ink md:text-h1">Đang vào mùa</h1>
      <p className="text-small text-muted-foreground">Danh sách sản phẩm theo mùa lấy từ GET /products?inSeason=true.</p>
    </section>
  );
}
