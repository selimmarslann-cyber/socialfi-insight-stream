# Profiles & Admin Console — NOP Intelligence Layer

## Profile Model
- Profiles live in the Supabase table `social_profiles` with columns: `wallet_address` (unique, lowercase), `display_name`, `handle`, `avatar_url`, `bio`, `nop_id`, `is_banned`, `total_posts`, and timestamps. Handles are auto-generated as `nop-xxxxx` but can be edited in the UI.
- Avatars are stored in the Supabase storage bucket `avatars`. The helper `uploadAvatar()` writes the file and returns a public URL that is persisted on the profile row.
- The helper module `src/lib/profile.ts` exposes functions to fetch or create the current wallet’s profile, update metadata, list posts (`listUserPosts`) and liked posts (`listUserLikes`), and upload avatars. Components use `useCurrentProfile()` (React Query + Zustand) to keep the current profile cached.
- Banned status (`is_banned`) is honored throughout the client: the post composer, like button, and pool trade actions block interaction, display warning banners, and early return before mutating state.

## Likes & Activity
- Likes are persisted in the new `post_likes` table (`id`, `post_id`, `profile_id`, `wallet_address`, `created_at`, unique on post/profile). RLS remains open for preview but the client enforces wallet ownership.
- `fetchSocialFeed` and `PostCard` now hydrate engagement data from `post_likes` so the `upvotes` count and heart state reflect true Supabase records. The toggle helper in `src/lib/likes.ts` optimistically updates counts and prevents banned wallets from liking.
- “My Profile” (`/profile`) and public profiles (`/u/:slug`) consume `listUserPosts` and `listUserLikes` to show activity and liked posts. Posts link back to `/u/:slug`, enabling navigation through the feed.

## Admin Console
- `src/pages/Admin.tsx` now renders a nav-driven console with five modules:
  - **Overview**: total profiles, posts, pools with trades, and cumulative NOP volume plus top pools/alpha users.
  - **Users**: table of `social_profiles` with ban/unban actions, handle/wallet metadata, and created time.
  - **Posts**: moderation list where ops can hide/unhide posts or toggle the `is_featured` flag.
  - **Pools**: list of contributes with weekly NOP volume (read-only in this phase).
  - **System**: notes about preview-only controls plus the mock `BurnPanel`.
- Preview auth lives in `src/lib/adminAuth.ts`. It reads `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD`, compares against the login form, and stores a localStorage flag (`nop_admin_session_v2`). This is intentionally insecure and only meant for demos; production deployments will replace it with MPC + SafeAuth.
- Additional admin-only routes (`/admin/contributes/:id`, games admin) now check `isAdminLoggedIn()` before rendering.

## Ban Semantics
- Setting `is_banned = true` on a profile disables the composer, like button, and pool trade actions for that wallet. The UI surfaces badges and alerts explaining the restriction.
- Admins can flip the flag from the Users tab; React Query invalidation ensures the new state propagates to profile pages and interactive components.

## Known Limitations / Future Work
- Profile posts/likes load only when Supabase is configured; add server-side fallbacks for static previews.
- `total_posts` is stored but not automatically incremented on every create—consider a trigger or view for accurate counts.
- Likes/pool moderation are still client-side; migrate to serverless functions before shipping beyond preview.
- Admin auth is front-end only. Replace with MPC + SafeAuth and server-enforced RLS policies before mainnet.
