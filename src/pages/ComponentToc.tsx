import { memo, useCallback } from 'react';
import { Card } from '@components/common';

export interface TocSection {
  id: string;
  label: string;
  children?: TocSection[];
}

interface ComponentTocProps {
  sections: TocSection[];
  activeSection: string;
  onNavigate: (sectionId: string, viewIndex?: number) => void;
}

export const ComponentToc = memo(function ComponentToc({
  sections,
  activeSection,
  onNavigate,
}: ComponentTocProps) {
  const renderSection = useCallback(
    (section: TocSection, isChild = false) => {
      const isActive = activeSection === section.id;
      const hasActiveChild = section.children?.some((child) => child.id === activeSection);

      return (
        <li key={section.id} style={{ marginTop: isChild ? 0 : '0.5rem' }}>
          <a
            href={`#${section.id}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(section.id);
            }}
            style={{
              textDecoration: 'none',
              color: isActive ? 'var(--primary-color)' : 'inherit',
              fontWeight: isActive || hasActiveChild ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            <code>&lt;{section.label} /&gt;</code>
          </a>
          {section.children && section.children.length > 0 && (
            <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem', fontSize: '0.9em' }}>
              {section.children.map((child, idx) => {
                const childIsActive = activeSection === child.id;
                return (
                  <div key={idx} style={{ marginBottom: '0.125rem' }}>
                    <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>↳</span>
                    <a
                      href={`#${child.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(child.id, idx);
                      }}
                      style={{
                        textDecoration: 'none',
                        color: childIsActive ? 'var(--primary-color)' : 'inherit',
                        fontWeight: childIsActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                      }}
                    >
                      <code>&lt;{child.label} /&gt;</code>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </li>
      );
    },
    [activeSection, onNavigate]
  );

  return (
    <Card header="📑 Complete Component Inventory">
      <p
        style={{
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
        }}
      >
        The Floor application is built with <strong>30+ React components</strong>. Click any
        component below to view its demo:
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          textAlign: 'left',
        }}
      >
        {/* 1. Common Components (8) */}
        <Card header="Common Components">
          <ul style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}>
            {sections.slice(0, 8).map((section) => renderSection(section))}
          </ul>
        </Card>

        {/* 2. Category (9 with subviews) */}
        <Card header="Category">
          <ul style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}>
            {sections.slice(10, 13).map((section) => renderSection(section))}
          </ul>
        </Card>

        {/* 3. Contestant (3 with subviews) */}
        <Card header="Contestant">
          <ul style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}>
            {sections.slice(8, 10).map((section) => renderSection(section))}
          </ul>
        </Card>

        {/* 4. Slides (4) */}
        <Card header="Slides">
          <ul style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}>
            {sections.slice(13, 17).map((section) => renderSection(section))}
          </ul>
        </Card>

        {/* 5. Grid Management (2 with children) */}
        <Card header="Grid Management">
          <ul style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}>
            {sections.slice(20, 21).map((section) => renderSection(section))}
          </ul>
        </Card>

        {/* 6. Duel (2) */}
        <Card header="Duel">
          <ul style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}>
            {sections.slice(17, 19).map((section) => renderSection(section))}
          </ul>
        </Card>

        {/* 7. Audience View (2 with children) */}
        <Card header="Audience View">
          <ul style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}>
            {sections.slice(19, 20).map((section) => renderSection(section))}
          </ul>
        </Card>

        {/* 8. Other (1) */}
        <Card header="Other">
          <ul style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}>
            {sections.slice(21).map((section) => renderSection(section))}
          </ul>
        </Card>
      </div>
    </Card>
  );
});
