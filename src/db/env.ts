import { existsSync } from 'node:fs';

/** Loads .env when present (local runs); CI sets the variables directly. */
export function loadEnv(): void {
  if (existsSync('.env')) process.loadEnvFile('.env');
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .env.example)`);
  return value;
}
