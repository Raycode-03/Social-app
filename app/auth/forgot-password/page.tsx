"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const cfg = {
  title: "Set a new Password",
  description: "Step by step reset with email verification",
  success: "Password reset successful!",
  error: "Something went wrong",
  emailButton: "Verify Email",
  codeButton: "Verify Reset Code",
  passwordButton: "Set New Password",
  linkButton: "← Back to login",
  linkHref: "/auth/login",
};

export default function Page() {
  const router = useRouter();

  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [loading, setLoading] = useState(false);

  // form fields
  const [email, setEmail] = useState("");
  const [resetcode, setresetcode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // step states
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  async function handleVerifyEmail(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const baseurl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseurl}/api/auth/user_auth/forgot-password/verify-email`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {setMessage({ text: data.error || cfg.error, type: "error" });}
        else{
            setEmailVerified(true);
            setMessage({ text:data.message || "Email verified. Enter your reset code.", type: "success" });
        }

        
    } catch (error) {
      console.log(error);
      setMessage({ text: "Something went wrong, please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const baseurl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseurl}/api/auth/user_auth/forgot-password/verify-reset-code`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email, resetcode: resetcode.toString() }),
      });
      const data = await res.json();

      if (!res.ok) {setMessage({ text: data.error || cfg.error, type: "error" });}
      else{
            setCodeVerified(true);
            setMessage({ text:data.message || "Code verified. Enter your new password.", type: "success" });
      }

      
    } catch (error) {
      console.log(error);
      setMessage({ text: "Something went wrong, please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const baseurl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseurl}/api/auth/user_auth/forgot-password/new-password`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email,resetcode: resetcode.toString(), password: newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {setMessage({ text: data.error || cfg.error, type: "error" });}
      else{setMessage({ text: data.message|| cfg.success, type: "success" });
          router.push("/auth/login");
        }

      
    } catch (error) {
        console.log(error);
        setMessage({ text: "Something went wrong, please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="w-full max-w-sm ">
            <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-bold text-center">{cfg.title}</CardTitle>
        <CardDescription className="text-center">{cfg.description}</CardDescription>
      </CardHeader>

      {message && (
        <div className="max-h-[30px] px-6 mb-5 z-20">
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            {message.type === "error" ? (
              <AlertCircleIcon className="h-4 w-4" />
            ) : (
              <CheckCircle2Icon className="h-4 w-4" />
            )}
            <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </div>
      )}

      <CardContent className="space-y-6">
        {/* Step 1: Email */}
        <form onSubmit={handleVerifyEmail} className={emailVerified ? "hidden" : ""}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              disabled={emailVerified}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <CardFooter className="mt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : cfg.emailButton}
            </Button>
          </CardFooter>
        </form>

        {/* Step 2: Reset Code */}
        <form
          onSubmit={handleVerifyCode}
          className={`${!emailVerified || codeVerified ? "hidden" : ""}`}
        >
          <div className="grid gap-2">
            <Label htmlFor="reset_code">Reset Code</Label>
            <Input
              id="reset_code"
              type="text"
              required
              max={6}
              value={resetcode}
              disabled={codeVerified}
              onChange={(e) => setresetcode(e.target.value)}
            />
          </div>
          <CardFooter className="mt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : cfg.codeButton}
            </Button>
          </CardFooter>
        </form>

        {/* Step 3: New Password */}
        <form
          onSubmit={handleSetPassword}
          className={`${!codeVerified ? "hidden" : ""}`}
        >
          <div className="grid gap-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              required
              min={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <CardFooter className="mt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : cfg.passwordButton}
            </Button>
          </CardFooter>
        </form>
      </CardContent>

      <Separator className="my-2 bg-gray-200" />
      <CardFooter>
        <p className="text-sm text-gray-500 mt-2">
          <Link href={cfg.linkHref}>
            <Button variant="link" type="button" className="p-0 h-auto">
              {cfg.linkButton}
            </Button>
          </Link>
        </p>
      </CardFooter>
      </Card>
    </div>
  );
}
