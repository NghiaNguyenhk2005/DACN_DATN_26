import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthedRequest } from "./auth.guard";

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AuthedRequest>().user,
);
