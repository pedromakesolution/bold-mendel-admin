'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

type AuditAction = 'deactivate_user' | 'reactivate_user' | 'reset_password' | 'change_plan'

/**
 * Writes an entry to the audit_logs table.
 * Called at the end of every admin mutation action.
 */
async function writeAuditLog({
  adminId,
  action,
  targetId,
  targetType = 'profile',
  payload = {},
}: {
  adminId: string
  action: AuditAction
  targetId: string
  targetType?: 'profile' | 'subscription'
  payload?: Record<string, unknown>
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('audit_logs').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    payload,
  })
  if (error) {
    console.error('[audit_logs] Failed to write audit log:', error)
    // Non-fatal — we don't want a log failure to block the primary action
  }
}

// ── deactivateUser ────────────────────────────────────────────────────────────

/**
 * Deactivates a user account with dual-layer security:
 * 1. Soft delete on profile (blocks RLS-protected data access)
 * 2. Auth ban via ban_duration (immediately invalidates JWT refresh)
 * 3. Writes to audit_logs
 */
export async function deactivateUser(userId: string) {
  const session = await requireAdminSession()
  const supabase = createAdminClient()

  // 1. Soft delete on profile — blocks RLS
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileError) {
    return { error: 'Falha ao desativar perfil: ' + profileError.message }
  }

  // 2. Ban in Auth — immediately invalidates refresh token (prevents JWT renewal)
  const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: '876000h', // 100 years ≈ permanent ban
  })

  if (banError) {
    console.error('[deactivateUser] Auth ban failed:', banError)
    // Profile is already soft-deleted — partial success, log the warning
  }

  // 3. Audit log
  await writeAuditLog({
    adminId: session.user.id,
    action: 'deactivate_user',
    targetId: userId,
    payload: { banned_at: new Date().toISOString(), ban_duration: '876000h' },
  })

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
}

// ── reactivateUser ────────────────────────────────────────────────────────────

/**
 * Reactivates a previously deactivated user account.
 * Restores profile active status and removes the Auth ban.
 */
export async function reactivateUser(userId: string) {
  const session = await requireAdminSession()
  const supabase = createAdminClient()

  // 1. Reactivate profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_active: true, deleted_at: null })
    .eq('id', userId)

  if (profileError) {
    return { error: 'Falha ao reativar perfil: ' + profileError.message }
  }

  // 2. Remove Auth ban
  const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  })

  if (unbanError) {
    console.error('[reactivateUser] Auth unban failed:', unbanError)
  }

  // 3. Audit log
  await writeAuditLog({
    adminId: session.user.id,
    action: 'reactivate_user',
    targetId: userId,
    payload: { reactivated_at: new Date().toISOString() },
  })

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
}

// ── sendPasswordReset ─────────────────────────────────────────────────────────

/**
 * Sends a password recovery email to the user.
 * Uses Supabase Admin generateLink to create a recovery URL.
 */
export async function sendPasswordReset(userId: string) {
  const session = await requireAdminSession()
  const supabase = createAdminClient()

  // Fetch user email from auth
  const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(userId)
  if (userError || !authUser.user?.email) {
    return { error: 'Usuário não encontrado ou sem email registrado.' }
  }

  // Generate recovery link — Supabase sends the email automatically
  const { error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: authUser.user.email,
  })

  if (linkError) {
    return { error: 'Falha ao gerar link de recuperação: ' + linkError.message }
  }

  // Audit log
  await writeAuditLog({
    adminId: session.user.id,
    action: 'reset_password',
    targetId: userId,
    payload: { email: authUser.user.email, sent_at: new Date().toISOString() },
  })

  return { success: true }
}

// ── changePlan ────────────────────────────────────────────────────────────────

const VALID_PLANS = ['free', 'starter', 'pro', 'studio'] as const
type Plan = (typeof VALID_PLANS)[number]

/**
 * Manually overrides a user's plan on both profile and subscriptions tables.
 * Records the previous plan in the audit log for traceability.
 */
export async function changePlan(userId: string, newPlan: Plan) {
  if (!VALID_PLANS.includes(newPlan)) {
    return { error: 'Plano inválido.' }
  }

  const session = await requireAdminSession()
  const supabase = createAdminClient()

  // Fetch current plan for audit payload
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_info')
    .eq('id', userId)
    .single()

  const currentBiz = (profile?.business_info as Record<string, unknown>) ?? {}
  const previousPlan = (currentBiz.plan as string) ?? 'unknown'

  // 1. Update profile business_info.plan
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ business_info: { ...currentBiz, plan: newPlan } })
    .eq('id', userId)

  if (profileError) {
    return { error: 'Falha ao atualizar plano no perfil: ' + profileError.message }
  }

  // 2. Update subscriptions.plan_id (manual override)
  await supabase
    .from('subscriptions')
    .update({ plan_id: newPlan })
    .eq('freelancer_id', userId)
  // Subscriptions row may not exist for free users — intentional, not an error

  // 3. Audit log
  await writeAuditLog({
    adminId: session.user.id,
    action: 'change_plan',
    targetId: userId,
    targetType: 'subscription',
    payload: { from: previousPlan, to: newPlan, changed_at: new Date().toISOString() },
  })

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
}

// ── redirectToDashboard ───────────────────────────────────────────────────────
// Utility used by root page redirect
export async function redirectToDashboard() {
  redirect('/dashboard')
}
