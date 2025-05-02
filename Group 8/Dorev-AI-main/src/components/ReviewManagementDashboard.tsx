import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Star, AlertTriangle, CheckCircle, 
  Filter, Search, MoreVertical, ThumbsUp, ThumbsDown 
} from 'lucide-react';
import { MockReview } from '../data/mockReviews';

// Add sentiment label styling
const sentimentStyles = {
  positive: 'bg-green-50/80 text-green-800 border border-green-200 backdrop-blur-sm',
  negative: 'bg-red-50/80 text-red-800 border border-red-200 backdrop-blur-sm',
  neutral: 'bg-yellow-50/80 text-yellow-800 border border-yellow-200 backdrop-blur-sm'
};

interface ReviewResponse {
  id: string;
  reviewId: string;
  content: string;
  isAiGenerated: boolean;
  status: 'pending' | 'approved' | 'posted';
  createdAt: string;
}

export default function ReviewManagementDashboard() {
  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<MockReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<MockReview | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [responses, setResponses] = useState<Record<string, ReviewResponse>>({});

  // AI-generated response templates
  const aiResponseTemplates = {
    positive: [
      "Thank you for your wonderful feedback! We're thrilled to hear about your great experience.",
      "We really appreciate your positive review! It's fantastic to know you enjoyed your visit.",
      "Thank you for the amazing review! We're so glad we could provide you with a great experience."
    ],
    neutral: [
      "Thank you for your feedback. We appreciate your honest review and will consider your suggestions.",
      "We value your feedback and will use it to improve our services. Thank you for choosing us.",
      "Thank you for sharing your experience. We're always working to improve and your feedback helps."
    ],
    negative: [
      "We apologize for not meeting your expectations. Please contact us directly so we can address your concerns.",
      "We're sorry to hear about your experience. Our team would like to make things right - please reach out to us.",
      "Thank you for bringing this to our attention. We'd like to learn more about your experience and make it right."
    ]
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [filter, searchTerm, reviews]);

  const loadReviews = () => {
    const storedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    setReviews(storedReviews);
  };

  const filterReviews = () => {
    let filtered = [...reviews];

    // Apply sentiment filter
    if (filter !== 'all') {
      filtered = filtered.filter(review => review.sentiment === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  };

  const generateAIResponse = (review: MockReview) => {
    const templates = aiResponseTemplates[review.sentiment];
    const randomIndex = Math.floor(Math.random() * templates.length);
    const response: ReviewResponse = {
      id: Math.random().toString(36).substr(2, 9),
      reviewId: review.id,
      content: templates[randomIndex],
      isAiGenerated: true,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setResponses(prev => ({
      ...prev,
      [review.id]: response
    }));
  };

  const approveResponse = (reviewId: string) => {
    setResponses(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        status: 'approved' as const
      }
    }));
  };

  const updateResponse = (reviewId: string, content: string) => {
    setResponses(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        content,
        isAiGenerated: false
      }
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
          <div className="flex gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm ${sentimentStyles.positive}`}>
              Positive
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${sentimentStyles.neutral}`}>
              Neutral
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${sentimentStyles.negative}`}>
              Negative
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Reviews</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{review.customerName}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${sentimentStyles[review.sentiment]}`}>
                    {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <span className="text-yellow-400">{`★`.repeat(review.rating)}</span>
                  <span className="text-gray-300">{`★`.repeat(5 - review.rating)}</span>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.review}</p>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium">Response</span>
                </div>
                {!responses[review.id] && (
                  <button
                    onClick={() => generateAIResponse(review)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Generate AI Response
                  </button>
                )}
              </div>

              {responses[review.id] && (
                <div className="space-y-4">
                  <textarea
                    value={responses[review.id].content}
                    onChange={(e) => updateResponse(review.id, e.target.value)}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    {responses[review.id].status === 'pending' && (
                      <button
                        onClick={() => approveResponse(review.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Approve & Post
                      </button>
                    )}
                    {responses[review.id].status === 'approved' && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        Posted
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No reviews match your criteria
        </div>
      )}
    </div>
  );
} 