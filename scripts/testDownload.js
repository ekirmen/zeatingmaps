// Test script for download functionality
const fetch = require('node-fetch');

async function testDownload() {
  const locator = 'TEST123'; // Replace with a real locator
  const token = 'your_token_here'; // Replace with a real token
  
  const url = `http://localhost:3000/api/payments/${locator}/download`;
  
  try {
    console.log('Testing download endpoint:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const buffer = await response.buffer();
      console.log('PDF size:', buffer.length, 'bytes');
      console.log('✅ Download successful');
    } else {
      const error = await response.text();
      console.log('❌ Download failed:', error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDownload(); 