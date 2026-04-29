import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const status = useAuthStore(s => s.status);
  const error = useAuthStore(s => s.error);
  const signIn = useAuthStore(s => s.signIn);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch {
      // error stays in store
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
      >
        <h1 className="font-serif text-2xl text-stone-800">Finanzas 2.0</h1>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-stone-600">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-stone-200 px-4 py-2 focus:border-terracotta-400 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-stone-600">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-stone-200 px-4 py-2 focus:border-terracotta-400 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-terracotta-500 py-2 text-white shadow-sm hover:bg-terracotta-600 disabled:opacity-50"
        >
          {isLoading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};
