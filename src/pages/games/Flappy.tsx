import { useEffect, useRef, useState } from 'react';
import { addScore, bestOf } from '@/lib/games/localStore';

type Pipe = { x: number; top: number; bottom: number };

const WIDTH = 320;
const HEIGHT = 420;
const BIRD_X = 60;
const BIRD_RADIUS = 10;

export default function Flappy() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setBest(bestOf('flappy'));
  }, []);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame = 0;
    let frame = 0;
    let velocity = 0;
    let birdY = 150;
    let currentScore = 0;
    const pipes: Pipe[] = [];
    let ended = false;

    const setGameScore = (value: number) => {
      currentScore = value;
      setScore(value);
    };

    const jump = () => {
      velocity = -8;
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        jump();
      }
    };

    const reset = () => {
      birdY = 150;
      velocity = 0;
      frame = 0;
      pipes.length = 0;
      setGameScore(0);
    };

    const spawn = () => {
      const gap = 120;
      const top = Math.random() * 160 + 20;
      pipes.push({ x: WIDTH + 20, top, bottom: top + gap });
    };

    const saveScore = () => {
      addScore('flappy', { score: currentScore, ts: Date.now() });
      setBest((prev) => Math.max(prev, currentScore));
    };

    const endGame = () => {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKey);
      setRunning(false);
      saveScore();
      window.alert(`Game over! Score: ${currentScore}`);
    };

    const loop = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      velocity += 0.5;
      birdY += velocity;

      if (frame % 90 === 0) spawn();

      ctx.fillStyle = '#4F46E5';
      pipes.forEach((pipe, index) => {
        pipe.x -= 2.2;
        ctx.fillRect(pipe.x, 0, 40, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, 40, HEIGHT - pipe.bottom);

        if (Math.abs(pipe.x - BIRD_X) < 2.3) {
          setGameScore(currentScore + 1);
        }

        const inPipeRange = pipe.x < BIRD_X + BIRD_RADIUS && pipe.x + 40 > BIRD_X - BIRD_RADIUS;
        if (!ended && inPipeRange && (birdY < pipe.top || birdY > pipe.bottom)) {
          pipes.splice(index, pipes.length);
          endGame();
        }
      });

      ctx.fillStyle = '#F5C76A';
      ctx.beginPath();
      ctx.arc(BIRD_X, birdY, BIRD_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      if (!ended && (birdY > HEIGHT - BIRD_RADIUS || birdY < BIRD_RADIUS)) {
        endGame();
        return;
      }

      frame += 1;
      animationFrame = window.requestAnimationFrame(loop);
    };

    reset();
    window.addEventListener('keydown', handleKey);
    animationFrame = window.requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKey);
    };
  }, [running]);

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <h1 className="mb-2 text-xl font-semibold">Flappy NOP</h1>
      <div className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Space ile zıpla. Borulara çarpma.
      </div>
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={() => {
            setScore(0);
            setRunning(true);
          }}
          className="h-9 rounded-xl px-4 text-white"
          style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-from), var(--brand-to))' }}
        >
          Start
        </button>
        <div className="text-sm">
          Score: <b>{score}</b>
        </div>
        <div className="text-sm">
          Best: <b>{best}</b>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="rounded-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--ring)', boxShadow: 'var(--shadow-card)' }}
      />
      <a id="how-to" className="mt-3 block text-sm underline" style={{ color: 'var(--menu-active)' }}>
        How to
      </a>
    </div>
  );
}
