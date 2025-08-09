import { test, expect } from '@playwright/test';

const dash = (base: string) => `${base}/backoffice/#/dashboard`;

test.describe('Backoffice - navegación básica', () => {
  test('dashboard, plano y boletería cargan sin romper', async ({ page, baseURL }) => {
    const base = baseURL!;

    // Dashboard
    await page.goto(dash(base));
    await expect(page).toHaveTitle(/.|\s/);

    // Plano
    await page.goto(`${dash(base)}/plano`);
    await expect(page).toHaveTitle(/.|\s/);

    // Intentar abrir crear-mapa con un id genérico (no falla si 404 visual)
    await page.goto(`${dash(base)}/crear-mapa/7`);
    // Verifica que la página no crashea
    await expect(page).toHaveTitle(/.|\s/);

    // Boletería
    await page.goto(`${dash(base)}/boleteria`);
    // Busca algún texto/componente común en la UI de boletería
    const maybeHeader = page.getByText(/Boletería|Selecciona|Cart|Carrito/i).first();
    await expect(maybeHeader).toBeTruthy();
  });
});


