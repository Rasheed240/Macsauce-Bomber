import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewCampaign from './pages/NewCampaign'
import CampaignDetail from './pages/CampaignDetail'

import Templates from './pages/Templates'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Unsubscribe from './pages/Unsubscribe'

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="campaigns/new" element={<NewCampaign />} />
                <Route path="campaigns/:id" element={<CampaignDetail />} />
                <Route path="templates" element={<Templates />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              {/* Unsubscribe page (no layout) */}
              <Route path="/unsubscribe/:contactId" element={<Unsubscribe />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
