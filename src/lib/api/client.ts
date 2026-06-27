import { mockClient } from './mock'
import { httpClient } from './http'
import type { ApiClient } from './interface'

export const apiClient: ApiClient =
  import.meta.env.VITE_API_MODE === 'http' ? httpClient : mockClient
