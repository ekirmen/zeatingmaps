const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Example HTTPS callable function
exports.helloWorld = functions.https.onCall((data, context) => {
  return { message: 'Hello from Firebase Functions!' };
});

// Add your Firebase Functions here
