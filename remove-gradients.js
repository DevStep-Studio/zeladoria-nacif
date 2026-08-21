import fs from 'fs';
import path from 'path';

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.tsx') || dirFile.endsWith('.js') || dirFile.endsWith('.css')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Remove bg-gradient-to-* and hover:bg-gradient-to-*
  content = content.replace(/\b(?:hover:)?bg-gradient-to-[a-z]{1,2}\b/g, '');

  // 2. Replace from-* with bg-* (since we are removing gradients, the from color becomes the solid background)
  // We should be careful. If it has hover:from, it becomes hover:bg.
  content = content.replace(/\bhover:from-([a-z0-9-]+)\b/g, 'hover:bg-$1');
  content = content.replace(/\bfrom-([a-z0-9-]+)\b/g, 'bg-$1');

  // 3. Remove to-* and via-* and their hover variants
  content = content.replace(/\b(?:hover:)?to-[a-z0-9-]+\b/g, '');
  content = content.replace(/\b(?:hover:)?via-[a-z0-9-]+\b/g, '');

  // Clean up any double spaces left behind in class strings
  content = content.replace(/ +(?=(?:[^"']*["'][^"']*["'])*[^"']*$)/g, ' ')
                 .replace(/"\s+/g, '"')
                 .replace(/\s+"/g, '"')
                 .replace(/`\s+/g, '`')
                 .replace(/\s+`/g, '`')
                 .replace(/ \}/g, '}')
                 .replace(/\{ /g, '{');
                 
  // Clean up classes like 'bg-red-500  ' inside template literals or regular strings
  content = content.replace(/className=(["`])\s+/g, 'className=$1');
  content = content.replace(/\s+(["`])/g, '$1'); // this might be risky, let's just do multiple spaces to single space
  content = content.replace(/  +/g, ' ');

  // For SVGs (linearGradient) -> solid colors
  // Replace <linearGradient> usages
  content = content.replace(/stroke="url\(#[^)]+\)"/g, 'stroke="currentColor"');
  content = content.replace(/fill="url\(#[^)]+\)"/g, 'fill="currentColor"');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
