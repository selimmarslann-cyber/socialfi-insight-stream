export interface PostComment {
  id: string;
  postId: string;
  walletAddress: string;
  content: string;
  createdAt: string;
}

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
  walletAddress?: string;
  content: string;
  images?: string[];
  attachments?: string[];
  score: number;
  taskId?: string;
  createdAt: string;
  contributedAmount?: number;
  tags?: string[];
  aiSignal?: string;
  aiVolatility?: string;
  aiMmActivity?: string;
  aiScore?: number;
  aiLastUpdatedAt?: string;
  poolEnabled?: boolean;
  contractPostId?: number | null;
  likedByViewer?: boolean;
  comments?: PostComment[];
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
  walletAddress: string;
  mediaUrls?: string[];
  tags?: string[];
  taskId?: string;
}
