import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { JwtModule } from "@nestjs/jwt";
import { APP_CONFIG, loadConfig } from "./app-config";
import { AuthGuard } from "./auth.guard";
import { Clock, SystemClock } from "./clock";
import { CONTRACT_DOCUMENT, loadContractDocument } from "./contract-document";
import { DemoResetRegistry } from "./demo-reset.registry";
import { EventBus, NestEventBus } from "./events/event-bus";
import { IdempotencyInterceptor } from "./idempotency.interceptor";
import { prismaProviders, PRISMA_CLIENT } from "./prisma";
import { ProblemFilter } from "./problem.filter";
import { TokenService } from "./token.service";

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    JwtModule.registerAsync({
      useFactory: () => ({ secret: loadConfig().jwtSecret, signOptions: { expiresIn: "8h" } }),
    }),
  ],
  providers: [
    { provide: APP_CONFIG, useFactory: () => loadConfig() },
    { provide: CONTRACT_DOCUMENT, useFactory: loadContractDocument },
    TokenService,
    DemoResetRegistry,
    ...prismaProviders,
    { provide: EventBus, useClass: NestEventBus },
    { provide: Clock, useClass: SystemClock },
    { provide: APP_FILTER, useClass: ProblemFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
  exports: [APP_CONFIG, CONTRACT_DOCUMENT, TokenService, DemoResetRegistry, Clock, PRISMA_CLIENT, EventBus],
})
export class CoreModule {}
