import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import {
  registerSchema,
  loginSchema,
  onboardSchema,
  completeProfileSchema,
  updateFcmTokenSchema,
} from '../schemas/auth.schemas'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/auth/register
   * Create a new user account and return a session immediately.
   */
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    // 1. Create the Supabase auth user
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      phone: body.phone,
      password: body.password,
      email_confirm: true, // skip email verification for smooth onboarding
    })

    if (createError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Registration failed',
        message: createError.message,
      })
    }

    // 2. Immediately sign the user in so they get a JWT for onboarding
    let session = null
    if (body.email) {
      const { data: signIn, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: body.email!,
        password: body.password,
      })
      if (!signInError) session = signIn.session
    } else if (body.phone) {
      const { data: signIn, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        phone: body.phone!,
        password: body.password,
      })
      if (!signInError) session = signIn.session
    }

    return reply.status(201).send({
      success: true,
      data: {
        user_id: created.user.id,
        access_token: session?.access_token ?? null,
        refresh_token: session?.refresh_token ?? null,
        expires_at: session?.expires_at ?? null,
        needs_onboarding: true,
        message: 'Account created. Complete your profile to continue.',
      },
    })
  })

  /**
   * POST /api/auth/login
   * Sign in with email/phone + password
   */
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    let authResult
    if (body.email) {
      authResult = await supabaseAdmin.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })
    } else if (body.phone) {
      authResult = await supabaseAdmin.auth.signInWithPassword({
        phone: body.phone,
        password: body.password,
      })
    } else {
      return reply.status(400).send({ message: 'Email or phone required' })
    }

    if (authResult.error || !authResult.data.session) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Authentication failed',
        message: authResult.error?.message ?? 'Invalid credentials',
      })
    }

    const { session, user } = authResult.data

    // Fetch profile to determine if onboarding is complete
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return reply.send({
      success: true,
      data: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user_id: user.id,
        profile,
        needs_onboarding: !profile,
      },
    })
  })

  /**
   * POST /api/auth/complete-profile
   * Final onboarding step — saves user_type, username, and interests in one shot.
   * Called by the frontend OnboardComplete page.
   */
  fastify.post(
    '/complete-profile',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = completeProfileSchema.parse(request.body)
      const userId = request.user.id

      // 1. Username uniqueness check
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', body.username)
        .neq('id', userId) // allow re-submission with same username (idempotent)
        .single()

      if (existing) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Username is already taken',
        })
      }

      // 2. Upsert base profile (handles re-submissions gracefully)
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: userId,
            username: body.username,
            display_name: body.full_name,
            user_type: body.user_type,
            interests: body.interests,
            avatar_url: body.avatar_url ?? null,
            is_verified: false,
            follower_count: 0,
            following_count: 0,
            post_count: 0,
          },
          { onConflict: 'id' }
        )
        .select()
        .single()

      if (profileError) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Profile creation failed',
          message: profileError.message,
        })
      }

      // 3. Create type-specific sub-profile (idempotent)
      const typeTable = `${body.user_type}_profiles` as const
      await supabaseAdmin
        .from(typeTable)
        .upsert({ profile_id: userId }, { onConflict: 'profile_id', ignoreDuplicates: true })

      // 4. Seed user_interest_scores from stated interests (cold-start data)
      if (body.interests.length > 0) {
        const seedRows = body.interests.map((tag) => ({
          user_id: userId,
          tag,
          score: 1, // baseline score from explicit selection
        }))
        await supabaseAdmin
          .from('user_interest_scores')
          .upsert(seedRows, { onConflict: 'user_id,tag', ignoreDuplicates: true })
      }

      return reply.status(201).send({
        success: true,
        data: profile,
      })
    }
  )

  /**
   * POST /api/auth/onboard  (legacy alias — kept for backwards compatibility)
   */
  fastify.post(
    '/onboard',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = onboardSchema.parse(request.body)
      const userId = request.user.id
      const userType = (request.user as any).user_metadata?.user_type ?? 'fan'

      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', body.username)
        .single()

      if (existing) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Username is already taken',
        })
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          username: body.username,
          display_name: body.display_name,
          bio: body.bio ?? null,
          avatar_url: body.avatar_url ?? null,
          user_type: userType,
          is_verified: false,
          follower_count: 0,
          following_count: 0,
          post_count: 0,
        })
        .select()
        .single()

      if (profileError) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Profile creation failed',
          message: profileError.message,
        })
      }

      const typeTable = `${userType}_profiles`
      await supabaseAdmin.from(typeTable).insert({ profile_id: userId })

      return reply.status(201).send({ success: true, data: profile })
    }
  )

  /**
   * POST /api/auth/refresh
   */
  fastify.post('/refresh', async (request, reply) => {
    const { refresh_token } = request.body as { refresh_token: string }
    if (!refresh_token) {
      return reply.status(400).send({ message: 'refresh_token required' })
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token })

    if (error || !data.session) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Token refresh failed',
        message: error?.message ?? 'Invalid refresh token',
      })
    }

    return reply.send({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    })
  })

  /**
   * GET /api/auth/me
   */
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    return reply.send({ success: true, data: request.user })
  })

  /**
   * PUT /api/auth/fcm-token
   */
  fastify.put('/fcm-token', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { fcm_token } = updateFcmTokenSchema.parse(request.body)

    await supabaseAdmin.from('profiles').update({ fcm_token }).eq('id', request.user.id)

    return reply.send({ success: true })
  })

  /**
   * POST /api/auth/logout
   */
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const token = request.headers.authorization!.slice(7)
    await supabaseAdmin.auth.admin.signOut(token)

    await supabaseAdmin
      .from('profiles')
      .update({ fcm_token: null })
      .eq('id', request.user.id)

    return reply.send({ success: true, message: 'Logged out' })
  })

  /**
   * GET /api/auth/check-username/:username
   */
  fastify.get('/check-username/:username', async (request, reply) => {
    const { username } = request.params as { username: string }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return reply.send({ available: false, reason: 'Invalid username format' })
    }

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (data) {
      const suffix = Math.floor(Math.random() * 9000) + 1000
      return reply.send({ available: false, suggestion: `${username}${suffix}` })
    }

    return reply.send({ available: true })
  })
}

export default authRoutes
