import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Usage: npx ts-node scripts/generate-hash.ts "minhasenha"')
  process.exit(1)
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(`APP_PASSWORD_HASH=${hash}`)
})
