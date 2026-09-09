import accountData from './routes/accountData'
import conversationControls from './routes/conversationControls'
import { ZodError } from 'zod'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { env } from './config/env'

// ─── Plugins ──────────────────────────────────────────────────────────────────
import authPlugin from './plugins/auth'

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth'
import directoryRoutes from './routes/directory'
import recruitmentRoutes from './routes/recruitment'
import pollRoutes from './routes/polls'
import profileRoutes from './routes/profiles'
import playerRoutes from './routes/players'
import clubRoutes from './routes/clubs'
import scoutRoutes from './routes/scouts'
import coachRoutes from './routes/coaches'
import feedRoutes from './routes/feed'
import postRoutes from './routes/posts'
import videoRoutes from './routes/videos'
import searchRoutes from './routes/search'
import followRoutes from './routes/follows'
import messageRoutes from './routes/messages'
import notificationRoutes from './routes/notifications'
import adminRoutes from './routes/admin'
import uploadsRoutes from './routes/uploads'
import settingsRoutes from './routes/settings'
import blockRoutes from './routes/blocks'
import reportRoutes from './routes/reports'
import bookmarkRoutes from './routes/bookmarks'

// ─── Server ───────────────────────────────────────────────────────────────────

const server = Fastify({
  logger:
    env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : true,
})

export async function build() {
  // ── CORS ─────────────────────────────────────────────────────────────────
  await server.register(cors, {
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  await server.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down.',
    }),
  })

  // ── Multipart (file uploads) ──────────────────────────────────────────────
  await server.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB max for avatar/cover images
    },
  })

  // ── Auth Plugin ───────────────────────────────────────────────────────────
  await server.register(authPlugin)

  // ── Health Check ──────────────────────────────────────────────────────────
  server.get('/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }))

  // ── Global Error Handler ──────────────────────────────────────────────────
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error)

    if (error instanceof ZodError) return reply.code(400).send({ message: error.issues.map(issue => issue.message).join('; ') })

    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      })
    }

    const statusCode = error.statusCode ?? 500
    return reply.status(statusCode).send({
      statusCode,
      error: error.name ?? 'Internal Server Error',
      message: statusCode === 500 ? 'An unexpected error occurred' : error.message,
    })
  })


  // ── API Routes ────────────────────────────────────────────────────────────
  await server.register(accountData,{prefix:'/api/account-data'})
  await server.register(conversationControls,{prefix:'/api/conversation-controls'})
  await server.register(pollRoutes, {prefix:'/api/polls'})
  await server.register(recruitmentRoutes, { prefix: '/api/recruitment' })
  await server.register(directoryRoutes, { prefix: '/api/directory' })
  await server.register(authRoutes,         { prefix: '/api/auth' })
  await server.register(profileRoutes,      { prefix: '/api/profiles' })
  await server.register(playerRoutes,       { prefix: '/api/players' })
  await server.register(clubRoutes,         { prefix: '/api/clubs' })
  await server.register(scoutRoutes,        { prefix: '/api/scouts' })
  await server.register(coachRoutes,        { prefix: '/api/coaches' })
  await server.register(feedRoutes,         { prefix: '/api/feed' })
  await server.register(postRoutes,         { prefix: '/api/posts' })
  await server.register(videoRoutes,        { prefix: '/api/videos' })
  await server.register(searchRoutes,       { prefix: '/api/search' })
  await server.register(followRoutes,       { prefix: '/api/follows' })
  await server.register(messageRoutes,      { prefix: '/api/messages' })
  await server.register(notificationRoutes, { prefix: '/api/notifications' })
  await server.register(adminRoutes,        { prefix: '/api/admin' })
  await server.register(uploadsRoutes,      { prefix: '/api/uploads' })
  await server.register(settingsRoutes,     { prefix: '/api/settings' })
  await server.register(blockRoutes,        { prefix: '/api/blocks' })
  await server.register(reportRoutes,       { prefix: '/api/reports' })
  await server.register(bookmarkRoutes,     { prefix: '/api/bookmarks' })

  // ── 404 Handler ───────────────────────────────────────────────────────────
  server.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    })
  })


  return server
}

// ─── Start ────────────────────────────────────────────────────────────────────

async function start() {
  const app = await build()
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    app.log.info(`🚀 Footfrica API running on http://localhost:${env.PORT}`)
    app.log.info(`   Environment: ${env.NODE_ENV}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  server.log.info(`Received ${signal} — shutting down gracefully...`)
  await server.close()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

if (require.main === module) start()
