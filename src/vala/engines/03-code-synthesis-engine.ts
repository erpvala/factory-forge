// @ts-nocheck
// ENGINE 03 — Code Synthesis Engine: spec + arch → typed code file stubs
import type { ValaSpec, ValaArchitect, ValaCodeOutput, CodeFile } from '@/vala/types';

function toPascal(str: string): string {
  return str.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function genComponent(mod: string): CodeFile {
  const name = toPascal(mod);
  return {
    path:     `src/components/${mod}/${name}Panel.tsx`,
    language: 'tsx',
    stub: [
      `// @ts-nocheck`,
      `import { Card } from '@/components/ui/card';`,
      `export default function ${name}Panel() {`,
      `  return <Card className="p-6"><h2>${name}</h2></Card>;`,
      `}`,
    ].join('\n'),
  };
}

function genService(mod: string): CodeFile {
  const name = toPascal(mod);
  return {
    path:     `src/services/${mod}Service.ts`,
    language: 'ts',
    stub: [
      `// @ts-nocheck`,
      `import { supabase } from '@/integrations/supabase/client';`,
      `export async function list${name}(userId: string) {`,
      `  const { data, error } = await supabase.from('${mod}').select('*').eq('user_id', userId);`,
      `  if (error) throw error;`,
      `  return data;`,
      `}`,
    ].join('\n'),
  };
}

function genHook(mod: string): CodeFile {
  const name = toPascal(mod);
  return {
    path:     `src/hooks/use${name}.ts`,
    language: 'ts',
    stub: [
      `// @ts-nocheck`,
      `import { useState, useEffect } from 'react';`,
      `import { list${name} } from '@/services/${mod}Service';`,
      `export function use${name}(userId: string) {`,
      `  const [data, setData] = useState([]);`,
      `  const [loading, setLoading] = useState(true);`,
      `  useEffect(() => {`,
      `    list${name}(userId).then(setData).finally(() => setLoading(false));`,
      `  }, [userId]);`,
      `  return { data, loading };`,
      `}`,
    ].join('\n'),
  };
}

function genTest(mod: string): CodeFile {
  const name = toPascal(mod);
  return {
    path:     `src/test/${mod}.test.ts`,
    language: 'ts',
    stub: [
      `// @ts-nocheck`,
      `import { describe, it, expect, vi } from 'vitest';`,
      `import { list${name} } from '@/services/${mod}Service';`,
      `vi.mock('@/integrations/supabase/client');`,
      `describe('${name} Service', () => {`,
      `  it('returns array', async () => {`,
      `    expect(Array.isArray(await list${name}('user-1'))).toBe(true);`,
      `  });`,
      `});`,
    ].join('\n'),
  };
}

export function runCodeSynthesisEngine(
  spec: ValaSpec,
  _arch: ValaArchitect,
): ValaCodeOutput {
  const primaryModules = spec.modules.filter(
    (m) => !['auth', 'notifications', 'settings'].includes(m),
  );

  return {
    components: primaryModules.map(genComponent),
    services:   primaryModules.map(genService),
    hooks:      primaryModules.map(genHook),
    tests:      primaryModules.map(genTest),
  };
}
