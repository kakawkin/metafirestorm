// build.js - сборка JSX -> JS без Babel в браузере
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Порядок файлов как в index.html
const files = [
  'mock.jsx',
  'api.jsx',
  'ui.jsx',
  'pickers.jsx',
  'stats.jsx',
  'TalentCalc.jsx',
  'guides.jsx',
  'players.jsx',
  'feedback.jsx',
  'donate.jsx',
  'app.jsx',
];

// Конкатенируем все JSX файлы в один
const combined = files
  .map(f => '\n// === ' + f + ' ===\n' + fs.readFileSync(path.join(__dirname, f), 'utf8'))
  .join('\n');

// Пишем временный файл
fs.writeFileSync('_bundle_entry.jsx', combined);

// Собираем через esbuild
esbuild.build({
  entryPoints: ['_bundle_entry.jsx'],
  outfile: 'bundle.js',
  bundle: false,
  minify: true,
  loader: { '.jsx': 'jsx' },
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: 'es2017',
  logLevel: 'info',
}).then(() => {
  fs.unlinkSync('_bundle_entry.jsx');
  const size = (fs.statSync('bundle.js').size / 1024).toFixed(1);
  console.log('\nГотово! bundle.js = ' + size + ' KB');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
