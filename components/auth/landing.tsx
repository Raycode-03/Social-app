"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import SignInBtn from "@/auth/signinbtn";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Config for login/register modes
const modeConfig = {
  login: {
  title: "Sign in to your account",
  description: "Enter your email and password to access your account.",
  success: "Signed in successfully!",
  error: "Unable to sign in.",
  button: "Log in",
  forgot_link: "Forgot-Password?",
  linkText: "Don't have an account?",
  linkButton: "Create one",
  linkHref: "/auth/register",
  endpoint: "login",
},
register: {
  title: "Create a new account",
  description: "Enter your details below to get started.",
  success: "Account created successfully!",
  error: "Unable to sign up.",
  button: "Sign up",
  forgot_link: "",
  linkText: "Already have an account?",
  linkButton: "Log in",
  linkHref: "/auth/login",
  endpoint: "register",
},

};

export function CardDemo({ data }: { data: "login" | "register" }) {
  const [ mode , setmode ] = useState<"login" | "register">(data);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const cfg = modeConfig[mode]; // pick config once

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const baseUrl = process.env.NEXTAUTH_URL||'http://localhost:3000' ;
      const res = await fetch(`${baseUrl}/api/auth/user_auth/${cfg.endpoint}`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTimeout(()=>{setMessage({ text: data.error || cfg.error, type: "error" });},3000)
        
      } else {
        setMessage({ text: cfg.success, type: "success" });
        await signIn("credentials", {
          email,
          password,
          redirect: true,
          callbackUrl: "/users",
        });
      }
    } catch (error) {
      console.log(error);
      setTimeout(() => {setMessage({ text: "Something went wrong, please try again.", type: "error" }); 
        }, 3000);
      
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Heading */}
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-bold text-center">{cfg.title}</CardTitle>
        <CardDescription className="text-center">{cfg.description}</CardDescription>
      </CardHeader>

      {/* Alert Message */}
      {message && (
        <div className=" max-h-[30px] px-6  mb-5 z-20">
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            {message.type === "error" ? (
              <AlertCircleIcon className="h-4 w-4" />
            ) : (
              <CheckCircle2Icon className="h-2 w-4" />
            )}
            <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2 ">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="text-sm  flex justify-end">
            <Link href={`/auth/${cfg.forgot_link.toLowerCase()}`} className="text-gray-500 mt-2 hover:underline hover:text-blue-300">{cfg.forgot_link.replace("-", " ")}</Link>
          </div>
        </CardContent>

        {/* Buttons */}
        <CardFooter className="flex flex-col gap-3 mt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading...": cfg.button}
          </Button>

          <Separator className="my-2 bg-gray-200" />

          <div className="mt-1 space-y-3">
            <SignInBtn provider="github" variant="github" />
            <SignInBtn provider="google" variant="google" />
          </div>

          {/* Bottom Link */}
          <p className="text-sm text-gray-500 mt-2">
            {cfg.linkText}
            <Link href={cfg.linkHref}>
              <Button variant="link" type="button" className="p-0 h-auto" onClick={()=> setmode(mode=== "login" ? "register": "login")}>
                {cfg.linkButton}
              </Button>
            </Link>
          </p>
        </CardFooter>
      </form>
    </>
  );
}
