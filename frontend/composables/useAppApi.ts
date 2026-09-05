type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, any> | FormData;
  query?: Record<string, string | number | undefined>;
};

export function useAppApi() {
  const config = useRuntimeConfig();
  const accessToken = useCookie<string | null>('dau_access_token', { sameSite: 'lax' });
  const refreshToken = useCookie<string | null>('dau_refresh_token', { sameSite: 'lax' });

  async function request<T>(path: string, options: ApiOptions = {}) {
    const headers: Record<string, string> = {};
    if (accessToken.value) headers.authorization = `Bearer ${accessToken.value}`;
    return $fetch<T>(`${config.public.apiBase}${path}`, { ...options, body: options.body, headers });
  }

  return { accessToken, refreshToken, request };
}
