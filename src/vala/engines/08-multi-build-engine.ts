// @ts-nocheck
// ENGINE 08 — Multi-Build Engine: web bundle | APK gradle | software package
import type { BuildTarget, ValaBuildOutput } from '@/vala/types';

export function runMultiBuildEngine(
  target: BuildTarget,
  projectName: string,
  version: string,
): ValaBuildOutput {
  if (target === 'apk') {
    return {
      target:      'apk',
      artifact:    `${projectName}-${version}-release.apk`,
      sizeMb:      22.4,
      durationMs:  94_000,
      signed:      true,
      downloadUrl: `/builds/${projectName}/apk/${version}/release.apk`,
    };
  }

  if (target === 'software') {
    return {
      target:      'software',
      artifact:    `${projectName}-${version}-setup.exe`,
      sizeMb:      55.8,
      durationMs:  68_000,
      signed:      true,
      downloadUrl: `/builds/${projectName}/software/${version}/setup.exe`,
    };
  }

  // web
  return {
    target:      'web',
    artifact:    `dist/`,
    sizeMb:      3.8,
    durationMs:  18_500,
    signed:      false,
    downloadUrl: null,
  };
}

export function buildSteps(target: BuildTarget): string[] {
  if (target === 'apk') {
    return ['clean project', 'resolve dependencies', 'compile Kotlin', 'package APK', 'sign with keystore', 'export release'];
  }
  if (target === 'software') {
    return ['install deps', 'compile TS', 'bundle with pkg', 'generate installer', 'sign binary', 'create release'];
  }
  return ['install deps', 'type-check', 'tree-shake', 'bundle with Vite', 'optimize chunks', 'output dist/'];
}
