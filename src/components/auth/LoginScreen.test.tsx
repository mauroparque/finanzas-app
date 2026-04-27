import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginScreen } from './LoginScreen';
import { useAuthStore } from '../../store/authStore';

describe('LoginScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, status: 'idle', error: null });
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders email and password inputs and submit button', () => {
    render(<LoginScreen />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('calls signIn with form values on submit', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ signIn } as never);

    render(<LoginScreen />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pw123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.com', 'pw123'));
  });

  it('renders error from store', () => {
    useAuthStore.setState({ session: null, status: 'error', error: 'Credenciales inválidas' });
    render(<LoginScreen />);
    expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
  });

  it('disables submit button while loading', () => {
    useAuthStore.setState({ session: null, status: 'loading', error: null });
    render(<LoginScreen />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
