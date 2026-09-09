import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { supabaseAdmin as db } from '../lib/supabase';
import { canViewProfile } from '../services/access.service';
const routes: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', app.authenticate);
    app.addHook('preHandler', async (req, reply) => {
        const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
        const { data: p } = await db.from('posts').select('author_id,visibility').eq('id', id).single();
        if (!p || !await canViewProfile(req.user.id, p.author_id))
            return reply.code(404).send({ message: 'Post unavailable' });
        if (p.visibility === 'followers' && p.author_id !== req.user.id) {
            const { data: f } = await db.from('follows').select('follower_id').eq('follower_id', req.user.id).eq('following_id', p.author_id).maybeSingle();
            if (!f)
                return reply.code(403).send({ message: 'Post is for followers only' });
        }
    });
    app.get('/:id', async (req, reply) => {
        const { id } = req.params as {
            id: string;
        };
        const { data: p, error } = await db.from('polls').select('*').eq('post_id', id).single();
        if (error || !p)
            return reply.code(404).send({ message: 'Poll not found' });
        const counts = await Promise.all(p.options.map(async (_: string, i: number) => {
            const { count, error } = await db.from('poll_votes').select('user_id', { head: true, count: 'exact' }).eq('post_id', id).eq('option_index', i);
            if (error)
                throw error;
            return count || 0;
        }));
        const { data: vote, error: voteError } = await db.from('poll_votes').select('option_index').eq('post_id', id).eq('user_id', req.user.id).maybeSingle();
        if (voteError)
            throw voteError;
        return { success: true, data: { ...p, counts, selected: vote?.option_index ?? null } };
    });
    app.post('/:id/vote', async (req, reply) => {
        const { id } = req.params as {
            id: string;
        };
        const { option_index } = z.object({ option_index: z.number().int().min(0).max(3) }).parse(req.body);
        const { error } = await db.rpc('vote_in_poll', { target_post: id, voter: req.user.id, choice: option_index });
        if (error)
            return reply.code(409).send({ message: 'Unable to vote. The poll may be closed.' });
        return { success: true };
    });
};
export default routes;
