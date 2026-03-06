import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const rootDir = path.resolve(path.dirname(currentFile), '..')

const replacements = [
  {
    source: path.join(rootDir, 'lib/polyfills/next-polyfill-module-modern.js'),
    target: path.join(rootDir, 'node_modules/next/dist/build/polyfills/polyfill-module.js'),
  },
  {
    source: path.join(rootDir, 'lib/polyfills/next-polyfill-nomodule-modern.js'),
    target: path.join(rootDir, 'node_modules/next/dist/build/polyfills/polyfill-nomodule.js'),
  },
]

for (const { source, target } of replacements) {
  const contents = await readFile(source, 'utf8')
  await writeFile(target, contents)
  console.log(`patched ${path.relative(rootDir, target)}`)
}
