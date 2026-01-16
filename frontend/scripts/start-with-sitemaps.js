import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import axios from 'axios'
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
  const client = axios.create({ timeout: 5000 })
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await client.get(url)
      if (res.status >= 200 && res.status < 300) {
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
  // Check if server.js exists
  const serverPath = join(process.cwd(), 'server.js')
  if (!existsSync(serverPath)) {
    console.error('[startup] server.js not found at:', serverPath)
    console.error('[startup] Current working directory:', process.cwd())
    console.error('[startup] This usually means Next.js standalone output was not generated.')
    console.error('[startup] Check that output: "standalone" is set in next.config.ts for production builds.')
    process.exit(1)
  }
  
  console.log('[startup] launching Next.js server from:', serverPath)
  const child = spawn('node', ['server.js'], { 
    stdio: 'inherit',
    env: { ...process.env },
    cwd: process.cwd()
  })
  
  child.on('error', (err) => {
    console.error('[startup] Failed to start Next.js server:', err)
    console.error('[startup] Error details:', err.message, err.stack)
    process.exit(1)
  })
  
  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[startup] Next.js server exited with code ${code}`)
      process.exit(code)
    } else if (signal) {
      console.error(`[startup] Next.js server was killed with signal ${signal}`)
      process.exit(1)
    } else {
      console.log('[startup] Next.js server exited normally')
      process.exit(0)
    }
  })
  
  // Handle process termination signals
  process.on('SIGTERM', () => {
    console.log('[startup] Received SIGTERM, shutting down gracefully')
    child.kill('SIGTERM')
  })
  
  process.on('SIGINT', () => {
    console.log('[startup] Received SIGINT, shutting down gracefully')
    child.kill('SIGINT')
  })
  
  // Wait a moment to ensure server is starting
  await sleep(2000)
  console.log('[startup] Next.js server process started, health checks should now pass')
}

async function run() {
  try {
    await checkHealth()
  } catch (err) {
    console.warn('[startup] Health check error (continuing anyway):', err?.message || err)
  }
  
  // Start the server first so health checks can pass immediately
  await startServer()
  
  // Run sitemap generation in the background after a short delay
  // This allows the server to start responding to health checks
  setTimeout(() => {
    main().catch((err) => {
      console.error('[startup] sitemap generation failed (non-fatal):', err)
    })
  }, 5000) // Wait 5 seconds for server to be ready
}

run().catch((err) => {
  console.error('[startup] fatal error:', err)
  process.exit(1)
})