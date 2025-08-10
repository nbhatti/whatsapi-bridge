import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../Navigation';
import { useAuth } from '../../hooks/use-auth';

// Mock the auth hook
jest.mock('../../hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Navigation', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('renders nothing when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      login: jest.fn(),
      loading: false,
      error: null,
    });

    const { container } = render(<Navigation />);
    expect(container.firstChild).toBeNull();
  });

  it('renders navigation when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'user' },
      logout: mockLogout,
      login: jest.fn(),
      loading: false,
      error: null,
    });

    render(<Navigation />);

    // Check if main navigation elements are present
    expect(screen.getByText('WhatsApp API')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Devices')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('displays user email when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'user' },
      logout: mockLogout,
      login: jest.fn(),
      loading: false,
      error: null,
    });

    render(<Navigation />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls logout when sign out button is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'user' },
      logout: mockLogout,
      login: jest.fn(),
      loading: false,
      error: null,
    });

    render(<Navigation />);

    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('has correct navigation links', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'user' },
      logout: mockLogout,
      login: jest.fn(),
      loading: false,
      error: null,
    });

    render(<Navigation />);

    // Check navigation links
    expect(screen.getByRole('link', { name: /WhatsApp API/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /Chat/i })).toHaveAttribute('href', '/chat');
    expect(screen.getByRole('link', { name: /Devices/i })).toHaveAttribute('href', '/devices');
    expect(screen.getByRole('link', { name: /Groups/i })).toHaveAttribute('href', '/groups');
    expect(screen.getByRole('link', { name: /Contacts/i })).toHaveAttribute('href', '/contacts');
    expect(screen.getByRole('link', { name: /AI Assistant/i })).toHaveAttribute('href', '/ai');
  });
});
