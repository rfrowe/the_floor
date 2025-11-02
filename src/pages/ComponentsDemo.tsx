import { useState, useEffect } from 'react';
import { Container, Button, Card, Modal, Spinner } from '@components/common';
import { ContestantCard } from '@components/contestant/ContestantCard';
import { SlideViewer } from '@components/slide/SlideViewer';
import { ClockBar } from '@components/duel/ClockBar';
import type { Contestant, Slide } from '@types';
import styles from './ComponentsDemo.module.css';

export function ComponentsDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSkipAnimation, setShowSkipAnimation] = useState(false);
  const [clockActivePlayer, setClockActivePlayer] = useState<1 | 2>(1);
  const [time1, setTime1] = useState(30);
  const [time2, setTime2] = useState(30);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleSkipAnimationDemo = () => {
    setShowSkipAnimation(true);
    // Animation is exactly 3 seconds, reset after completion
    setTimeout(() => {
      setShowSkipAnimation(false);
    }, 3000);
  };

  // Simulate clock countdown with 100ms updates for smooth millisecond display
  useEffect(() => {
    const interval = setInterval(() => {
      if (clockActivePlayer === 1 && time1 > 0) {
        setTime1((t) => Math.max(0, t - 0.1));
      } else if (clockActivePlayer === 2 && time2 > 0) {
        setTime2((t) => Math.max(0, t - 0.1));
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [clockActivePlayer, time1, time2]);

  const handleResetClock = () => {
    setTime1(30);
    setTime2(30);
    setClockActivePlayer(1);
  };

  const handleSwitchPlayer = () => {
    setClockActivePlayer(clockActivePlayer === 1 ? 2 : 1);
  };

  const handleTimeout = () => {
    if (clockActivePlayer === 1) {
      setTime1(0);
    } else {
      setTime2(0);
    }
  };
  // Mock contestants for demo
  const mockContestants: Contestant[] = [
    {
      id: 'demo-contestant-1',
      name: 'Alice Johnson',
      category: { name: '80s Movies', slides: [] },
      wins: 8,
      eliminated: false,
    },
    {
      id: 'demo-contestant-2',
      name: 'Bob Smith',
      category: { name: 'State Capitals', slides: [] },
      wins: 3,
      eliminated: false,
    },
    {
      id: 'demo-contestant-3',
      name: 'Carol Davis',
      category: { name: 'World History', slides: [] },
      wins: 5,
      eliminated: true,
    },
    {
      id: 'demo-contestant-4',
      name: 'David Lee',
      category: { name: 'Science Facts', slides: [] },
      wins: 0,
      eliminated: false,
    },
  ];

  // Sample slide data for demo
  const demoSlide: Slide = {
    imageUrl:
      'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%234a90a4"/%3E%3Ctext x="400" y="150" font-family="Arial" font-size="48" fill="white" text-anchor="middle"%3ESample Slide Image%3C/text%3E%3Ctext x="200" y="400" font-family="Arial" font-size="32" fill="%23ffd700"%3ECensored Content%3C/text%3E%3Ctext x="600" y="200" font-family="Arial" font-size="32" fill="%23ffd700"%3EHidden Text%3C/text%3E%3C/svg%3E',
    answer: 'Sample Answer',
    censorBoxes: [
      {
        x: 15,
        y: 60,
        width: 35,
        height: 15,
        color: '#000000',
      },
      {
        x: 65,
        y: 25,
        width: 25,
        height: 12,
        color: 'rgba(0, 0, 0, 0.9)',
      },
    ],
  };

  // Sample slides with quadrant censor boxes for testing positioning
  const quadrantTestSlides: Slide[] = [
    {
      imageUrl:
        'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%23ffffff"/%3E%3Crect x="0" y="0" width="400" height="300" fill="%23ffeeee" stroke="%23999" stroke-width="2"/%3E%3Crect x="400" y="0" width="400" height="300" fill="%23eeffee" stroke="%23999" stroke-width="2"/%3E%3Crect x="0" y="300" width="400" height="300" fill="%23eeeeff" stroke="%23999" stroke-width="2"/%3E%3Crect x="400" y="300" width="400" height="300" fill="%23ffffee" stroke="%23999" stroke-width="2"/%3E%3Ctext x="200" y="150" font-family="Arial" font-size="24" fill="%23333" text-anchor="middle"%3ETop Left%3C/text%3E%3Ctext x="600" y="150" font-family="Arial" font-size="24" fill="%23333" text-anchor="middle"%3ETop Right%3C/text%3E%3Ctext x="200" y="450" font-family="Arial" font-size="24" fill="%23333" text-anchor="middle"%3EBottom Left%3C/text%3E%3Ctext x="600" y="450" font-family="Arial" font-size="24" fill="%23333" text-anchor="middle"%3EBottom Right%3C/text%3E%3C/svg%3E',
      answer: 'Quadrant Test',
      censorBoxes: [
        // Top-left quadrant box
        {
          x: 5,
          y: 5,
          width: 40,
          height: 40,
          color: 'rgba(255, 0, 0, 0.5)',
        },
        // Top-right quadrant box
        {
          x: 55,
          y: 5,
          width: 40,
          height: 40,
          color: 'rgba(0, 255, 0, 0.5)',
        },
        // Bottom-left quadrant box
        {
          x: 5,
          y: 55,
          width: 40,
          height: 40,
          color: 'rgba(0, 0, 255, 0.5)',
        },
        // Bottom-right quadrant box
        {
          x: 55,
          y: 55,
          width: 40,
          height: 40,
          color: 'rgba(255, 255, 0, 0.5)',
        },
      ],
    },
    {
      imageUrl:
        'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%23f0f0f0"/%3E%3Cline x1="400" y1="0" x2="400" y2="600" stroke="%23333" stroke-width="2" stroke-dasharray="5,5"/%3E%3Cline x1="0" y1="300" x2="800" y2="300" stroke="%23333" stroke-width="2" stroke-dasharray="5,5"/%3E%3Ctext x="400" y="50" font-family="Arial" font-size="24" fill="%23333" text-anchor="middle"%3ECorner Boxes Test%3C/text%3E%3Ctext x="100" y="100" font-family="Arial" font-size="18" fill="%23000"%3ETL Corner%3C/text%3E%3Ctext x="700" y="100" font-family="Arial" font-size="18" fill="%23000" text-anchor="end"%3ETR Corner%3C/text%3E%3Ctext x="100" y="500" font-family="Arial" font-size="18" fill="%23000"%3EBL Corner%3C/text%3E%3Ctext x="700" y="500" font-family="Arial" font-size="18" fill="%23000" text-anchor="end"%3EBR Corner%3C/text%3E%3Ctext x="400" y="300" font-family="Arial" font-size="18" fill="%23000" text-anchor="middle"%3ECenter%3C/text%3E%3C/svg%3E',
      answer: 'Corner Boxes',
      censorBoxes: [
        // Top-left corner
        {
          x: 2,
          y: 10,
          width: 20,
          height: 10,
          color: '#ff0000',
        },
        // Top-right corner
        {
          x: 78,
          y: 10,
          width: 20,
          height: 10,
          color: '#00ff00',
        },
        // Bottom-left corner
        {
          x: 2,
          y: 78,
          width: 20,
          height: 10,
          color: '#0000ff',
        },
        // Bottom-right corner
        {
          x: 78,
          y: 78,
          width: 20,
          height: 10,
          color: '#ff00ff',
        },
        // Center
        {
          x: 40,
          y: 45,
          width: 20,
          height: 10,
          color: '#000000',
        },
      ],
    },
    {
      imageUrl:
        'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%23e0f0ff"/%3E%3Ctext x="400" y="100" font-family="Arial" font-size="36" fill="%23000" text-anchor="middle"%3EEdge Cases Test%3C/text%3E%3Ctext x="50" y="300" font-family="Arial" font-size="20" fill="%23000"%3ELeft%3C/text%3E%3Ctext x="750" y="300" font-family="Arial" font-size="20" fill="%23000" text-anchor="end"%3ERight%3C/text%3E%3Ctext x="400" y="50" font-family="Arial" font-size="20" fill="%23000" text-anchor="middle"%3ETop%3C/text%3E%3Ctext x="400" y="580" font-family="Arial" font-size="20" fill="%23000" text-anchor="middle"%3EBottom%3C/text%3E%3C/svg%3E',
      answer: 'Edge Cases',
      censorBoxes: [
        // Full width top
        {
          x: 0,
          y: 0,
          width: 100,
          height: 10,
          color: 'rgba(128, 0, 0, 0.3)',
        },
        // Full width bottom
        {
          x: 0,
          y: 90,
          width: 100,
          height: 10,
          color: 'rgba(0, 128, 0, 0.3)',
        },
        // Left edge
        {
          x: 0,
          y: 45,
          width: 10,
          height: 10,
          color: 'rgba(0, 0, 128, 0.5)',
        },
        // Right edge
        {
          x: 90,
          y: 45,
          width: 10,
          height: 10,
          color: 'rgba(128, 128, 0, 0.5)',
        },
      ],
    },
  ];

  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);
  const currentTestSlide = selectedSlideIndex !== null ? quadrantTestSlides[selectedSlideIndex] : null;

  return (
    <Container>
      <div className={styles['demo']}>
        <h1>Layout Components Demo</h1>

        {/* Container Demo */}
        <section className={styles['section']}>
          <h2>Container</h2>
          <p>
            The Container component provides consistent max-width and padding, centers content on
            large screens, and has responsive behavior.
          </p>
          <div className={styles['highlight']}>
            <p>This entire page is wrapped in a Container component!</p>
          </div>
        </section>

        {/* Button Demo */}
        <section className={styles['section']}>
          <h2>Button</h2>
          <div className={styles['componentGrid']}>
            <div>
              <h3>Variants</h3>
              <div className={styles['buttonGroup']}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div>
              <h3>Sizes</h3>
              <div className={styles['buttonGroup']}>
                <Button size="small">Small</Button>
                <Button size="medium">Medium</Button>
                <Button size="large">Large</Button>
              </div>
            </div>

            <div>
              <h3>States</h3>
              <div className={styles['buttonGroup']}>
                <Button disabled>Disabled</Button>
                <Button loading={isLoading} onClick={handleLoadingDemo}>
                  Click to Load
                </Button>
              </div>
            </div>

            <div>
              <h3>With Icons</h3>
              <div className={styles['buttonGroup']}>
                <Button icon="➕">Add Item</Button>
                <Button variant="danger" icon="🗑️">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Card Demo */}
        <section className={styles['section']}>
          <h2>Card</h2>
          <div className={styles['cardGrid']}>
            <Card>
              <h3>Basic Card</h3>
              <p>This is a simple card with just body content.</p>
            </Card>

            <Card header="Card with Header">
              <p>This card has a header section.</p>
            </Card>

            <Card
              header="Full Featured Card"
              footer={
                <Button size="small" variant="primary">
                  Action
                </Button>
              }
            >
              <p>This card has a header, body, and footer sections.</p>
            </Card>

            <Card interactive header="Interactive Card">
              <p>Hover over this card to see the interactive effect!</p>
            </Card>
          </div>
        </section>

        {/* Spinner Demo */}
        <section className={styles['section']}>
          <h2>Spinner</h2>
          <div className={styles['componentGrid']}>
            <div>
              <h3>Sizes</h3>
              <div className={styles['spinnerGroup']}>
                <Spinner size="small" />
                <Spinner size="medium" />
                <Spinner size="large" />
              </div>
            </div>

            <div>
              <h3>With Label</h3>
              <Spinner size="medium" label="Loading data..." />
            </div>
          </div>
        </section>

        {/* ContestantCard Demo */}
        <section className={styles['section']}>
          <h2>Contestant Card</h2>
          <div className={styles['cardGrid']}>
            {mockContestants.map((contestant) => {
              const maxWins = Math.max(...mockContestants.map((c) => c.wins));
              const hasTopWins = contestant.wins === maxWins && maxWins > 0;
              return (
                <ContestantCard
                  key={contestant.name}
                  contestant={contestant}
                  isSelected={selectedContestant === contestant.name}
                  onSelect={(c) => {
                    setSelectedContestant(c.name === selectedContestant ? null : c.name);
                  }}
                  hasTopWins={hasTopWins}
                />
              );
            })}
          </div>
          <div className={styles['highlight']} style={{ marginTop: '1rem' }}>
            <p>
              <strong>Features:</strong> Click cards to select/deselect. Notice the eliminated
              contestant (Carol) is greyed out. Alice has a crown for having the most wins (8). Win
              counts are displayed as badges.
            </p>
          </div>
        </section>

        {/* Modal Demo */}
        <section className={styles['section']}>
          <h2>Modal</h2>
          <div className={styles['buttonGroup']}>
            <Button
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              Open Modal
            </Button>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
            }}
            title="Demo Modal"
            footer={
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsModalOpen(false);
                  }}
                >
                  Confirm
                </Button>
              </>
            }
          >
            <p>
              This is a modal dialog. It has focus trapping, click-outside to close, and escape key
              handling.
            </p>
            <p>Try pressing the Tab key to cycle through the focusable elements!</p>
          </Modal>
        </section>

        {/* ClockBar Demo */}
        <section className={styles['section']}>
          <h2>ClockBar</h2>
          <p>
            The ClockBar component displays both players&apos; names, remaining time, and active
            player indicator for the audience view during duels.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            {mockContestants[0] && mockContestants[1] && (
              <ClockBar
                contestant1={mockContestants[0]}
                contestant2={mockContestants[1]}
                timeRemaining1={time1}
                timeRemaining2={time2}
                activePlayer={clockActivePlayer}
                categoryName="80s Movies"
              />
            )}
          </div>
          <div className={styles['buttonGroup']}>
            <Button size="small" onClick={handleSwitchPlayer}>
              Switch Active Player
            </Button>
            <Button size="small" variant="danger" onClick={handleTimeout}>
              Trigger Timeout (Active Player)
            </Button>
            <Button size="small" variant="secondary" onClick={handleResetClock}>
              Reset Clock
            </Button>
          </div>
          <div className={styles['highlight']}>
            <p>
              <strong>Features:</strong>
            </p>
            <ul>
              <li>Real-time countdown display for both players</li>
              <li>Clear visual indicator of active player</li>
              <li>Low time warning (orange) at &lt; 10 seconds</li>
              <li>Critical time warning (red, pulsing) at &lt; 5 seconds</li>
              <li>Smooth animations when switching active player</li>
              <li>Responsive design with viewport-based text sizing</li>
              <li>Handles long names with ellipsis truncation</li>
              <li>Category name display</li>
            </ul>
          </div>
        </section>

        {/* SlideViewer Demo */}
        <section className={styles['section']}>
          <h2>SlideViewer</h2>
          <p>
            The SlideViewer component displays slide images with censorship boxes overlaid at
            precise positions. It handles aspect ratio preservation with letterboxing.
          </p>
          <div className={styles['componentGrid']}>
            <div>
              <h3>Basic Usage</h3>
              <div style={{ height: '400px', border: '1px solid #ccc' }}>
                <SlideViewer slide={demoSlide} />
              </div>
            </div>

            <div>
              <h3>With Show Answer</h3>
              <div style={{ marginBottom: '1rem' }}>
                <Button
                  onClick={() => {
                    setShowAnswer(!showAnswer);
                  }}
                  size="small"
                >
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </Button>
              </div>
              <div style={{ height: '400px', border: '1px solid #ccc' }}>
                <SlideViewer slide={demoSlide} showAnswer={showAnswer} />
              </div>
            </div>
          </div>
          <div className={styles['highlight']}>
            <p>
              <strong>Features:</strong>
            </p>
            <ul>
              <li>Maintains image aspect ratio with letterboxing</li>
              <li>Precisely positioned censorship boxes using percentage coordinates</li>
              <li>White background for transparent images</li>
              <li>Smooth transitions when hiding/showing boxes</li>
              <li>Loading and error states</li>
              <li>Responsive sizing to fit any container</li>
            </ul>
          </div>

          {/* Quadrant Censor Box Testing */}
          <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3>Censor Box Positioning Test</h3>
            <p style={{ marginBottom: '1rem' }}>
              Test slides with quadrant and edge case censor boxes to verify proper positioning:
            </p>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {quadrantTestSlides.map((testSlide, index) => (
                <Button
                  key={index}
                  variant={selectedSlideIndex === index ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => {
                    setSelectedSlideIndex(index);
                  }}
                >
                  {testSlide.answer}
                </Button>
              ))}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>SlideViewer (like Audience View)</h4>
                <div style={{ height: '450px', border: '2px solid var(--border-default)', backgroundColor: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentTestSlide ? (
                    <SlideViewer slide={currentTestSlide} showAnswer={showAnswer} />
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Select a test slide above</p>
                  )}
                </div>
                {currentTestSlide && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Button
                      onClick={() => {
                        setShowAnswer(!showAnswer);
                      }}
                      size="small"
                    >
                      {showAnswer ? 'Show Boxes' : 'Hide Boxes'}
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Expected Box Positions</h4>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  border: '2px solid var(--border-default)',
                  borderRadius: '4px',
                  minHeight: '150px'
                }}>
                  {currentTestSlide ? (
                    <>
                      <p><strong>{currentTestSlide.answer}</strong></p>
                      <ul style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        {currentTestSlide.censorBoxes.map((box, i) => (
                          <li key={i}>
                            Box {i + 1}:
                            <span style={{
                              display: 'inline-block',
                              width: '20px',
                              height: '12px',
                              backgroundColor: box.color,
                              marginLeft: '0.5rem',
                              marginRight: '0.5rem',
                              verticalAlign: 'middle',
                              border: '1px solid #333'
                            }}></span>
                            Position: ({box.x}%, {box.y}%) | Size: {box.width}% × {box.height}%
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>Select a test slide to see box details</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Skip Animation Demo */}
        <section className={styles['section']}>
          <h2>Skip Animation (Audience View)</h2>
          <p>
            When a player skips a question, the answer is displayed in the center of the clock bar
            for exactly 3 seconds with fade in/out transitions.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <Button onClick={handleSkipAnimationDemo} disabled={showSkipAnimation}>
              {showSkipAnimation ? 'Animation Playing...' : 'Trigger Skip Animation'}
            </Button>
          </div>
          {mockContestants[0] && mockContestants[1] && (
            <ClockBar
              contestant1={mockContestants[0]}
              contestant2={mockContestants[1]}
              timeRemaining1={25}
              timeRemaining2={30}
              activePlayer={1}
              categoryName="World Landmarks"
              {...(showSkipAnimation && { skipAnswer: 'The Eiffel Tower' })}
            />
          )}
          <div className={styles['highlight']} style={{ marginTop: '1rem' }}>
            <p>
              <strong>Features:</strong>
            </p>
            <ul>
              <li>
                Exactly 3 seconds total duration (200ms fade in + 2600ms hold + 200ms fade out)
              </li>
              <li>Bright yellow text on dark background for high visibility</li>
              <li>Smooth scale and fade transitions</li>
              <li>Centered overlay that doesn&apos;t interfere with other UI elements</li>
              <li>Answer text or &quot;Skipped&quot; fallback when no answer available</li>
            </ul>
          </div>
        </section>

        {/* Accessibility Notes */}
        <section className={styles['section']}>
          <Card header="Accessibility Features">
            <ul>
              <li>All buttons have proper focus states and keyboard navigation</li>
              <li>Modal has focus trap and restores focus on close</li>
              <li>Spinner has proper ARIA roles and screen reader text</li>
              <li>ContestantCard supports keyboard interaction (Enter/Space) and ARIA labels</li>
              <li>All components support custom className for styling</li>
              <li>Interactive elements have appropriate ARIA labels</li>
            </ul>
          </Card>
        </section>
      </div>
    </Container>
  );
}
