// This file contains the real Firebase configuration for production use.
// It is separated from emulator config to keep firebase.json clean.

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyANzv5HG-rwkhzchyQG6WFdhP3i9k35P04",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ticketfronted.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ticketfronted",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ticketfronted.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "945637700333",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:945637700333:web:f0ee4709a23fed09cf52e4",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://ticketfronted-default-rtdb.firebaseio.com"
};

export default firebaseConfig;
