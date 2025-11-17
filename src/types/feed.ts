export interface PostCommentAuthor {
  id: string;
  username?: string;
  displayName: string;
  avatar?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  text: string;
  createdAt: string;
  author: PostCommentAuthor;
}

export interface PostViewerState {
  liked: boolean;
  rating?: number | null;
}

export interface PostRatingSummary {
  average: number;
  count: number;
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
  engagement: {
    upvotes: number;
    comments: number;
    tips: number;
    shares: number;
  };
  comments?: PostComment[];
  ratingSummary?: PostRatingSummary;
  viewerState?: PostViewerState;
}

export interface FeedResponse {
  items: Post[];
  nextCursor?: string;
}

export interface CreatePostInput {
  content: string;
  taskId?: string;
  attachments?: string[];
  tags?: string[];
}
