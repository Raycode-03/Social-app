"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import SignInBtn from "@/auth/signinbtn";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import IsLoading from "@/components/loading/loading";
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
  linkButton: "Sign up",
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

  const cfg = modeConfig[mode]; // pick config once

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const baseUrl = process.env.NEXTAUTH_URL||'http://localhost:3000' ;
      const res = await fetch(`${baseUrl}/api/auth/user_auth/${cfg.endpoint}`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || cfg.error);
        
      } else {
        toast.success(cfg.success);
        await signIn("credentials", {
          email,
          password,
          redirect: true,
          callbackUrl: "/users",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong, please try again.");
      
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Heading */}<CardHeader className="space-y-3 pb-0">
          <div className="flex items-center justify-center gap-2">
            <Image src={"/logos/flowline.svg"} width={22} height={22} alt={"Flowline logo"} className="text-primary"/>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Flowline
            </CardTitle>
          </div>
          
          <div className="text-center space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              {cfg.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto leading-snug">
              {cfg.description}
            </CardDescription>
          </div>
        </CardHeader>
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

          <div className="grid gap-2 mb-1">
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
        <CardFooter className="flex flex-col gap-3 mt-2">
          <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <IsLoading loadstate={true} />
            ) : (
                  <>
                    {cfg.button}
                  </>
            )}
          </Button>

          <Separator className="my-2 bg-gray-200"/>

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
