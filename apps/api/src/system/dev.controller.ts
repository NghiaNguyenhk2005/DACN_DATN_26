import { Controller, HttpCode, Inject, Post } from "@nestjs/common";
import { APP_CONFIG, type AppConfig } from "../core/app-config";
import { DemoResetRegistry } from "../core/demo-reset.registry";
import { ProblemException } from "../core/problem";

@Controller("dev")
export class DevController {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly registry: DemoResetRegistry,
  ) {}

  @Post("reset")
  @HttpCode(204)
  reset(): void {
    if (!this.config.demoMode) throw new ProblemException(404, "DEMO_MODE_OFF");
    this.registry.resetAll();
  }
}
