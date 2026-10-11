import { test, expect } from '@playwright/test'

// Os fluxos autenticados exigem uma conta real da equipe com MFA (TOTP) no
// projeto Supabase configurado em .env.local; aqui ficam só os fluxos públicos.
test.describe('Painel Administrativo ChamaVet - Acesso', () => {
  test('Deve renderizar a tela de login sem atalhos de demonstração', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('ChamaVet Admin')).toBeVisible()
    await expect(page.getByRole('button', { name: /Acessar com Supabase/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Entrar como Admin/i })).toHaveCount(0)
  })

  test('Rotas do painel redirecionam para o login sem sessão', async ({ page }) => {
    for (const path of ['/', '/usuarios', '/verificacoes', '/financeiro']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('Cookie de demonstração antigo não dá acesso', async ({ page, context }) => {
    await context.addCookies([
      { name: 'chamavet_demo_role', value: 'admin', url: 'http://localhost:3000' },
    ])
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })
})
