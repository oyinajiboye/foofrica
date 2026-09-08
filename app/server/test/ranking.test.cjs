const {test}=require('node:test')
const assert=require('node:assert/strict')
const {rankPosts,scorePost,learnInterests,normalizeTags,decay}=require('../dist/domain/ranking')
const now=Date.parse('2026-09-08T12:00:00Z')
const post=(id,author,extra={})=>({id,author_id:author,created_at:new Date(now).toISOString(),post_type:'text',likes_count:0,comments_count:0,reposts_count:0,tags:[],author:{user_type:'player'},...extra})
const context=(extra={})=>({role:'scout',now,interests:{},following:new Set(),seen:new Set(),dismissed:new Set(),...extra})
test('normalizes and deduplicates topics across onboarding and post tags',()=>{
 assert.deepEqual(normalizeTags([' Training ','TRAINING','Grassroots   Football','']),['training','grassroots football'])
})
test('stronger meaningful signals preserve interest intensity and decay with time',()=>{
 const signals=[{tags:['passing'],weight:2,at:new Date(now).toISOString()},{tags:['goals'],weight:2,at:new Date(now-21*86400000).toISOString()}]
 const interests=learnInterests([],signals,now)
 assert.equal(interests.passing,2);assert.equal(interests.goals,1)
 assert.equal(decay('invalid',now),0)
})
test('relevant low-engagement talent can outrank a viral unrelated post',()=>{
 const relevant=post('a','new',{tags:['passing']})
 const viral=post('b','popular',{likes_count:1000000})
 assert.equal(rankPosts([viral,relevant],context({interests:{passing:5}}))[0].id,'a')
})
test('club and coach roles have different football priorities',()=>{
 const coach=post('a','a',{author:{user_type:'coach'}}),player=post('b','b')
 assert.ok(scorePost(player,context({role:'club'})).score>scorePost(coach,context({role:'club'})).score)
 assert.ok(scorePost(coach,context({role:'coach'})).score>scorePost(player,context({role:'coach'})).score)
})
test('dismissals exclude posts; seen content is downranked; duplicates do not reappear',()=>{
 const a=post('a','a'),b=post('b','b'),c=post('c','c')
 const ranked=rankPosts([a,b,a,c],context({dismissed:new Set(['c']),seen:new Set(['a'])}))
 assert.deepEqual(ranked.map(p=>p.id),['b','a'])
})
test('creator diversity prevents a prolific account dominating the first ten',()=>{
 const posts=Array.from({length:10},(_,i)=>post('popular'+i,'same',{likes_count:10000})).concat(Array.from({length:12},(_,i)=>post('new'+i,'author'+i)))
 const ranked=rankPosts(posts,context()).slice(0,10)
 assert.ok(ranked.filter(p=>p.author_id==='same').length<=2)
 for(let i=1;i<ranked.length;i++)assert.notEqual(ranked[i].author_id,ranked[i-1].author_id)
})
test('sparse communities return all available posts without artificial filler',()=>{
 assert.equal(rankPosts([post('a','a'),post('b','a')],context()).length,2)
 assert.deepEqual(rankPosts([],context()),[])
})
test('explicit feedback cannot cause unbounded interest weights',()=>{
 const interests=learnInterests([],Array.from({length:1000},()=>({tags:['training'],weight:2,at:new Date(now).toISOString()})),now)
 assert.equal(interests.training,5)
})
