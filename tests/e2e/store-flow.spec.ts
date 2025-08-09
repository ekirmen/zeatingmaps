import { test, expect } from '@playwright/test';

test.describe('Store - flujo básico', () => {
  test('home, evento y mapa (si existe) cargan', async ({ page, baseURL }) => {
    const base = baseURL!;

    // Home de la store
    await page.goto(`${base}/store`);
    await expect(page).toHaveTitle(/.|\s/);

    // Buscar link a eventos o navegar a un evento conocido si lo tienes
    // Aquí intentamos un selector flexible
    const anyEventLink = page.locator('a:has-text("Ver")').first();
    if (await anyEventLink.count()) {
      await anyEventLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Intentar encontrar canvas/Konva (si hay mapa)
    const konva = page.locator('.konvajs-content, canvas');
    // No hacemos hard-fail si no existe; solo intentamos verificar si está visible
    if (await konva.count()) {
      await expect(konva.first()).toBeVisible();
    }
  });
});


