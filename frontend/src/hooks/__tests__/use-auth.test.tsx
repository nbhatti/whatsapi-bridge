import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from '../use-auth';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console.error to avoid cluttering test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useAuth', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should throw error when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should initialize with loading state', () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('should fetch user on mount when authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.any(Object));
  });

  it('should handle login successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Mock the initial auth check (returns null)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock successful login
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
      credentials: 'include',
    });
  });

  it('should handle login failure', async () => {
    // Mock the initial auth check (returns null)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock failed login
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBe(null);
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Mock the initial auth check (returns user)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Mock successful logout
    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  });

  it('should refresh user data', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Mock the initial auth check (returns null)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock successful refresh
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(mockUser);
  });
});
