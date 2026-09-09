const { test, before, after } = require('node:test')
global.fetch=async()=>{throw new Error('Network calls are forbidden in regression tests')}
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
  assert.deepEqual(writes.find(w => w.table === 'posts').value.tags, ['training'])
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

const otherId='22222222-2222-4222-8222-222222222222'
const {ageOn,canTransitionApplication,opportunitySchema}=require('../dist/domain/recruitment')
test('application lifecycle preserves withdrawal and prevents applicant self-promotion',()=>{
 assert.equal(canTransitionApplication('submitted','shortlisted',true),false)
 assert.equal(canTransitionApplication('submitted','withdrawn',true),true)
 assert.equal(canTransitionApplication('withdrawn','invited',false),false)
 assert.equal(canTransitionApplication('invited','shortlisted',false),false)
 assert.equal(canTransitionApplication('submitted','invited',false),true)
})
test('age eligibility changes on birthday in UTC and rejects invalid dates',()=>{
 assert.equal(ageOn('2010-09-09',new Date('2026-09-08T23:59:59Z')),15)
 assert.equal(ageOn('2010-09-09',new Date('2026-09-09T00:00:00Z')),16)
 assert.equal(ageOn('invalid'),null)
 assert.equal(opportunitySchema.safeParse({title:'Trial',description:'Open trial for skilled players',country:'Nigeria',deadline:'2027-01-01T00:00:00Z',min_age:24,max_age:18}).success,false)
})
test('unverified clubs and other roles cannot publish opportunities',async()=>{
 for(const user_type of ['club','player','scout']){
  reset(table=>({data:table==='profiles'?{...profile,user_type,is_verified:false}:null,error:null}))
  const res=await app.inject({method:'POST',url:'/api/recruitment/opportunities',headers,payload:{}})
  assert.equal(res.statusCode,403,res.body);assert.equal(writes.length,0)
 }
})
test('applicants cannot promote themselves and third parties cannot change applications',async()=>{
 for(const player_id of [userId,otherId]){
  reset(table=>({data:table==='profiles'?profile:table==='applications'?{player_id,status:'submitted',opportunity:{club_id:otherId}}:null,error:null}))
  const res=await app.inject({method:'PUT',url:`/api/recruitment/applications/${otherId}`,headers,payload:{status:'invited'}})
  assert.equal(res.statusCode,player_id===userId?409:403,res.body);assert.equal(writes.length,0)
 }
})
test('verification review requires an administrator',async()=>{
 reset(table=>({data:table==='profiles'?{...profile,is_admin:false}:null,error:null}))
 const res=await app.inject({method:'PUT',url:`/api/recruitment/verification/${otherId}/review`,headers,payload:{status:'approved',review_note:'Approved'}})
 assert.equal(res.statusCode,403);assert.equal(writes.length,0)
})
test('club cannot accept an invitation on behalf of a player',async()=>{
 reset(table=>({data:table==='profiles'?{...profile,user_type:'club'}:table==='squad_memberships'?{club_id:userId,player_id:otherId,status:'pending'}:null,error:null}))
 const res=await app.inject({method:'PUT',url:`/api/recruitment/squad/${otherId}`,headers,payload:{status:'accepted'}})
 assert.equal(res.statusCode,403);assert.equal(writes.length,0)
})
test('private profiles protect career and season subresources',async()=>{
 reset(table=>({data:table==='profiles'?profile:table==='blocked_users'?[]:table==='user_settings'?{profile_visibility:'private'}:[],error:null}))
 for(const suffix of ['career','stats','videos','endorsements']){
  const res=await app.inject({url:`/api/profiles/${otherId}/${suffix}`,headers})
  assert.equal(res.statusCode,403,res.body)
 }
})
test('blocked authors cannot be accessed through direct post comments',async()=>{
 reset(table=>({data:table==='profiles'?profile:table==='posts'?{author_id:otherId,visibility:'public'}:table==='blocked_users'?[{blocker_id:userId,blocked_id:otherId}]:null,error:null}))
 const res=await app.inject({url:`/api/posts/${otherId}/comments`,headers})
 assert.equal(res.statusCode,403,res.body)
})
test('messaging honors nobody preference and performs no writes',async()=>{
 reset(table=>({data:table==='profiles'?profile:table==='blocked_users'?[]:table==='user_settings'?{who_can_dm:'nobody'}:null,error:null}))
 const res=await app.inject({method:'POST',url:'/api/messages/conversations',headers,payload:{recipient_id:otherId,message:'Hello'}})
 assert.equal(res.statusCode,403,res.body);assert.equal(writes.length,0)
})
test('non-participants cannot download private attachments',async()=>{
 reset(table=>({data:table==='profiles'?profile:table==='message_attachments'?{message:{conversation:{participant_ids:[otherId]}}}:null,error:null}))
 const res=await app.inject({url:`/api/messages/attachments/${otherId}`,headers})
 assert.equal(res.statusCode,403,res.body)
})
test('empty poll options fail validation before creating a post',async()=>{
 reset(table=>({data:table==='profiles'?profile:null,error:null}))
 const res=await app.inject({method:'POST',url:'/api/posts',headers,payload:{content:'Choose a player',post_type:'poll',poll_options:['','B']}})
 assert.equal(res.statusCode,400,res.body);assert.equal(writes.length,0)
})
test('video posts reject another uploaders video',async()=>{
 reset(table=>({data:table==='profiles'?profile:table==='videos'?{uploader_id:otherId,status:'ready'}:null,error:null}))
 const res=await app.inject({method:'POST',url:'/api/posts',headers,payload:{post_type:'video',video_id:otherId}})
 assert.equal(res.statusCode,400,res.body);assert.equal(writes.length,0)
})

test('OAuth uses unique per-browser PKCE challenges and restricts providers',async()=>{
 reset(()=>({data:null,error:null}))
 const one=await app.inject({method:'POST',url:'/api/auth/oauth/google'})
 const two=await app.inject({method:'POST',url:'/api/auth/oauth/google'})
 assert.equal(one.statusCode,200,one.body);assert.equal(two.statusCode,200,two.body)
 const a=one.json().data,b=two.json().data
 assert.notEqual(a.verifier,b.verifier)
 const expected=require('node:crypto').createHash('sha256').update(a.verifier).digest('base64url')
 assert.equal(new URL(a.url).searchParams.get('code_challenge'),expected)
 const bad=await app.inject({method:'POST',url:'/api/auth/oauth/untrusted'})
 assert.equal(bad.statusCode,400)
})

test('feed cursors are scoped to their owner and expire safely',async()=>{
 let ownerFilter=false
 reset((table,calls)=>{
  if(table==='feed_sessions')ownerFilter=calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]===userId)
  return {data:table==='profiles'?profile:null,error:null}
 })
 const res=await app.inject({url:`/api/feed?cursor=${otherId}:0&limit=10`,headers})
 assert.equal(res.statusCode,410,res.body);assert.ok(ownerFilter)
})
test('ranked pagination fills past newly private posts and returns a continuation',async()=>{
 const b='33333333-3333-4333-8333-333333333333',c='44444444-4444-4444-8444-444444444444'
 reset(table=>({data:table==='profiles'?profile:table==='feed_sessions'?{post_ids:[otherId,b,c]}:table==='posts'?[
  {id:otherId,author_id:otherId,visibility:'public',post_type:'text'},
  {id:b,author_id:userId,visibility:'public',post_type:'text'},
  {id:c,author_id:userId,visibility:'public',post_type:'text'}
 ]:table==='user_settings'?[{user_id:otherId,profile_visibility:'private'}]:[],error:null}))
 const res=await app.inject({url:`/api/feed?cursor=${otherId}:0&limit=1`,headers})
 assert.equal(res.statusCode,200,res.body)
 assert.equal(res.json().data.data[0].id,b)
 assert.equal(res.json().data.hasMore,true)
 assert.equal(res.json().data.next_cursor,`${otherId}:2`)
})
test('recommendation feedback rejects unavailable posts',async()=>{
 reset(table=>({data:table==='profiles'?profile:table==='posts'?{author_id:otherId,visibility:'public'}:table==='blocked_users'?[{blocker_id:userId,blocked_id:otherId}]:null,error:null}))
 const res=await app.inject({method:'POST',url:`/api/feed/feedback/${otherId}`,headers,payload:{kind:'interested'}})
 assert.equal(res.statusCode,403,res.body);assert.equal(writes.length,0)
})


test('role matrix denies specialist mutations to other account types', async () => {
 const routes = [
  ['player','POST',`/api/players/${userId}/career`],
  ['player','PUT',`/api/players/${userId}/stats`],
  ['player','PUT',`/api/players/${userId}/career/${otherId}`],
  ['player','DELETE',`/api/players/${userId}/career/${otherId}`],
  ['player','PUT',`/api/profiles/${userId}/stats`],
  ['club','POST',`/api/clubs/${userId}/verify-player/${otherId}`],
  ['coach','DELETE',`/api/coaches/${userId}/endorse/${otherId}?skill=pace`],
  ['scout','GET','/api/scouts/shortlists'],
 ]
 for (const [allowed,method,url] of routes) for (const role of ['fan','club','player','scout','coach'].filter(r=>r!==allowed)) {
  reset(table=>({data:table==='profiles'?{...profile,user_type:role}:null,error:null}))
  const res=await app.inject({method,url,headers,...(['POST','PUT'].includes(method)?{payload:{}}:{})})
  assert.equal(res.statusCode,403,`${role} ${method} ${url}: ${res.body}`)
  assert.equal(writes.length,0)
 }
})
test('player endpoints reject injected ownership fields before database writes',async()=>{
 for (const [method,url,payload] of [
  ['PUT',`/api/players/${userId}/stats`,{season:'2026',club_name:'Club',player_id:otherId}],
  ['POST',`/api/players/${userId}/career`,{club_name:'Club',start_date:'2026-01-01',player_id:otherId}],
  ['PUT',`/api/players/${userId}/career/${otherId}`,{player_id:otherId}],
 ]) {
  reset(table=>({data:table==='profiles'?profile:null,error:null}))
  const res=await app.inject({method,url,headers,payload})
  assert.equal(res.statusCode,400,res.body)
  assert.equal(writes.length,0)
 }
})
