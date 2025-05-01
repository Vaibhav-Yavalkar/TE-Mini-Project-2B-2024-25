import React, { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import ReviewForm from './ReviewForm';
import type { Review } from '../types';

// In a real app, this would be an API call to a sentiment analysis service
const mockAnalyzeSentiment = async (text: string): Promise<'positive' | 'neutral' | 'negative'> => {
  // Simple mock implementation based on text length and presence of positive/negative words
  const positiveWords = ['great', 'amazing', 'excellent', 'good', 'love', 'perfect', 'awesome'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible', 'disappointed', 'worst'];
  
  const lowercaseText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowercaseText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowercaseText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

export default function ReviewCollector() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (reviewData: Omit<Review, 'id' | 'sentiment' | 'isPublic'>) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // 1. Analyze sentiment
      const sentiment = await mockAnalyzeSentiment(reviewData.content);
      
      // 2. Create review object
      const review: Review = {
        id: crypto.randomUUID(),
        ...reviewData,
        sentiment,
        isPublic: sentiment !== 'negative', // Private if negative
      };

      // 3. Handle review based on sentiment
      if (sentiment === 'negative') {
        // Store privately and show feedback message
        console.log('Storing private review:', review);
        setSubmitStatus('success');
      } else {
        // In a real app, store review and redirect to Google
        console.log('Redirecting to Google with review:', review);
        // Mock delay before redirect
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmitStatus('success');
        
        // Simulate Google redirect (in production, redirect to actual Google Review page)
        window.open('https://www.google.com/maps/place/?q=place_id=YOUR_PLACE_ID', '_blank');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrorMessage('Failed to submit review. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Thank You!</h2>
        <p className="mt-2 text-gray-600">
          Your feedback has been received and is greatly appreciated.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {submitStatus === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="ml-3 text-red-700">{errorMessage}</p>
        </div>
      )}
      
      <ReviewForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}