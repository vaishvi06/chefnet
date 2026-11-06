import { describe, it, expect, beforeEach } from 'vitest';
import { tokenStorage } from '../utils/tokenStorage';
import * as z from 'zod';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().regex(passwordPattern, 'Password must be 8+ chars with a letter and a number'),
    confirmPassword: z.string(),
    role: z.enum(['customer', 'chef'])
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

describe('In-Memory Token Storage', () => {
  beforeEach(() => {
    tokenStorage.clearToken();
  });

  it('initially has no token', () => {
    expect(tokenStorage.getToken()).toBeNull();
    expect(tokenStorage.hasToken()).toBe(false);
  });

  it('sets and retrieves access token strictly in memory', () => {
    tokenStorage.setToken('jwt-access-token-sample');
    expect(tokenStorage.getToken()).toBe('jwt-access-token-sample');
    expect(tokenStorage.hasToken()).toBe(true);

    // Verify localStorage/sessionStorage is untouched
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('clears token cleanly', () => {
    tokenStorage.setToken('test-token');
    tokenStorage.clearToken();
    expect(tokenStorage.getToken()).toBeNull();
  });
});

describe('Auth Form Validation Schemas', () => {
  it('validates a correct registration payload', () => {
    const validData = {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'customer'
    };
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects passwords shorter than 8 characters or lacking numbers', () => {
    const invalidData = {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'short',
      confirmPassword: 'short',
      role: 'customer'
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('Password must be 8+ chars');
  });

  it('rejects mismatching passwords', () => {
    const mismatchData = {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'Password123',
      confirmPassword: 'DifferentPassword123',
      role: 'customer'
    };
    const result = registerSchema.safeParse(mismatchData);
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => i.message === 'Passwords do not match')).toBe(true);
  });
});

