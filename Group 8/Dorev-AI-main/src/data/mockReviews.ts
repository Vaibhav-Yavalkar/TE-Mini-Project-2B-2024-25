export interface MockReview {
  id: string;
  customerName: string;
  email: string;
  phoneNumber?: string;
  rating: number;
  review: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  createdAt: string;
}

export const mockReviews: MockReview[] = [
  {
    id: '1',
    customerName: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phoneNumber: '+1 (555) 123-4567',
    rating: 5,
    review: 'Exceptional service! The staff was incredibly friendly and professional. The attention to detail was impressive. Would definitely recommend to friends and family.',
    sentiment: 'positive',
    createdAt: '2024-03-15T10:30:00Z'
  },
  {
    id: '2',
    customerName: 'Michael Chen',
    email: 'mchen@example.com',
    rating: 4,
    review: 'Good experience overall. Service was prompt and efficient. Only minor suggestion would be to improve the waiting area comfort.',
    sentiment: 'positive',
    createdAt: '2024-03-14T15:45:00Z'
  },
  {
    id: '3',
    customerName: 'Emily Rodriguez',
    email: 'emily.r@example.com',
    phoneNumber: '+1 (555) 987-6543',
    rating: 2,
    review: 'Service was below expectations. Long wait times and communication could have been better. Hope to see improvements in the future.',
    sentiment: 'negative',
    createdAt: '2024-03-13T09:15:00Z'
  },
  {
    id: '4',
    customerName: 'David Wilson',
    email: 'dwilson@example.com',
    rating: 5,
    review: 'Outstanding experience from start to finish! The team went above and beyond to ensure everything was perfect. Highly recommend their services.',
    sentiment: 'positive',
    createdAt: '2024-03-12T14:20:00Z'
  },
  {
    id: '5',
    customerName: 'Lisa Thompson',
    email: 'lisa.t@example.com',
    phoneNumber: '+1 (555) 234-5678',
    rating: 3,
    review: 'Average experience. Service was okay but there\'s room for improvement. Staff was friendly but the process could be more streamlined.',
    sentiment: 'neutral',
    createdAt: '2024-03-11T11:00:00Z'
  }
];

export const getRandomReview = (): MockReview => {
  const randomIndex = Math.floor(Math.random() * mockReviews.length);
  return {...mockReviews[randomIndex], 
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  };
}; 