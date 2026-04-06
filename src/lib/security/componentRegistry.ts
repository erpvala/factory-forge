// @ts-nocheck

const ALLOWED_LAZY_IMPORT_PREFIXES = [
  '@/pages/',
  '@/components/',
  '@/app/',
];

const BLOCKED_COMPONENT_IMPORT_PATTERNS = [
  new RegExp(['super', 'admin', 'system'].join('[-/]'), 'i'),
  new RegExp(['super', 'admin', 'wire', 'frame'].join('[-/]'), 'i'),
  new RegExp(['/', 'wire', 'frame', '/'].join(''), 'i'),
  new RegExp(['role', 'switch'].join('[-/]'), 'i'),
  /legacy/i,
];

export const assertLazyComponentImportAllowed = (importPath: string) => {
  if (!importPath) {
    throw new Error('Component registry lock: unresolved lazy import path');
  }

  if (BLOCKED_COMPONENT_IMPORT_PATTERNS.some((pattern) => pattern.test(importPath))) {
    throw new Error(`Component registry lock: blocked legacy import "${importPath}"`);
  }

  if (!ALLOWED_LAZY_IMPORT_PREFIXES.some((prefix) => importPath.startsWith(prefix))) {
    throw new Error(`Component registry lock: unregistered import "${importPath}"`);
  }
};

export const inferImportPathFromFactory = (factoryFn: () => Promise<any>) => {
  const source = factoryFn.toString();
  const match = source.match(/import\((['\"`])([^'\"`]+)\1\)/);
  return match?.[2] || '';
};
