// Test script for download functionality
const fetch = require('node-fetch');

async function testDownloadEndpoint() {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://zeatingmaps-ekirmens-projects.vercel.app';
  const locator = 'X4YF35J'; // Usar el locator del error
  
  console.log('Testing download endpoint...');
  console.log('Base URL:', baseUrl);
  console.log('Locator:', locator);
  
  try {
    // Primero probar el endpoint simple
    console.log('\n1. Testing simple hello endpoint...');
    const helloResponse = await fetch(`${baseUrl}/api/hello`);
    console.log('Hello response status:', helloResponse.status);
    if (helloResponse.ok) {
      const helloData = await helloResponse.json();
      console.log('Hello response:', helloData);
    } else {
      const errorText = await helloResponse.text();
      console.log('Hello error response:', errorText);
    }
    
    // Luego probar el endpoint de variables de entorno
    console.log('\n2. Testing environment variables endpoint...');
    const envResponse = await fetch(`${baseUrl}/api/test-env`);
    console.log('Env response status:', envResponse.status);
    if (envResponse.ok) {
      const envData = await envResponse.json();
      console.log('Environment variables:', envData);
    } else {
      const errorText = await envResponse.text();
      console.log('Env error response:', errorText);
    }
    
    // Finalmente probar el endpoint de descarga (sin token por ahora)
    console.log('\n3. Testing download endpoint without token...');
    const downloadResponse = await fetch(`${baseUrl}/api/payments/${locator}/download`);
    console.log('Download response status:', downloadResponse.status);
    console.log('Download response headers:', Object.fromEntries(downloadResponse.headers.entries()));
    
    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.log('Download error response:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDownloadEndpoint(); 