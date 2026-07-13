import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LoginPanel from './Login.jsx'
import { isAuthenticated } from './auth.js'

function RequireAuth({ children }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

function RequireNoAuth({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/app" replace />
  }
  return children
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<RequireNoAuth><LoginPanel /></RequireNoAuth>} />
        <Route path="/app" element={<RequireAuth><App /></RequireAuth>} />
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/app" /> : <Navigate replace to="/login" />} />
        <Route path="*" element={isAuthenticated() ? <Navigate replace to="/app" /> : <Navigate replace to="/login" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
