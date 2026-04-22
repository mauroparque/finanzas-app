import { describe, it, expect, beforeEach } from 'vitest';
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
} from './api';
import { mockFetch, mockFetch204 } from '../test/helpers';

describe('PostgREST API CRUD helpers', () => {
  beforeEach(() => {
    import.meta.env.VITE_API_URL = 'https://api.test.com';
    import.meta.env.DEV = true;
  });

  describe('apiGet', () => {
    it('returns typed array from GET request', async () => {
      const data = [{ id: 1, nombre: 'Test' }];
      mockFetch(data);
      const result = await apiGet<{ id: number; nombre: string }>('/test');
      expect(result).toEqual(data);
    });

    it('passes query params to URL', async () => {
      mockFetch([]);
      await apiGet('/test', { activo: 'eq.true' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('activo=eq.true'),
        expect.any(Object)
      );
    });

    it('throws on non-ok response', async () => {
      mockFetch(null, false);
      await expect(apiGet('/test')).rejects.toThrow();
    });
  });

  describe('apiPost', () => {
    it('sends body as JSON and returns created record', async () => {
      const created = { id: 1, nombre: 'Created' };
      mockFetch([created]);
      const result = await apiPost('/test', { nombre: 'Created' });
      expect(result).toEqual(created);
    });

    it('handles PostgREST Prefer: return=representation array response', async () => {
      const record = { id: 42, monto: 100 };
      mockFetch([record]);
      const result = await apiPost<{ monto: number }, { id: number; monto: number }>('/test', { monto: 100 });
      expect(result).toEqual(record);
    });
  });

  describe('apiPatch', () => {
    it('sends filter params and partial body', async () => {
      const updated = [{ id: 1, nombre: 'Updated' }];
      mockFetch(updated);
      const result = await apiPatch('/test', { id: 'eq.1' }, { nombre: 'Updated' });
      expect(result).toEqual(updated);
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const [, opts] = call;
      const body = JSON.parse(opts.body as string);
      expect(body).toEqual({ nombre: 'Updated' });
    });
  });

  describe('apiDelete', () => {
    it('sends DELETE with filter params', async () => {
      mockFetch(null);
      await apiDelete('/test', { id: 'eq.1' });
      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('id=eq.1');
      expect(call[1].method).toBe('DELETE');
    });

    it('handles 204 No Content', async () => {
      mockFetch204();
      await expect(apiDelete('/test', { id: 'eq.1' })).resolves.toBeUndefined();
    });
  });
});