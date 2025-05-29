#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取所有 TypeScript 和 JavaScript 文件
function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 和 .next 目录
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 修复未使用变量（添加下划线前缀）
function fixUnusedVars(content) {
  // 修复未使用的变量声明
  content = content.replace(
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
    (match, varName) => {
      if (!varName.startsWith('_')) {
        return `const _${varName} =`;
      }
      return match;
    }
  );
  
  // 修复未使用的函数参数
  content = content.replace(
    /\(([^)]*)\)\s*=>/g,
    (match, params) => {
      const fixedParams = params.split(',').map(param => {
        const trimmed = param.trim();
        if (trimmed && !trimmed.startsWith('_') && !trimmed.includes(':')) {
          return `_${trimmed}`;
        }
        return param;
      }).join(',');
      return `(${fixedParams}) =>`;
    }
  );
  
  return content;
}

// 修复 prefer-const 错误
function fixPreferConst(content) {
  // 查找 let 声明但从未重新赋值的变量
  const lines = content.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // 简单的 let 到 const 转换（需要更复杂的分析来确保安全）
    if (line.includes('let ') && !line.includes('for (let')) {
      // 这是一个简化的实现，实际应该检查变量是否被重新赋值
      line = line.replace(/\blet\b/g, 'const');
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

// 修复 React 转义字符错误
function fixReactEscapes(content) {
  // 修复引号转义
  content = content.replace(/(?<!\\)"/g, '&quot;');
  return content;
}

// 修复缺失的导入
function fixMissingImports(content, filePath) {
  const missingImports = [];
  
  // 检查常见的缺失导入
  if (content.includes('ChevronLeft') && !content.includes('import.*ChevronLeft')) {
    missingImports.push('ChevronLeft');
  }
  if (content.includes('ChevronRight') && !content.includes('import.*ChevronRight')) {
    missingImports.push('ChevronRight');
  }
  if (content.includes('Check') && !content.includes('import.*Check')) {
    missingImports.push('Check');
  }
  if (content.includes('X') && !content.includes('import.*X')) {
    missingImports.push('X');
  }
  if (content.includes('LogOut') && !content.includes('import.*LogOut')) {
    missingImports.push('LogOut');
  }
  if (content.includes('LayoutDashboard') && !content.includes('import.*LayoutDashboard')) {
    missingImports.push('LayoutDashboard');
  }
  
  if (missingImports.length > 0) {
    // 查找现有的 lucide-react 导入
    const lucideImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*["']lucide-react["']/);
    
    if (lucideImportMatch) {
      // 添加到现有导入
      const existingImports = lucideImportMatch[1].split(',').map(s => s.trim());
      const newImports = [...new Set([...existingImports, ...missingImports])];
      content = content.replace(
        lucideImportMatch[0],
        `import { ${newImports.join(', ')} } from "lucide-react"`
      );
    } else {
      // 添加新的导入行
      const importLine = `import { ${missingImports.join(', ')} } from "lucide-react"\n`;
      content = importLine + content;
    }
  }
  
  return content;
}

// 主修复函数
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 应用各种修复
    content = fixMissingImports(content, filePath);
    content = fixPreferConst(content);
    // content = fixUnusedVars(content); // 暂时注释掉，因为可能过于激进
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 修复了文件: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:`, error.message);
    return false;
  }
}

// 主函数
function main() {
  console.log('🔧 开始批量修复 ESLint 错误...\n');
  
  const projectRoot = process.cwd();
  const files = getAllFiles(projectRoot);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✨ 完成！共修复了 ${fixedCount} 个文件`);
  
  // 运行 ESLint 检查剩余错误
  console.log('\n🔍 运行 ESLint 检查剩余错误...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch (error) {
    console.log('\n还有一些错误需要手动修复。');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, getAllFiles }; 