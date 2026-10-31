import axios from 'axios'

export class ApiError extends Error {
  constructor(code, message, fields, status) {
    super(message)
    this.code = code
    this.fields = fields
    this.status = status
  }
}

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const body = err.response?.data?.error
    const apiError = body
      ? new ApiError(body.code, body.message, body.fields, err.response.status)
      : new ApiError('NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.', undefined, 0)

    if (apiError.code === 'AUTH_REQUIRED' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
    return Promise.reject(apiError)
  },
)
