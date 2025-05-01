import React, { useState } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  Trash2, 
  CheckCircle, 
  Filter, 
  Download,
  Reply,
  Search,
  Star
} from 'lucide-react';
import type { Review, SentimentType } from '../types';

// Mock data for reviews
const mockReviews: Review[] = [
  {
    id: '1',
    rating: 5,
    content: "Amazing service! The staff was incredibly helpful and professional.",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "+1234567890",
    date: "2024-03-15",
    sentiment: "positive",
    isPublic: true
  },
  {
    id: '2',
    rating: 2,
    content: "Long waiting times and unfriendly staff.",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    customerPhone: "+1234567891",
    date: "2024-03-14",
    sentiment: "negative",
    isPublic: false
  },
  {
    id: '3',
    rating: 4,
    content: "Good experience overall, but room for improvement.",
    customerName: "Mike Johnson",
    customerEmail: "mike@example.com",
    customerPhone: "+1234567892",
    date: "2024-03-13",
    sentiment: "neutral",
    isPublic: true
  }
];

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [filter, setFilter] = useState<SentimentType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());

  const filteredReviews = reviews.filter(review => {
    const matchesFilter = filter === 'all' || review.sentiment === filter;
    const matchesSearch = review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDeleteReviews = () => {
    const updatedReviews = reviews.filter(review => !selectedReviews.has(review.id));
    setReviews(updatedReviews);
    setSelectedReviews(new Set());
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Customer', 'Rating', 'Review', 'Sentiment', 'Public'];
    const csvContent = filteredReviews.map(review => [
      review.date,
      review.customerName,
      review.rating,
      review.content,
      review.sentiment,
      review.isPublic ? 'Yes' : 'No'
    ].join(',')).join('\n');
    
    const blob = new Blob([`${headers.join(',')}\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reviews-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Review Management</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          {selectedReviews.size > 0 && (
            <button
              onClick={handleDeleteReviews}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'positive'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Positive
          </button>
          <button
            onClick={() => setFilter('neutral')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'neutral'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Neutral
          </button>
          <button
            onClick={() => setFilter('negative')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'negative'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Negative
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <div
            key={review.id}
            className={`p-4 rounded-lg border ${
              selectedReviews.has(review.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedReviews.has(review.id)}
                onChange={(e) => {
                  const newSelected = new Set(selectedReviews);
                  if (e.target.checked) {
                    newSelected.add(review.id);
                  } else {
                    newSelected.delete(review.id);
                  }
                  setSelectedReviews(newSelected);
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{review.customerName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{review.date}</span>
                      <span>•</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        review.sentiment === 'positive'
                          ? 'bg-green-100 text-green-800'
                          : review.sentiment === 'negative'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                    </span>
                    {review.isPublic ? (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Public
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        Private
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{review.content}</p>
                <div className="flex gap-2">
                  <button className="flex items-center text-sm text-gray-600 hover:text-blue-600">
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </button>
                  <button className="flex items-center text-sm text-gray-600 hover:text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}