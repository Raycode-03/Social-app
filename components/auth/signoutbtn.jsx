"use client";
import React from 'react'
import { signOut } from 'next-auth/react';

const SignOutBtn = () => (
  <span onClick={() => signOut({ callbackUrl: "/auth/login" })}>
    {`Sign Out`}
  </span>
);
export default SignOutBtn;