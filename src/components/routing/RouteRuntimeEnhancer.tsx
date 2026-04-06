// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';

const SCROLL_KEY = 'sv.route.scroll.positions';
const BREADCRUMB_SCRIPT_ID = 'sv-breadcrumb-jsonld';
const CANONICAL_IGNORED_PARAMS = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']);

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  const collapsed = pathname.replace(/\/+/g, '/');
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }
  return collapsed;
}

function legacyCanonicalPath(pathname: string): string {
  const normalized = normalizePathname(pathname);

  const productMatch = normalized.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    return `/marketplace/product/${encodeURIComponent(decodeURIComponent(productMatch[1]))}`;
  }

  if (normalized === '/auth') return '/login';
  if (normalized === '/dashboard') return '/app';

  return normalized;
}

function getScrollMap(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function setScrollMap(map: Record<string, number>) {
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function prettifySegment(segment: string): string {
  if (!segment) return '';
  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function buildBreadcrumbs(pathname: string) {
  const segments = normalizePathname(pathname).split('/').filter(Boolean);
  const crumbs = [{ label: 'Home', href: '/' }];
  let current = '';

  for (const segment of segments) {
    current += `/${segment}`;
    crumbs.push({
      label: prettifySegment(segment),
      href: current,
    });
  }

  return crumbs;
}

function setCanonicalLink(pathname: string, search: string) {
  if (typeof document === 'undefined') return;

  const params = new URLSearchParams(search);
  const clean = new URLSearchParams();
  params.forEach((value, key) => {
    if (!CANONICAL_IGNORED_PARAMS.has(key.toLowerCase())) {
      clean.append(key, value);
    }
  });

  const canonicalSearch = clean.toString();
  const href = `${window.location.origin}${pathname}${canonicalSearch ? `?${canonicalSearch}` : ''}`;

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = href;
}

function setBreadcrumbJsonLd(items: Array<{ label: string; href: string }>) {
  if (typeof document === 'undefined') return;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${window.location.origin}${item.href}`,
    })),
  };

  let script = document.getElementById(BREADCRUMB_SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = BREADCRUMB_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLd);
}

function RouteNavigationLoader() {
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 220);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.search, location.hash]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-0.5 bg-transparent">
      <div className="h-full w-full origin-left animate-pulse bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" />
    </div>
  );
}

export default function RouteRuntimeEnhancer() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const currentKey = `${normalizePathname(location.pathname)}${location.search}`;
  const previousKeyRef = useRef<string>(currentKey);

  const canonicalPath = useMemo(() => legacyCanonicalPath(location.pathname), [location.pathname]);

  useEffect(() => {
    if (canonicalPath !== normalizePathname(location.pathname)) {
      navigate(
        {
          pathname: canonicalPath,
          search: location.search,
          hash: location.hash,
        },
        { replace: true }
      );
    }
  }, [canonicalPath, location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    setCanonicalLink(canonicalPath, location.search);
    const crumbs = buildBreadcrumbs(canonicalPath);
    setBreadcrumbJsonLd(crumbs);
    window.dispatchEvent(new CustomEvent('sv:breadcrumbs', { detail: crumbs }));
  }, [canonicalPath, location.search]);

  useEffect(() => {
    const prev = previousKeyRef.current;
    if (prev !== currentKey) {
      const map = getScrollMap();
      map[prev] = window.scrollY;
      setScrollMap(map);
      previousKeyRef.current = currentKey;
    }
  }, [currentKey]);

  useEffect(() => {
    const hash = location.hash ? decodeURIComponent(location.hash.replace('#', '')) : '';
    if (hash) {
      const timer = window.setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 40);
      return () => window.clearTimeout(timer);
    }

    const map = getScrollMap();
    if (navigationType === 'POP' && typeof map[currentKey] === 'number') {
      window.scrollTo({ top: map[currentKey], left: 0, behavior: 'auto' });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash, navigationType, currentKey]);

  return <RouteNavigationLoader />;
}
