import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
export default defineConfig({
  base: './',
  plugins: [{
    name: 'ardy-offline-assets',
    generateBundle(options, bundle) {
      this.emitFile({type:'asset',fileName:'offline-assets.json',source:JSON.stringify(Object.keys(bundle).map(name=>'./'+name))});
    },
    closeBundle() {
      const assets=JSON.parse(readFileSync('dist/offline-assets.json','utf8'));
      const id=assets.find(name=>name.endsWith('.js'))?.replace(/\W/g,'')||Date.now();
      const sw=readFileSync('dist/sw.js','utf8').replace('ardy-shell-v1',`ardy-shell-${id}`);
      writeFileSync('dist/sw.js',sw);
    }
  }],
  build: { target: 'es2022', chunkSizeWarningLimit: 650 },
});
