// @ts-nocheck
import { redirect } from 'next/navigation';

/**
 * Global Not Found handler for Next.js App Router.
 * Any unmatched route hits this file — immediately redirects to /login.
 * No 404 UI is ever rendered.
 */
export default function GlobalNotFound() {
  redirect('/login');
}
