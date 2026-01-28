import * as esbuild from 'esbuild';

// Build main entry point (CLI with shebang)
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
  external: [
    '@modelcontextprotocol/sdk',
    'zod',
  ],
  sourcemap: true,
});

// Build library entry points (for imports by mcp-server)
await esbuild.build({
  entryPoints: [
    'src/api-client.ts',
    'src/tools/index.ts',
    'src/traced-server.ts',
  ],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
  external: [
    '@modelcontextprotocol/sdk',
    'zod',
    '@skillomatic/shared',
  ],
  sourcemap: true,
});

console.log('Build complete: dist/');
