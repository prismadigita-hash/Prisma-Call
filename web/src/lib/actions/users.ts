'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Cria um acesso (usuário do Supabase Auth) com e-mail + senha, já confirmado.
// Usa a Admin API (service_role). Disponível para quem já está logado.
export async function createAuthUser(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const full_name = String(formData.get('full_name') ?? '').trim()

  if (!email || !email.includes('@')) {
    redirect('/settings?user_error=' + encodeURIComponent('Informe um e-mail válido.'))
  }
  if (password.length < 6) {
    redirect('/settings?user_error=' + encodeURIComponent('A senha precisa ter ao menos 6 caracteres.'))
  }

  const { error } = await supabaseAdmin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: full_name ? { full_name } : undefined,
  })

  if (error) {
    redirect('/settings?user_error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/settings')
  redirect('/settings?user_ok=' + encodeURIComponent('Acesso criado para ' + email))
}
