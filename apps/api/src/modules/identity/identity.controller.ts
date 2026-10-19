import { Body, Controller, Get, Post } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { IdentityService } from "./identity.service";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";

@Controller()
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post("auth/otp")
  requestOtp(@Body() body: { email: string }) {
    return this.identityService.requestOtp(body.email);
  }

  @Post("auth/login")
  login(@Body() body: { challengeId: string; code: string }) {
    return this.identityService.login(body.challengeId, body.code);
  }

  @Get("me")
  getMe(@CurrentUser() user?: AuthUser): Schema<"Me"> {
    return this.identityService.getMe(user?.id);
  }
}
