import { useState, useEffect, useCallback } from 'react';
import { ComponentToc, type TocSection } from './ComponentToc';
import ContestantCardDemo from '@components/demo/ContestantCard';
import ClockBarDemo from '@components/demo/ClockBar';
import CategoryStorageDemo from '@components/demo/CategoryStorage';
import AudienceViewDemo from '@components/demo/AudienceView';
import DuelSetupDemo from '@components/demo/DuelSetup';
import SlideViewerDemo from '@components/demo/SlideViewer';
import ModalDemo from '@components/demo/Modal';
import SlidingModalDemo from '@components/demo/SlidingModal';
import SlidePreviewDemo from '@components/demo/SlidePreview';
import SlideListDemo from '@components/demo/SlideList';
import GridManagementDemo from '@components/demo/GridManagement';
import CategoryManagerDemo from '@components/demo/CategoryManager';
import ContestantCreatorDemo from '@components/demo/ContestantCreator';
import ImportContentDemo from '@components/demo/ImportContent';
import { Container, Button, Card, Spinner, ThemeToggle, ErrorBoundary } from '@components/common';
import styles from './ComponentsDemo.module.css';

// Section definitions for ToC and navigation
const SECTIONS: TocSection[] = [
  { id: 'container', label: 'Container' },
  { id: 'button', label: 'Button' },
  { id: 'card', label: 'Card' },
  { id: 'spinner', label: 'Spinner' },
  { id: 'modal', label: 'Modal' },
  { id: 'sliding-modal', label: 'SlidingModal' },
  { id: 'theme-toggle', label: 'ThemeToggle' },
  { id: 'view-stack', label: 'ViewStack' },
  { id: 'contestant-card', label: 'ContestantCard' },
  {
    id: 'contestant-creator',
    label: 'ContestantCreator',
    children: [
      { id: 'contestant-creator-0', label: 'CreateContent' },
      { id: 'contestant-creator-1', label: 'ImportContent' },
    ],
  },
  {
    id: 'category-manager',
    label: 'CategoryManager',
    children: [
      { id: 'category-manager-0', label: 'ListContent' },
      { id: 'category-manager-1', label: 'ImportContent' },
      { id: 'category-manager-2', label: 'DeleteConfirmationContent' },
    ],
  },
  {
    id: 'import-content',
    label: 'ImportContent',
    children: [
      { id: 'import-content-0', label: 'ImportContent' },
      { id: 'import-content-1', label: 'SampleCategoryBrowser' },
      { id: 'import-content-2', label: 'IndividualPreview 1 of N' },
      { id: 'import-content-3', label: 'IndividualPreview JSON' },
      { id: 'import-content-4', label: 'IndividualPreview N of N' },
    ],
  },
  { id: 'category-storage', label: 'CategoryStorage' },
  { id: 'slide-viewer', label: 'SlideViewer' },
  { id: 'slide-preview', label: 'SlidePreview' },
  { id: 'slide-list', label: 'SlideList' },
  { id: 'censor-box', label: 'CensorBox' },
  { id: 'clock-bar', label: 'ClockBar' },
  { id: 'duel-setup', label: 'DuelSetup' },
  {
    id: 'audience-view',
    label: 'AudienceView',
    children: [
      { id: 'audience-view', label: 'FloorGrid' },
      { id: 'audience-view', label: 'GridSquare' },
    ],
  },
  {
    id: 'grid-management',
    label: 'GridManagement',
    children: [
      { id: 'grid-management', label: 'GridInitializer' },
      { id: 'grid-management', label: 'GridConfigurator' },
    ],
  },
  { id: 'accessibility', label: 'Accessibility' },
];

export function ComponentsDemo() {
  // State for vending machine - which section is active (empty = none)
  const [activeSection, setActiveSection] = useState<string>('');

  // Sync with URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && SECTIONS.some((s) => s.id === hash || s.children?.some((c) => c.id === hash))) {
      setActiveSection(hash);
    }
  }, []);

  // Update URL hash when section changes
  useEffect(() => {
    if (activeSection) {
      window.location.hash = activeSection;
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  }, [activeSection]);

  // Track carousel view indices
  const [carouselViews, setCarouselViews] = useState<Record<string, number>>({});

  // Navigation handler for ToC
  const handleNavigate = useCallback((sectionId: string, viewIndex?: number) => {
    // Extract parent section and view index from child IDs like "category-manager-0"
    const match = /^(.+)-(\d+)$/.exec(sectionId);
    if (match && viewIndex === undefined) {
      const parentSection = match[1] ?? '';
      const childIndex = parseInt(match[2] ?? '0', 10);
      setActiveSection(sectionId);
      if (parentSection) {
        setCarouselViews((prev) => ({ ...prev, [parentSection]: childIndex }));
      }
    } else {
      setActiveSection(sectionId);
      // Store view index for carousel-based sections
      if (viewIndex !== undefined) {
        setCarouselViews((prev) => ({ ...prev, [sectionId]: viewIndex }));
      }
    }

    // Scroll to the vended section
    setTimeout(() => {
      const element = document.getElementById('vended-section');
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  // Render vended section content
  const renderVendedSection = () => {
    if (!activeSection) {
      return null;
    }

    // Render specific section based on activeSection
    switch (activeSection) {
      case 'theme-toggle':
        return (
          <section className={styles['section']} id="theme-toggle">
            <Card header="🌓 Theme Toggle">
              <p style={{ marginBottom: '1rem' }}>
                The ThemeToggle is now in the page header (top-right). Switch between light and dark
                modes. The theme preference is persisted to localStorage and affects the entire
                application.
              </p>
              <div className={styles['highlight']}>
                <p>
                  <strong>Features:</strong> Persistent theme across page reloads, accessible with
                  proper ARIA labels, smooth transitions between themes.
                </p>
              </div>
            </Card>
          </section>
        );

      case 'container':
        return (
          <section className={styles['section']} id="container">
            <h2>
              <code>&lt;Container /&gt;</code>
            </h2>
            <p>
              The Container component provides consistent max-width and padding, centers content on
              large screens, and has responsive behavior.
            </p>
            <div className={styles['highlight']}>
              <p>This entire page is wrapped in a Container component!</p>
            </div>
          </section>
        );

      case 'button':
        return (
          <section className={styles['section']} id="button">
            <h2>
              <code>&lt;Button /&gt;</code>
            </h2>
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
                  <Button>Normal</Button>
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
        );

      case 'card':
        return (
          <section className={styles['section']} id="card">
            <h2>
              <code>&lt;Card /&gt;</code>
            </h2>
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
        );

      case 'spinner':
        return (
          <section className={styles['section']} id="spinner">
            <h2>
              <code>&lt;Spinner /&gt;</code>
            </h2>
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
        );

      case 'contestant-card':
        return <ContestantCardDemo />;

      case 'clock-bar':
        return <ClockBarDemo />;

      case 'slide-viewer':
        return <SlideViewerDemo />;

      case 'category-storage':
        return <CategoryStorageDemo />;

      case 'audience-view':
        return <AudienceViewDemo />;

      case 'duel-setup':
        return <DuelSetupDemo />;

      case 'modal':
        return <ModalDemo />;

      case 'sliding-modal':
        return <SlidingModalDemo />;

      case 'slide-preview':
        return <SlidePreviewDemo />;

      case 'slide-list':
        return <SlideListDemo />;

      case 'grid-management':
        return <GridManagementDemo />;

      case 'category-manager':
      case 'category-manager-0':
      case 'category-manager-1':
      case 'category-manager-2': {
        const match = /^category-manager-(\d+)$/.exec(activeSection);
        const viewIndex = match
          ? parseInt(match[1] ?? '0', 10)
          : (carouselViews['category-manager'] ?? 0);
        return (
          <CategoryManagerDemo
            initialView={viewIndex}
            onViewChange={(newIndex) => {
              setCarouselViews((prev) => ({ ...prev, 'category-manager': newIndex }));
              setActiveSection(`category-manager-${String(newIndex)}`);
            }}
          />
        );
      }

      case 'contestant-creator':
      case 'contestant-creator-0':
      case 'contestant-creator-1': {
        const match = /^contestant-creator-(\d+)$/.exec(activeSection);
        const viewIndex = match
          ? parseInt(match[1] ?? '0', 10)
          : (carouselViews['contestant-creator'] ?? 0);
        return (
          <ContestantCreatorDemo
            initialView={viewIndex}
            onViewChange={(newIndex) => {
              setCarouselViews((prev) => ({ ...prev, 'contestant-creator': newIndex }));
              setActiveSection(`contestant-creator-${String(newIndex)}`);
            }}
          />
        );
      }

      case 'import-content':
      case 'import-content-0':
      case 'import-content-1':
      case 'import-content-2':
      case 'import-content-3':
      case 'import-content-4': {
        const match = /^import-content-(\d+)$/.exec(activeSection);
        const viewIndex = match
          ? parseInt(match[1] ?? '0', 10)
          : (carouselViews['import-content'] ?? 0);
        return (
          <ImportContentDemo
            initialView={viewIndex}
            onViewChange={(newIndex) => {
              setCarouselViews((prev) => ({ ...prev, 'import-content': newIndex }));
              setActiveSection(`import-content-${String(newIndex)}`);
            }}
          />
        );
      }

      case 'view-stack':
        return (
          <section className={styles['section']} id="view-stack">
            <h2>
              <code>&lt;ViewStack /&gt;</code>
            </h2>
            <p>
              ViewStack provides navigation between views with undo/redo support. It&apos;s used
              throughout the application for workflows like CategoryManager and ContestantCreator.
            </p>
            <div className={styles['highlight']}>
              <p>
                <strong>Features:</strong> Stack-based navigation, undo/redo commands, view history
                management. See CategoryManager and ContestantCreator sections for examples in
                action.
              </p>
            </div>
          </section>
        );

      case 'censor-box':
        return (
          <section className={styles['section']} id="censor-box">
            <h2>
              <code>&lt;CensorBox /&gt;</code>
            </h2>
            <p>
              The CensorBox component is used internally by SlideViewer to render censorship
              overlays. It handles positioning, sizing, and show/hide animations.
            </p>
            <div className={styles['highlight']}>
              <p>
                <strong>Note:</strong> This is an internal component. See the SlideViewer section
                for interactive demonstrations of censor boxes in action.
              </p>
            </div>
          </section>
        );

      case 'accessibility':
        return (
          <section className={styles['section']}>
            <Card header="Accessibility Features">
              <ul>
                <li>All buttons have proper focus states and keyboard navigation</li>
                <li>Modal has focus trap and restores focus on close</li>
                <li>Spinner has proper ARIA roles and screen reader text</li>
                <li>ContestantCard supports keyboard interaction (Enter/Space) and ARIA labels</li>
                <li>All components support custom className for styling</li>
                <li>Interactive elements have appropriate ARIA labels</li>
                <li>ThemeToggle provides theme context with accessible toggle</li>
                <li>FloorGrid includes proper grid roles and aria-labels</li>
              </ul>
            </Card>
          </section>
        );

      default:
        return (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Section content not yet migrated. Check back soon!
            </p>
          </div>
        );
    }
  };

  return (
    <Container>
      <div className={styles['demo']}>
        {/* Header with theme toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1>Complete Component Showcase</h1>
            <p
              style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}
            >
              Interactive demonstrations of all components. Click any component to view its demo.
            </p>
          </div>
          <div style={{ marginLeft: '2rem' }}>
            <ThemeToggle />
          </div>
        </div>

        {/* Table of Contents - Always visible */}
        <ComponentToc
          sections={SECTIONS}
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />

        {/* Vended Section - Shows selected component */}
        {activeSection && (
          <div id="vended-section" style={{ marginTop: '3rem' }}>
            <ErrorBoundary
              onReset={() => {
                setActiveSection('');
              }}
            >
              {renderVendedSection()}
            </ErrorBoundary>
          </div>
        )}
      </div>
    </Container>
  );
}
