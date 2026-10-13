import { Module } from "@nestjs/common";
import { CoreModule } from "./core/core.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { BUSINESS_MODULES } from "./modules";
import { SystemModule } from "./system/system.module";

@Module({
  imports: [CoreModule, IntegrationsModule, SystemModule, ...BUSINESS_MODULES],
})
export class AppModule {}
