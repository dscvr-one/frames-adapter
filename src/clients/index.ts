import { Client, cacheExchange, fetchExchange } from '@urql/core';

export const useUrqlClient = (apiUrl: string) => {
  return new Client({
    url: apiUrl,
    exchanges: [cacheExchange, fetchExchange],
  });
};
