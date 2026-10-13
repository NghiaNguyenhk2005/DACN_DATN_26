import { Module } from "@nestjs/common";
import { DevController } from "./dev/dev.controller";
import { HealthController } from "./health/health.controller";
import { MockStore } from "./store/mock-store";

@Module({
  controllers: [HealthController, DevController],
  providers: [MockStore],
})
export class AppModule {}
