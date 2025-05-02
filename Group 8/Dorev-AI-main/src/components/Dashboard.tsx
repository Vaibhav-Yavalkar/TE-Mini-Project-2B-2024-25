import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  QrCode, 
  Star, 
  ThumbsUp, 
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  Search
} from 'lucide-react';
import type { DashboardStats, Review, ReviewTrend } from '../types';
import ReviewManagement from './ReviewManagement';
import Analytics from './Analytics';
import ReviewCollectionManager from './ReviewCollectionManager';
import { useBusiness } from './BusinessProvider';
import QRCodeGenerator from './QRCodeGenerator';
import { mockReviews } from '../data/mockReviews';

// Mock data for the dashboard stats
const mockStats: DashboardStats = {
  totalReviews: 128,
  averageRating: 4.5,
  positiveReviews: 98,
  negativeReviews: 12,
  neutralReviews: 18,
  weeklyGrowth: 12.5
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
}

function StatCard({ title, value, icon, suffix = '' }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-semibold text-gray-900">
        {value.toLocaleString()}{suffix}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { business, loading } = useBusiness();
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    // Load reviews from localStorage (if any) or use mock data
    const storedReviews = localStorage.getItem('reviews');
    setReviews(storedReviews ? JSON.parse(storedReviews) : mockReviews);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <ThumbsUp className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">doRev</span>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`px-3 py-2 rounded-md ${
                  activeTab === 'reviews' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Reviews
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-2 rounded-md ${
                  activeTab === 'analytics' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Analytics
              </button>
              <button 
                onClick={() => setActiveTab('collection')}
                className={`px-3 py-2 rounded-md ${
                  activeTab === 'collection' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Collection Manager
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('qr-codes')}
              className={`${
                activeTab === 'qr-codes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              QR Codes
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Reviews"
              value={mockStats.totalReviews}
              icon={<MessageSquare className="h-6 w-6 text-blue-600" />}
            />
            <StatCard
              title="Average Rating"
              value={mockStats.averageRating}
              icon={<Star className="h-6 w-6 text-yellow-500" />}
              suffix="/5"
            />
            <StatCard
              title="Positive Reviews"
              value={mockStats.positiveReviews}
              icon={<ThumbsUp className="h-6 w-6 text-green-600" />}
            />
            <StatCard
              title="Weekly Growth"
              value={mockStats.weeklyGrowth}
              icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
              suffix="%"
            />
          </div>
        ) : (
          <QRCodeGenerator />
        )}
      </main>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Review Dashboard</h1>
        
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{review.customer_name}</h3>
                  <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-yellow-400 text-xl">{'★'.repeat(review.rating)}</span>
                  <span className="text-gray-300 text-xl">{'★'.repeat(5 - review.rating)}</span>
                </div>
              </div>
              <p className="text-gray-700">{review.content}</p>
              <div className="mt-4">
                <span className={`inline-block px-2 py-1 text-sm rounded ${
                  review.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                  review.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {review.sentiment}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}