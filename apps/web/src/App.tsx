import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { Layout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardPage } from '@/pages/dashboard';
import { VendorsPage } from '@/pages/vendors';
import { VendorDetailPage } from '@/pages/vendor-detail';
import { DocumentsPage } from '@/pages/documents';
import { InboxPage } from '@/pages/inbox';
import { SearchPage } from '@/pages/search';
import { LoginPage } from '@/pages/login';
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="vendors" element={<VendorsPage />} />
              <Route path="vendors/:id" element={<VendorDetailPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
