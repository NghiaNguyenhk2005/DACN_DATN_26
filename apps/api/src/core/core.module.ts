import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { APP_CONFIG, loadConfig } from "./app-config";
import { AuthGuard } from "./auth.guard";
import { CONTRACT_DOCUMENT, loadContractDocument } from "./contract-document";
import { DemoResetRegistry } from "./demo-reset.registry";
import { IdempotencyInterceptor } from "./idempotency.interceptor";
import { ProblemFilter } from "./problem.filter";
import { TokenService } from "./token.service";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({ secret: loadConfig().jwtSecret, signOptions: { expiresIn: "8h" } }),
    }),
  ],
  providers: [
    { provide: APP_CONFIG, useFactory: () => loadConfig() },
    { provide: CONTRACT_DOCUMENT, useFactory: loadContractDocument },
    TokenService,
    DemoResetRegistry,
    { provide: APP_FILTER, useClass: ProblemFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
  exports: [APP_CONFIG, CONTRACT_DOCUMENT, TokenService, DemoResetRegistry],
})
export class CoreModule {}
