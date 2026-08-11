'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relative) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    failures.push(`Eksik dosya: ${relative}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

const source = read('assets/llms.txt');
const rootCopy = read('llms.txt');
const htaccess = read('.htaccess');

if (!/^#\s+\S+/m.test(source)) {
  failures.push('assets/llms.txt: en az bir H1 Markdown başlığı bulunmalıdır.');
}

const links = [...source.matchAll(/\[[^\]]+\]\(https:\/\/www\.canpolatnakliyat\.com\/[^)]*\)/g)];
if (links.length < 10) {
  failures.push(`assets/llms.txt: yeterli Markdown bağlantısı yok; bulunan ${links.length}.`);
}

for (const required of [
  'https://www.canpolatnakliyat.com/',
  'https://www.canpolatnakliyat.com/hizmetler/evden-eve-nakliyat.html',
  'https://www.canpolatnakliyat.com/bolgeler/edremit-nakliyat.html',
]) {
  if (!source.includes(`](${required})`)) {
    failures.push(`assets/llms.txt: zorunlu kanonik bağlantı eksik: ${required}`);
  }
}

if (!htaccess.includes('RewriteRule ^llms\\.txt$ assets/llms.txt [L,NC]')) {
  failures.push('.htaccess: /llms.txt kök yolu assets/llms.txt kaynağına bağlanmalıdır.');
}

if (rootCopy !== source) {
  failures.push('llms.txt ve assets/llms.txt içerikleri aynı olmalıdır.');
}

if (failures.length) {
  console.error('llms.txt denetimi başarısız:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS: llms.txt H1 ve ${links.length} kanonik Markdown bağlantısıyla doğrulandı.`);
