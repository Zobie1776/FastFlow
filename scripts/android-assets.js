const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'www');

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

if (!fs.existsSync(distDir)) {
  console.error('Missing dist/ directory. Run web:build first.');
  process.exit(1);
}

fs.rmSync(assetsDir, { recursive: true, force: true });
fs.mkdirSync(assetsDir, { recursive: true });

fs.readdirSync(distDir).forEach(entry => {
  copyRecursive(path.join(distDir, entry), path.join(assetsDir, entry));
});

const indexPath = path.join(assetsDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('index.html not found in android assets output.');
  process.exit(1);
}

console.log('Android assets updated at android/app/src/main/assets/www/.');
