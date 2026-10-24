// Hàng đợi chạy tuần tự theo khóa. Thay cho SELECT ... FOR UPDATE của CSDL thật: hai yêu cầu cùng khóa
// không chạy xen kẽ giữa lúc đọc và lúc ghi (NFR1.2, chống bán vượt).
export class KeyedMutex {
  private tails = new Map<string, Promise<unknown>>();

  async runExclusive<T>(key: string, work: () => Promise<T>): Promise<T> {
    const prev = this.tails.get(key) ?? Promise.resolve();
    const run = prev.then(work, work);
    const tail = run.then(
      () => undefined,
      () => undefined,
    );
    this.tails.set(key, tail);
    try {
      return await run;
    } finally {
      if (this.tails.get(key) === tail) this.tails.delete(key);
    }
  }
}
