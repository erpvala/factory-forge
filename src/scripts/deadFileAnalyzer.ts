// @ts-nocheck
/**
 * Dead File Analyzer - Comprehensive Analysis of Unused Files
 * Identifies dead/unused files across the entire project after multiple code changes
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';

console.log('🔍 DEAD FILE ANALYZER - COMPREHENSIVE PROJECT SCAN\n');

// Configuration
const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const EXCLUDE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build', 'coverage'];
const EXCLUDE_FILES = ['.gitignore', '.env', 'README.md', 'package.json', 'tsconfig.json'];

// Analysis results
interface FileAnalysis {
  filePath: string;
  type: 'page' | 'component' | 'hook' | 'service' | 'util' | 'context' | 'store' | 'route' | 'other';
  importedBy: string[];
  referencedInRoutes: boolean;
  referencedInApp: boolean;
  isUsed: boolean;
  lastModified: string;
  fileSize: number;
  riskLevel: 'high' | 'medium' | 'low';
  recommendation: 'delete' | 'review' | 'keep';
}

interface ModuleAnalysis {
  moduleName: string;
  totalFiles: number;
  usedFiles: number;
  deadFiles: number;
  deadFilesList: FileAnalysis[];
  cleanupPotential: number;
}

const allFiles: FileAnalysis[] = [];
const routeReferences = new Set<string>();
const appReferences = new Set<string>();

// Helper functions
function isExcluded(filePath: string): boolean {
  return EXCLUDE_DIRS.some(dir => filePath.includes(dir)) || 
         EXCLUDE_FILES.some(file => filePath.endsWith(file));
}

function getFileType(filePath: string): FileAnalysis['type'] {
  if (filePath.includes('/pages/')) return 'page';
  if (filePath.includes('/components/')) return 'component';
  if (filePath.includes('/hooks/')) return 'hook';
  if (filePath.includes('/services/')) return 'service';
  if (filePath.includes('/utils/')) return 'util';
  if (filePath.includes('/contexts/')) return 'context';
  if (filePath.includes('/stores/')) return 'store';
  if (filePath.includes('/routes/')) return 'route';
  return 'other';
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  
  // Match import statements
  const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Match dynamic imports
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Match require statements
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function extractReferences(content: string): string[] {
  const references: string[] = [];
  
  // Match component usage in JSX
  const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = jsxRegex.exec(content)) !== null) {
    references.push(match[1]);
  }
  
  // Match function calls
  const functionRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
  while ((match = functionRegex.exec(content)) !== null) {
    references.push(match[1]);
  }
  
  return references;
}

function resolveImportPath(importPath: string, currentFile: string): string | null {
  // Handle relative imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const resolvedPath = path.resolve(path.dirname(currentFile), importPath);
    return findFileFromPath(resolvedPath);
  }
  
  // Handle absolute imports (with @ alias)
  if (importPath.startsWith('@/')) {
    const resolvedPath = path.join(SRC_DIR, importPath.slice(2));
    return findFileFromPath(resolvedPath);
  }
  
  // Handle package imports
  if (!importPath.startsWith('.')) {
    return null; // External package
  }
  
  return findFileFromPath(path.join(SRC_DIR, importPath));
}

function findFileFromPath(resolvedPath: string): string | null {
  const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
  
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  return null;
}

function analyzeFile(filePath: string): FileAnalysis {
  const content = readFileSync(filePath, 'utf8');
  const stats = statSync(filePath);
  const imports = extractImports(content);
  const references = extractReferences(content);
  
  const analysis: FileAnalysis = {
    filePath,
    type: getFileType(filePath),
    importedBy: [],
    referencedInRoutes: routeReferences.has(filePath),
    referencedInApp: appReferences.has(filePath),
    isUsed: false,
    lastModified: stats.mtime.toISOString(),
    fileSize: stats.size,
    riskLevel: 'low',
    recommendation: 'keep'
  };
  
  // Check if file is used by other files
  // This will be populated in the second pass
  return analysis;
}

function scanDirectory(dir: string): void {
  if (!existsSync(dir)) return;
  
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = statSync(fullPath);
    
    if (stats.isDirectory() && !isExcluded(fullPath)) {
      scanDirectory(fullPath);
    } else if (stats.isFile() && !isExcluded(fullPath)) {
      const ext = path.extname(fullPath);
      if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
        allFiles.push(analyzeFile(fullPath));
      }
    }
  }
}

function extractRouteReferences(): void {
  // Extract from appRoutes.tsx
  const routesPath = path.join(SRC_DIR, 'routes', 'appRoutes.tsx');
  if (existsSync(routesPath)) {
    const content = readFileSync(routesPath, 'utf8');
    const imports = extractImports(content);
    
    imports.forEach(imp => {
      const resolved = resolveImportPath(imp, routesPath);
      if (resolved) routeReferences.add(resolved);
    });
  }
  
  // Extract from main App.tsx
  const appPath = path.join(SRC_DIR, 'App.tsx');
  if (existsSync(appPath)) {
    const content = readFileSync(appPath, 'utf8');
    const imports = extractImports(content);
    
    imports.forEach(imp => {
      const resolved = resolveImportPath(imp, appPath);
      if (resolved) appReferences.add(resolved);
    });
  }
}

function buildDependencyGraph(): void {
  // Build dependency graph to determine which files are actually used
  const fileMap = new Map(allFiles.map(f => [f.filePath, f]));
  
  for (const file of allFiles) {
    const content = readFileSync(file.filePath, 'utf8');
    const imports = extractImports(content);
    
    imports.forEach(imp => {
      const resolved = resolveImportPath(imp, file.filePath);
      if (resolved && fileMap.has(resolved)) {
        const targetFile = fileMap.get(resolved)!;
        targetFile.importedBy.push(file.filePath);
      }
    });
  }
}

function determineUsage(): void {
  // Determine which files are actually used
  const entryPoints = [
    path.join(SRC_DIR, 'App.tsx'),
    path.join(SRC_DIR, 'main.tsx'),
    path.join(SRC_DIR, 'index.tsx')
  ];
  
  const visited = new Set<string>();
  const queue = [...entryPoints.filter(existsSync)];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    
    visited.add(current);
    const file = allFiles.find(f => f.filePath === current);
    if (!file) continue;
    
    file.isUsed = true;
    
    // Add all imports to queue
    const content = readFileSync(current, 'utf8');
    const imports = extractImports(content);
    
    imports.forEach(imp => {
      const resolved = resolveImportPath(imp, current);
      if (resolved && !visited.has(resolved)) {
        queue.push(resolved);
      }
    });
  }
  
  // Mark all visited files as used
  visited.forEach(filePath => {
    const file = allFiles.find(f => f.filePath === filePath);
    if (file) file.isUsed = true;
  });
}

function assessRiskAndRecommendation(file: FileAnalysis): void {
  if (file.isUsed || file.referencedInRoutes || file.referencedInApp) {
    file.recommendation = 'keep';
    file.riskLevel = 'low';
    return;
  }
  
  if (file.importedBy.length > 0) {
    file.recommendation = 'review';
    file.riskLevel = 'medium';
    return;
  }
  
  // Assess based on file type and location
  if (file.type === 'page' && file.filePath.includes('/pages/')) {
    file.riskLevel = 'high';
    file.recommendation = 'delete';
  } else if (file.type === 'component' && file.fileSize > 5000) {
    file.riskLevel = 'medium';
    file.recommendation = 'review';
  } else if (file.fileSize < 1000) {
    file.riskLevel = 'low';
    file.recommendation = 'delete';
  } else {
    file.riskLevel = 'medium';
    file.recommendation = 'review';
  }
}

function generateModuleAnalysis(): ModuleAnalysis[] {
  const modules = new Map<string, FileAnalysis[]>();
  
  // Group files by module
  allFiles.forEach(file => {
    const parts = file.filePath.split(path.sep);
    const srcIndex = parts.indexOf('src');
    if (srcIndex !== -1 && srcIndex + 1 < parts.length) {
      const moduleName = parts[srcIndex + 1];
      if (!modules.has(moduleName)) {
        modules.set(moduleName, []);
      }
      modules.get(moduleName)!.push(file);
    }
  });
  
  // Generate analysis for each module
  const analysis: ModuleAnalysis[] = [];
  
  modules.forEach((files, moduleName) => {
    const usedFiles = files.filter(f => f.isUsed || f.referencedInRoutes || f.referencedInApp);
    const deadFiles = files.filter(f => !f.isUsed && !f.referencedInRoutes && !f.referencedInApp);
    
    analysis.push({
      moduleName,
      totalFiles: files.length,
      usedFiles: usedFiles.length,
      deadFiles: deadFiles.length,
      deadFilesList: deadFiles,
      cleanupPotential: Math.round((deadFiles.length / files.length) * 100)
    });
  });
  
  return analysis.sort((a, b) => b.deadFiles - a.deadFiles);
}

function main() {
  console.log('📁 Scanning project files...\n');
  
  // Extract route and app references
  extractRouteReferences();
  
  // Scan all files
  scanDirectory(SRC_DIR);
  
  // Build dependency graph
  buildDependencyGraph();
  
  // Determine usage
  determineUsage();
  
  // Assess risk and recommendations
  allFiles.forEach(file => assessRiskAndRecommendation(file));
  
  // Generate module analysis
  const moduleAnalysis = generateModuleAnalysis();
  
  // Generate report
  console.log('📊 DEAD FILE ANALYSIS REPORT\n');
  console.log('='.repeat(80));
  
  const totalFiles = allFiles.length;
  const usedFiles = allFiles.filter(f => f.isUsed || f.referencedInRoutes || f.referencedInApp).length;
  const deadFiles = totalFiles - usedFiles;
  const highRiskFiles = allFiles.filter(f => f.riskLevel === 'high' && f.recommendation === 'delete').length;
  const mediumRiskFiles = allFiles.filter(f => f.riskLevel === 'medium' && f.recommendation === 'review').length;
  
  console.log(`📈 SUMMARY:`);
  console.log(`   Total Files: ${totalFiles}`);
  console.log(`   Used Files: ${usedFiles}`);
  console.log(`   Dead Files: ${deadFiles} (${Math.round((deadFiles / totalFiles) * 100)}%)`);
  console.log(`   High Risk (Safe to Delete): ${highRiskFiles}`);
  console.log(`   Medium Risk (Review Needed): ${mediumRiskFiles}`);
  console.log(`   Potential Cleanup: ${Math.round((deadFiles / totalFiles) * 100)}%\n`);
  
  console.log('🏗️ MODULE BREAKDOWN:');
  console.log('-'.repeat(80));
  
  moduleAnalysis.slice(0, 10).forEach(module => {
    if (module.deadFiles > 0) {
      console.log(`\n📦 ${module.moduleName.toUpperCase()}:`);
      console.log(`   Total Files: ${module.totalFiles}`);
      console.log(`   Used Files: ${module.usedFiles}`);
      console.log(`   Dead Files: ${module.deadFiles}`);
      console.log(`   Cleanup Potential: ${module.cleanupPotential}%`);
      
      if (module.deadFilesList.length > 0 && module.deadFilesList.length <= 5) {
        console.log(`   Dead Files:`);
        module.deadFilesList.forEach(file => {
          const relativePath = path.relative(PROJECT_ROOT, file.filePath);
          console.log(`     ❌ ${relativePath} (${file.fileSize} bytes, ${file.riskLevel} risk)`);
        });
      } else if (module.deadFilesList.length > 5) {
        console.log(`   Dead Files: ${module.deadFilesList.length} files (showing top 5):`);
        module.deadFilesList.slice(0, 5).forEach(file => {
          const relativePath = path.relative(PROJECT_ROOT, file.filePath);
          console.log(`     ❌ ${relativePath} (${file.fileSize} bytes, ${file.riskLevel} risk)`);
        });
        console.log(`     ... and ${module.deadFilesList.length - 5} more`);
      }
    }
  });
  
  console.log('\n🎯 HIGH PRIORITY CLEANUP (Safe to Delete):');
  console.log('-'.repeat(80));
  
  const highRiskDeadFiles = allFiles.filter(f => f.riskLevel === 'high' && f.recommendation === 'delete');
  if (highRiskDeadFiles.length > 0) {
    highRiskDeadFiles.slice(0, 20).forEach(file => {
      const relativePath = path.relative(PROJECT_ROOT, file.filePath);
      console.log(`   🗑️  ${relativePath} (${file.fileSize} bytes)`);
    });
    if (highRiskDeadFiles.length > 20) {
      console.log(`   ... and ${highRiskDeadFiles.length - 20} more files`);
    }
  } else {
    console.log('   ✅ No high-risk dead files found');
  }
  
  console.log('\n⚠️  MEDIUM PRIORITY CLEANUP (Review Required):');
  console.log('-'.repeat(80));
  
  const mediumRiskFiles = allFiles.filter(f => f.riskLevel === 'medium' && f.recommendation === 'review');
  if (mediumRiskFiles.length > 0) {
    mediumRiskFiles.slice(0, 15).forEach(file => {
      const relativePath = path.relative(PROJECT_ROOT, file.filePath);
      console.log(`   🔍 ${relativePath} (${file.fileSize} bytes, imported by ${file.importedBy.length} files)`);
    });
    if (mediumRiskFiles.length > 15) {
      console.log(`   ... and ${mediumRiskFiles.length - 15} more files`);
    }
  } else {
    console.log('   ✅ No medium-risk files found');
  }
  
  console.log('\n💡 CLEANUP RECOMMENDATIONS:');
  console.log('-'.repeat(80));
  console.log('1. 🗑️  Delete HIGH RISK files - These are unused and safe to remove');
  console.log('2. 🔍 Review MEDIUM RISK files - Check if they\'re really needed');
  console.log('3. 📦 Group cleanup by module - Clean one module at a time');
  console.log('4. 🧪 Test after each module cleanup - Ensure no breaking changes');
  console.log('5. 📝 Update imports - Remove imports of deleted files');
  console.log('6. 🔄 Commit changes incrementally - Easy rollback if needed');
  
  console.log('\n🎯 ESTIMATED IMPACT:');
  console.log('-'.repeat(80));
  console.log(`📉 Potential Size Reduction: ${Math.round(allFiles.reduce((sum, f) => sum + (f.recommendation === 'delete' ? f.fileSize : 0), 0) / 1024)} KB`);
  console.log(`🧹 Files to Delete: ${highRiskDeadFiles.length}`);
  console.log(`📋 Files to Review: ${mediumRiskFiles.length}`);
  console.log(`📊 Overall Project Cleanup: ${Math.round((deadFiles / totalFiles) * 100)}%`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles,
      usedFiles,
      deadFiles,
      highRiskFiles,
      mediumRiskFiles,
      cleanupPotential: Math.round((deadFiles / totalFiles) * 100)
    },
    moduleAnalysis,
    highRiskFiles: highRiskDeadFiles.map(f => ({
      path: path.relative(PROJECT_ROOT, f.filePath),
      size: f.fileSize,
      type: f.type,
      lastModified: f.lastModified
    })),
    mediumRiskFiles: mediumRiskFiles.map(f => ({
      path: path.relative(PROJECT_ROOT, f.filePath),
      size: f.fileSize,
      type: f.type,
      importedBy: f.importedBy.length,
      lastModified: f.lastModified
    }))
  };
  
  const reportPath = path.join(PROJECT_ROOT, 'DEAD_FILES_ANALYSIS_REPORT.json');
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log('\n✨ Dead file analysis complete!\n');
}

// Run the analysis
if (require.main === module) {
  main();
}

export { main as analyzeDeadFiles };
