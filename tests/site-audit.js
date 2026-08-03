const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!name.startsWith('.') && name !== 'node_modules') walk(full);
    } else if (name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const failures = [];
for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const token of ['<html lang="tr">', '<meta name="viewport"', '<title>', '<meta name="description"', 'id="main"']) {
    if (!source.includes(token)) failures.push(`${path.relative(root,file)} eksik: ${token}`);
  }
  const localLinks = [...source.matchAll(/(?:href|src)="(\/[^"#?]+)(?:[?#][^"]*)?"/g)].map(m => m[1]);
  for (const link of localLinks) {
    if (link.startsWith('//')) continue;
    let target = path.join(root, link.replace(/^\//, ''));
    if (link === '/') target = path.join(root, 'index.html');
    if (!path.extname(target)) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) failures.push(`${path.relative(root,file)} kırık bağlantı: ${link}`);
  }
}
const forbidden = ['Okur Nakliyat', 'okurnakliyatedremit.com', '0537 226 50 43'];
for (const file of htmlFiles.concat([path.join(root,'assets/css/style.css'), path.join(root,'assets/js/main.js')])) {
  const source = fs.readFileSync(file,'utf8');
  for (const item of forbidden) if (source.includes(item)) failures.push(`${path.relative(root,file)} eski marka kalıntısı: ${item}`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${htmlFiles.length} HTML dosyası, yerel bağlantılar ve eski marka kalıntıları kontrol edildi.`);
