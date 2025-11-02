import { useState } from 'react';
import { Container, Button, Card, Modal, Spinner } from '@components/common';
import { ContestantCard } from '@components/contestant/ContestantCard';
import type { Contestant } from '@types';
import styles from './ComponentsDemo.module.css';

export function ComponentsDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  // Mock contestants for demo
  const mockContestants: Contestant[] = [
    {
      id: 'demo-contestant-1',
      name: 'Alice Johnson',
      category: { name: '80s Movies', slides: [] },
      wins: 5,
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
      wins: 7,
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
            {mockContestants.map((contestant) => (
              <ContestantCard
                key={contestant.name}
                contestant={contestant}
                isSelected={selectedContestant === contestant.name}
                onSelect={(c) => {
                  setSelectedContestant(c.name === selectedContestant ? null : c.name);
                }}
              />
            ))}
          </div>
          <div className={styles['highlight']} style={{ marginTop: '1rem' }}>
            <p>
              <strong>Features:</strong> Click cards to select/deselect. Notice the eliminated
              contestant (Carol) is greyed out. Win counts are displayed as badges.
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
