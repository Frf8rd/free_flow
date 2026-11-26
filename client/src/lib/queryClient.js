import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // fără reîncercări la erori 4xx (nu se vor repara singure)
      retry: (count, err) => (err?.status >= 400 && err?.status < 500 ? false : count < 1),
    },
    mutations: { retry: false },
  },
});
