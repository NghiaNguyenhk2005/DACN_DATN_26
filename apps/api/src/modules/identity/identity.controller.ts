import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";
import { IdentityService } from "./identity.service";

@Controller()
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post("auth/otp")
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() body: { email: string }): Promise<{ challengeId: string; expiresAt: string; devCode?: string }> {
    return this.identity.requestOtp(body.email);
  }

  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { challengeId: string; code: string }): Promise<{ accessToken: string; user: Schema<"Me"> }> {
    return this.identity.login(body.challengeId, body.code);
  }

  @Get("me")
  getMe(@CurrentUser() user?: AuthUser): Promise<Schema<"Me">> {
    return this.identity.getMe(user?.id);
  }

  @Get("me/addresses")
  listAddresses(@CurrentUser() user: AuthUser): Promise<Schema<"Address">[]> {
    return this.identity.listAddresses(user.id);
  }

  @Post("me/addresses")
  createAddress(@CurrentUser() user: AuthUser, @Body() body: Schema<"AddressInput">): Promise<Schema<"Address">> {
    return this.identity.createAddress(user.id, body);
  }
}
