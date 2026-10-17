import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../dist/', import.meta.url))
const target = fileURLToPath(new URL('../docs/', import.meta.url))
if (!existsSync(source)) throw new Error('Run npm run build first.')
rmSync(target, { recursive: true, force: true })
cpSync(source, target, { recursive: true })
writeFileSync(`${target}/.nojekyll`, '')
console.log('Static GitHub Pages files written to docs/.')
