const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
Object.assign(process.env, { NODE_ENV: 'test', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon', SUPABASE_SERVICE_ROLE_KEY: 'test-service', JWT_SECRET: 'test-secret' })
const { supabaseAdmin } = require('../dist/lib/supabase')
const { build } = require('../dist/index')
const userId = '11111111-1111-4111-8111-111111111111'
let app
let responder
let writes
const profile = { id: userId, username: 'testplayer', display_name: 'Test Player', user_type: 'player' }
supabaseAdmin.auth.getUser = async token => token === 'valid' ? { data: { user: { id: userId, email: 'test@example.com' } }, error: null } : { data: { user: null }, error: { message: 'Invalid' } }
supabaseAdmin.from = table => {
  const calls = []
  const chain = new Proxy({}, { get: (_, method) => {
    if (method === 'then') return (resolve, reject) => Promise.resolve(responder(table, calls)).then(resolve, reject)
    return (...args) => { calls.push([method, ...args]); if (['upsert','insert','update'].includes(method)) writes.push({ table, method, value: args[0] }); return chain }
  } })
  return chain
}
supabaseAdmin.rpc = async () => ({ data: null, error: null })
before(async () => { app = await build() })
after(async () => { await app.close() })
const headers = { authorization: 'Bearer valid' }
function reset(fn) { writes = []; responder = fn }

test('onboarding accepts a verified identity without an existing profile and supplies club name', async () => {
  reset((table, calls) => {
    const upsert = calls.find(c => c[0] === 'upsert')
    if (table === 'profiles' && upsert) return { data: { ...upsert[1] }, error: null }
    return { data: null, error: null }
  })
  const res = await app.inject({ method: 'POST', url: '/api/auth/complete-profile', headers, payload: { user_type: 'club', full_name: 'Test Club', username: 'testclub', country: 'Nigeria', interests: [] } })
  assert.equal(res.statusCode, 201, res.body)
  assert.equal(res.json().data.id, userId)
  assert.equal(writes.find(w => w.table === 'club_profiles').value.club_name, 'Test Club')
  assert.ok(!Object.hasOwn(writes.find(w => w.table === 'profiles').value, 'is_verified'))
  assert.ok(!Object.hasOwn(writes.find(w => w.table === 'profiles').value, 'follower_count'))
})
test('onboarding rejects missing and invalid tokens', async () => {
  reset(() => ({ data: null, error: null }))
  for (const authorization of [undefined, 'Bearer invalid']) {
    const res = await app.inject({ method: 'POST', url: '/api/auth/complete-profile', headers: authorization ? { authorization } : {}, payload: {} })
    assert.equal(res.statusCode, 401)
  }
  assert.equal(writes.length, 0)
})
test('new identity cannot access profile-dependent feed', async () => {
  reset(() => ({ data: null, error: null }))
  const res = await app.inject({ method: 'GET', url: '/api/feed', headers })
  assert.equal(res.statusCode, 401)
})
test('invalid onboarding and refresh payloads return validation errors', async () => {
  reset(() => ({ data: null, error: null }))
  for (const url of ['/api/auth/complete-profile', '/api/auth/refresh']) {
    const res = await app.inject({ method: 'POST', url, headers, payload: {} })
    assert.equal(res.statusCode, 400, res.body)
  }
})
test('existing account cannot change its role via onboarding', async () => {
  reset(() => ({ data: { user_type: 'player' }, error: null }))
  const res = await app.inject({ method: 'POST', url: '/api/auth/complete-profile', headers, payload: { user_type: 'scout', full_name: 'Test Scout', username: 'testscout', interests: [] } })
  assert.equal(res.statusCode, 409)
  assert.equal(writes.length, 0)
})
test('posts persist interest tags', async () => {
  reset(table => ({ data: table === 'profiles' ? profile : { id: userId }, error: null }))
  const res = await app.inject({ method: 'POST', url: '/api/posts', headers, payload: { post_type: 'text', content: 'Training today', tags: ['Training'] } })
  assert.equal(res.statusCode, 201, res.body)
  assert.deepEqual(writes.find(w => w.table === 'posts').value.tags, ['Training'])
})
test('directory rejects invalid pagination', async () => {
  reset(() => ({ data: profile, error: null }))
  const res = await app.inject({ method: 'GET', url: '/api/directory?role=player&page=-1', headers })
  assert.equal(res.statusCode, 400)
})
test('private shortlist notes reject a non-owner', async () => {
  reset(table => ({ data: table === 'profiles' ? { ...profile, user_type: 'scout' } : { scout_id: 'someone-else' }, error: null }))
  const res = await app.inject({ method: 'PUT', url: `/api/scouts/shortlists/${userId}/players/${userId}`, headers, payload: { notes: 'Good passing' } })
  assert.equal(res.statusCode, 403)
  assert.equal(writes.length, 0)
})
