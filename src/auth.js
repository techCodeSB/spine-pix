export const TOKEN_KEY = 'passportAuthToken'

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const isAuthenticated = () => {
  return Boolean(getToken())
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
