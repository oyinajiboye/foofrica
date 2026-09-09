import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin as db } from '../lib/supabase'
const datasets={posts:{table:'posts',owner:'author_id',columns:'id,content,post_type,image_urls,tags,created_at'},comments:{table:'comments',owner:'author_id',columns:'id,post_id,parent_id,content,created_at'},messages:{table:'messages',owner:'sender_id',columns:'id,conversation_id,content,created_at'},applications:{table:'applications',owner:'player_id',columns:'id,opportunity_id,status,cover_note,created_at'},role_history:{table:'role_switch_history',owner:'user_id',columns:'id,previous_role,next_role,created_at'}} as const
const accountData:FastifyPluginAsync=async app=>{
 app.addHook('preHandler',app.authenticate)
 app.get('/export/:dataset',async(req,reply)=>{
  const {dataset}=z.object({dataset:z.enum(['posts','comments','messages','applications','role_history'])}).parse(req.params)
  const {page}=z.object({page:z.coerce.number().int().min(1).max(100000).default(1)}).parse(req.query)
  const config=datasets[dataset];const size=500
  const {data,error}=await db.from(config.table).select(config.columns).eq(config.owner,req.user.id).order('created_at').order('id').range((page-1)*size,page*size)
  if(error)throw new Error('Unable to export account data')
  const rows=data||[]
  return {success:true,data:{records:rows.slice(0,size),hasMore:rows.length>size,page,dataset}}
 })
 app.delete('/history/recommendations',async(req)=>{
  for(const table of ['feed_feedback','feed_sessions']){const {error}=await db.from(table).delete().eq('user_id',req.user.id);if(error)throw new Error('Unable to clear recommendation history')}
  return {success:true}
 })
}
export default accountData
