import { useEffect, useMemo, useRef, useState } from 'react';
import { addScore, bestOf } from '@/lib/games/localStore';

type Card = {
  id: number;
  value: number;
  open: boolean;
  matched: boolean;
};

const createDeck = () => {
  const base = Array.from({ length: 8 }, (_, index) => index + 1);
  const doubled = [...base, ...base];

  for (let i = doubled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }

  return doubled.map<Card>((value, index) => ({
    id: index,
    value,
    open: false,
    matched: false,
  }));
};

export default function Memory() {
  const [cards, setCards] = useState<Card[]>([]);
  const [steps, setSteps] = useState(0);
  const [best, setBest] = useState<number | undefined>(undefined);
  const stepsRef = useRef(0);
  const finishedRef = useRef(false);

  const openedCards = useMemo(() => cards.filter((card) => card.open && !card.matched), [cards]);

  useEffect(() => {
    const initialBest = bestOf('memory');
    setBest(initialBest === 0 ? undefined : initialBest);
  }, []);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setCards(createDeck());
    setSteps(0);
    stepsRef.current = 0;
    finishedRef.current = false;
  };

  const saveScore = (value: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    addScore('memory', { score: value, ts: Date.now() });
    setBest((prev) => {
      if (prev === undefined) return value;
      return Math.min(prev, value);
    });
  };

  const flip = (card: Card) => {
    if (card.open || card.matched || openedCards.length === 2) return;

    setCards((prev) =>
      prev.map((item) => (item.id === card.id ? { ...item, open: true } : item)),
    );

    setTimeout(() => {
      setCards((prev) => {
        const currentOpen = prev.filter((item) => item.open && !item.matched);
        if (currentOpen.length < 2) return prev;

        const matched = currentOpen[0].value === currentOpen[1].value;
        const updated = prev.map((item) => {
          if (!currentOpen.some((openCard) => openCard.id === item.id)) return item;
          if (matched) {
            return { ...item, matched: true, open: false };
          }
          return { ...item, open: false };
        });

        setSteps((prevSteps) => {
          const nextSteps = prevSteps + 1;
          stepsRef.current = nextSteps;
          return nextSteps;
        });

        if (matched && updated.every((item) => item.matched)) {
          const finalSteps = stepsRef.current;
          saveScore(finalSteps);
          window.alert(`Bitti! Hamle: ${finalSteps}`);
        }

        return updated;
      });
    }, 350);
  };

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <h1 className="mb-2 text-xl font-semibold">Memory Match</h1>
      <div className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Aynı kartları eşleştir. En az hamleyle bitir.
      </div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={reset}
          className="h-9 rounded-xl px-4 text-white"
          style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-from), var(--brand-to))' }}
        >
          Restart
        </button>
        <div className="text-sm">
          Steps: <b>{steps}</b>
        </div>
        <div className="text-sm">
          Best (lowest): <b>{best ?? '-'}</b>
        </div>
      </div>
      <div className="grid max-w-[420px] grid-cols-4 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card)}
            className="h-20 rounded-xl text-lg font-semibold transition"
            style={{
              background:
                card.matched || card.open
                  ? 'linear-gradient(90deg, var(--brand-from), var(--brand-to))'
                  : 'var(--bg-card)',
              color: card.matched || card.open ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--ring)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {card.matched || card.open ? card.value : '?'}
          </button>
        ))}
      </div>
      <a id="how-to" className="mt-3 block text-sm underline" style={{ color: 'var(--menu-active)' }}>
        How to
      </a>
    </div>
  );
}
