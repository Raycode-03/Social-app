"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
const SignInBtn = ({
  provider,
  variant = "default",
}) => {
  const [loading, setLoading] = useState(false);
  return (

    <Button
      variant={variant}
      className="w-full p-4"
      onClick={() => {
        setLoading(true);
        signIn(provider, { callbackUrl: "/users" })
          .finally(() => setLoading(false));
      }}
      disabled={loading}
    >
      <Image
        src={`/logos/${provider.toLowerCase()}.svg`}
        alt={`${provider} logo`}
        width={20}
        height={20}
        className="mr-2 inline-block"
      />
      Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </Button>
  );
};

export default SignInBtn;
