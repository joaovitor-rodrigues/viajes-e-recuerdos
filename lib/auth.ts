import bcrypt from 'bcryptjs'

export async function verifyPassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, process.env.APP_PASSWORD_HASH!)
}

export async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
