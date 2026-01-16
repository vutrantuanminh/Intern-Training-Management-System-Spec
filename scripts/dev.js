#!/usr/bin/env node
const { spawn } = require('child_process');

const useSmeeEnv = process.env.USE_SMEE;
const useSmee = !(useSmeeEnv === 'false' || useSmeeEnv === '0');
const smeeUrl = process.env.SMEE_URL || 'https://smee.io/sXxkAtqpqOujy7';
// Default forward target for smee: production Vercel app webhook endpoint
const smeeTarget = process.env.SMEE_TARGET || 'https://intern-training-management-system-s.vercel.app/api/github/webhook';

const procs = [];

function startCommand(command, args, name) {
  const child = spawn(command, args, { stdio: 'inherit', shell: true });
  child.on('exit', (code, signal) => {
    if (code !== 0) {
      console.log(`${name} exited with code ${code} ${signal ? `(signal ${signal})` : ''}`);
    }
  });
  procs.push(child);
}

if (useSmee) {
  console.log('Starting smee forwarder ->', smeeUrl, '->', smeeTarget);
  startCommand('npx', ['smee', '-u', smeeUrl, '-t', smeeTarget], 'smee');
} else {
  console.log('Skipping smee (USE_SMEE is false)');
}

console.log('Starting vite dev server');
startCommand('npx', ['vite'], 'vite');

function shutdown() {
  console.log('\nShutting down processes...');
  procs.forEach((p) => {
    try { p.kill(); } catch (e) {}
  });
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
