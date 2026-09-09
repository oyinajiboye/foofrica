import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin as db } from '../lib/supabase'
import { canMessage } from '../services/access.service'
const conversationControls: FastifyPluginAsync = async app => {
 app.addHook('preHandler',app.authenticate)
 app.addHook('preHandler',async(req,reply)=>{
  const {id}=z.object({id:z.string().uuid()}).parse(req.params)
  const {data,error}=await db.from('conversations').select('participant_ids').eq('id',id).maybeSingle()
  if(error)throw new Error('Unable to check conversation')
  if(!data?.participant_ids.includes(req.user.id))return reply.code(403).send({message:'Conversation unavailable'})
  const other=data.participant_ids.find((x:string)=>x!==req.user.id)
  if(other&&!await canMessage(req.user.id,other))return reply.code(403).send({message:'Conversation unavailable'})
 })
 app.put('/:id/preferences',async(req)=>{
  const {id}=req.params as {id:string}
  const body=z.object({pinned:z.boolean().optional(),muted:z.boolean().optional()}).strict().parse(req.body)
  const {data,error}=await db.from('conversation_preferences').upsert({conversation_id:id,user_id:req.user.id,...body},{onConflict:'conversation_id,user_id'}).select().single()
  if(error)throw new Error('Unable to save preferences')
  return {success:true,data}
 })
 app.get('/:id/preferences',async(req)=>{
  const {id}=req.params as {id:string}
  const {data,error}=await db.from('conversation_preferences').select('pinned,muted').eq('conversation_id',id).eq('user_id',req.user.id).maybeSingle()
  if(error)throw new Error('Unable to load preferences')
  return {success:true,data:data||{pinned:false,muted:false}}
 })
 app.put('/:id/presence',async(req)=>{
  const {id}=req.params as {id:string};const {typing}=z.object({typing:z.boolean()}).strict().parse(req.body)
  const {error}=await db.from('conversation_presence').upsert({conversation_id:id,user_id:req.user.id,last_seen_at:new Date().toISOString(),typing_until:new Date(Date.now()+(typing?5000:0)).toISOString()},{onConflict:'conversation_id,user_id'})
  if(error)throw new Error('Unable to update presence')
  return {success:true}
 })
 app.get('/:id/presence',async(req)=>{
  const {id}=req.params as {id:string}
  const {data,error}=await db.from('conversation_presence').select('*').eq('conversation_id',id).neq('user_id',req.user.id).gt('last_seen_at',new Date(Date.now()-30000).toISOString())
  if(error)throw new Error('Unable to load presence')
  const visible=[]
  for(const row of data||[]){const {data:s,error:e}=await db.from('user_settings').select('show_online_status').eq('user_id',row.user_id).maybeSingle();if(e)throw new Error('Unable to check presence privacy');if(s?.show_online_status!==false)visible.push({user_id:row.user_id,online:true,typing:Date.parse(row.typing_until)>Date.now()})}
  return {success:true,data:visible}
 })
}
export default conversationControls
