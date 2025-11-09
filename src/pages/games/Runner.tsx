import { useEffect, useRef, useState } from 'react';
import { addScore, bestOf } from '@/lib/games/localStore';

type Obstacle = { x: number; w: number; h: number };

const WIDTH = 480;
const HEIGHT = 200;
const RUNNER_SIZE = 14;
const RUNNER_X = 40;

export default function Runner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setBest(bestOf('runner'));
  }, []);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame = 0;
    let frame = 0;
    let velocityY = 0;
    let playerY = HEIGHT - RUNNER_SIZE * 2;
    let onGround = true;
    let currentScore = 0;
    let ended = false;
    const obstacles: Obstacle[] = [];

    const setGameScore = (value: number) => {
      currentScore = value;
      setScore(value);
    };

    const jump = () => {
      if (!onGround) return;
      velocityY = -10;
      onGround = false;
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        jump();
      }
    };

    const reset = () => {
      playerY = HEIGHT - RUNNER_SIZE * 2;
      velocityY = 0;
      onGround = true;
      frame = 0;
      obstacles.length = 0;
      setGameScore(0);
    };

    const spawn = () => {
      const height = 20 + Math.random() * 40;
      const width = 12 + Math.random() * 20;
      obstacles.push({ x: WIDTH + 30, w: width, h: height });
    };

    const saveScore = () => {
      addScore('runner', { score: currentScore, ts: Date.now() });
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

      velocityY += 0.7;
      playerY += velocityY;

      if (playerY >= HEIGHT - RUNNER_SIZE * 2) {
        playerY = HEIGHT - RUNNER_SIZE * 2;
        velocityY = 0;
        onGround = true;
      }

      if (frame % 70 === 0) spawn();

      ctx.fillStyle = '#4F46E5';
      obstacles.forEach((obstacle, index) => {
        obstacle.x -= 3.2;
        ctx.fillRect(obstacle.x, HEIGHT - obstacle.h, obstacle.w, obstacle.h);

        const collisionX = obstacle.x < RUNNER_X + RUNNER_SIZE && obstacle.x + obstacle.w > RUNNER_X;
        const collisionY = HEIGHT - obstacle.h < playerY + RUNNER_SIZE;

        if (!ended && collisionX && collisionY) {
          obstacles.splice(index, obstacles.length);
          endGame();
        }

        if (Math.abs(obstacle.x - RUNNER_X) < 1.8) {
          setGameScore(currentScore + 1);
        }
      });

      ctx.fillStyle = '#F5C76A';
      ctx.fillRect(RUNNER_X, playerY, RUNNER_SIZE, RUNNER_SIZE);

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
      <h1 className="mb-2 text-xl font-semibold">NOP Runner</h1>
      <div className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Space ile zıpla. Engellerden kaç.
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
