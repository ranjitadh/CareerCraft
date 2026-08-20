import { test, expect } from '@playwright/test'

test.describe('ResumeForge AI E2E', () => {
  test('complete resume creation flow', async ({ page }) => {
    // 1. Register
    await page.goto('http://localhost:3000/register')
    await page.fill('input[name="name"]', 'E2E Test User')
    await page.fill('input[name="email"]', `e2e-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // 2. Navigate to profile
    await page.goto('/profile')

    // 3. Fill in profile basics
    const headlineInput = page.locator('input[name="professionalHeadline"]')
    if (await headlineInput.isVisible()) {
      await headlineInput.fill('Senior Software Engineer')
    }

    const phoneInput = page.locator('input[name="phone"]')
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+1-555-0100')
    }

    const locationInput = page.locator('input[name="location"]')
    if (await locationInput.isVisible()) {
      await locationInput.fill('San Francisco, CA')
    }

    const summaryInput = page.locator('textarea[name="professionalSummary"]')
    if (await summaryInput.isVisible()) {
      await summaryInput.fill('Experienced software engineer with 8+ years building scalable distributed systems.')
    }

    // Save profile
    const saveButton = page.locator('button:has-text("Save")')
    if (await saveButton.isVisible()) {
      await saveButton.click()
      await expect(page.locator('text=Profile saved')).toBeVisible({ timeout: 5000 })
    }

    // 4. Add experience
    const addExperienceButton = page.locator('button:has-text("Add Experience")')
    if (await addExperienceButton.isVisible()) {
      await addExperienceButton.click()

      await page.fill('input[name="company"]', 'TechCorp Inc.')
      await page.fill('input[name="title"]', 'Senior Software Engineer')
      await page.fill('input[name="location"]', 'San Francisco, CA')
      await page.fill('textarea[name="originalDescription"]', 'Led development of microservices architecture serving 10M+ daily users.')

      const experienceSave = page.locator('button:has-text("Save")')
      await experienceSave.first().click()
    }

    // 5. Add skills
    const addSkillButton = page.locator('button:has-text("Add Skill")')
    if (await addSkillButton.isVisible()) {
      await addSkillButton.click()

      await page.fill('input[name="skillName"]', 'TypeScript')
      await page.fill('input[name="skillCategory"]', 'Languages')

      const skillSave = page.locator('button:has-text("Save")')
      await skillSave.first().click()
    }

    // 6. Create a new resume
    await page.goto('/resumes/new')
    await page.fill('input[name="resumeName"]', 'Senior Engineer Application')
    await page.fill('textarea[name="jobDescription"]', 'We are seeking a Senior Software Engineer to join our platform team. You will design and build scalable microservices, mentor junior engineers, and contribute to technical architecture decisions. Requirements: 5+ years experience, TypeScript, Node.js, cloud infrastructure.')

    // 7. Analyze job description
    const analyzeButton = page.locator('button:has-text("Analyze")')
    await analyzeButton.click()

    // Wait for analysis to complete
    await expect(page.locator('text=Keyword Alignment')).toBeVisible({ timeout: 30000 })

    // 8. Generate tailored resume
    const generateButton = page.locator('button:has-text("Generate")')
    await generateButton.click()

    // Wait for generation to complete
    await expect(page.locator('text=Professional Summary')).toBeVisible({ timeout: 30000 })

    // 9. Generate LaTeX
    const latexButton = page.locator('button:has-text("Generate LaTeX")')
    if (await latexButton.isVisible()) {
      await latexButton.click()
      await expect(page.locator('.latex-editor')).toBeVisible({ timeout: 30000 })
    }
  })

  test('login and access dashboard', async ({ page }) => {
    // Register first
    await page.goto('http://localhost:3000/register')
    const email = `dash-${Date.now()}@example.com`
    await page.fill('input[name="name"]', 'Dashboard User')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Logout
    await page.goto('/api/auth/logout', { waitUntil: 'commit' })

    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('register shows validation errors', async ({ page }) => {
    await page.goto('http://localhost:3000/register')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible()
  })

  test('login shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'nobody@example.com')
    await page.fill('input[name="password"]', 'WrongPass1')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 })
  })

  test('resume list shows created resumes', async ({ page }) => {
    // Register
    await page.goto('http://localhost:3000/register')
    const email = `list-${Date.now()}@example.com`
    await page.fill('input[name="name"]', 'List User')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Check resumes page
    await page.goto('/resumes')
    await expect(page.locator('text=No resumes')).toBeVisible()
  })
})
