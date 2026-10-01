import { test, expect } from '@playwright/test'

test.describe('Painel Administrativo ChamaVet - Fluxos Principais', () => {
  test('Deve renderizar a tela de login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('ChamaVet Admin')).toBeVisible()
    await expect(page.getByRole('button', { name: /Entrar como Admin/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Entrar como Suporte/i })).toBeVisible()
  })

  test('Admin: Login com acesso total e menu financeiro visível', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Entrar como Admin")')
    await page.waitForURL('http://localhost:3000/')

    // Valida títulos e menus exclusivos de admin
    await expect(page.getByText('Visão Geral da Plataforma')).toBeVisible()
    await expect(page.getByRole('link', { name: /Financeiro/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Configurações/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Equipe/i })).toBeVisible()
  })

  test('Suporte: Menu com restrições de permissão', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Entrar como Suporte")')
    await page.waitForURL('http://localhost:3000/')

    // Menus operacionais visíveis
    await expect(page.getByRole('link', { name: /Verificações/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Denúncias/i })).toBeVisible()

    // Menus administrativos NÃO devem estar presentes
    await expect(page.getByRole('link', { name: /Financeiro/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Configurações/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Equipe/i })).toHaveCount(0)
  })

  test('Operação: Navegação na fila de verificações', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Entrar como Admin")')
    await page.goto('/verificacoes')

    await expect(page.getByText('Fila de Verificação de Cadastros')).toBeVisible()
    await expect(page.getByRole('button', { name: /Profissionais/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Clínicas/i })).toBeVisible()
  })
})
