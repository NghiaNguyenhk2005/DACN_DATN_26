import { Controller, HttpCode, NotFoundException, Post } from "@nestjs/common";
import { MockStore } from "../store/mock-store";

@Controller("dev")
export class DevController {
  constructor(private readonly store: MockStore) {}

  @Post("reset")
  @HttpCode(204)
  reset(): void {
    if (process.env.NODE_ENV === "production") throw new NotFoundException();
    this.store.reset();
  }
}
