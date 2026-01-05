
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './screens/Dashboard';
import Reports from './screens/Reports';
import MapView from './screens/MapView';
import VisitSession from './screens/VisitSession';
import FieldDetails from './screens/FieldDetails';
import Producers from './screens/Producers';
import Proposals from './screens/Proposals';
import Catalog from './screens/Catalog';
import Visits from './screens/Visits';
import Auth from './screens/Auth';
import UserManagement from './screens/UserManagement';
import { authStore } from './services/authStore';

const ProtectedRoute = ({ children, requiredPermission }: { children?: React.ReactNode, requiredPermission?: string }) => {
  const user = authStore.getCurrentUser();
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredPermission && !user.permissions[requiredPermission as keyof typeof user.permissions]) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/reports" element={<ProtectedRoute requiredPermission="reports"><Reports /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute requiredPermission="map"><MapView /></ProtectedRoute>} />
                <Route path="/visits" element={<ProtectedRoute requiredPermission="visits"><Visits /></ProtectedRoute>} />
                <Route path="/producers" element={<ProtectedRoute requiredPermission="producers"><Producers /></ProtectedRoute>} />
                <Route path="/proposals" element={<ProtectedRoute requiredPermission="proposals"><Proposals /></ProtectedRoute>} />
                <Route path="/catalog" element={<ProtectedRoute requiredPermission="catalog"><Catalog /></ProtectedRoute>} />
                <Route path="/field/:id" element={<FieldDetails />} />
                <Route path="/visit-session/:id" element={<VisitSession />} />
                <Route path="/users" element={<ProtectedRoute requiredPermission="users"><UserManagement /></ProtectedRoute>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
