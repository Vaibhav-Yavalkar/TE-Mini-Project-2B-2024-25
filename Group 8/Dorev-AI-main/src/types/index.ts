export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface Review {
  id: string;
  rating: number;
  content: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  sentiment: SentimentType;
  isPublic: boolean;
  couponCode?: string;
}

export interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  googlePlaceId: string;
  qrCode: string;
  averageRating: number;
}

export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  neutralReviews: number;
  weeklyGrowth: number;
}

export interface ReviewTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}