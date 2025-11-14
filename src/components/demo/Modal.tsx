import { useState } from 'react';
import { Modal, Button } from '@components/common';
import { ComponentController } from '@pages/ComponentController';
import { DemoDescription, DemoHighlights } from '@pages/DemoControlsContent';
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
        description={
          <DemoDescription>
            <p>
              Accessible modal dialog with overlay, close button, and optional header/footer slots.
              Includes focus trapping, escape key handling, and click-outside-to-close. Used
              throughout the app for confirmations and forms.
            </p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Try These Features:">
            - <strong>Open Modal button:</strong> Launch the modal
            <br />- <strong>Escape key:</strong> Close modal
            <br />- <strong>Click overlay:</strong> Close by clicking outside
            <br />- <strong>Tab key:</strong> Cycles through focusable elements
            <br />- Focus is trapped inside the modal while open
          </DemoHighlights>
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
