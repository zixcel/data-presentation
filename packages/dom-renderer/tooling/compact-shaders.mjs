// Compact only the reviewed Three.js shader chunk source used by this renderer.
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const reviewedSha256 = '9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea'
const tokens = /[A-Za-z_]\w*|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|(?:\+\+|--|\+=|-=|\*=|\/=|==|!=|<=|>=|&&|\|\||<<|>>|\^=|&=|\|=)|[^\s]/g
const sequence = input => JSON.stringify(input.match(tokens))

function compactChunk(input) {
  if (input.includes('"') || input.includes('/*') || input.split('\n').some(line => line.trim().endsWith('\\'))) {
    throw new Error('Unreviewed shader syntax')
  }
  const directives = input.split('\n').filter(line => line.trimStart().startsWith('#')).map(line => sequence(line))
  const lines = input.split('\n').map(line => {
    const initial = line.trim()
    if (/^#(?:include|pragma|define)/.test(initial) || initial.includes('//')) return initial
    const spaced = initial.replace(/[ \t]*([(){},;\[\]])[ \t]*/g, '$1').replace(/[ \t]{2,}/g, ' ')
    const compact = spaced.replace(/[ \t]*([=+\-*/<>?:!&|])[ \t]*/g, '$1')
    return sequence(initial) === sequence(compact) ? compact : initial
  })
  let result = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], previous = lines[i - 1]
    const join = i > 0 && !line.startsWith('#') && !previous.startsWith('#') && !line.includes('//') && !previous.includes('//')
    if (join) result += (sequence(previous + ' ' + line) === sequence(previous + line) ? '' : ' ') + line
    else result += (i ? '\n' : '') + line
  }
  const after = result.split('\n').filter(line => line.trimStart().startsWith('#')).map(line => sequence(line))
  if (sequence(input) !== sequence(result) || JSON.stringify(directives) !== JSON.stringify(after)) {
    throw new Error('Shader token or directive boundary changed')
  }
  return result
}

/** Fail closed unless the exact reviewed upstream source is present. */
export function compactThreeShaderSource(source) {
  if (createHash('sha256').update(source).digest('hex') !== reviewedSha256) throw new Error('Unreviewed Three.js shader source')
  let chunks = 0
  const result = source.replace(/(var ([A-Za-z0-9_]+) = ")((?:[^"\\]|\\.)*)(";)/g, (all, start, name, encoded, end) => {
    if (!encoded.includes('\\n')) return all
    chunks++
    return start + JSON.stringify(compactChunk(JSON.parse('"' + encoded + '"'))).slice(1, -1) + end
  })
  if (chunks !== 107) throw new Error('Unexpected shader chunk count')
  return result
}

/** esbuild plugin for browser builds. Does not alter source files or runtime APIs. */
export function compactThreeShaders() {
  return { name: 'zixcel-reviewed-three-shaders', setup(build) {
    build.onLoad({ filter: /[\\/]three[\\/]build[\\/]three\.module\.js$/ }, async args => ({
      contents: compactThreeShaderSource(await readFile(args.path, 'utf8')), loader: 'js',
    }))
  } }
}
