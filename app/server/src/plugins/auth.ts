import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import type { AuthUser } from '../types'

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser
    authIdentity: { id: string; email?: string }
  }
}

// Extracts and verifies the Supabase JWT from Authorization header
const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticateIdentity', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : null
    if (!token) { reply.code(401).send({ message: 'Authentication required' }); return }
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) { reply.code(401).send({ message: 'Invalid or expired token' }); return }
    request.authIdentity = { id: user.id, email: user.email }
  })

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      })
    }

    const token = authHeader.slice(7)

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
    }

    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User profile not found. Please complete onboarding.',
      })
    }

    request.user = {
      id: user.id,
      email: user.email,
      user_type: profile.user_type,
      profile,
    }
  })

  // Optional auth — attaches user if token is present, doesn't fail if not
  fastify.decorate('optionalAuth', async (request: FastifyRequest, _reply: FastifyReply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return

    const token = authHeader.slice(7)
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      request.user = {
        id: user.id,
        email: user.email,
        user_type: profile.user_type,
        profile,
      }
    }
  })
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticateIdentity: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(authPlugin, { name: 'auth' })
