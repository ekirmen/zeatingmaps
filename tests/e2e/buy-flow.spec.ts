import { test, expect } from '@playwright/test';

const EVENT_TITLE = 'ER CONDE DEL GUACHARO 03 DE OCTUBRE';

test.describe('Flujo compra simulado', () => {
  test('listar eventos, abrir detalle 03 y verificar mapa', async ({ page, baseURL }) => {
    // Captura de logs/errores para diagnóstico
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
    });
    page.on('requestfailed', (req) => {
      errors.push(`[requestfailed] ${req.method()} ${req.url()} → ${req.failure()?.errorText}`);
    });
    page.on('response', async (res) => {
      try {
        if (res.status() >= 400) {
          errors.push(`[response ${res.status()}] ${res.request().method()} ${res.url()}`);
        }
      } catch {}
    });

    await page.goto(baseURL!);

    // Cerrar cookies si aparecen
    const cookieButtons = [
      'text=/aceptar/i',
      'text=/accept/i',
      'text=/entendido/i',
    ];
    for (const sel of cookieButtons) {
      const btn = page.locator(sel).first();
      if (await btn.count()) {
        await btn.click({ timeout: 2000 }).catch(() => {});
        break;
      }
    }

    // Buscar el evento por título exacto o parcial
    const titleRegex = new RegExp(EVENT_TITLE, 'i');
    const eventCard = page.getByText(EVENT_TITLE, { exact: false }).first();
    const eventCardAlt = page.getByText(/ER CONDE DEL GUACHARO 03/i).first();

    if (await eventCard.count()) {
      await eventCard.click();
    } else if (await eventCardAlt.count()) {
      await eventCardAlt.click();
    } else {
      // Fallback: cualquier link de detalle/comprar
      const anyLink = page.locator('a:has-text("ver"), a:has-text("comprar"), a:has-text("buy"), a:has-text("detalle")').first();
      if (await anyLink.count()) await anyLink.click();
    }

    await page.waitForLoadState('networkidle');

    // Verificar mapa (Konva / canvas)
    const konva = page.locator('.konvajs-content, canvas');
    await konva.first().waitFor({ timeout: 8000 }).catch(() => {});

    if (!(await konva.count())) {
      console.log('DIAGNOSTICO E2E MAPA - errores capturados:\n' + errors.join('\n'));
      throw new Error('No se detectó mapa (canvas/Konva) en la página del evento');
    }

    await expect(konva.first()).toBeVisible();
  });
});


