import { env } from '../config/env'
import { supabaseAdmin } from '../lib/supabase'
import type { NotificationType } from '../types'

let _firebaseAdmin: typeof import('firebase-admin') | null = null

async function getFirebaseAdmin() {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null
  }
  if (!_firebaseAdmin) {
    const admin = await import('firebase-admin')
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
    }
    _firebaseAdmin = admin
  }
  return _firebaseAdmin
}

interface NotificationPayload {
  recipientId: string
  actorId: string
  type: NotificationType
  entityType?: string
  entityId?: string
}

interface PushMessage {
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * Create a notification record and send a push notification.
 */
export async function createNotification(payload: NotificationPayload) {
  // Don't notify yourself
  if (payload.recipientId === payload.actorId) return

  // Insert notification record
  const { data: notification } = await supabaseAdmin
    .from('notifications')
    .insert({
      recipient_id: payload.recipientId,
      actor_id: payload.actorId,
      type: payload.type,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
    })
    .select()
    .single()

  if (!notification) return

  // Get FCM token for recipient
  const { data: recipient } = await supabaseAdmin
    .from('profiles')
    .select('fcm_token, display_name')
    .eq('id', payload.recipientId)
    .single()

  if (!recipient?.fcm_token) return

  // Get actor name
  const { data: actor } = await supabaseAdmin
    .from('profiles')
    .select('display_name, username')
    .eq('id', payload.actorId)
    .single()

  const actorName = actor?.display_name ?? 'Someone'
  const pushMessage = buildPushMessage(payload.type, actorName)

  await sendPushNotification(recipient.fcm_token, pushMessage, {
    notification_id: notification.id,
    type: payload.type,
    entity_id: payload.entityId ?? '',
  })
}

function buildPushMessage(type: NotificationType, actorName: string): PushMessage {
  const messages: Record<NotificationType, PushMessage> = {
    like: { title: 'New Like', body: `${actorName} liked your post` },
    comment: { title: 'New Comment', body: `${actorName} commented on your post` },
    follow: { title: 'New Follower', body: `${actorName} started following you` },
    mention: { title: 'You were mentioned', body: `${actorName} mentioned you in a post` },
    message: { title: 'New Message', body: `${actorName} sent you a message` },
    endorsement: { title: 'New Endorsement', body: `${actorName} endorsed your skills` },
    verification: { title: 'Profile Verified', body: 'Your profile has been verified!' },
    shortlist: { title: 'Added to Shortlist', body: `${actorName} added you to a shortlist` },
  }
  return messages[type]
}

async function sendPushNotification(
  fcmToken: string,
  message: PushMessage,
  data: Record<string, string> = {}
) {
  const admin = await getFirebaseAdmin()
  if (!admin) {
    console.warn('⚠️  Firebase not configured — skipping push notification')
    return
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
      apns: {
        payload: {
          aps: { badge: 1, sound: 'default' },
        },
      },
    })
  } catch (error) {
    console.error('Push notification failed:', error)
    // Clean up invalid tokens
    if ((error as any)?.code === 'messaging/registration-token-not-registered') {
      await supabaseAdmin
        .from('profiles')
        .update({ fcm_token: null })
        .eq('fcm_token', fcmToken)
    }
  }
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null)

  return count ?? 0
}
