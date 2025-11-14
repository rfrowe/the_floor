/**
 * Shared styled components for Demo Controls content
 * Ensures consistent formatting across all demo components
 */

import type { ReactNode } from 'react';

interface DemoHighlightsProps {
  title: string;
  children: ReactNode;
}

export function DemoHighlights({ title, children }: DemoHighlightsProps) {
  return (
    <>
      <p>
        <strong>{title}</strong>
      </p>
      <div style={{ marginTop: '0.75rem', marginBottom: 0, marginLeft: '1rem', lineHeight: '2' }}>
        {children}
      </div>
    </>
  );
}

interface DemoDescriptionProps {
  children: ReactNode;
}

export function DemoDescription({ children }: DemoDescriptionProps) {
  return <div style={{ textAlign: 'left' }}>{children}</div>;
}
