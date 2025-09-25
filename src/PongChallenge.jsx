import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const COURT_WIDTH = 420;
const COURT_HEIGHT = 240;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 60;
const PLAYER_X = 20;
const AGENT_X = COURT_WIDTH - PLAYER_X - PADDLE_WIDTH;
const BALL_SIZE = 12;
const WINNING_SCORE = 3;

const randomServeVelocity = (direction) => {
  const speed = 3.6;
  const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6; // between -30 and 30 degrees
  const vx = speed * Math.cos(angle) * direction;
  const vy = speed * Math.sin(angle);
  const adjustedVy =
    vy === 0 ? 0.6 * (Math.random() > 0.5 ? 1 : -1) : vy;
  return { vx, vy: adjustedVy };
};

const createInitialState = () => {
  const { vx, vy } = randomServeVelocity(Math.random() > 0.5 ? 1 : -1);
  return {
    ballX: COURT_WIDTH / 2 - BALL_SIZE / 2,
    ballY: COURT_HEIGHT / 2 - BALL_SIZE / 2,
    ballVX: vx,
    ballVY: vy,
    playerY: COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    agentY: COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    playerScore: 0,
    agentScore: 0,
    playing: true,
  };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function PongChallenge({ onPlayerWin, onAgentWin }) {
  const stateRef = useRef(null);
  if (stateRef.current === null) {
    stateRef.current = createInitialState();
  }

  const [renderState, setRenderState] = useState(() => ({
    ballX: stateRef.current.ballX,
    ballY: stateRef.current.ballY,
    playerY: stateRef.current.playerY,
    agentY: stateRef.current.agentY,
    playerScore: stateRef.current.playerScore,
    agentScore: stateRef.current.agentScore,
  }));

  const resetBall = useCallback((direction = 1) => {
    const state = stateRef.current;
    state.ballX = COURT_WIDTH / 2 - BALL_SIZE / 2;
    state.ballY = COURT_HEIGHT / 2 - BALL_SIZE / 2;
    const { vx, vy } = randomServeVelocity(direction);
    state.ballVX = vx;
    state.ballVY = vy;
  }, []);

  const resetMatch = useCallback((direction = 1) => {
    const state = stateRef.current;
    state.playerScore = 0;
    state.agentScore = 0;
    state.playerY = COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    state.agentY = COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall(direction);
  }, [resetBall]);

  const scheduleRender = useCallback(() => {
    const state = stateRef.current;
    setRenderState({
      ballX: state.ballX,
      ballY: state.ballY,
      playerY: state.playerY,
      agentY: state.agentY,
      playerScore: state.playerScore,
      agentScore: state.agentScore,
    });
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    state.playing = true;
    let animationId;
    let previousTime = performance.now();

    const step = (time) => {
      const currentState = stateRef.current;
      if (!currentState.playing) {
        return;
      }

      const delta = clamp((time - previousTime) / 16.67, 0.5, 1.5);
      previousTime = time;

      currentState.playerY = clamp(
        currentState.playerY,
        0,
        COURT_HEIGHT - PADDLE_HEIGHT
      );

      currentState.ballX += currentState.ballVX * delta;
      currentState.ballY += currentState.ballVY * delta;

      if (currentState.ballY <= 0 && currentState.ballVY < 0) {
        currentState.ballY = 0;
        currentState.ballVY *= -1;
      } else if (
        currentState.ballY >= COURT_HEIGHT - BALL_SIZE &&
        currentState.ballVY > 0
      ) {
        currentState.ballY = COURT_HEIGHT - BALL_SIZE;
        currentState.ballVY *= -1;
      }

      const agentCenter = currentState.agentY + PADDLE_HEIGHT / 2;
      const ballCenter = currentState.ballY + BALL_SIZE / 2;
      const followSpeed = 2.8 * delta;
      if (agentCenter + 6 < ballCenter) {
        currentState.agentY = clamp(
          currentState.agentY + followSpeed * 4,
          0,
          COURT_HEIGHT - PADDLE_HEIGHT
        );
      } else if (agentCenter - 6 > ballCenter) {
        currentState.agentY = clamp(
          currentState.agentY - followSpeed * 4,
          0,
          COURT_HEIGHT - PADDLE_HEIGHT
        );
      }

      // Player paddle collision
      if (
        currentState.ballX <= PLAYER_X + PADDLE_WIDTH &&
        currentState.ballX + BALL_SIZE >= PLAYER_X &&
        currentState.ballY + BALL_SIZE >= currentState.playerY &&
        currentState.ballY <= currentState.playerY + PADDLE_HEIGHT &&
        currentState.ballVX < 0
      ) {
        currentState.ballX = PLAYER_X + PADDLE_WIDTH;
        currentState.ballVX = Math.abs(currentState.ballVX) * 1.03;
        const offset =
          (currentState.ballY + BALL_SIZE / 2 -
            (currentState.playerY + PADDLE_HEIGHT / 2)) /
          (PADDLE_HEIGHT / 2);
        currentState.ballVY = clamp(
          currentState.ballVY + offset * 1.6,
          -4.5,
          4.5
        );
      }

      // Agent paddle collision
      if (
        currentState.ballX + BALL_SIZE >= AGENT_X &&
        currentState.ballX <= AGENT_X + PADDLE_WIDTH &&
        currentState.ballY + BALL_SIZE >= currentState.agentY &&
        currentState.ballY <= currentState.agentY + PADDLE_HEIGHT &&
        currentState.ballVX > 0
      ) {
        currentState.ballX = AGENT_X - BALL_SIZE;
        currentState.ballVX = -Math.abs(currentState.ballVX) * 1.03;
        const offset =
          (currentState.ballY + BALL_SIZE / 2 -
            (currentState.agentY + PADDLE_HEIGHT / 2)) /
          (PADDLE_HEIGHT / 2);
        currentState.ballVY = clamp(
          currentState.ballVY + offset * 1.4,
          -4.5,
          4.5
        );
      }

      // Scoring conditions
      if (currentState.ballX + BALL_SIZE < 0) {
        currentState.agentScore += 1;
        if (currentState.agentScore >= WINNING_SCORE) {
          const nextServeDirection = Math.random() > 0.5 ? 1 : -1;
          onAgentWin?.();
          resetMatch(nextServeDirection);
        } else {
          resetBall(1);
        }
      } else if (currentState.ballX > COURT_WIDTH) {
        currentState.playerScore += 1;
        if (currentState.playerScore >= WINNING_SCORE) {
          currentState.playing = false;
          scheduleRender();
          onPlayerWin?.();
          return;
        }
        resetBall(-1);
      }

      scheduleRender();
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => {
      stateRef.current.playing = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [onAgentWin, onPlayerWin, resetBall, resetMatch, scheduleRender]);

  const movePlayer = useCallback((amount) => {
    const state = stateRef.current;
    if (!state.playing) {
      return;
    }
    state.playerY = clamp(
      state.playerY + amount,
      0,
      COURT_HEIGHT - PADDLE_HEIGHT
    );
    scheduleRender();
  }, [scheduleRender]);

  const handleKeyControl = useCallback(
    (direction) => () => {
      movePlayer(direction * 20);
    },
    [movePlayer]
  );

  const instructions = useMemo(
    () =>
      `First to ${WINNING_SCORE} points wins. You control the left paddle. Use the arrow buttons to move up or down.`,
    []
  );

  return (
    <section className="pong" aria-label="Pong challenge">
      <header className="pong__header">
        <h2>Final challenge: Pong duel</h2>
        <p>{instructions}</p>
      </header>
      <div className="pong__board" role="img" aria-label="Pong game board">
        <svg
          className="pong__court"
          viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="pong-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(37, 99, 235, 0.35)" />
              <stop offset="100%" stopColor="rgba(30, 41, 59, 0.9)" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y="0"
            width={COURT_WIDTH}
            height={COURT_HEIGHT}
            fill="url(#pong-bg)"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="2"
            rx="18"
          />
          <line
            x1={COURT_WIDTH / 2}
            y1="12"
            x2={COURT_WIDTH / 2}
            y2={COURT_HEIGHT - 12}
            stroke="rgba(148, 163, 184, 0.4)"
            strokeDasharray="6 12"
            strokeWidth="2"
          />
          <rect
            x={PLAYER_X}
            y={renderState.playerY}
            width={PADDLE_WIDTH}
            height={PADDLE_HEIGHT}
            rx="4"
            fill="#f8fafc"
          />
          <rect
            x={AGENT_X}
            y={renderState.agentY}
            width={PADDLE_WIDTH}
            height={PADDLE_HEIGHT}
            rx="4"
            fill="rgba(148, 163, 184, 0.9)"
          />
          <rect
            x={renderState.ballX}
            y={renderState.ballY}
            width={BALL_SIZE}
            height={BALL_SIZE}
            rx="6"
            fill="#facc15"
          />
        </svg>
      </div>
      <div className="pong__scoreboard" aria-live="polite">
        <span>You: {renderState.playerScore}</span>
        <span>Agent: {renderState.agentScore}</span>
      </div>
      <div className="pong__controls" aria-label="Paddle controls">
        <button
          type="button"
          className="pong__control"
          onClick={handleKeyControl(-1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="pong__control"
          onClick={handleKeyControl(1)}
        >
          ↓
        </button>
      </div>
    </section>
  );
}
