/**
 * Simple Dead File Analyzer - JavaScript version
 * Identifies unused files across the project
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DEAD FILE ANALYZER - PROJECT SCAN\n');

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// Analysis results
const allFiles = [];
const routeReferences = new Set();
const appReferences = new Set();

// Helper functions
function isExcluded(filePath) {
  return filePath.includes('node_modules') || 
         filePath.includes('.next') || 
         filePath.includes('.git') || 
         filePath.includes('dist') ||
         filePath.includes('build');
}

function getFileType(filePath) {
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

function extractImports(content) {
  const imports = [];
  
  // Match import statements
  const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function resolveImportPath(importPath, currentFile) {
  // Handle absolute imports (with @ alias)
  if (importPath.startsWith('@/')) {
    const resolvedPath = path.join(SRC_DIR, importPath.slice(2));
    return findFileFromPath(resolvedPath);
  }
  
  return null;
}

function findFileFromPath(resolvedPath) {
  const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
  
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  return null;
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory() && !isExcluded(fullPath)) {
      scanDirectory(fullPath);
    } else if (stats.isFile() && !isExcluded(fullPath)) {
      const ext = path.extname(fullPath);
      if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const fileStats = fs.statSync(fullPath);
        
        allFiles.push({
          filePath: fullPath,
          type: getFileType(fullPath),
          content: content,
          fileSize: fileStats.size,
          lastModified: fileStats.mtime.toISOString(),
          importedBy: [],
          isUsed: false,
          referencedInRoutes: false,
          referencedInApp: false
        });
      }
    }
  }
}

function extractRouteReferences() {
  // Extract from appRoutes.tsx
  const routesPath = path.join(SRC_DIR, 'routes', 'appRoutes.tsx');
  if (fs.existsSync(routesPath)) {
    const content = fs.readFileSync(routesPath, 'utf8');
    const imports = extractImports(content);
    
    imports.forEach(imp => {
      const resolved = resolveImportPath(imp, routesPath);
      if (resolved) routeReferences.add(resolved);
    });
  }
  
  // Extract from main App.tsx
  const appPath = path.join(SRC_DIR, 'App.tsx');
  if (fs.existsSync(appPath)) {
    const content = fs.readFileSync(appPath, 'utf8');
    const imports = extractImports(content);
    
    imports.forEach(imp => {
      const resolved = resolveImportPath(imp, appPath);
      if (resolved) appReferences.add(resolved);
    });
  }
}

function buildDependencyGraph() {
  const fileMap = new Map(allFiles.map(f => [f.filePath, f]));
  
  for (const file of allFiles) {
    const imports = extractImports(file.content);
    
    imports.forEach(imp => {
      const resolved = resolveImportPath(imp, file.filePath);
      if (resolved && fileMap.has(resolved)) {
        const targetFile = fileMap.get(resolved);
        targetFile.importedBy.push(file.filePath);
      }
    });
  }
}

function determineUsage() {
  // Mark files referenced in routes and app
  allFiles.forEach(file => {
    file.referencedInRoutes = routeReferences.has(file.filePath);
    file.referencedInApp = appReferences.has(file.filePath);
    
    if (file.referencedInRoutes || file.referencedInApp) {
      file.isUsed = true;
    }
  });
  
  // Mark entry points
  const entryPoints = [
    path.join(SRC_DIR, 'App.tsx'),
    path.join(SRC_DIR, 'main.tsx'),
    path.join(SRC_DIR, 'index.tsx')
  ];
  
  entryPoints.forEach(entryPoint => {
    const file = allFiles.find(f => f.filePath === entryPoint);
    if (file) file.isUsed = true;
  });
  
  // Mark files that are imported by used files
  const visited = new Set();
  const queue = allFiles.filter(f => f.isUsed);
  
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.filePath)) continue;
    
    visited.add(current.filePath);
    
    const imports = extractImports(current.content);
    imports.forEach(imp => {
      const resolved = resolveImportPath(imp, current.filePath);
      if (resolved) {
        const importedFile = allFiles.find(f => f.filePath === resolved);
        if (importedFile && !importedFile.isUsed) {
          importedFile.isUsed = true;
          queue.push(importedFile);
        }
      }
    });
  }
}

function generateReport() {
  console.log('📊 DEAD FILE ANALYSIS REPORT\n');
  console.log('='.repeat(80));
  
  const totalFiles = allFiles.length;
  const usedFiles = allFiles.filter(f => f.isUsed).length;
  const deadFiles = totalFiles - usedFiles;
  
  console.log(`📈 SUMMARY:`);
  console.log(`   Total Files: ${totalFiles}`);
  console.log(`   Used Files: ${usedFiles}`);
  console.log(`   Dead Files: ${deadFiles} (${Math.round((deadFiles / totalFiles) * 100)}%)`);
  console.log(`   Cleanup Potential: ${Math.round((deadFiles / totalFiles) * 100)}%\n`);
  
  // Group by type
  const byType = {};
  allFiles.forEach(file => {
    if (!byType[file.type]) {
      byType[file.type] = { total: 0, used: 0, dead: [], deadCount: 0 };
    }
    byType[file.type].total++;
    if (file.isUsed) {
      byType[file.type].used++;
    } else {
      byType[file.type].dead.push(file);
      byType[file.type].deadCount++;
    }
  });
  
  console.log('🏗️ FILE TYPE BREAKDOWN:');
  console.log('-'.repeat(80));
  
  Object.entries(byType).forEach(([type, stats]) => {
    if (stats.deadCount > 0) {
      console.log(`\n📁 ${type.toUpperCase()} (${stats.deadCount}/${stats.total} dead):`);
      stats.dead.slice(0, 5).forEach(file => {
        const relativePath = path.relative(PROJECT_ROOT, file.filePath);
        const sizeKB = Math.round(file.fileSize / 1024);
        console.log(`   ❌ ${relativePath} (${sizeKB}KB)`);
      });
      if (stats.dead.length > 5) {
        console.log(`   ... and ${stats.dead.length - 5} more`);
      }
    }
  });
  
  console.log('\n🎯 HIGH PRIORITY CLEANUP (Unused Pages):');
  console.log('-'.repeat(80));
  
  const deadPages = allFiles.filter(f => f.type === 'page' && !f.isUsed);
  if (deadPages.length > 0) {
    deadPages.forEach(file => {
      const relativePath = path.relative(PROJECT_ROOT, file.filePath);
      const sizeKB = Math.round(file.fileSize / 1024);
      console.log(`   🗑️  ${relativePath} (${sizeKB}KB)`);
    });
  } else {
    console.log('   ✅ No unused pages found');
  }
  
  console.log('\n⚠️  UNUSED COMPONENTS:');
  console.log('-'.repeat(80));
  
  const deadComponents = allFiles.filter(f => f.type === 'component' && !f.isUsed);
  if (deadComponents.length > 0) {
    deadComponents.slice(0, 10).forEach(file => {
      const relativePath = path.relative(PROJECT_ROOT, file.filePath);
      const sizeKB = Math.round(file.fileSize / 1024);
      console.log(`   🔍 ${relativePath} (${sizeKB}KB)`);
    });
    if (deadComponents.length > 10) {
      console.log(`   ... and ${deadComponents.length - 10} more components`);
    }
  } else {
    console.log('   ✅ All components are used');
  }
  
  console.log('\n💡 CLEANUP RECOMMENDATIONS:');
  console.log('-'.repeat(80));
  console.log('1. 🗑️  Remove unused pages first - They have the highest impact');
  console.log('2. 🔍 Review unused components - Some might be dynamically imported');
  console.log('3. 🧪 Test after each cleanup - Ensure no breaking changes');
  console.log('4. 📝 Update imports - Remove imports of deleted files');
  console.log('5. 🔄 Commit incrementally - Easy rollback if needed');
  
  const totalSizeKB = Math.round(allFiles.reduce((sum, f) => sum + f.fileSize, 0) / 1024);
  const deadSizeKB = Math.round(allFiles.filter(f => !f.isUsed).reduce((sum, f) => sum + f.fileSize, 0) / 1024);
  
  console.log('\n🎯 ESTIMATED IMPACT:');
  console.log('-'.repeat(80));
  console.log(`📉 Potential Size Reduction: ${deadSizeKB}KB out of ${totalSizeKB}KB`);
  console.log(`🧹 Files to Delete: ${deadFiles}`);
  console.log(`📊 Overall Project Cleanup: ${Math.round((deadFiles / totalFiles) * 100)}%`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles,
      usedFiles,
      deadFiles,
      cleanupPotential: Math.round((deadFiles / totalFiles) * 100),
      totalSizeKB,
      deadSizeKB
    },
    deadFiles: allFiles.filter(f => !f.isUsed).map(f => ({
      path: path.relative(PROJECT_ROOT, f.filePath),
      type: f.type,
      sizeKB: Math.round(f.fileSize / 1024),
      lastModified: f.lastModified
    }))
  };
  
  const reportPath = path.join(PROJECT_ROOT, 'DEAD_FILES_ANALYSIS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log('\n✨ Dead file analysis complete!\n');
}

// Main execution
function main() {
  console.log('📁 Scanning project files...\n');
  
  extractRouteReferences();
  scanDirectory(SRC_DIR);
  buildDependencyGraph();
  determineUsage();
  generateReport();
}

main();
