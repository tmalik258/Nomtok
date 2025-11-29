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
const logoLightPath = path.join(publicDir, 'logo-transparent-white.png')
const logoDarkPath = path.join(publicDir, 'logo-transparent-black.png')

const sizes = [16, 32, 48, 64]

async function ensureFileExists(file) {
  try {
    await fs.promises.access(file, fs.constants.R_OK)
  } catch {
    throw new Error(`Source image not found: ${file}`)
  }
}

async function createPng(size, sourcePath, bg, output) {
  // Get source image metadata to check dimensions
  const metadata = await sharp(sourcePath).metadata()
  
  // For very small sizes, use multi-step downscaling for better quality
  let pipeline = sharp(sourcePath)
  
  // If source is much larger than target, resize in steps for better quality
  if (metadata.width && metadata.width > size * 4) {
    // First resize to 4x the target size
    const step1Size = size * 4
    pipeline = pipeline.resize({
      width: step1Size,
      height: step1Size,
      fit: 'contain',
      background: bg,
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
  }
  
  if (metadata.width && metadata.width > size * 2) {
    // Second resize to 2x the target size
    const step2Size = size * 2
    pipeline = pipeline.resize({
      width: step2Size,
      height: step2Size,
      fit: 'contain',
      background: bg,
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
  }
  
  // Final resize to target size with enhanced sharpening
  const buf = await pipeline
    .resize({
      width: size,
      height: size,
      fit: 'contain',
      background: bg,
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .sharpen(2.0)
    .png({
      quality: 100,
      compressionLevel: 6,
      adaptiveFiltering: true,
      force: true,
    })
    .toBuffer()
  await fs.promises.writeFile(output, buf)
}

async function generatePngVariants() {
  await ensureFileExists(logoLightPath)
  await ensureFileExists(logoDarkPath)
  
  const outputs = []
  
  // Generate light mode favicons (use black logo for light backgrounds)
  for (const s of sizes) {
    const out = path.join(publicDir, `favicon-light-${s}x${s}.png`)
    outputs.push(out)
    await createPng(s, logoDarkPath, { r: 0, g: 0, b: 0, alpha: 0 }, out)
  }
  
  // Generate dark mode favicons (use white logo for dark backgrounds)
  for (const s of sizes) {
    const out = path.join(publicDir, `favicon-dark-${s}x${s}.png`)
    outputs.push(out)
    await createPng(s, logoLightPath, { r: 0, g: 0, b: 0, alpha: 0 }, out)
  }
  
  // Apple touch icon prefers opaque background (using black logo)
  const appleOut = path.join(publicDir, 'apple-touch-icon.png')
  await createPng(180, logoDarkPath, { r: 255, g: 255, b: 255, alpha: 1 }, appleOut)
  
  return outputs
}

async function generateIco(pngs) {
  // Use light mode 32x32 for ico (default)
  const light32 = pngs.find(p => p.includes('favicon-light-32x32'))
  const icoPngs = light32 ? [light32] : pngs.slice(0, 1)
  const buf = await pngToIco(icoPngs)
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