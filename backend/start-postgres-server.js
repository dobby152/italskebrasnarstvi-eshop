#!/usr/bin/env node

/**
 * Skript pro spuštění PostgreSQL verze serveru
 */

const { spawn } = require('child_process');
const path = require('path');

// Cesta k server-postgres.js
const serverPath = path.join(__dirname, 'server-postgres.js');

// Spuštění serveru
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

console.log(`Spouštím PostgreSQL verzi serveru...`);

server.on('close', (code) => {
  console.log(`Server byl ukončen s kódem: ${code}`);
});

server.on('error', (err) => {
  console.error('Chyba při spuštění serveru:', err);
});

// Zachycení signálů pro graceful shutdown
process.on('SIGINT', () => {
  console.log('\nUkončuji server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nUkončuji server...');
  server.kill('SIGTERM');
});