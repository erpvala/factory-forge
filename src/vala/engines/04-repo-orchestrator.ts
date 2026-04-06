// @ts-nocheck
// ENGINE 04 — Repo Orchestrator: auto repo, branching, semantic commits, version tags
import type { ValaJobRequest, ValaRepoState } from '@/vala/types';

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

function bumpVersion(base: string, label: string): string {
  const [major, minor, patch] = base.split('.').map(Number);
  if (label === 'major') return `${major + 1}.0.0`;
  if (label === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function buildSemanticCommit(idea: string, modules: string[]): string {
  const scope = modules[0] ?? 'core';
  const summary = idea.length > 60 ? idea.slice(0, 57) + '...' : idea;
  return `feat(${scope}): ${summary}`;
}

export function runRepoOrchestrator(request: ValaJobRequest): ValaRepoState {
  const repoName = sanitizeName(request.projectName ?? request.idea);
  const version  = '1.0.0';

  return {
    repoName,
    branch: 'feature/vala-init',
    version,
    commitMessage: buildSemanticCommit(request.idea, request.modules ?? []),
    tags: [`v${version}`, `vala-build-${request.jobId.slice(-8)}`],
    rollbackAvailable: true,
  };
}

export function createHotfixBranch(jobId: string, errorId: string): string {
  return `hotfix/vala-heal-${jobId.slice(-6)}-${errorId.slice(-6)}`;
}

export function bumpPatchVersion(current: string): string {
  return bumpVersion(current, 'patch');
}
