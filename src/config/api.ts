/**
 * API Client for Hono Backend
 *
 * Communicates with the Hono server running on the VPS.
 * Base URL from environment variable: VITE_API_URL
 *
 * Examples:
 *   - apiGet('/transactions?mes=2026-04')
 *   - apiPost('/transactions', { monto: 1000, ... })
 *   - apiPatch('/transactions/123', { validado: true })
 *   - apiDelete('/transactions/123')
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiOptions extends RequestInit {
    throwOnError?: boolean;
}

interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<ApiResponse<T>> {
    const { throwOnError = true, ...fetchOptions } = options;

    const url = `${API_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = data.error || `HTTP ${response.status}`;
            if (throwOnError) {
                throw new Error(error);
            }
            return {
                error,
                status: response.status,
            };
        }

        return {
            data,
            status: response.status,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (throwOnError) {
            throw error;
        }
        return {
            error: message,
            status: 500,
        };
    }
}

/**
 * GET request
 */
export async function apiGet<T>(
    endpoint: string,
    options?: ApiOptions
): Promise<T> {
    const response = await apiFetch<T>(endpoint, {
        ...options,
        method: 'GET',
    });

    if (response.error) throw new Error(response.error);
    return response.data as T;
}

/**
 * POST request
 */
export async function apiPost<T>(
    endpoint: string,
    body?: any,
    options?: ApiOptions
): Promise<T> {
    const response = await apiFetch<T>(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body || {}),
    });

    if (response.error) throw new Error(response.error);
    return response.data as T;
}

/**
 * PATCH request (partial update)
 */
export async function apiPatch<T>(
    endpoint: string,
    body?: any,
    options?: ApiOptions
): Promise<T> {
    const response = await apiFetch<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body || {}),
    });

    if (response.error) throw new Error(response.error);
    return response.data as T;
}

/**
 * PUT request (full replacement)
 */
export async function apiPut<T>(
    endpoint: string,
    body?: any,
    options?: ApiOptions
): Promise<T> {
    const response = await apiFetch<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body || {}),
    });

    if (response.error) throw new Error(response.error);
    return response.data as T;
}

/**
 * DELETE request
 */
export async function apiDelete<T = void>(
    endpoint: string,
    options?: ApiOptions
): Promise<T> {
    const response = await apiFetch<T>(endpoint, {
        ...options,
        method: 'DELETE',
    });

    if (response.error) throw new Error(response.error);
    return response.data as T;
}

/**
 * Batch GET requests (Promise.all)
 */
export async function apiBatchGet<T extends any[]>(
    endpoints: string[],
    options?: ApiOptions
): Promise<T> {
    const promises = endpoints.map((endpoint) => apiGet(endpoint, options));
    return Promise.all(promises) as Promise<T>;
}

export default {
    get: apiGet,
    post: apiPost,
    patch: apiPatch,
    put: apiPut,
    delete: apiDelete,
    batchGet: apiBatchGet,
};
