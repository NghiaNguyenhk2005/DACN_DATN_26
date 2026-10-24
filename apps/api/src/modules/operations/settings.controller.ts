import { Body, Controller, Get, Put } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { SettingsService } from "./settings.service";

@Controller("admin/settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  list(): Promise<Schema<"PlatformSettings">> {
    return this.settings.get();
  }

  @Put()
  update(@Body() body: Schema<"PlatformSettingsUpdate">): Promise<Schema<"PlatformSettings">> {
    return this.settings.update(body);
  }
}
