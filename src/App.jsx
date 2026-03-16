import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Loader } from './components/UI';

import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { Conference } from './pages/Conference';
import { Session } from './pages/Session';

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  if (!session) return <Navigate to="/auth" />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/conference/:confId" element={<ProtectedRoute><Conference /></ProtectedRoute>} />
            <Route path="/session/:sessionId" element={<ProtectedRoute><Session /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
