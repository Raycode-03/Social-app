"use server";
import { CardDemo } from "@/components/auth/landing";
import { Card } from "@/components/ui/card";

export default async function RegisterPage() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="w-full max-w-sm ">
        <CardDemo  data="register"/>
      </Card>
    </div>
  );
}