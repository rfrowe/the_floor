import { useState } from 'react';
import { Modal, Button } from '@components/common';
import { ComponentController } from '@pages/ComponentController';
import styles from '@pages/ComponentsDemo.module.css';

export default function ModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className={styles['section']} id="modal">
      <h2>
        <code>&lt;Modal /&gt;</code>
      </h2>

      <ComponentController
        controls={[
          {
            type: 'button',
            label: '🪟 Open Modal',
            onClick: () => {
              setIsModalOpen(true);
            },
            variant: 'primary',
          },
        ]}
        highlights={
          <p>
            <strong>Features:</strong> Focus trapping, click-outside to close, escape key handling,
            and tab cycling through focusable elements.
          </p>
        }
      />

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
          This is a modal dialog. Try pressing the Tab key to cycle through the focusable elements,
          clicking outside to close, or pressing Escape!
        </p>
      </Modal>
    </section>
  );
}
