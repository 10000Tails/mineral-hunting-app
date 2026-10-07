/**
 * Account service. The screens call these functions; swap the bodies for a real
 * provider (Supabase, Firebase, Clerk, your own API…) without touching the UI.
 */

export interface NewAccount {
  name: string;
  email: string;
  password: string;
}

export class AuthNotConfiguredError extends Error {
  constructor() {
    super("Accounts aren't connected to a server yet.");
    this.name = 'AuthNotConfiguredError';
  }
}

export async function createAccount(_account: NewAccount): Promise<void> {
  throw new AuthNotConfiguredError();
}

export async function logIn(_email: string, _password: string): Promise<void> {
  throw new AuthNotConfiguredError();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export const MIN_PASSWORD_LENGTH = 8;
