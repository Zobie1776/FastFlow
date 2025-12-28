const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(entry => {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    });
    return;
  }
  fs.copyFileSync(src, dest);
}

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const filesToCopy = [
  'index.html',
  'src',
  'public'
];

filesToCopy.forEach(item => {
  const srcPath = path.join(rootDir, item);
  if (!fs.existsSync(srcPath)) {
    return;
  }
  const destPath = path.join(distDir, item);
  copyRecursive(srcPath, destPath);
});

console.log('Web build prepared at dist/.');
