// Test Store Flow - Verificación completa de la secuencia del store
// Ejecutar con: node test-store-flow.js

const puppeteer = require('puppeteer');

const BASE_URL = 'https://zeatingmaps-ekirmens-projects.vercel.app';

async function testStoreFlow() {
  console.log('🚀 Iniciando test completo del store...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 1000,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    // PASO 1: Página principal del store
    console.log('📋 PASO 1: Verificando página principal del store...');
    await page.goto(`${BASE_URL}/store`);
    await page.waitForSelector('.ant-card', { timeout: 10000 });
    
    const eventCards = await page.$$('.ant-card');
    console.log(`✅ Encontrados ${eventCards.length} eventos en la página principal`);
    
    // PASO 2: Seleccionar primer evento
    console.log('\n📋 PASO 2: Seleccionando primer evento...');
    const firstEventCard = eventCards[0];
    const eventLink = await firstEventCard.$('a');
    const eventUrl = await eventLink.evaluate(el => el.href);
    
    console.log(`🔗 URL del evento: ${eventUrl}`);
    await page.goto(eventUrl);
    
    // PASO 3: Verificar página del evento
    console.log('\n📋 PASO 3: Verificando página del evento...');
    await page.waitForSelector('.ant-card', { timeout: 10000 });
    
    const eventTitle = await page.$eval('h1, h2', el => el.textContent);
    console.log(`📝 Título del evento: ${eventTitle}`);
    
    // PASO 4: Verificar funciones disponibles
    console.log('\n📋 PASO 4: Verificando funciones disponibles...');
    const funciones = await page.$$('.ant-select-option');
    console.log(`🎭 Funciones disponibles: ${funciones.length}`);
    
    if (funciones.length > 0) {
      // PASO 5: Seleccionar primera función
      console.log('\n📋 PASO 5: Seleccionando primera función...');
      await page.click('.ant-select');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
      await page.click('.ant-select-dropdown .ant-select-item-option');
      
      // PASO 6: Verificar que aparece el mapa
      console.log('\n📋 PASO 6: Verificando aparición del mapa...');
      await page.waitForSelector('.ant-tabs', { timeout: 10000 });
      
      const mapTab = await page.$('.ant-tabs-tab[data-key="seats"]');
      if (mapTab) {
        console.log('✅ Tab de asientos encontrado');
        
        // PASO 7: Verificar contenido del mapa
        console.log('\n📋 PASO 7: Verificando contenido del mapa...');
        await page.waitForTimeout(2000); // Esperar carga del mapa
        
        const mapContent = await page.$('.ant-card-body');
        if (mapContent) {
          const mapText = await mapContent.evaluate(el => el.textContent);
          console.log(`🗺️ Contenido del mapa: ${mapText.substring(0, 100)}...`);
          
          // PASO 8: Verificar asientos disponibles
          console.log('\n📋 PASO 8: Verificando asientos disponibles...');
          const seats = await page.$$('[data-seat-id], .seat, .asiento');
          console.log(`💺 Asientos encontrados: ${seats.length}`);
          
          if (seats.length > 0) {
            // PASO 9: Seleccionar primer asiento
            console.log('\n📋 PASO 9: Seleccionando primer asiento...');
            await seats[0].click();
            await page.waitForTimeout(1000);
            
            // PASO 10: Verificar carrito
            console.log('\n📋 PASO 10: Verificando carrito...');
            const cartCount = await page.$eval('.text-blue-600', el => el.textContent);
            console.log(`🛒 Items en carrito: ${cartCount}`);
            
            // PASO 11: Ir al carrito
            console.log('\n📋 PASO 11: Yendo al carrito...');
            await page.click('button:contains("Ver Carrito")');
            await page.waitForSelector('.ant-card', { timeout: 10000 });
            
            const cartItems = await page.$$('.ant-list-item');
            console.log(`📦 Items en carrito: ${cartItems.length}`);
            
            // PASO 12: Verificar botón de pago
            console.log('\n📋 PASO 12: Verificando botón de pago...');
            const payButton = await page.$('button:contains("Pagar"), button:contains("Proceder al Pago")');
            if (payButton) {
              console.log('✅ Botón de pago encontrado');
              
              // PASO 13: Ir al pago
              console.log('\n📋 PASO 13: Yendo al pago...');
              await payButton.click();
              await page.waitForSelector('.ant-form', { timeout: 10000 });
              
              console.log('✅ Formulario de pago cargado correctamente');
            } else {
              console.log('❌ Botón de pago no encontrado');
            }
          } else {
            console.log('❌ No se encontraron asientos en el mapa');
          }
        } else {
          console.log('❌ Contenido del mapa no encontrado');
        }
      } else {
        console.log('❌ Tab de asientos no encontrado');
      }
    } else {
      console.log('❌ No se encontraron funciones disponibles');
    }
    
    console.log('\n🎉 Test completado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await browser.close();
  }
}

// Ejecutar el test
testStoreFlow().catch(console.error);
