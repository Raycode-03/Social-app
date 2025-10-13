import React from 'react'
import { CardDemo } from "@/components/auth/landing";
import { Card } from "@/components/ui/card";
function Login() {
  return (
    <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-sm md:max-w-sm">
        <CardDemo data= "login"/>
        </Card>
        
    </div>
  )
}

export default Login