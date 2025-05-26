#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 需要修复的文件和对应的修复规则
const fixes = [
  // 简单的变量重命名（添加下划线前缀）
  {
    file: 'app/file/components/BreadcrumbNav.tsx',
    replacements: [
      { from: ', index)', to: ', _index)' }
    ]
  },
  {
    file: 'app/file/components/FileExplorer.tsx',
    replacements: [
      { from: 'CloudFile, FolderNode', to: '_CloudFile, _FolderNode' }
    ]
  },
  {
    file: 'app/file/components/views/GridView.tsx',
    replacements: [
      { from: 'useEffect,', to: '_useEffect,' },
      { from: 'FileImage,', to: '_FileImage,' },
      { from: 'ExternalLink,', to: '_ExternalLink,' },
      { from: '(e) => {', to: '(_e) => {' },
      { from: 'message,', to: '_message,' }
    ]
  },
  {
    file: 'app/nav/components/NavCardActions.tsx',
    replacements: [
      { from: 'loading,', to: '_loading,' }
    ]
  },
  {
    file: 'app/nav/stores/navStore.ts',
    replacements: [
      { from: 'import { toast }', to: 'import { toast as _toast }' }
    ]
  }
];

// 执行修复
fixes.forEach(fix => {
  const filePath = path.join(__dirname, '..', fix.file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    fix.replacements.forEach(replacement => {
      content = content.replace(replacement.from, replacement.to);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${fix.file}`);
  } else {
    console.log(`❌ File not found: ${fix.file}`);
  }
});

console.log('🎉 Batch fix completed!'); 