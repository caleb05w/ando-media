import { cookies } from 'next/headers'

const MANIFESTO_ACCESS_COOKIE = 'ando_manifesto_access'
const MANIFESTO_ACCESS_COOKIE_VALUE =
  'v1:7b1843c6d84a8b7904b0b90445fe0d98b72bf27f3a98a7c98c348bfb58a6e0d9'
const MANIFESTO_PASSWORD = 'contextisallyouneed'

export async function hasManifestoAccess() {
  const cookieStore = await cookies()
  return (
    cookieStore.get(MANIFESTO_ACCESS_COOKIE)?.value ===
    MANIFESTO_ACCESS_COOKIE_VALUE
  )
}

export function isManifestoPassword(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value === MANIFESTO_PASSWORD
}

export async function grantManifestoAccess() {
  const cookieStore = await cookies()
  cookieStore.set(MANIFESTO_ACCESS_COOKIE, MANIFESTO_ACCESS_COOKIE_VALUE, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/manifesto',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
