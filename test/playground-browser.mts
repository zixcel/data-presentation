import type {OutgoingHttpHeaders} from 'node:http'
import type {Browser} from '@playwright/test'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { request } from 'node:http'
function status(url:string, headers:OutgoingHttpHeaders = {}):Promise<number|undefined> {
  return new Promise<number|undefined>((resolve, reject) => {
    const req = request(url, { headers }, response => { response.resume(); resolve(response.statusCode) })
    req.on('error', reject)
    req.end()
  })
}
const server = spawn(process.execPath, ['scripts/serve-playground.mts'], {
  stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PLAYGROUND_PORT: '0' } })
let browser:Browser|undefined
try {
  const [ready] = await once(server.stdout, 'data')
  const url = ready.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]
  assert.ok(url)
  assert.equal(await status(url, { Host: 'foreign.example:4173' }), 403)
  assert.equal(await status(url, { Origin: 'https://foreign.example' }), 403)
  assert.equal(await status(url, { 'Sec-Fetch-Site': 'cross-site' }), 403)
  assert.equal((await fetch(url + '/../../package.json')).status, 404)
  browser = await chromium.launch({ headless: true })
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors:string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(url)
    await page.locator('#rendered').getByText('Synthetic counter', { exact: false }).waitFor()
    await page.locator('#advance').click()
    assert.match(await page.locator('#status').textContent()??'', /counter is 2/)
    await page.locator('#stale').click()
    assert.match(await page.locator('#status').textContent()??'', /StaleSceneAction/)
    await page.locator('#mismatch').click()
    assert.match(await page.locator('#status').textContent()??'', /HydrationProjectionMismatch/)
    await page.locator('#corrupt').click()
    assert.match(await page.locator('#status').textContent()??'', /Rejected:/)
    assert.match(await page.locator('#rendered').textContent()??'', /2/)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log('Desktop and narrow playground: update, stale action, mismatched delivery and corruption refusal passed')
} finally {
  await browser?.close()
  const closed = once(server, 'close')
  server.kill('SIGTERM')
  await closed
}
