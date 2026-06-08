const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const files = [
  'mock.jsx',
  'api.jsx',
  'ui.jsx',
  'pickers.jsx',
  'stats-components.jsx',
  'stats-legacy.jsx',
  'stats.jsx',
  'TalentCalc.jsx',
  'guides.jsx',
  'players.jsx',
  'feedback.jsx',
  'donate.jsx',
  'app.jsx'
];

const tmpFile = path.join(__dirname, '_bundle_entry.jsx');
let code = 'const { useState, useEffect, useMemo } = React;\n';

for (const f of files) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) {
    console.error('Missing file:', p);
    process.exit(1);
  }
  let content = fs.readFileSync(p, 'utf-8');
  // Remove duplicate React hook destructuring declarations (we already declared them above)
  content = content.replace(/^const \{ useState, useEffect(?:, useMemo)? \} = React;\s*\n?/gm, '');
  // Concatenate all files into one global scope so functions are visible to each other
  code += content + '\n';
}

fs.writeFileSync(tmpFile, code, 'utf-8');

esbuild.build({
  entryPoints: [tmpFile],
  bundle: false,
  outfile: path.join(__dirname, 'bundle.js'),
  format: 'iife',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  minify: true,
  target: 'es2015',
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).then(() => {
  fs.unlinkSync(tmpFile);
  const size = fs.statSync(path.join(__dirname, 'bundle.js')).size;
  console.log(`bundle.js = ${(size / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
