import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'esnext',
  dts: true,
  sourcemap: true,
  clean: true,
  // CSS imports under @haklex/* are kept as-is, admin's vite resolves them.
  unbundle: false,
  outputOptions: {
    chunkFileNames: '[name]-[hash].mjs',
  },
})
