import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Externalize npm packages that users need to install
  external: [
    '@modelcontextprotocol/sdk',
    'zod',
  ],
  sourcemap: true,
});

console.log('Build complete: dist/index.js');
