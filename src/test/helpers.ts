export const mockFetch = (response: unknown, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(ok ? '' : 'Bad request'),
  }) as jest.Mock;
};

export const mockFetch204 = () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 204,
    json: () => Promise.resolve(undefined),
    text: () => Promise.resolve(''),
  }) as jest.Mock;
};