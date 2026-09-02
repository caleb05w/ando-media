'use server'

import { redirect } from 'next/navigation'

import { grantManifestoAccess, isManifestoPassword } from './access'

export async function unlockManifesto(formData: FormData) {
  if (!isManifestoPassword(formData.get('password'))) {
    redirect('/manifesto?error=1')
  }

  await grantManifestoAccess()
  redirect('/manifesto')
}
