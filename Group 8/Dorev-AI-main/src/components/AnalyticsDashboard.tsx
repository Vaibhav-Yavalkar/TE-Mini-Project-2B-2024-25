import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
  BarChart, Bar,
  ResponsiveContainer 
} from 'recharts';
import { Download, Users, Star, MessageCircle } from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  review: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
}

const COLORS = {
  positive: '#31D0AA',
  neutral: '#FFB547',
  negative: '#FF5C5C'
};

export default function AnalyticsDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  useEffect(() => {
    // Load reviews from localStorage
    const storedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    setReviews(storedReviews);
  }, []);

  // Calculate metrics
  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews || 0;
  const customerGrowth = reviews.length; // In a real app, this would be calculated differently
  const responseRate = 92.5; // Mock value for demo

  // Prepare data for Review Trends chart
  const reviewTrends = Array.from({ length: 3 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const monthReviews = reviews.filter(review => 
      new Date(review.createdAt).getMonth() === month.getMonth()
    );
    return {
      name: month.toLocaleString('default', { month: 'short' }),
      count: monthReviews.length
    };
  }).reverse();

  // Prepare data for Sentiment Distribution
  const sentimentCounts = reviews.reduce((acc, review) => {
    acc[review.sentiment] = (acc[review.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentData = [
    { name: 'Positive', value: sentimentCounts.positive || 0 },
    { name: 'Neutral', value: sentimentCounts.neutral || 0 },
    { name: 'Negative', value: sentimentCounts.negative || 0 }
  ];

  // Customer Growth data (mock data for demonstration)
  const growthData = [
    { month: 'Jan', customers: 27 },
    { month: 'Feb', customers: 32 },
    { month: 'Mar', customers: 36 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option>This Month</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <MessageCircle size={20} />
            <span>Total Reviews</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{totalReviews}</span>
            <span className="text-green-500 text-sm">↑ 12%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Star size={20} />
            <span>Average Rating</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}/5</span>
            <span className="text-green-500 text-sm">↑ 5%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users size={20} />
            <span>Customer Growth</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{customerGrowth}</span>
            <span className="text-green-500 text-sm">↑ 15%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <MessageCircle size={20} />
            <span>Response Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{responseRate}%</span>
            <span className="text-green-500 text-sm">↑ 2%</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Review Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Review Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reviewTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#4F46E5" 
                strokeWidth={2}
                dot={{ fill: '#4F46E5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {Object.entries(COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Customer Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="customers" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 