// NOTE: This games module is experimental and not part of the core NOP Intelligence Layer
// production app. It is currently excluded from navigation and main flows as of PHASE 2.
import { useEffect, useRef, useState } from 'react';
import { addScore, bestOf } from '@/lib/games/localStore';

type Phase = 'idle' | 'ready' | 'click' | 'too-early' | 'done';

export default function Reaction() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [ms, setMs] = useState(0);
  const [best, setBest] = useState<number | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTs = useRef(0);

  useEffect(() => {
    const initialBest = bestOf('reaction');
    setBest(initialBest === 0 ? undefined : initialBest);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const save = (value: number) => {
    addScore('reaction', { score: value, ts: Date.now() });
    setBest((prev) => {
      if (prev === undefined) return value;
      return Math.min(prev, value);
    });
  };

  const start = () => {
    setPhase('ready');
    setMs(0);
    clearTimer();
    const wait = 800 + Math.random() * 1500;
    timerRef.current = setTimeout(() => {
      setPhase('click');
      startTs.current = performance.now();
    }, wait);
  };

  const press = () => {
    if (phase === 'ready') {
      clearTimer();
      setPhase('too-early');
      setMs(0);
    } else if (phase === 'click') {
      const delta = Math.round(performance.now() - startTs.current);
      setMs(delta);
      setPhase('done');
      save(delta);
    } else if (phase === 'idle' || phase === 'too-early' || phase === 'done') {
      start();
    }
  };

  useEffect(
    () => () => {
      clearTimer();
    },
    [],
  );

  const hint =
    phase === 'idle'
      ? 'Başlamak için tıkla'
      : phase === 'ready'
        ? 'Yeşili bekle…'
        : phase === 'click'
          ? 'ŞİMDİ TIKLA!'
          : phase === 'too-early'
            ? 'Erken tıkladın — tekrar dene'
            : 'Tekrar oyna (tıkla)';

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <h1 className="mb-2 text-xl font-semibold">Reaction Speed Test</h1>
      <div className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Sinyali bekle, en hızlı reaksiyonu ver.
      </div>

      <button
        onClick={press}
        className="flex h-[220px] w-full max-w-[520px] items-center justify-center rounded-2xl text-xl font-semibold"
        style={{
          background: phase === 'click' ? '#16a34a' : 'var(--bg-card)',
          color: phase === 'click' ? '#fff' : 'var(--text-primary)',
          border: '1px solid var(--ring)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {phase === 'done' ? `${ms} ms` : hint}
      </button>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div>
          Last: <b>{ms}</b> ms
        </div>
        <div>
          Best: <b>{best ?? '-'}</b> ms
        </div>
        <a id="how-to" className="text-sm underline" style={{ color: 'var(--menu-active)' }}>
          How to
        </a>
      </div>
    </div>
  );
}
