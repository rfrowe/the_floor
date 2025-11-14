import { useState } from 'react';
import { SlidingModal, Button } from '@components/common';
import { ComponentController } from '@pages/ComponentController';
import styles from '@pages/ComponentsDemo.module.css';

export default function SlidingModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'secondary'>('main');

  return (
    <section className={styles['section']} id="sliding-modal">
      <h2>
        <code>&lt;SlidingModal /&gt;</code>
      </h2>
      <p>
        A modal with sliding panel navigation between views. Supports left/right slide animations
        and back button navigation.
      </p>

      <ComponentController
        controls={[
          {
            type: 'button',
            label: '🪟 Open Sliding Modal',
            onClick: () => {
              setIsOpen(true);
              setCurrentView('main');
            },
            variant: 'primary',
          },
        ]}
      />

      <SlidingModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setCurrentView('main');
        }}
        title="Sliding Modal Demo"
        currentView={currentView}
        showBackButton={currentView === 'secondary'}
        onBack={() => {
          setCurrentView('main');
        }}
      >
        <div style={{ padding: '1rem' }}>
          {currentView === 'main' ? (
            <>
              <h3>Main View</h3>
              <p>This is the main view of the sliding modal.</p>
              <Button
                onClick={() => {
                  setCurrentView('secondary');
                }}
              >
                Go to Secondary View →
              </Button>
            </>
          ) : (
            <>
              <h3>Secondary View</h3>
              <p>This is the secondary view. Click the back button in the header to return.</p>
            </>
          )}
        </div>
      </SlidingModal>
    </section>
  );
}
