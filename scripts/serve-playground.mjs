import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseOwnerOrigin, assessRequestBoundary, securityHeaders } from '@crowsi/browser-security/boundary'

const files = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']],
  ['/samples.json', ['samples.json', 'application/json']], ['/style.css', ['style.css', 'text/css']]])
const server = createServer((request, response) => {
  const owner = parseOwnerOrigin(`http://127.0.0.1:${server.address().port}`)
  const reason = assessRequestBoundary(owner, { host: request.headers.host, origin: request.headers.origin,
    method: request.method, fetchSite: request.headers['sec-fetch-site'] })
  if (reason || request.method !== 'GET') {
    response.writeHead(403).end(); return
  }
  const file = files.get(request.url)
  if (!file) { response.writeHead(404).end(); return }
  const headers = securityHeaders()
  response.writeHead(200, { ...headers, 'Content-Type': `${file[1]}; charset=utf-8`,
    'content-security-policy': headers['content-security-policy'].replace("connect-src 'self'", "connect-src 'none'") })
  response.end(readFileSync(resolve('dist/playground', file[0])))
})
const port = Number(process.env.PLAYGROUND_PORT ?? 4173)
if (!Number.isInteger(port) || (port !== 0 && port < 1024) || port > 65535) throw new Error('Invalid playground port')
server.listen(port, '127.0.0.1', () => console.log(`Playground: http://127.0.0.1:${server.address().port}`))
