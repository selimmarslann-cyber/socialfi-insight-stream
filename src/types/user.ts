export interface TrendingUser {
  username: string;
  score: number;
  rank: number;
  avatar?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface UserProfile {
  username: string;
  avatar?: string;
  bio?: string;
  score: number;
  rank: number;
  joinedAt: string;
  contributions: number;
}
