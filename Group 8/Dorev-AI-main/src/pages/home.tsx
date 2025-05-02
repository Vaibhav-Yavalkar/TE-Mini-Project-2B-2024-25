import React from 'react';
import { Link } from 'react-router-dom';
import { Star, BarChart, QrCode } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Customer Review Management
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Collect, manage, and analyze customer reviews with our easy-to-use platform.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Review Collection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Review Collection</h3>
            <p className="mt-2 text-gray-500">
              Easy-to-use review form for customers to share their experiences.
            </p>
            <div className="mt-4">
              <Link
                to="/review"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Leave a Review →
              </Link>
            </div>
          </div>

          {/* Business Dashboard */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
              <BarChart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Business Dashboard</h3>
            <p className="mt-2 text-gray-500">
              View and analyze customer feedback in real-time with our interactive dashboard.
            </p>
            <div className="mt-4">
              <Link
                to="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Dashboard →
              </Link>
            </div>
          </div>

          {/* QR Code Generation */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">QR Code Generation</h3>
            <p className="mt-2 text-gray-500">
              Generate custom QR codes to easily collect customer reviews in-person.
            </p>
            <div className="mt-4">
              <Link
                to="/qr-generator"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Generate QR Codes →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
            <div>
              <p className="text-4xl font-bold text-blue-600">100%</p>
              <p className="mt-2 text-gray-500">Customer Satisfaction</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">24/7</p>
              <p className="mt-2 text-gray-500">Review Collection</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">Real-time</p>
              <p className="mt-2 text-gray-500">Analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 