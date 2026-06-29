'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function createCloser(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim() || null
  const role = String(formData.get('role') ?? '').trim() || 'Closer'

  if (!name) throw new Error('Nome é obrigatório.')

  const { error } = await supabaseAdmin().from('closers').insert({ name, email, role })
  if (error) throw error

  revalidatePath('/closers')
  revalidatePath('/')
  redirect('/closers')
}

/**
 * Exclui um Closer. ATENÇÃO: por causa do ON DELETE CASCADE, isso apaga também
 * todas as calls, análises, notas e feedbacks vinculados a esse Closer.
 */
export async function deleteCloser(formData: FormData) {
  const id = String(formData.get('id'))
  const { error } = await supabaseAdmin().from('closers').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/closers')
  revalidatePath('/calls')
  revalidatePath('/')
  redirect('/closers')
}

export async function toggleCloserActive(formData: FormData) {
  const id = String(formData.get('id'))
  const active = String(formData.get('active')) === 'true'
  const { error } = await supabaseAdmin().from('closers').update({ active: !active }).eq('id', id)
  if (error) throw error
  revalidatePath('/closers')
}
