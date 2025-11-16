import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const appDir = path.join(root, 'app')
const logoPath = path.join(publicDir, 'logo.png')

const sizes = [16, 32, 48, 64]

async function ensureFileExists(file: string) {
  try {
    await fs.promises.access(file, fs.constants.R_OK)
  } catch {
    throw new Error(`Source image not found: ${file}`)
  }
}

async function createPng(size: number, bg: { r: number; g: number; b: number; alpha: number }, output: string) {
  const buf = await sharp(logoPath)
    .resize({ width: size, height: size, fit: 'contain', background: bg })
    .png()
    .toBuffer()
  await fs.promises.writeFile(output, buf)
}

async function generatePngVariants() {
  await ensureFileExists(logoPath)
  const outputs = [] as string[]
  for (const s of sizes) {
    const out = path.join(publicDir, `favicon-${s}x${s}.png`)
    outputs.push(out)
    await createPng(s, { r: 0, g: 0, b: 0, alpha: 0 }, out)
  }
  // Apple touch icon prefers opaque background
  const appleOut = path.join(publicDir, 'apple-touch-icon.png')
  await createPng(180, { r: 255, g: 255, b: 255, alpha: 1 }, appleOut)
  return outputs
}

async function generateIco(pngs: string[]) {
  const buf = await pngToIco(pngs)
  const icoPath = path.join(appDir, 'favicon.ico')
  await fs.promises.writeFile(icoPath, buf)
}

async function main() {
  const pngs = await generatePngVariants()
  await generateIco(pngs)
  console.log('Favicons generated:', pngs.map(p => path.basename(p)).join(', '))
}

main().catch((err) => {
  console.error('Failed to generate favicons:', err)
  process.exit(1)
})