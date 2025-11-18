// NOTE: This games module is experimental and not part of the core NOP Intelligence Layer
// production app. It is currently excluded from navigation and main flows as of PHASE 2.
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { useAuthStore } from '@/lib/store';
import {
  UserSettings,
  getAllSettings,
  getEarnedNop,
  getSettings,
  setSettings,
} from '@/lib/games/localStore';

type CapValue = number | '';

export default function GamesAdmin() {
  const { isAdmin } = useAuthStore();
  const [list, setList] = useState<UserSettings[]>([]);
  const [address, setAddress] = useState('');
  const [cap, setCap] = useState<CapValue>('');

  useEffect(() => {
    setList(getAllSettings());
  }, []);

  const refresh = () => {
    setList(getAllSettings());
  };

  const mergeAndSave = (partial: Partial<UserSettings>) => {
    const trimmed = address.trim();
    if (!trimmed) return;
    const existing = getSettings(trimmed);

    const next: UserSettings = {
      address: trimmed,
      banned: partial.banned ?? existing?.banned ?? false,
      rewardsPaused: partial.rewardsPaused ?? existing?.rewardsPaused ?? false,
      capEnabled:
        partial.capEnabled ??
        existing?.capEnabled ??
        (typeof cap === 'number' ? true : existing?.capEnabled ?? false),
      capNOP: typeof cap === 'number' ? cap : existing?.capNOP,
    };

    setSettings(next);
    refresh();
  };

  const resetForm = () => {
    setAddress('');
    setCap('');
  };

  if (!isAdmin) {
    return (
      <Container>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Admin features disabled</h2>
          <p className="text-muted-foreground">
            Games moderation tools are parked for PHASE 2. A secure admin channel ships alongside the MPC rollout.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ padding: '24px 0' }}>
        <h1 className="mb-2 text-xl font-semibold">Games — Admin</h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Adres bazlı ban / ödül durdurma / cap ayarla. (Local yönetim)
        </p>

        <div className="card mb-4 p-4" style={{ border: '1px solid var(--ring)' }}>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="text-xs" style={{ color: 'var(--menu-muted)' }}>
                Address
              </label>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="0x..."
                className="h-10 w-full rounded-lg px-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--ring)' }}
              />
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--menu-muted)' }}>
                Cap NOP
              </label>
              <input
                value={cap}
                onChange={(event) => {
                  const value = event.target.value;
                  setCap(value ? Number(value) : '');
                }}
                type="number"
                className="h-10 w-full rounded-lg px-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--ring)' }}
              />
            </div>
            <button
              onClick={() => mergeAndSave({ capEnabled: true })}
              className="h-10 rounded-xl px-4 text-white"
              style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-from), var(--brand-to))' }}
            >
              Save / Update
            </button>
            <button
              onClick={resetForm}
              className="h-10 rounded-xl px-4"
              style={{ background: 'var(--surface-subtle)', border: '1px solid var(--ring)' }}
            >
              Clear
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => mergeAndSave({ banned: true })}
              className="h-9 rounded-lg px-3"
              style={{ border: '1px solid var(--ring)' }}
            >
              Ban
            </button>
            <button
              onClick={() => mergeAndSave({ banned: false })}
              className="h-9 rounded-lg px-3"
              style={{ border: '1px solid var(--ring)' }}
            >
              Unban
            </button>
            <button
              onClick={() => mergeAndSave({ rewardsPaused: true })}
              className="h-9 rounded-lg px-3"
              style={{ border: '1px solid var(--ring)' }}
            >
              Pause Rewards
            </button>
            <button
              onClick={() => mergeAndSave({ rewardsPaused: false })}
              className="h-9 rounded-lg px-3"
              style={{ border: '1px solid var(--ring)' }}
            >
              Resume Rewards
            </button>
            <button
              onClick={() => mergeAndSave({ capEnabled: false })}
              className="h-9 rounded-lg px-3"
              style={{ border: '1px solid var(--ring)' }}
            >
              Disable Cap
            </button>
          </div>
        </div>

        <div className="card p-4" style={{ border: '1px solid var(--ring)' }}>
          <div className="mb-2 text-sm font-semibold">Users</div>
          <div className="space-y-2 text-sm">
            {list.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Henüz kayıt yok.</div>}
            {list.map((entry) => (
              <div
                key={entry.address}
                className="grid grid-cols-1 gap-2 rounded-lg px-3 py-2 md:grid-cols-6"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--ring)' }}
              >
                <div className="break-all md:col-span-2">{entry.address}</div>
                <div>
                  ban: <b>{entry.banned ? 'yes' : 'no'}</b>
                </div>
                <div>
                  paused: <b>{entry.rewardsPaused ? 'yes' : 'no'}</b>
                </div>
                <div>
                  cap: <b>{entry.capEnabled ? entry.capNOP ?? 0 : '-'}</b>
                </div>
                <div>
                  earned (local): <b>{getEarnedNop(entry.address)}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
