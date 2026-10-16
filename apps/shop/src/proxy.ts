import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Kiểm lạc quan: thiếu cookie phiên thì chuyển /dang-nhap ngay. Kiểm thật (token còn hạn) nằm ở requireViewer().
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const url = new URL("/dang-nhap", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/gio-hang", "/thanh-toan", "/don-hang/:path*"],
};
