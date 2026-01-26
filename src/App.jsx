import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AssetForm from './pages/AssetForm';
import Login from './pages/Login';
import PublicReport from './pages/PublicReport';
import Layout from './components/Layout';
// Import placeholder or actual components for new routes
import StockDashboard from './pages/StockDashboard';
import Maintenance from './pages/Maintenance';
import MaintenanceForm from './pages/MaintenanceForm';
import MaintenanceStats from './pages/MaintenanceStats';
import UsersPage from './pages/UsersPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/report" element={<PublicReport />} />

        {/* Protected Routes wrapped in Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AssetForm />} />
          <Route path="/edit/:id" element={<AssetForm />} />

          {/* New Features */}
          <Route path="/stock" element={<StockDashboard />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/maintenance/stats" element={<MaintenanceStats />} /> {/* Added route for MaintenanceStats */}
          <Route path="/users" element={<UsersPage />} />
          <Route path="/maintenance/add" element={<MaintenanceForm />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
