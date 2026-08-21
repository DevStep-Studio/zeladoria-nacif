const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/EducationModule.jsx',
  'src/components/education/SchoolsList.jsx',
  'src/components/education/EnrollmentForm.jsx',
  'src/components/education/MyEnrollments.jsx'
];

filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // EducationModule specific
  if (file.includes('EducationModule')) {
    content = content.replace('bg-indigo-50', 'bg-slate-50/50');
    content = content.replace('bg-indigo-600 text-white px-4 pt-4 pb-10', 'bg-white px-4 pt-6 pb-6 border-b border-slate-100 shadow-sm');
    content = content.replace(/data-\[state=active\]:bg-indigo-600/g, 'data-[state=active]:bg-primary');
  }

  // General indigo replacements
  content = content.replace(/bg-indigo-600 hover:bg-indigo-700/g, 'bg-primary hover:bg-primary/90');
  content = content.replace(/bg-indigo-600/g, 'bg-primary');
  content = content.replace(/text-indigo-800/g, 'text-primary');
  content = content.replace(/text-indigo-700/g, 'text-primary');
  content = content.replace(/text-indigo-600/g, 'text-primary');
  content = content.replace(/text-indigo-500/g, 'text-primary');
  content = content.replace(/bg-indigo-500/g, 'bg-primary');
  content = content.replace(/bg-indigo-100/g, 'bg-primary/10');
  content = content.replace(/bg-indigo-50/g, 'bg-primary/5');
  content = content.replace(/border-indigo-500/g, 'border-primary');
  content = content.replace(/hover:border-indigo-200/g, 'hover:border-primary/30');
  content = content.replace(/hover:border-indigo-300/g, 'hover:border-primary/40');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Updated', file);
});
