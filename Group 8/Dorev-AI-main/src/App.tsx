import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/home';
import ReviewPage from './pages/review';
import DashboardPage from './pages/dashboard';
import QRGeneratorPage from './pages/qr-generator';
import ReviewManagementPage from './pages/review-management';

function App() {
  return (
    <Router>
      <div>
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Home
                </Link>
                <Link
                  to="/review"
                  className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Leave a Review
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  to="/qr-generator"
                  className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  QR Generator
                </Link>
                <Link
                  to="/reviewmanagement"
                  className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Review Management
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/qr-generator" element={<QRGeneratorPage />} />
          <Route path="/reviewmanagement" element={<ReviewManagementPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;