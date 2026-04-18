// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    // HARD redirect - no 404 UI shown
    window.location.replace('/login');
  }, [navigate]);

  return null; // Never renders
}
