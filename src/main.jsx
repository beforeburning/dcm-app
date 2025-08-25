import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { HeroUIProvider } from '@heroui/react'
import { ToastProvider } from '@heroui/toast'
import './assets/main.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HeroUIProvider>
      <ToastProvider placement={'top-center'} />
      <App />
    </HeroUIProvider>
  </StrictMode>,
)
