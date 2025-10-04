'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function Page() {
  const router = useRouter()
  
  useEffect(() => {
    router.push("/auth/login")
  }, [router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Redirecting to login...</div>
    </div>
  )
}

export default Page