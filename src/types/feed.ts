export interface Post {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    score: number;
    refCode: string;
    verified?: boolean;
  };
  content: string;
  images?: string[];
  score: number;
  taskId?: string;
  createdAt: string;
  contributedAmount?: number;
  tags?: string[];
  aiSignal?: string;
  aiVolatility?: string;
  aiMmActivity?: string;
  aiScore?: number;
  engagement: {
    upvotes: number;
    comments: number;
    tips: number;
    shares: number;
  };
}

export interface FeedResponse {
  items: Post[];
  nextCursor?: string;
}

export interface CreatePostInput {
  content: string;
  taskId?: string;
}
