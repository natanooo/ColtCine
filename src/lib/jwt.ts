import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET || 'coltcine-secret-key-2026'
)

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}
