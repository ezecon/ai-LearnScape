'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router';
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push('/dashboard')
  }, [])
  return (
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      "
    >
      LearnScape
    </div>
  );
}