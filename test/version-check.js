// 版本一致性: app.js 的 VERSION 必须等于 sw.js 的 VERSION, 否则 PWA 不会更新或出现混版本
const fs = require('fs');
const app = /VERSION = '([^']+)'/.exec(fs.readFileSync('js/app.js', 'utf8'))[1];
const sw = /const VERSION = '([^']+)'/.exec(fs.readFileSync('sw.js', 'utf8'))[1];
const html = fs.readFileSync('index.html', 'utf8'); const swSrc = fs.readFileSync('sw.js', 'utf8');
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map((m) => './' + m[1]).filter((s) => !swSrc.includes("'" + s + "'"));
if (app !== sw) { console.error('VERSION MISMATCH app.js', app, 'sw.js', sw); process.exit(1); }
if (scripts.length) { console.error('sw.js ASSETS 缺少:', scripts.join(' ')); process.exit(1); }
console.log('version check ok', app);
