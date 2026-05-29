import { authConfig } from "@/lib/auth.config";
import NextAuth from "next-auth";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/friends/:path*",
    "/groups/:path*",
    "/expenses/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
