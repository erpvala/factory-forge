// @ts-nocheck
import { useEffect, useState } from 'react';

const BANNED_TOKENS = [
  ['super', 'admin', 'wire', 'frame'].join('-'),
  ['wire', 'frame', 'sidebar'].join('-'),
  ['role', 'switch', 'dashboard'].join(''),
  ['super', 'admin', 'system'].join('-'),
  ['role', 'switch'].join('-'),
];

function scanDomForLegacyToken() {
  const nodes = document.querySelectorAll('[id], [class], [data-component], [data-testid]');
  for (const node of nodes) {
    const payload = [
      node.id,
      node.className,
      node.getAttribute('data-component') || '',
      node.getAttribute('data-testid') || '',
    ]
      .join(' ')
      .toLowerCase();

    const token = BANNED_TOKENS.find((t) => payload.includes(t));
    if (token) return token;
  }
  return null;
}

export default function LegacyRuntimeGuard() {
  const [blockedToken, setBlockedToken] = useState(null);

  useEffect(() => {
    const check = () => {
      const token = scanDomForLegacyToken();
      if (!token) return;
      console.error('[RUNTIME_GUARD] legacy UI token detected:', token);
      setBlockedToken(token);
      throw new Error(`Legacy UI blocked at runtime: ${token}`);
    };

    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['id', 'class', 'data-component', 'data-testid'],
    });

    return () => observer.disconnect();
  }, []);

  if (!blockedToken) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black text-white p-6 text-center">
      <div>
        <h1 className="text-xl font-bold">Legacy UI Runtime Blocked</h1>
        <p className="mt-2 text-sm opacity-80">Token detected: {blockedToken}</p>
      </div>
    </div>
  );
}
