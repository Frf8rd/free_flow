import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/layout/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProjectNew from './pages/ProjectNew'
import Projects from './pages/Projects'
import Recommendations from './pages/Recommendations'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="workspace">
        <Routes>
          <Route path="/" element={<Recommendations />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<Dashboard />} />
          <Route path="/settings" element={<Dashboard />} />
          <Route path="/projects/active" element={<Projects />} />
          <Route path="/projects/archive" element={<Projects />} />
          <Route path="/projects/new" element={<ProjectNew />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}