  export interface Post {
    id: string;
    author: {
      username: string;
      avatar?: string;
      score: number;
      refCode: string;
    };
    content: string;
    imageUrl?: string;
    score: number;
    taskId?: string;
    createdAt: string;
    engagement: {
      upvotes: number;
      comments: number;
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
