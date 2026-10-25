
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import './index.css'
import MyRegistrations from './pages/MyRegistrations'
import CreateEvent from './pages/CreateEvent'
import EditEvent  from './pages/EditEvent'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-registrations" element={<MyRegistrations />}/>
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/edit-event/:eventId" element={<EditEvent />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
