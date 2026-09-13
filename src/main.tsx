import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// The boot gate is meant to always greet visitors at the top of the page.
// Without this, a refresh mid-scroll has the browser silently restore the
// old scroll position underneath the gate, so dismissing it dumps you back
// wherever you were instead of at About Me.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
