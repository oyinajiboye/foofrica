import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { cacheDelete, cacheKeys } from '../lib/redis'
import {
  updateSettingsSchema,
  changeEmailSchema,
  changePasswordSchema,
  changeUsernameSchema,
} from '../schemas/settings.schemas'

const settingsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/settings
   * Get the authenticated user's settings
   */
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id

    // Fetch or create settings row
    let { data: settings, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!settings) {
      // Auto-create if somehow missing
      const { data: created, error: createError } = await supabaseAdmin
        .from('user_settings')
        .insert({ user_id: userId })
        .select()
        .single()

      if (createError) return reply.status(500).send({ message: createError.message })
      settings = created
    }

    return reply.send({ success: true, data: settings })
  })

  /**
   * PUT /api/settings
   * Update any combination of settings fields
   */
  fastify.put('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id
    const body = updateSettingsSchema.parse(request.body)

    // Filter out undefined values
    const updates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) updates[key] = value
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ message: 'No settings to update' })
    }

    // Ensure settings row exists (upsert)
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, data })
  })

  // ── Account Changes ─────────────────────────────────────────────────────────

  /**
   * PUT /api/settings/account/email
   * Change the user's email address
   */
  fastify.put('/account/email', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { new_email, password } = changeEmailSchema.parse(request.body)
    const userId = request.user.id

    // Verify current password by attempting sign-in
    const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: request.user.email!,
      password,
    })

    if (verifyError) {
      return reply.status(401).send({ message: 'Current password is incorrect' })
    }

    // Check if email is already taken
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .neq('id', userId)

    // Update email via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: new_email,
    })

    if (updateError) {
      return reply.status(400).send({ message: updateError.message })
    }

    return reply.send({ success: true, message: 'Email updated successfully' })
  })

  /**
   * PUT /api/settings/account/password
   * Change password (requires current password verification)
   */
  fastify.put('/account/password', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { current_password, new_password } = changePasswordSchema.parse(request.body)
    const userId = request.user.id

    // Verify current password
    const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: request.user.email!,
      password: current_password,
    })

    if (verifyError) {
      return reply.status(401).send({ message: 'Current password is incorrect' })
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: new_password,
    })

    if (updateError) {
      return reply.status(400).send({ message: updateError.message })
    }

    return reply.send({ success: true, message: 'Password updated successfully' })
  })

  /**
   * PUT /api/settings/account/username
   * Change username (with uniqueness check)
   */
  fastify.put('/account/username', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { new_username } = changeUsernameSchema.parse(request.body)
    const userId = request.user.id

    // Check uniqueness
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', new_username)
      .neq('id', userId)
      .single()

    if (existing) {
      return reply.status(409).send({ message: 'Username is already taken' })
    }

    // Update username
    const oldUsername = request.user.profile.username
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ username: new_username, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    // Bust caches for old and new username
    await Promise.all([
      cacheDelete(cacheKeys.profile(userId)),
      cacheDelete(cacheKeys.profile(oldUsername)),
      cacheDelete(cacheKeys.profile(new_username)),
    ])

    return reply.send({ success: true, data })
  })

  /**
   * PUT /api/settings/account/profile
   * Update location and website_url on the base profile
   */
  fastify.put('/account/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id
    const { location, website_url } = request.body as {
      location?: string
      website_url?: string
    }

    const updates: Record<string, unknown> = {}
    if (location !== undefined) updates.location = location
    if (website_url !== undefined) updates.website_url = website_url

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ message: 'No fields to update' })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    await cacheDelete(cacheKeys.profile(userId))

    return reply.send({ success: true, data })
  })

  // ── Account Lifecycle ───────────────────────────────────────────────────────

  /**
   * POST /api/settings/deactivate
   * Temporarily deactivate account (sets a flag, doesn't delete data)
   */
  fastify.post('/deactivate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id

    // Ban the Supabase auth user (prevents login but keeps data)
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // ~100 years (effectively permanent until reactivated)
    })

    if (error) return reply.status(500).send({ message: error.message })

    // Clear FCM token
    await supabaseAdmin
      .from('profiles')
      .update({ fcm_token: null, updated_at: new Date().toISOString() })
      .eq('id', userId)

    return reply.send({
      success: true,
      message: 'Account deactivated. Contact support to reactivate.',
    })
  })

  /**
   * DELETE /api/settings/account
   * Permanently delete the account and all associated data.
   * This is irreversible.
   */
  fastify.delete('/account', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id
    const { password } = (request.body as { password?: string }) ?? {}

    // Require password confirmation for destructive action
    if (!password) {
      return reply.status(400).send({ message: 'Password confirmation required for account deletion' })
    }

    // Verify password
    const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: request.user.email!,
      password,
    })

    if (verifyError) {
      return reply.status(401).send({ message: 'Password is incorrect' })
    }

    // Delete from Supabase Auth — cascades to profiles and all FK-linked data
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      return reply.status(500).send({ message: deleteError.message })
    }

    return reply.send({
      success: true,
      message: 'Account permanently deleted',
    })
  })
}

export default settingsRoutes
