import { useState, useEffect, useRef, useCallback } from 'react';
import { ClockBar } from '@components/duel/ClockBar';
import { ComponentController } from '@pages/ComponentController';
import { DemoHighlights, DemoDescription } from '@pages/DemoControlsContent';
import type { Contestant } from '@types';
import styles from '@pages/ComponentsDemo.module.css';

const mockContestants: Contestant[] = [
  {
    id: 'demo-contestant-1',
    name: 'Alice Johnson',
    category: { name: '80s Movies', slides: [] },
    wins: 8,
    eliminated: false,
    gridPosition: { row: 0, col: 0 },
    controlledSquares: ['0-0'],
  },
  {
    id: 'demo-contestant-2',
    name: 'Bob Smith',
    category: { name: 'State Capitals', slides: [] },
    wins: 3,
    eliminated: false,
    gridPosition: { row: 1, col: 2 },
    controlledSquares: ['1-2'],
  },
];

export default function ClockBarDemo() {
  const [time1, setTime1] = useState(30);
  const [time2, setTime2] = useState(30);
  const [clockActivePlayer, setClockActivePlayer] = useState<1 | 2>(1);
  const [clockSpeed, setClockSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showSkipAnimation, setShowSkipAnimation] = useState(false);
  const [_, setSkipAnimationCountdown] = useState(0);
  const countdownIntervalRef = useRef<number | null>(null);

  // Clock countdown with speed control
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const decrement = 0.1 * clockSpeed;
      setTime1((t) => (clockActivePlayer === 1 && t > 0 ? Math.max(0, t - decrement) : t));
      setTime2((t) => (clockActivePlayer === 2 && t > 0 ? Math.max(0, t - decrement) : t));
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [clockActivePlayer, clockSpeed, isPaused]);

  const handleSwitchPlayer = useCallback(() => {
    setClockActivePlayer((prev) => (prev === 1 ? 2 : 1));
  }, []);

  const handleTimeout = useCallback(() => {
    setClockActivePlayer((current) => {
      if (current === 1) {
        setTime1(0);
      } else {
        setTime2(0);
      }
      return current;
    });
  }, []);

  const handleResetClock = useCallback(() => {
    setTime1(30);
    setTime2(30);
    setClockActivePlayer(1);
    setClockSpeed(1);
    setIsPaused(false);
  }, []);

  const handleSkipAnimationDemo = useCallback(() => {
    setShowSkipAnimation(true);
    setSkipAnimationCountdown(3);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setSkipAnimationCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    setTimeout(() => {
      setShowSkipAnimation(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      setSkipAnimationCountdown(0);
    }, 3000);
  }, []);

  return (
    <section className={styles['section']} id="clock-bar">
      <h2>
        <code>&lt;ClockBar /&gt;</code>
      </h2>
      <p>
        The ClockBar component displays both players&apos; names, remaining time, and active player
        indicator for the audience view during duels. Includes skip animation feature.
      </p>

      <ComponentController
        controls={[
          {
            type: 'group',
            label: 'Time Settings',
            controls: [
              {
                type: 'slider',
                label: 'Player 1 Time (seconds)',
                value: Math.round(time1 * 10) / 10,
                min: 0,
                max: 60,
                step: 0.5,
                onChange: (val) => {
                  setTime1(val as number);
                },
              },
              {
                type: 'slider',
                label: 'Player 2 Time (seconds)',
                value: Math.round(time2 * 10) / 10,
                min: 0,
                max: 60,
                step: 0.5,
                onChange: (val) => {
                  setTime2(val as number);
                },
              },
              {
                type: 'slider',
                label: 'Countdown Speed',
                value: clockSpeed,
                min: 0.5,
                max: 5,
                step: 0.5,
                onChange: (val) => {
                  setClockSpeed(val as number);
                },
              },
            ],
          },
          {
            type: 'group',
            label: 'Clock Actions',
            controls: [
              {
                type: 'button',
                label: isPaused ? '▶️ Resume' : '⏸️ Pause',
                onClick: () => {
                  setIsPaused(!isPaused);
                },
                variant: 'secondary',
              },
              {
                type: 'button',
                label: '⏯️ Switch Player',
                onClick: handleSwitchPlayer,
                variant: 'secondary',
              },
              {
                type: 'button',
                label: '⚡ Force Timeout',
                onClick: handleTimeout,
                variant: 'danger',
              },
              {
                type: 'button',
                label: '⏭️ Skip',
                onClick: handleSkipAnimationDemo,
                variant: 'primary',
                disabled: showSkipAnimation,
              },
            ],
          },
        ]}
        onReset={handleResetClock}
        description={
          <DemoDescription>
            <p>
              Adjust player times, countdown speed, and trigger various clock states. The skip
              animation button shows the 3-second answer overlay used when players skip questions.
            </p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Key Features:">
            - Real-time countdown with adjustable speed multiplier (0.5x - 5x)
            <br />
            - Pause/Resume control to freeze the countdown
            <br />
            - Clear visual indicator of active player
            <br />
            - Low time warning (orange) at &lt; 10 seconds
            <br />
            - Critical time warning (red, pulsing) at &lt; 5 seconds
            <br />
            - Skip animation: 3-second overlay with fade in/out transitions
            <br />- Responsive design with viewport-based text sizing
          </DemoHighlights>
        }
      />

      <div style={{ marginBottom: '1rem' }}>
        {mockContestants[0] && mockContestants[1] && (
          <ClockBar
            contestant1={mockContestants[0]}
            contestant2={mockContestants[1]}
            timeRemaining1={time1}
            timeRemaining2={time2}
            activePlayer={clockActivePlayer}
            categoryName="80s Movies"
            {...(showSkipAnimation && { skipAnswer: 'The Eiffel Tower' })}
          />
        )}
      </div>
    </section>
  );
}
