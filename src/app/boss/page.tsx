// @ts-nocheck
'use client';

import React from 'react';
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BossPage() {
  const router = useRouter();
  useEffect(() => {
    router.push('/login?redirect=%2Fcontrol-panel');
  }, [router]);
  return null;
}
