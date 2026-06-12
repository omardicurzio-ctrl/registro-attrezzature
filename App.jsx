import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AssetRegistry from './pages/AssetRegistry';
import AssetDetail from './pages/AssetDetail';
import QRLabelSheet from './components/QRLabelSheet';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/attrezzature" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/asset/:code" element={<AssetDetail />} />
          <Route
            path="/attrezzature"
            element={
              <ProtectedRoute>
                <AssetRegistry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/etichette"
            element={
              <ProtectedRoute>
                <QRLabelSheet />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/attrezzature" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
