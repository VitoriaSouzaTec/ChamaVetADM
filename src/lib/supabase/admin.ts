import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase com Service Role.
 * ATENÇÃO: NUNCA deve ser importado em componentes Client ('use client').
 * Uso restrito a Server Actions e rotas de API protegidas no servidor,
 * exclusivamente para operações administrativas (ex: Supabase Auth Admin API).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL ou Service Role Key ausente no ambiente do servidor.')
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
