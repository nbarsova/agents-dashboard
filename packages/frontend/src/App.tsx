import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AgentDetail from './pages/AgentDetail';
import Login from './pages/Login';
import OrgOverview from './pages/OrgOverview';
import PersonalDashboard from './pages/PersonalDashboard';
import Signup from './pages/Signup';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/orgs/:orgId/overview" element={<OrgOverview />} />
              <Route path="/orgs/:orgId/agents/:agentId" element={<AgentDetail />} />
              <Route path="/me/analytics" element={<PersonalDashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
