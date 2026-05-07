import 'dotenv/config'
import { db } from '../src/lib/prisma'

async function testConnection() {
  console.log('🔍 Testing database connection...\n')

  const databaseUrl = process.env.DATABASE_URL
  console.log(`📝 DATABASE_URL: ${databaseUrl ? '✓ Defined' : '✗ Not defined'}`)

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env file')
    console.log('\n📋 Add to .env:')
    console.log('DATABASE_URL="postgresql://postgres:postgres@localhost:5433/meubanco"')
    process.exit(1)
  }

  console.log(`   Connection string format: postgresql://[user]:[pass]@[host]:[port]/[db]`)

  try {
    console.log('\n⏳ Attempting to connect...')

    const result = await db.$queryRaw`SELECT 1`

    console.log('✅ Connection successful!\n')
    console.log('✓ PostgreSQL is running')
    console.log('✓ Credentials are correct')
    console.log('✓ Database exists\n')

    console.log('You can now run: npm run db:seed-test')
  } catch (error) {
    console.error('❌ Connection failed!\n')

    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('SASL') || errorMessage.includes('password')) {
      console.error('🔐 Authentication Error:')
      console.error('   - PostgreSQL is not accepting your credentials')
      console.error('   - Check DATABASE_URL in .env:')
      console.error('   - Format: postgresql://postgres:postgres@localhost:5433/meubanco\n')
      console.error('📝 Common issues:')
      console.error('   1. PostgreSQL not running (port 5433 not listening)')
      console.error('   2. Wrong username/password')
      console.error('   3. Database "meubanco" does not exist')
    } else if (errorMessage.includes('ECONNREFUSED')) {
      console.error('🚫 Connection Refused:')
      console.error('   - PostgreSQL is not running on localhost:5433')
      console.error('   - Start PostgreSQL and ensure it listens on port 5433\n')
    } else if (errorMessage.includes('does not exist')) {
      console.error('📦 Database Not Found:')
      console.error('   - Database "meubanco" does not exist')
      console.error('   - Create it with: createdb -U postgres meubanco\n')
    } else {
      console.error('Error:', errorMessage)
    }

    console.error('---\n')
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

testConnection()
