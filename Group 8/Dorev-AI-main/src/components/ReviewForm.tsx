import React, { useState } from 'react';
import { Star, Send, Loader } from 'lucide-react';
import { getRandomReview, MockReview } from '../data/mockReviews';

interface ReviewFormProps {
  onSubmitSuccess?: () => void;
}

export default function ReviewForm({ onSubmitSuccess }: ReviewFormProps) {
  const initialFormData = {
    rating: 0,
    content: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  };

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const GOOGLE_PLACE_ID = 'ChIJc-c8_Kq_5zsRyGqIuKb201A';

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }
    
    if (!customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Review content is required';
    }
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateCouponCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `THANK${code}`;
  };

  const redirectToGoogleReview = () => {
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;
    window.open(googleReviewUrl, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new review object
      const newReview: MockReview = {
        id: Math.random().toString(36).substr(2, 9),
        customerName,
        email: customerEmail,
        phoneNumber: customerPhone || undefined,
        rating,
        review: content,
        sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
        createdAt: new Date().toISOString()
      };

      // Get existing reviews from localStorage or initialize empty array
      const existingReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
      
      // Add new review to the beginning of the array
      const updatedReviews = [newReview, ...existingReviews];
      
      // Save to localStorage
      localStorage.setItem('reviews', JSON.stringify(updatedReviews));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setSubmissionStatus('success');

      if (rating <= 3) {
        // Generate and set coupon code for ratings 3 or lower
        const newCouponCode = generateCouponCode();
        setCouponCode(newCouponCode);
        setShowThankYou(true);
      } else {
        // Redirect to Google Review for ratings 4 or 5
        redirectToGoogleReview();
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setContent('');
    setErrors({});
    setSubmissionStatus(null);
  };

  if (showThankYou) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Thank You for Your Feedback!</h2>
        <p className="text-gray-600 mb-6">
          We appreciate your honest review. Here's a special discount code for your next visit:
        </p>
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <p className="text-2xl font-mono font-bold text-blue-600">{couponCode}</p>
        </div>
        <p className="text-sm text-gray-500">
          Use this code on your next visit to receive a special discount.
          Valid for 30 days from today.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Share Your Experience</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your experience?
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
              >
                <Star
                  className={`h-8 w-8 ${
                    (hoveredRating ? value <= hoveredRating : value <= rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.customerName
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.customerName && (
              <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="customerEmail"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.customerEmail
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.customerEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.customerPhone
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="+1 (555) 000-0000"
            />
            {errors.customerPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
            )}
          </div>
        </div>

        {/* Review Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Your Review
          </label>
          <textarea
            id="content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              errors.content
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="Tell us about your experience..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="-ml-1 mr-2 h-4 w-4" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}