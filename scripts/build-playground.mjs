import { build } from 'esbuild'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { sampleSnapshots } from '../examples/data-to-screen.mjs'

const output = resolve('dist/playground')
mkdirSync(output, { recursive: true })
const samples = await sampleSnapshots()
writeFileSync(resolve(output, 'samples.json'), JSON.stringify(samples, null, 2))
copyFileSync(resolve('playground/data-to-screen/index.html'), resolve(output, 'index.html'))
copyFileSync(resolve('playground/data-to-screen/style.css'), resolve(output, 'style.css'))
await build({ entryPoints: ['playground/data-to-screen/app.mjs'], bundle: true,
  platform: 'browser', format: 'esm', outfile: resolve(output, 'app.js'),
  plugins: [{ name: 'synthetic-snapshots', setup(builder) {
    builder.onResolve({ filter: /samples\.json$/ }, () => ({ path: 'samples', namespace: 'synthetic' }))
    builder.onLoad({ filter: /.*/, namespace: 'synthetic' }, () => ({ contents: JSON.stringify(samples), loader: 'json' }))
  } }],
})
console.log('Built public-API playground with synthetic source and bounded Node producer')
