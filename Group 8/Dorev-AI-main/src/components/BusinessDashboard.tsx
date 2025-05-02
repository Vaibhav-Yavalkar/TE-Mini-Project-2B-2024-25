import { useState, useEffect } from 'react';
import { mockReviews, MockReview } from '../data/mockReviews';

export default function BusinessDashboard() {
  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [selectedThreshold, setSelectedThreshold] = useState<number>(0);
  
  useEffect(() => {
    // Initialize localStorage with mock reviews if empty
    const storedReviews = localStorage.getItem('reviews');
    if (!storedReviews) {
      localStorage.setItem('reviews', JSON.stringify(mockReviews));
    }
    
    // Load reviews from localStorage
    loadReviews();
  }, []);

  const loadReviews = () => {
    const storedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    setReviews(storedReviews);
  };

  // Filter reviews based on rating threshold
  const filteredReviews = reviews.filter(review => review.rating >= selectedThreshold);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Business Dashboard</h2>
        
        {/* Rating Threshold Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Minimum Rating:</label>
          <select
            value={selectedThreshold}
            onChange={(e) => setSelectedThreshold(Number(e.target.value))}
            className="border rounded-md px-2 py-1"
          >
            <option value={0}>All Reviews</option>
            <option value={3}>3+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={5}>5 Stars</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{review.customerName}</h3>
                <p className="text-gray-600 text-sm">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center">
                <span className="text-yellow-400">{`★`.repeat(review.rating)}</span>
                <span className="text-gray-300">{`★`.repeat(5 - review.rating)}</span>
              </div>
            </div>
            <p className="text-gray-700">{review.review}</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Sentiment: {review.sentiment}</p>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No reviews match the selected criteria
          </div>
        )}
      </div>
    </div>
  );
} 