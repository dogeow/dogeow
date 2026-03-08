'use client'

import { get } from './core'

export const baseSWRConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
}

export const apiFetcher = <T>(url: string): Promise<T> => get<T>(url)
