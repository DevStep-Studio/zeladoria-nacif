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

  content = content.replace(/"import\b/g, '"\nimport');
  content = content.replace(/"export\b/g, '"\nexport');
  content = content.replace(/"const\b/g, '"\nconst');
  content = content.replace(/"let\b/g, '"\nlet');
  content = content.replace(/"return\b/g, '"\nreturn');
  content = content.replace(/"if\b/g, '"\nif');
  content = content.replace(/"else\b/g, '"\nelse');
  content = content.replace(/}import\b/g, '}\nimport');
  content = content.replace(/}export\b/g, '}\nexport');

  const attributes = ['className', 'element', 'id', 'd', 'stroke', 'fill', 'viewBox', 'xmlns', 'style', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'height', 'width', 'type', 'name', 'value', 'placeholder', 'variant', 'size', 'onClick', 'onChange', 'href', 'to', 'src', 'alt', 'open', 'onOpenChange', 'onSubmit', 'htmlFor', 'ref', 'disabled', 'required', 'checked', 'onCheckedChange', 'onValueChange', 'defaultValue', 'min', 'max', 'step', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'strokeDasharray', 'gradientUnits', 'stopColor', 'stopOpacity'];

  attributes.forEach(attr => {
    const regex = new RegExp(`"(${attr}=)`, 'g');
    content = content.replace(regex, '" $1');
  });

  // also sometimes spaces between attributes got lost, e.g. `type="submit"className="..."` -> `type="submit" className="..."`
  content = content.replace(/"([a-zA-Z0-9-]+)=/g, '" $1=');
  // but wait, that might add multiple spaces if run multiple times, which is fine as HTML/JSX ignores extra spaces. Let's just do it for all attributes:
  // "something=" -> " something="
  // except for `<` like `"<path "` which doesn't happen.
  // Actually, replacing `"([a-zA-Z]+)=` with `" $1=` is very robust.
  
  // also what about missing space before `/>`?
  content = content.replace(/"\/>/g, '" />');

  // and `>import` -> `>\nimport` (in case JSX ends and import starts, though unlikely)
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
