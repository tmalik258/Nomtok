import { spawn } from 'node:child_process'
import main from './generate-sitemaps.js'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000').replace(/\/$/, '')
const HEALTH_ENDPOINT = process.env.BACKEND_HEALTH_PATH || '/health'
const MAX_ATTEMPTS = Number(process.env.SITEMAP_HEALTH_ATTEMPTS || 30)
const BASE_DELAY_MS = Number(process.env.SITEMAP_HEALTH_BASE_DELAY_MS || 2000)

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function checkHealth() {
  const url = `${API_URL}${HEALTH_ENDPOINT}`
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) {
        console.log(`[startup] backend healthy at ${url}`)
        return true
      }
      console.log(`[startup] health not ok (status ${res.status}), attempt ${attempt}/${MAX_ATTEMPTS}`)
    } catch (err) {
      console.log(`[startup] health check failed, attempt ${attempt}/${MAX_ATTEMPTS}:`, err?.message || err)
    }
    const backoff = BASE_DELAY_MS * Math.min(attempt, 10)
    await sleep(backoff)
  }
  console.warn('[startup] backend health never OK; continuing without guaranteeing availability')
  return false
}

async function startServer() {
  console.log('[startup] launching Next.js server')
  const child = spawn('node', ['server.js'], { stdio: 'inherit' })
  child.on('exit', (code) => {
    console.log(`[startup] Next.js server exited with code ${code}`)
    process.exit(code ?? 0)
  })
}

async function run() {
  await checkHealth()
  try {
    await main()
  } catch (err) {
    console.error('[startup] sitemap generation failed; starting server anyway:', err)
  }
  await startServer()
}

run().catch((err) => {
  console.error('[startup] fatal error:', err)
  process.exit(1)
})