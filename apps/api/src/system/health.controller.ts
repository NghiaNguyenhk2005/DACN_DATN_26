import { Controller, Get } from "@nestjs/common";
import type { Schema } from "@farmery/contract";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): Schema<"Health"> {
    return { status: "ok", uptimeSeconds: Math.round(process.uptime()) };
  }
}
