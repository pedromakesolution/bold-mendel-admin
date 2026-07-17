'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

type AuditAction = 'deactivate_user' | 'reactivate_user' | 'reset_password' | 'change_plan' | 'anonymize_user' | 'hard_delete_user'

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

  // 3. Update dedicated plan column on profiles
  await supabase
    .from('profiles')
    .update({ plan: newPlan })
    .eq('id', userId)

  // 4. Audit log
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

// ── anonymizeUser ─────────────────────────────────────────────────────────────

/**
 * LGPD Tombstoning — permanently anonymizes a user's PII.
 *
 * This is NOT a hard delete. The user's UUID remains intact so that:
 *   - contracts remain valid (freelancer_id references preserved)
 *   - transactions maintain fiscal integrity (6-year retention)
 *   - audit trail is complete
 *
 * What gets destroyed:
 *   - name, email, phone, CPF/CNPJ, PIX key, avatar (PII)
 *   - auth credentials (password reset to random, account banned)
 *
 * What is preserved:
 *   - UUID (referential integrity)
 *   - contracts, transactions, projects (fiscal/legal records)
 *   - audit_logs (immutable — anonymization itself is logged)
 */
export async function anonymizeUser(userId: string) {
  const session = await requireAdminSession()
  const supabase = createAdminClient()

  // 1. Read current profile data BEFORE anonymization (for audit record)
  const { data: profile, error: profileFetchError } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single()

  if (profileFetchError || !profile) {
    return { error: 'Usuário não encontrado.' }
  }

  const anonEmail = `deleted_${crypto.randomUUID()}@deleted.freeladock.com`

  // 2. Audit BEFORE the write (records original PII for legal purposes)
  await writeAuditLog({
    adminId: session.user.id,
    action: 'anonymize_user',
    targetId: userId,
    payload: {
      original_name: profile.full_name,
      original_email: profile.email,
      anonymized_at: new Date().toISOString(),
      anon_email: anonEmail,
    },
  })

  // 3. Overwrite PII in profiles — UUID stays intact
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name:     '[Usuário Excluído - LGPD]',
      email:         anonEmail,
      avatar_url:    null,
      cpf_cnpj:      null,
      phone:         null,
      pix_key:       null,
      business_info: {},
      plan:          'free',
      is_active:     false,
      deleted_at:    new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileError) {
    return { error: 'Falha ao anonimizar perfil: ' + profileError.message }
  }

  // 4. Invalidate auth credentials (user can never log in again)
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    email:        anonEmail,
    password:     crypto.randomUUID(), // cryptographically random — unguessable
    ban_duration: '876000h',           // 100 years = permanent
    user_metadata: {
      deleted: true,
      deleted_at: new Date().toISOString(),
    },
  })

  if (authError) {
    console.error('[anonymizeUser] Auth update failed:', authError)
    // Profile is already anonymized — partial success, non-fatal
  }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { success: true }
}

// ── hardDeleteUser ─────────────────────────────────────────────────────────────

/**
 * Hard deletes a user from the database.
 * This permanently deletes the user from auth.users and profiles.
 * CAUTION: May fail if there are foreign key constraints (e.g. contracts, projects)
 * unless ON DELETE CASCADE is configured.
 */
export async function hardDeleteUser(userId: string) {
  const session = await requireAdminSession()
  const supabase = createAdminClient()

  // 1. Read current profile data BEFORE deletion (for audit record)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single()

  // 2. Audit BEFORE the write
  await writeAuditLog({
    adminId: session.user.id,
    action: 'hard_delete_user',
    targetId: userId,
    payload: {
      original_name: profile?.full_name,
      original_email: profile?.email,
      hard_deleted_at: new Date().toISOString(),
    },
  })

  // 3. Delete from auth.users (this often cascades to public.profiles)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    console.error('[hardDeleteUser] Auth delete failed:', authError)
    let errorMessage = authError.message
    if (!errorMessage || errorMessage === '{}' || errorMessage === '[object Object]') {
      errorMessage = 'O usuário possui registros dependentes (como contratos ou faturas) e não pode ser excluído permanentemente.'
    }
    return { error: 'Falha ao excluir usuário na autenticação: ' + errorMessage }
  }

  // 4. Fallback: manually delete from profiles if no cascade
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    console.error('[hardDeleteUser] Profile delete failed:', profileError)
  }

  revalidatePath('/users')
  // We can't easily redirect from here if called from a button on the details page,
  // we will handle navigation on the client.
  return { success: true }
}
