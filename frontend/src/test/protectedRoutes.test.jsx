import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';

describe('ProtectedRoute Component', () => {
  it('redirects to /login when user is not authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true
    });

    render(
      <MemoryRouter initialEntries={['/customer/discover']}>
        <Routes>
          <Route path="/login" element={<div>Login Page Mock</div>} />
          <Route
            path="/customer/discover"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <div>Secret Customer Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Secret Customer Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated with matching role', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { _id: 'u1', name: 'Aarav Patel', role: 'customer', isLocationVerified: true },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true
    });

    render(
      <MemoryRouter initialEntries={['/customer/discover']}>
        <Routes>
          <Route
            path="/customer/discover"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <div>Secret Customer Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret Customer Content')).toBeInTheDocument();
  });

  it('redirects to /403 when user role is unauthorized', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { _id: 'u2', name: 'Chef Suresh', role: 'chef' },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true
    });

    render(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <Routes>
          <Route path="/403" element={<div>Access Forbidden 403</div>} />
          <Route
            path="/admin/overview"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Secret Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Forbidden 403')).toBeInTheDocument();
    expect(screen.queryByText('Secret Admin Dashboard')).not.toBeInTheDocument();
  });
});

