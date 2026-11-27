import { Body, Controller, Get, Put } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { SettingsService } from "./settings.service";

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("admin/settings")
  list(): Promise<Schema<"PlatformSettings">> {
    return this.settings.get();
  }

  @Get("shop/delivery-settings")
  async publicSettings(): Promise<Schema<"DeliverySettings">> {
    const { codMaxAmount, cutoffTime, deliverySlots, shippingFee, freeShippingThreshold } = await this.settings.get();
    return { codMaxAmount, cutoffTime, deliverySlots, shippingFee, freeShippingThreshold };
  }

  @Put("admin/settings")
  update(@Body() body: Schema<"PlatformSettingsUpdate">): Promise<Schema<"PlatformSettings">> {
    return this.settings.update(body);
  }
}
