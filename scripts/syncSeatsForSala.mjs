#!/usr/bin/env node
import { syncSeatsForSala } from '../src/backoffice/services/apibackoffice.js';

const salaId = process.argv[2];
if (!salaId) {
  console.error('Usage: node syncSeatsForSala.mjs <salaId>');
  process.exit(1);
}

syncSeatsForSala(salaId)
  .then(() => {
    console.log(`Seats synchronized for sala ${salaId}`);
  })
  .catch((err) => {
    console.error('Error syncing seats:', err.message || err);
    process.exit(1);
  });

