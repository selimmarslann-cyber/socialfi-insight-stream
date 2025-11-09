import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bestOf, GameKey, getScores } from '@/lib/games/localStore';

type CardConfig = {
  key: GameKey;
  name: string;
  desc: string;
  href: string;
};

const CARDS: CardConfig[] = [
  { key: 'flappy', name: 'Flappy NOP', desc: 'Engellerden geç, en uzağa uç.', href: '/games/flappy' },
  { key: 'runner', name: 'NOP Runner', desc: 'Koş, zıpla, engellerden kaç.', href: '/games/runner' },
  {
    key: 'memory',
    name: 'Memory Match',
    desc: 'Kartları eşleştir, en az hamlede bitir.',
    href: '/games/memory',
  },
  { key: 'reaction', name: 'Reaction Test', desc: 'Sinyali bekle ve en hızlı tıkla.', href: '/games/reaction' },
];

const LOCAL_GAMES: GameKey[] = ['flappy', 'runner', 'memory', 'reaction'];

function LeaderboardCard() {
  const [gameKey] = useState<GameKey>('flappy');

  const items = useMemo(() => {
    const list = getScores(gameKey);
    const sorted =
      gameKey === 'memory' || gameKey === 'reaction'
        ? [...list].sort((a, b) => a.score - b.score)
        : [...list].sort((a, b) => b.score - a.score);
    return sorted.slice(0, 10);
  }, [gameKey]);

  return (
    <div className="card p-4" style={{ border: '1px solid var(--ring)' }}>
      <div className="text-sm font-semibold mb-2">Leaderboard (local) — Flappy</div>
      <div className="space-y-2 text-sm">
        {items.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Henüz skor yok.</div>}
        {items.map((row, index) => (
          <div
            key={`${row.ts}-${index}`}
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--ring)' }}
          >
            <span>
              #{index + 1} — {row.address?.slice(0, 6) || 'local'}
            </span>
            <b>{row.score}</b>
          </div>
        ))}
      </div>
      <div className="text-[11px] mt-2" style={{ color: 'var(--menu-muted)' }}>
        Not: Bu tablo cihazınızdaki yerel skorlardan oluşur.
      </div>
    </div>
  );
}

export default function Games() {
  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Games</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Mini oyunları oyna; skorların yerel olarak kaydedilir. (İleride global leaderboard ve NOP ödül entegrasyonu
          eklenecek.)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4" style={{ border: '1px solid var(--ring)' }}>
          <div className="text-xs font-semibold" style={{ color: 'var(--menu-muted)' }}>
            Total Games
          </div>
          <div className="text-xl font-semibold mt-1">{CARDS.length}</div>
        </div>
        <div className="card p-4" style={{ border: '1px solid var(--ring)' }}>
          <div className="text-xs font-semibold" style={{ color: 'var(--menu-muted)' }}>
            Best (Flappy)
          </div>
          <div className="text-xl font-semibold mt-1">{bestOf('flappy')}</div>
        </div>
        <div className="card p-4" style={{ border: '1px solid var(--ring)' }}>
          <div className="text-xs font-semibold" style={{ color: 'var(--menu-muted)' }}>
            Best (Runner)
          </div>
          <div className="text-xl font-semibold mt-1">{bestOf('runner')}</div>
        </div>
        <div className="card p-4" style={{ border: '1px solid var(--ring)' }}>
          <div className="text-xs font-semibold" style={{ color: 'var(--menu-muted)' }}>
            Best (Memory — lowest)
          </div>
          <div className="text-xl font-semibold mt-1">{bestOf('memory') || '-'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {CARDS.map((card) => (
            <div
              key={card.key}
              className="card p-5 transition-shadow hover:shadow-xl"
              style={{ border: '1px solid var(--ring)' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">{card.name}</div>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    background: 'var(--surface-subtle)',
                    color: 'var(--menu-muted)',
                    border: '1px solid var(--ring)',
                  }}
                >
                  Best: {bestOf(card.key)}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {card.desc}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to={card.href}
                  className="flex h-9 items-center justify-center rounded-xl px-4 text-sm text-white"
                  style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-from), var(--brand-to))' }}
                >
                  Play
                </Link>
                <a
                  href={`${card.href}#how-to`}
                  className="text-sm underline"
                  style={{ color: 'var(--menu-active)' }}
                >
                  How it works
                </a>
              </div>
            </div>
          ))}
        </div>
        <LeaderboardCard />
      </div>

      <div className="mt-6 card p-4" style={{ border: '1px solid var(--ring)' }}>
        <div className="mb-3 text-sm font-semibold">My Scores</div>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {LOCAL_GAMES.map((key) => {
            const config = CARDS.find((card) => card.key === key);
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--ring)' }}
              >
                <span>{config?.name ?? key}</span>
                <span style={{ color: 'var(--menu-active)' }}>{bestOf(key)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
