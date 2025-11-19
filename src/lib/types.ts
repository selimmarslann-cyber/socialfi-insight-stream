export type Contribute = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  tags?: string[];
  weeklyScore?: number;
  weeklyVolumeNop?: number;
  coverImage?: string;
  poolEnabled?: boolean;
  contractPostId?: number | null;
  createdAt?: string;
  created_at?: string;
};
