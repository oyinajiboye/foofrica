import { supabaseAdmin as db } from '../lib/supabase';
export async function blockedIds(userId: string): Promise<string[]> {
    const { data, error } = await db.from('blocked_users').select('blocker_id,blocked_id').or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (error)
        throw new Error('Unable to check access permissions');
    return (data || []).map(x => x.blocker_id === userId ? x.blocked_id : x.blocker_id);
}
export async function canViewProfile(viewerId: string | undefined, profileId: string) {
    if (viewerId === profileId)
        return true;
    if (viewerId && (await blockedIds(viewerId)).includes(profileId))
        return false;
    const { data, error } = await db.from('user_settings').select('profile_visibility').eq('user_id', profileId).maybeSingle();
    if (error)
        throw new Error('Unable to check profile visibility');
    return data?.profile_visibility !== 'private';
}
export async function canMessage(senderId: string, recipientId: string) {
    if ((await blockedIds(senderId)).includes(recipientId))
        return false;
    const { data, error } = await db.from('user_settings').select('who_can_dm').eq('user_id', recipientId).maybeSingle();
    if (error)
        throw new Error('Unable to check messaging preferences');
    if (data?.who_can_dm === 'nobody')
        return false;
    if (data?.who_can_dm === 'followers') {
        const { data: follow, error: e } = await db.from('follows').select('follower_id').eq('follower_id', senderId).eq('following_id', recipientId).maybeSingle();
        if (e)
            throw new Error('Unable to check messaging preferences');
        return !!follow;
    }
    return true;
}
export async function canViewPost(viewerId: string | undefined, post: {
    author_id: string;
    visibility: string;
}) {
    if (!await canViewProfile(viewerId, post.author_id))
        return false;
    if (post.visibility === 'public' || viewerId === post.author_id)
        return true;
    if (!viewerId)
        return false;
    const { data, error } = await db.from('follows').select('follower_id').eq('follower_id', viewerId).eq('following_id', post.author_id).maybeSingle();
    if (error)
        throw new Error('Unable to check post access');
    return !!data;
}
export async function visiblePosts<T extends {
    author_id: string;
    visibility: string;
}>(viewerId: string | undefined, posts: T[]) {
    const decisions = await Promise.all(posts.map(p => canViewPost(viewerId, p)));
    let muted: string[] = [];
    if (viewerId) {
        const { data, error } = await db.from('muted_users').select('muted_id').eq('muter_id', viewerId);
        if (error)
            throw new Error('Unable to check muted accounts');
        muted = (data || []).map(m => m.muted_id);
    }
    return posts.filter((p, i) => decisions[i] && !muted.includes(p.author_id));
}
export async function publicProfile(viewerId: string | undefined, profile: any) {
    const { fcm_token, is_admin, settings, ...safe } = profile;
    if (viewerId === profile.id)
        return safe;
    const { data, error } = await db.from('user_settings').select('show_age,show_location').eq('user_id', profile.id).maybeSingle();
    if (error)
        throw new Error('Unable to check profile preferences');
    if (data?.show_location === false) {
        safe.location = null;
        for (const k of ['club_profile', 'coach_profile', 'scout_profile'])
            if (safe[k])
                safe[k] = { ...safe[k], country: null, city: null };
    }
    if (data?.show_age === false && safe.player_profile)
        safe.player_profile = { ...safe.player_profile, date_of_birth: null };
    return safe;
}
export async function protectProfilePayload(viewer: string | undefined, value: any): Promise<any> {
    if (Array.isArray(value))
        return (await Promise.all(value.map(v => protectProfilePayload(viewer, v)))).filter(v => v !== null);
    if (!value || typeof value !== 'object')
        return value;
    if (value.profile_id) {
        if (!await canViewProfile(viewer, value.profile_id))
            return null;
        const p = await publicProfile(viewer, { id: value.profile_id, player_profile: value });
        value = p.player_profile;
    }
    if (value.id && value.username) {
        if (!await canViewProfile(viewer, value.id))
            return null;
        value = await publicProfile(viewer, value);
    }
    return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await protectProfilePayload(viewer, v)])));
}
