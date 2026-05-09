import 'dotenv/config'
import { db } from '../src/lib/prisma'
import { hash } from 'bcryptjs'

async function main() {
  const testEmail = 'teste2@gmail.com'
  const testPassword = '123456'
  const testCompanySlug = 'test-company'
  const testCompanyName = 'Test Company'

  console.log('🌱 Starting test environment setup...\n')

  try {
    await db.user.deleteMany({
      where: { email: testEmail },
    })
    console.log(`✓ Cleaned up existing user with email ${testEmail}`)
  } catch (error) {
    console.log(`ℹ No existing user to remove`)
  }

  let testCompany = await db.company.findUnique({
    where: { slug: testCompanySlug },
  })

  if (!testCompany) {
    testCompany = await db.company.create({
      data: {
        slug: testCompanySlug,
        name: testCompanyName,
        description: 'Ambiente de testes automatizados',
        logo: null,
      },
    })
    console.log(`✓ Created test company: "${testCompanyName}" (slug: ${testCompanySlug})`)
  } else {
    console.log(`✓ Test company already exists: "${testCompanyName}" (slug: ${testCompanySlug})`)
  }

  const hashedPassword = await hash(testPassword, 10)

  const user = await db.user.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      role: 'DEFAULT',
      companyId: testCompany.id,
    },
  })

  console.log(`✓ Test user created successfully!\n`)

  const testProject = await db.project.create({
    data: {
      companyId: testCompany.id,
      name: 'Test Project',
      type: 'LANDING_PAGE',
    },
  })
  console.log(`✓ Created test project: "Test Project"`)

  const testPage = await db.page.create({
    data: {
      projectId: testProject.id,
      name: 'Home',
      slug: 'home',
      content: {
        sections: [
          {
            type: 'hero',
            title: 'Welcome to Test Page',
            description: 'This is a test landing page',
          },
        ],
      },
    },
  })
  console.log(`✓ Created test page: "Home"`)

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TEST ENVIRONMENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 User Credentials:
  📧 Email: ${user.email}
  🔐 Password: ${testPassword}
  🆔 ID: ${user.id}
  👥 Role: ${user.role}

🏢 Company:
  🏷️  Slug: ${testCompany.slug}
  📝 Name: ${testCompany.name}
  🆔 ID: ${testCompany.id}

📁 Project:
  📝 Name: ${testProject.name}
  🎯 Type: ${testProject.type}
  🆔 ID: ${testProject.id}

📄 Page:
  📝 Name: ${testPage.name}
  🔗 Slug: ${testPage.slug}
  🆔 ID: ${testPage.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Access URL:
  http://localhost:3000/test-company/dashboard

✅ Ready for testing!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)
}

main()
  .catch((error) => {
    console.error('❌ Error creating test environment:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  })
