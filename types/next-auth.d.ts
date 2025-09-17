import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      isAdmin: boolean;
      packageType: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    isAdmin: boolean;
    packageType: string;
  }

  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    isAdmin: boolean;
    packageType: string;
  }
}
