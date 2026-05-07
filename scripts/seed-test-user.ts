import 'dotenv/config'
import { db } from '../src/lib/prisma'
import { hash } from 'bcryptjs'

async function main() {
  const testEmail = 'teste2@gmail.com'
  const testPassword = '123456'

  console.log('🌱 Starting test user creation...')

  try {
    await db.user.deleteMany({
      where: { email: testEmail },
    })
    console.log(`✓ Removed existing user with email ${testEmail}`)
  } catch (error) {
    console.log(`ℹ No existing user to remove`)
  }

  const hashedPassword = await hash(testPassword, 10)

  const user = await db.user.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      role: 'DEFAULT',
    },
  })

  console.log('✓ Test user created successfully!')
  console.log(`
  📧 Email: ${user.email}
  🔐 Password: ${testPassword}
  👤 Role: ${user.role}
  🆔 ID: ${user.id}
  `)
}

main()
  .catch((error) => {
    console.error('❌ Error creating test user:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  })
