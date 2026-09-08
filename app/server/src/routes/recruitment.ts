import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { supabaseAdmin as db } from '../lib/supabase';
import { canViewProfile, blockedIds, publicProfile } from '../services/access.service';
import { opportunitySchema, applicationStatus, canTransitionApplication, ageOn } from '../domain/recruitment';
const uuid = z.string().uuid();
const safeProfile = 'id,username,display_name,avatar_url,user_type,is_verified,bio,location,follower_count';
function fail(error: any) { if (error)
    throw Object.assign(new Error('Unable to save or load this record.'), { statusCode: error.code === '23505' ? 409 : 500 }); }
const recruitmentRoutes: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', app.authenticate);
    app.get('/opportunities', async (req) => {
        const params = z.object({ country: z.string().max(80).optional(), position: z.string().max(5).optional(), age: z.coerce.number().int().min(16).max(50).optional(), page: z.coerce.number().int().min(1).default(1), mine: z.enum(['true', 'false']).optional() }).parse(req.query);
        let query = db.from('opportunities').select('*,club:profiles!opportunities_club_id_fkey(id,username,display_name,is_verified)', { count: 'exact' }).order('created_at', { ascending: false });
        const blocked = await blockedIds(req.user.id);
        if (blocked.length)
            query = query.not('club_id', 'in', `(${blocked.join(',')})`);
        if (params.mine === 'true')
            query = query.eq('club_id', req.user.id);
        else
            query = query.eq('status', 'open').gt('deadline', new Date().toISOString());
        if (params.country)
            query = query.ilike('country', params.country);
        if (params.position)
            query = query.or(`positions.cs.{${params.position.replace(/[^A-Z]/g, '')}},positions.eq.{}`);
        if (params.age)
            query = query.lte('min_age', params.age).gte('max_age', params.age);
        const { data, error, count } = await query.range((params.page - 1) * 20, params.page * 20 - 1);
        fail(error);
        return { success: true, data: data || [], total: count || 0 };
    });
    app.post('/opportunities', async (req, reply) => {
        if (req.user.user_type !== 'club' || !req.user.profile.is_verified)
            return reply.code(403).send({ message: 'A verified club account is required to publish opportunities.' });
        const body = opportunitySchema.parse(req.body);
        if (new Date(body.deadline) <= new Date())
            return reply.code(400).send({ message: 'Choose a future deadline.' });
        const { data, error } = await db.from('opportunities').insert({ ...body, club_id: req.user.id }).select().single();
        fail(error);
        return reply.code(201).send({ success: true, data });
    });
    app.put('/opportunities/:id', async (req, reply) => {
        const { id } = z.object({ id: uuid }).parse(req.params);
        const { status } = z.object({ status: z.enum(['open', 'closed']) }).parse(req.body);
        const { data, error } = await db.from('opportunities').update({ status }).eq('id', id).eq('club_id', req.user.id).select().maybeSingle();
        fail(error);
        if (!data)
            return reply.code(404).send({ message: 'Opportunity not found.' });
        return { success: true, data };
    });
    app.post('/opportunities/:id/apply', async (req, reply) => {
        if (req.user.user_type !== 'player')
            return reply.code(403).send({ message: 'Only player accounts can apply.' });
        const { id } = z.object({ id: uuid }).parse(req.params);
        const { cover_note } = z.object({ cover_note: z.string().trim().max(2000).default('') }).parse(req.body);
        const { data: op, error: opError } = await db.from('opportunities').select('*').eq('id', id).single();
        fail(opError);
        if (!op || op.status !== 'open' || new Date(op.deadline) <= new Date())
            return reply.code(409).send({ message: 'This opportunity is closed.' });
        const { data: player } = await db.from('player_profiles').select('date_of_birth').eq('profile_id', req.user.id).single();
        if ((await blockedIds(req.user.id)).includes(op.club_id))
            return reply.code(403).send({ message: 'Opportunity is unavailable.' });
        const age = player?.date_of_birth ? ageOn(player.date_of_birth) : null;
        if (age === null || age < op.min_age || age > op.max_age)
            return reply.code(400).send({ message: 'Add your date of birth to your profile and check the age requirements.' });
        const { data, error } = await db.rpc('submit_application', { opportunity: id, applicant: req.user.id, note: cover_note });
        fail(error);
        return reply.code(201).send({ success: true, data });
    });
    app.get('/applications', async (req) => {
        let query = db.from('applications').select('*,opportunity:opportunities!inner(id,title,club_id,country,city),player:profiles!applications_player_id_fkey(id,username,display_name)').order('created_at', { ascending: false });
        query = req.user.user_type === 'club' ? query.eq('opportunity.club_id', req.user.id) : query.eq('player_id', req.user.id);
        const { data, error } = await query.limit(200);
        fail(error);
        return { success: true, data: data || [] };
    });
    app.put('/applications/:id', async (req, reply) => {
        const { id } = z.object({ id: uuid }).parse(req.params);
        const { status } = z.object({ status: applicationStatus }).parse(req.body);
        const { data: record, error } = await db.from('applications').select('*,opportunity:opportunities(club_id)').eq('id', id).single();
        fail(error);
        const applicant = record?.player_id === req.user.id;
        const owner = record?.opportunity?.club_id === req.user.id;
        if (!record || (!applicant && !owner))
            return reply.code(403).send({ message: 'Not authorized.' });
        if (!canTransitionApplication(record.status, status, applicant))
            return reply.code(409).send({ message: 'This status change is not allowed.' });
        const result = await db.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id).eq('status', record.status).select().maybeSingle();
        fail(result.error);
        if (!result.data)
            return reply.code(409).send({ message: 'Application changed. Refresh and try again.' });
        return { success: true, data: result.data };
    });
    app.get('/alerts', async (req) => {
        const { data: prefs, error } = await db.from('opportunity_alerts').select('*').eq('user_id', req.user.id).maybeSingle();
        fail(error);
        if (!prefs?.enabled)
            return { success: true, data: { preferences: prefs, matches: [] } };
        let q = db.from('opportunities').select('*,club:profiles!opportunities_club_id_fkey(display_name)').eq('status', 'open').gt('deadline', new Date().toISOString()).order('created_at', { ascending: false });
        const blocked = await blockedIds(req.user.id);
        if (blocked.length)
            q = q.not('club_id', 'in', `(${blocked.join(',')})`);
        if (prefs.country)
            q = q.ilike('country', prefs.country);
        if (prefs.position)
            q = q.or(`positions.cs.{${prefs.position}},positions.eq.{}`);
        const { data, error: e } = await q.limit(50);
        fail(e);
        return { success: true, data: { preferences: prefs, matches: data || [] } };
    });
    app.put('/alerts', async (req) => {
        const body = z.object({ enabled: z.boolean(), country: z.string().max(80).default(''), position: z.enum(['', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF']).default('') }).parse(req.body);
        const { data, error } = await db.from('opportunity_alerts').upsert({ ...body, user_id: req.user.id }).select().single();
        fail(error);
        return { success: true, data };
    });
    app.get('/verification', async (req) => {
        const { data, error } = await db.from('verification_requests').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
        fail(error);
        return { success: true, data: data || [] };
    });
    app.post('/verification', async (req, reply) => {
        const body = z.object({ organization: z.string().trim().min(2).max(120), evidence_url: z.string().url().refine(v => v.startsWith('https://'), 'Use an HTTPS link'), notes: z.string().max(2000).default('') }).parse(req.body);
        const { data, error } = await db.from('verification_requests').insert({ ...body, user_id: req.user.id }).select().single();
        fail(error);
        return reply.code(201).send({ success: true, data });
    });
    app.get('/verification/review', async (req, reply) => {
        const { data: admin } = await db.from('profiles').select('is_admin').eq('id', req.user.id).single();
        if (!admin?.is_admin)
            return reply.code(403).send({ message: 'Admin access required.' });
        const { data, error } = await db.from('verification_requests').select('*,profile:profiles!verification_requests_user_id_fkey(id,username,display_name,user_type)').eq('status', 'pending').order('created_at');
        fail(error);
        return { success: true, data: data || [] };
    });
    app.put('/verification/:id/review', async (req, reply) => {
        const { data: admin } = await db.from('profiles').select('is_admin').eq('id', req.user.id).single();
        if (!admin?.is_admin)
            return reply.code(403).send({ message: 'Admin access required.' });
        const { id } = z.object({ id: uuid }).parse(req.params);
        const { status, review_note } = z.object({ status: z.enum(['approved', 'rejected']), review_note: z.string().max(1000) }).parse(req.body);
        const { data, error } = await db.rpc('review_verification_request', { request_id: id, reviewer_id: req.user.id, decision: status, note: review_note });
        fail(error);
        return { success: true, data };
    });
    app.get('/squad', async (req) => {
        let q = db.from('squad_memberships').select('*,club:profiles!squad_memberships_club_id_fkey(id,username,display_name),player:profiles!squad_memberships_player_id_fkey(id,username,display_name)').order('created_at', { ascending: false });
        q = req.user.user_type === 'club' ? q.eq('club_id', req.user.id) : q.eq('player_id', req.user.id);
        const { data, error } = await q;
        fail(error);
        return { success: true, data: data || [] };
    });
    app.post('/squad', async (req, reply) => {
        if (req.user.user_type !== 'club')
            return reply.code(403).send({ message: 'Club account required.' });
        const { username } = z.object({ username: z.string().regex(/^[a-z0-9_]{3,30}$/) }).parse(req.body);
        const { data: player } = await db.from('profiles').select('id').eq('username', username).eq('user_type', 'player').single();
        if (!player)
            return reply.code(404).send({ message: 'Player not found.' });
        if (!await canViewProfile(req.user.id, player.id))
            return reply.code(403).send({ message: 'Player is unavailable.' });
        const { data, error } = await db.from('squad_memberships').insert({ club_id: req.user.id, player_id: player.id }).select().single();
        fail(error);
        return reply.code(201).send({ success: true, data });
    });
    app.put('/squad/:id', async (req, reply) => {
        const { id } = z.object({ id: uuid }).parse(req.params);
        const { status } = z.object({ status: z.enum(['accepted', 'declined', 'ended']) }).parse(req.body);
        const { data: m } = await db.from('squad_memberships').select('club_id,player_id,status').eq('id', id).maybeSingle();
        if (!m || ![m.club_id, m.player_id].includes(req.user.id) || (status !== 'ended' && m.player_id !== req.user.id))
            return reply.code(403).send({ message: 'Only the invited player may respond; either member may end membership.' });
        const { data, error } = await db.rpc('respond_squad_membership', { membership_id: id, actor_id: req.user.id, decision: status });
        fail(error);
        return { success: true, data };
    });
    app.get('/analytics', async (req) => {
        const { data, error } = await db.rpc('profile_analytics', { owner_id: req.user.id });
        fail(error);
        return { success: true, data };
    });
    app.post('/profile-views/:id', async (req, reply) => {
        const { id } = z.object({ id: uuid }).parse(req.params);
        if (!await canViewProfile(req.user.id, id))
            return reply.code(403).send({ message: 'Profile not accessible.' });
        if (id !== req.user.id) {
            const { error } = await db.from('profile_views').upsert({ profile_id: id, viewer_id: req.user.id, view_day: new Date().toISOString().slice(0, 10) }, { onConflict: 'profile_id,viewer_id,view_day', ignoreDuplicates: true });
            fail(error);
        }
        return { success: true };
    });
    app.get('/compare', async (req, reply) => {
        const { ids } = z.object({ ids: z.string() }).parse(req.query);
        const list = z.array(uuid).min(2).max(4).parse(ids.split(','));
        for (const id of list)
            if (!await canViewProfile(req.user.id, id))
                return reply.code(403).send({ message: 'A selected profile is not accessible.' });
        const { data, error } = await db.from('profiles').select(`${safeProfile},player_profile:player_profiles(primary_position,dominant_foot,height_cm,nationality),stats:player_stats(*)`).in('id', list).eq('user_type', 'player');
        fail(error);
        return { success: true, data: await Promise.all((data || []).map(p => publicProfile(req.user.id, p))) };
    });
};
export default recruitmentRoutes;
