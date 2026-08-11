import 'dotenv/config'
import { db } from '../src/lib/prisma'

async function main() {
  console.log('Adicionando GROQ ao enum geo_provider...')
  await db.$executeRawUnsafe(`ALTER TYPE geo_provider ADD VALUE IF NOT EXISTS 'GROQ';`)
  console.log('✅ GROQ adicionado ao enum no banco Postgres!')
}

main().catch(console.error).finally(() => process.exit(0))
