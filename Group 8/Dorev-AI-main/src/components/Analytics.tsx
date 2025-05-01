import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star,
  Calendar,
  ArrowUp,
  ArrowDown,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  neutralReviews: number;
  weeklyGrowth: number;
  monthlyTrends: {
    month: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }[];
  ratingDistribution: number[];
  customerGrowth: {
    month: string;
    newCustomers: number;
    returningCustomers: number;
  }[];
  responseTimeData: {
    range: string;
    count: number;
  }[];
  sentimentTrends: {
    month: string;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  }[];
}

const COLORS = ['#22c55e', '#eab308', '#ef4444'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get reviews data
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('date', { ascending: true });

      if (reviewsError) throw reviewsError;

      if (!reviews || reviews.length === 0) {
        setData(null);
        return;
      }

      // Basic metrics
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews;
      const positiveReviews = reviews.filter(rev => rev.sentiment === 'positive').length;
      const neutralReviews = reviews.filter(rev => rev.sentiment === 'neutral').length;
      const negativeReviews = reviews.filter(rev => rev.sentiment === 'negative').length;

      // Weekly growth calculation
      const lastWeekReviews = reviews.filter(rev => {
        const reviewDate = new Date(rev.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return reviewDate >= weekAgo;
      }).length;

      const previousWeekReviews = reviews.filter(rev => {
        const reviewDate = new Date(rev.date);
        const twoWeeksAgo = new Date();
        const weekAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return reviewDate >= twoWeeksAgo && reviewDate < weekAgo;
      }).length;

      const weeklyGrowth = previousWeekReviews === 0 
        ? 100 
        : ((lastWeekReviews - previousWeekReviews) / previousWeekReviews) * 100;

      // Rating distribution
      const ratingDistribution = Array(5).fill(0);
      reviews.forEach(rev => {
        ratingDistribution[rev.rating - 1]++;
      });

      // Monthly trends with customer growth
      const monthlyTrends = calculateMonthlyTrends(reviews);
      const customerGrowth = calculateCustomerGrowth(reviews);
      const responseTimeData = calculateResponseTimes(reviews);
      const sentimentTrends = calculateSentimentTrends(reviews);

      setData({
        totalReviews,
        averageRating,
        positiveReviews,
        negativeReviews,
        neutralReviews,
        weeklyGrowth,
        monthlyTrends,
        ratingDistribution,
        customerGrowth,
        responseTimeData,
        sentimentTrends,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTrends = (reviews: any[]) => {
    const months: { [key: string]: { positive: number; neutral: number; negative: number; total: number } } = {};
    
    reviews.forEach(review => {
      const month = new Date(review.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[month]) {
        months[month] = { positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      months[month][review.sentiment]++;
      months[month].total++;
    });

    return Object.entries(months).map(([month, counts]) => ({
      month,
      ...counts,
    }));
  };

  const calculateCustomerGrowth = (reviews: any[]) => {
    const months: { [key: string]: { newCustomers: number; returningCustomers: number } } = {};
    const customerHistory = new Set();

    reviews.forEach(review => {
      const month = new Date(review.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[month]) {
        months[month] = { newCustomers: 0, returningCustomers: 0 };
      }

      if (customerHistory.has(review.customer_email)) {
        months[month].returningCustomers++;
      } else {
        months[month].newCustomers++;
        customerHistory.add(review.customer_email);
      }
    });

    return Object.entries(months).map(([month, counts]) => ({
      month,
      ...counts,
    }));
  };

  const calculateResponseTimes = (reviews: any[]) => {
    const ranges = [
      { max: 1, label: '< 1 hour' },
      { max: 4, label: '1-4 hours' },
      { max: 24, label: '4-24 hours' },
      { max: 48, label: '24-48 hours' },
      { max: Infinity, label: '> 48 hours' }
    ];

    const responseTimes = ranges.map(range => ({
      range: range.label,
      count: 0
    }));

    reviews.forEach(review => {
      if (review.response) {
        const responseDate = new Date(review.updated_at);
        const reviewDate = new Date(review.created_at);
        const hours = (responseDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);

        const rangeIndex = ranges.findIndex(range => hours <= range.max);
        if (rangeIndex !== -1) {
          responseTimes[rangeIndex].count++;
        }
      }
    });

    return responseTimes;
  };

  const calculateSentimentTrends = (reviews: any[]) => {
    const months: { [key: string]: { positive: number; neutral: number; negative: number; total: number } } = {};
    
    reviews.forEach(review => {
      const month = new Date(review.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[month]) {
        months[month] = { positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      months[month][review.sentiment]++;
      months[month].total++;
    });

    return Object.entries(months).map(([month, counts]) => ({
      month,
      positivePercentage: (counts.positive / counts.total) * 100,
      neutralPercentage: (counts.neutral / counts.total) * 100,
      negativePercentage: (counts.negative / counts.total) * 100,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-600">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reviews"
          value={data.totalReviews}
          icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="Average Rating"
          value={data.averageRating}
          icon={<Star className="w-6 h-6 text-yellow-500" />}
          decimals={1}
          suffix="/5"
        />
        <StatCard
          title="Positive Reviews"
          value={(data.positiveReviews / data.totalReviews) * 100}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          suffix="%"
        />
        <StatCard
          title="Weekly Growth"
          value={data.weeklyGrowth}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          prefix={data.weeklyGrowth >= 0 ? '+' : ''}
          suffix="%"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Volume Trends */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Review Volume Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  name="Total Reviews"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newCustomers" name="New Customers" fill="#22c55e" />
                <Bar dataKey="returningCustomers" name="Returning Customers" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Analysis Trends */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Sentiment Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sentimentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="positivePercentage"
                  name="Positive"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="neutralPercentage"
                  name="Neutral"
                  stroke="#eab308"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="negativePercentage"
                  name="Negative"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Time Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Response Time Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.responseTimeData}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.responseTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

function StatCard({ title, value, icon, prefix = '', suffix = '', decimals = 0 }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-semibold text-gray-900">
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </p>
    </div>
  );
}