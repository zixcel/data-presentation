import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
function record(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value)); return value as Record<string, unknown>
}
const root = mkdtempSync(join(tmpdir(), 'projection-consumer-'))
writeFileSync(join(root, 'user.npmrc'), '')
writeFileSync(join(root, 'global.npmrc'), '')
const env = { ...process.env, NPM_CONFIG_USERCONFIG: join(root, 'user.npmrc'),
  NPM_CONFIG_GLOBALCONFIG: join(root, 'global.npmrc'), NPM_CONFIG_CACHE: join(root, 'cache'),
  NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org', NODE_AUTH_TOKEN: '', NPM_TOKEN: '' }
const directories = [".", "packages/projection-contracts", "packages/projection-client", "packages/dom-renderer", "packages/view-server", "packages/view-contracts"]
function run(command: string, args: string[], cwd: string) {
  return execFileSync(command, args, { cwd, env, encoding: 'utf8', timeout: 90000, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
}
try {
  for (const directory of directories) {
    const result: unknown = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', root], resolve(directory)))
    const item=record((Array.isArray(result) ? result : Object.values(record(result)))[0])
    assert.equal(typeof item.filename, 'string'); const filename=item.filename as string
    assert.equal(filename, filename.split('/').at(-1))
  }
  const consumer = join(root, 'consumer')
  mkdirSync(consumer)
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  writeFileSync(join(consumer, '.npmrc'), 'registry=https://registry.npmjs.org/\n')
  const tools = record(record(JSON.parse(readFileSync(resolve('package.json'), 'utf8'))).devDependencies)
  for(const key of ['typescript','@types/node','esbuild','@playwright/test','@crowsi/browser-security'])assert.equal(typeof tools[key], 'string')
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund',
    ...readdirSync(root).filter(name => name.endsWith('.tgz')).map(name => join(root, name)),
    `typescript@${tools.typescript}`, `@types/node@${tools['@types/node']}`,
    `esbuild@${tools.esbuild}`, `@playwright/test@${tools['@playwright/test']}`,
    `@crowsi/browser-security@${tools['@crowsi/browser-security']}`], consumer)
  cpSync(resolve('test/public-types.mts'), join(consumer, 'types.mts'))
  run(process.execPath, [join(consumer, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict',
    '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', 'types.mts'], consumer)
  cpSync(resolve('examples/data-to-screen.mjs'), join(consumer, 'example.mjs'))
  cpSync(resolve('test/consumer.mjs'), join(consumer, 'consumer.mjs'))
  run(process.execPath, ['consumer.mjs'], consumer)
  cpSync(resolve('packages/view-contracts/test/consumer.mts'), join(consumer, 'delivery-types.mts'))
  run(process.execPath, [join(consumer, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict',
    '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', 'delivery-types.mts'], consumer)
  for (const [file, name] of [['packages/view-server/test/server.test.mjs', '@zixcel/view-delivery'],
    ['packages/view-contracts/test/delivery.test.mts', '@zixcel/view-delivery-contracts']]) {
    const target = join(consumer, file.split('/').at(-1)!)
    writeFileSync(target, readFileSync(resolve(file), 'utf8').replace("'../src/index.mjs'", JSON.stringify(name)))
    run(process.execPath, ['--test', target], consumer)
  }

  if (process.argv.includes('--browser')) {
    mkdirSync(join(consumer, 'examples'))
    cpSync(resolve('examples/data-to-screen.mjs'), join(consumer, 'examples/data-to-screen.mjs'))
    cpSync(resolve('playground'), join(consumer, 'playground'), { recursive: true })
    mkdirSync(join(consumer, 'scripts'))
    for (const script of ['build-playground.mjs', 'serve-playground.mjs']) {
      cpSync(resolve('scripts', script), join(consumer, 'scripts', script))
    }
    run(process.execPath, ['scripts/build-playground.mjs'], consumer)
    cpSync(resolve('test/playground-browser.mjs'), join(consumer, 'browser.mjs'))
    run(process.execPath, ['browser.mjs'], consumer)
    console.log('Browser playground also passed using only installed candidate archives and public dependencies')
  }
  console.log('Six archive packages: independent public types, worker/store, client adoption, stale-action rejection and renderer imports passed')
} finally {
  rmSync(root, { recursive: true, force: true })
}
