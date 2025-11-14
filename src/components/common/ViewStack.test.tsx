/**
 * ViewStack Component Tests
 *
 * Tests the ViewStack component with command stack architecture
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { ViewStack, useViewStack, type ViewStackViewProps } from './ViewStack';
import type { Command } from './Command';
import { BOOKMARK } from './BookmarkCommand';

// Mock command for testing
class MockCommand implements Command {
  public executeCount: number;
  public undoCount: number;
  public description: string;
  private executeFn: (() => Promise<void>) | undefined;
  private undoFn: (() => Promise<void>) | undefined;

  constructor(executeFn?: () => Promise<void>, undoFn?: () => Promise<void>) {
    this.executeCount = 0;
    this.undoCount = 0;
    this.description = 'Mock Command';
    this.executeFn = executeFn;
    this.undoFn = undoFn;
  }

  async execute(): Promise<void> {
    this.executeCount++;
    if (this.executeFn) await this.executeFn();
  }

  async undo(): Promise<void> {
    this.undoCount++;
    if (this.undoFn) await this.undoFn();
  }

  describe(): string {
    return this.description;
  }
}

describe('ViewStack', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render initial view when opened', () => {
    function InitialView(_props: ViewStackViewProps) {
      return <div data-testid="initial-content">Initial Content</div>;
    }

    render(
      <ViewStack isOpen={true} onClose={mockOnClose}>
        <InitialView viewId="initial" viewTitle="Initial View" />
      </ViewStack>
    );

    expect(screen.getByTestId('initial-content')).toBeInTheDocument();
    expect(screen.getByText('Initial View')).toBeInTheDocument();
  });

  it('should execute commands when pushing views', async () => {
    const command1 = new MockCommand();
    const command2 = new MockCommand();

    function TestView(_props: ViewStackViewProps) {
      const { commitAndPushView } = useViewStack();

      const handlePush = () => {
        void commitAndPushView(
          {
            id: 'view2',
            title: 'View 2',
            content: <div>View 2</div>,
          },
          { commands: [command1, command2] }
        );
      };

      return (
        <div>
          <button onClick={handlePush}>Push View</button>
        </div>
      );
    }

    render(
      <ViewStack isOpen={true} onClose={mockOnClose}>
        <TestView viewId="initial" viewTitle="Initial View" />
      </ViewStack>
    );

    const pushButton = screen.getByText('Push View');
    act(() => {
      fireEvent.click(pushButton);
    });

    await waitFor(() => {
      expect(command1.executeCount).toBe(1);
      expect(command2.executeCount).toBe(1);
    });
  });

  it('should undo commands in LIFO order when popping', async () => {
    const executionOrder: string[] = [];
    const undoOrder: string[] = [];

    const command1 = new MockCommand(
      () => {
        executionOrder.push('cmd1');
        return Promise.resolve();
      },
      () => {
        undoOrder.push('cmd1');
        return Promise.resolve();
      }
    );

    const command2 = new MockCommand(
      () => {
        executionOrder.push('cmd2');
        return Promise.resolve();
      },
      () => {
        undoOrder.push('cmd2');
        return Promise.resolve();
      }
    );

    function View1(_props: ViewStackViewProps) {
      const { commitAndPushView } = useViewStack();

      const handlePush = () => {
        void commitAndPushView(
          {
            id: 'view2',
            title: 'View 2',
            content: <View2 />,
          },
          { commands: [command1, command2] }
        );
      };

      return (
        <div>
          <button onClick={handlePush}>Push with Commands</button>
        </div>
      );
    }

    function View2() {
      const { popView } = useViewStack();
      return (
        <div>
          <div>View 2 Content</div>
          <button
            onClick={() => {
              popView();
            }}
          >
            Pop View
          </button>
        </div>
      );
    }

    render(
      <ViewStack isOpen={true} onClose={mockOnClose}>
        <View1 viewId="initial" viewTitle="Initial" />
      </ViewStack>
    );

    act(() => {
      fireEvent.click(screen.getByText('Push with Commands'));
    });

    await waitFor(() => {
      expect(executionOrder).toEqual(['cmd1', 'cmd2']);
    });

    act(() => {
      fireEvent.click(screen.getByText('Pop View'));
    });

    await waitFor(() => {
      expect(undoOrder).toEqual(['cmd2', 'cmd1']);
    });
  });

  it('should return to bookmarked view with commitAndReturn', async () => {
    const cmd1 = new MockCommand();
    const cmd2 = new MockCommand();
    const cmd3 = new MockCommand();

    function InitialView(_props: ViewStackViewProps) {
      const { commitAndPushView, viewStack, commandStack } = useViewStack();

      const handlePush = () => {
        void commitAndPushView(
          { id: 'view2', title: 'View 2', content: <View2 /> },
          { commands: [BOOKMARK] }
        );
      };

      return (
        <div>
          <div data-testid="stack-info">
            {viewStack.length}-{commandStack.length}
          </div>
          <button onClick={handlePush}>Push View 2 with Bookmark</button>
        </div>
      );
    }

    function View2() {
      const { commitAndPushView, viewStack, commandStack } = useViewStack();

      const handlePush = () => {
        void commitAndPushView(
          { id: 'view3', title: 'View 3', content: <View3 /> },
          { commands: [cmd1] }
        );
      };

      return (
        <div>
          <div data-testid="stack-info">
            {viewStack.length}-{commandStack.length}
          </div>
          <button onClick={handlePush}>Push View 3</button>
        </div>
      );
    }

    function View3() {
      const { commitAndPushView, viewStack, commandStack } = useViewStack();

      const handlePush = () => {
        void commitAndPushView(
          { id: 'view4', title: 'View 4', content: <View4 /> },
          { commands: [cmd2] }
        );
      };

      return (
        <div>
          <div data-testid="stack-info">
            {viewStack.length}-{commandStack.length}
          </div>
          <button onClick={handlePush}>Push View 4</button>
        </div>
      );
    }

    function View4() {
      const { commitAndReturn, viewStack, commandStack } = useViewStack();

      const handleReturn = () => {
        void commitAndReturn({ commands: [cmd3] });
      };

      return (
        <div>
          <div data-testid="stack-info">
            {viewStack.length}-{commandStack.length}
          </div>
          <button onClick={handleReturn}>Commit and Return</button>
        </div>
      );
    }

    render(
      <ViewStack isOpen={true} onClose={mockOnClose}>
        <InitialView viewId="initial" viewTitle="Initial" />
      </ViewStack>
    );

    // Initial: [InitialView] []
    expect(screen.getByTestId('stack-info')).toHaveTextContent('1-0');

    // Push with BOOKMARK: [InitialView, View2] [[BOOKMARK]]
    act(() => {
      fireEvent.click(screen.getByText('Push View 2 with Bookmark'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('stack-info')).toHaveTextContent('2-1');
    });

    // Push View3: [InitialView, View2, View3] [[BOOKMARK], [cmd1]]
    act(() => {
      fireEvent.click(screen.getByText('Push View 3'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('stack-info')).toHaveTextContent('3-2');
    });
    expect(cmd1.executeCount).toBe(1);

    // Push View4: [InitialView, View2, View3, View4] [[BOOKMARK], [cmd1], [cmd2]]
    act(() => {
      fireEvent.click(screen.getByText('Push View 4'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('stack-info')).toHaveTextContent('4-3');
    });
    expect(cmd2.executeCount).toBe(1);

    // commitAndReturn: execute cmd3, find BOOKMARK at commandStack[0]
    // BOOKMARK at commandStack[0] means bookmarked view is viewStack[0] (InitialView)
    // Result: [InitialView] []
    act(() => {
      fireEvent.click(screen.getByText('Commit and Return'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('stack-info')).toHaveTextContent('1-0');
    });
    expect(cmd3.executeCount).toBe(1);
    expect(screen.getByText('Push View 2 with Bookmark')).toBeInTheDocument();
  });

  it('should call onComplete when no bookmark found in commitAndReturn', async () => {
    const cmd = new MockCommand();
    const onCompleteSpy = vi.fn();

    function InitialView(_props: ViewStackViewProps) {
      const { commitAndPushView } = useViewStack();

      const handlePush = () => {
        void commitAndPushView({
          id: 'view2',
          title: 'View 2',
          content: <View2 />,
        });
      };

      return (
        <div>
          <button onClick={handlePush}>Push View 2</button>
        </div>
      );
    }

    function View2() {
      const { commitAndReturn } = useViewStack();

      const handleReturn = () => {
        void commitAndReturn({ commands: [cmd] });
      };

      return (
        <div>
          <button onClick={handleReturn}>Commit and Return</button>
        </div>
      );
    }

    render(
      <ViewStack isOpen={true} onClose={mockOnClose} onComplete={onCompleteSpy}>
        <InitialView viewId="initial" viewTitle="Initial" />
      </ViewStack>
    );

    act(() => {
      fireEvent.click(screen.getByText('Push View 2'));
    });

    act(() => {
      fireEvent.click(screen.getByText('Commit and Return'));
    });

    await waitFor(() => {
      expect(cmd.executeCount).toBe(1);
      expect(onCompleteSpy).toHaveBeenCalled();
    });
  });

  it('should maintain command stack length = view stack length - 1', async () => {
    function TestView(_props: ViewStackViewProps) {
      const { commitAndPushView, popView, viewStack, commandStack } = useViewStack();

      const handlePush = () => {
        void commitAndPushView(
          {
            id: `view-${String(Date.now())}`,
            title: 'New View',
            content: <TestView viewId="nested" viewTitle="Nested" />,
          },
          { commands: [new MockCommand()] }
        );
      };

      return (
        <div>
          <div data-testid="view-length">{viewStack.length}</div>
          <div data-testid="command-length">{commandStack.length}</div>
          <button onClick={handlePush}>Push</button>
          <button
            onClick={() => {
              popView();
            }}
          >
            Pop
          </button>
        </div>
      );
    }

    render(
      <ViewStack isOpen={true} onClose={mockOnClose}>
        <TestView viewId="initial" viewTitle="Initial" />
      </ViewStack>
    );

    expect(screen.getByTestId('view-length')).toHaveTextContent('1');
    expect(screen.getByTestId('command-length')).toHaveTextContent('0');

    act(() => {
      fireEvent.click(screen.getByText('Push'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('view-length')).toHaveTextContent('2');
      expect(screen.getByTestId('command-length')).toHaveTextContent('1');
    });

    act(() => {
      fireEvent.click(screen.getByText('Push'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('view-length')).toHaveTextContent('3');
      expect(screen.getByTestId('command-length')).toHaveTextContent('2');
    });

    act(() => {
      fireEvent.click(screen.getByText('Pop'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('view-length')).toHaveTextContent('2');
      expect(screen.getByTestId('command-length')).toHaveTextContent('1');
    });
  });

  it('should handle view lifecycle hooks correctly', async () => {
    const lifecycleEvents: string[] = [];

    function View1(_props: ViewStackViewProps) {
      const { commitAndPushView } = useViewStack();

      const handlePush = () => {
        void commitAndPushView({
          id: 'view2',
          title: 'View 2',
          content: <View2 />,
          onEnter: () => {
            lifecycleEvents.push('view2:enter');
          },
          onExit: () => {
            lifecycleEvents.push('view2:exit');
          },
          onLeave: () => {
            lifecycleEvents.push('view2:leave');
            return Promise.resolve();
          },
        });
      };

      return (
        <div>
          <button onClick={handlePush}>Push View2</button>
        </div>
      );
    }

    function View2() {
      const { popView } = useViewStack();
      return (
        <div>
          <button
            onClick={() => {
              popView();
            }}
          >
            Pop
          </button>
        </div>
      );
    }

    render(
      <ViewStack isOpen={true} onClose={mockOnClose}>
        <View1
          viewId="view1"
          viewTitle="View 1"
          onViewEnter={() => {
            lifecycleEvents.push('view1:enter');
          }}
          onViewExit={() => {
            lifecycleEvents.push('view1:exit');
          }}
          onViewCommit={() => {
            lifecycleEvents.push('view1:commit');
            return Promise.resolve();
          }}
          onViewLeave={() => {
            lifecycleEvents.push('view1:leave');
            return Promise.resolve();
          }}
        />
      </ViewStack>
    );

    await waitFor(() => {
      expect(lifecycleEvents).toContain('view1:enter');
    });

    act(() => {
      fireEvent.click(screen.getByText('Push View2'));
    });

    await waitFor(() => {
      expect(lifecycleEvents).toEqual([
        'view1:enter',
        'view1:commit',
        'view1:leave',
        'view1:exit',
        'view2:enter',
      ]);
    });

    act(() => {
      fireEvent.click(screen.getByText('Pop'));
    });

    await waitFor(() => {
      expect(lifecycleEvents).toContain('view2:exit');
      expect(lifecycleEvents[lifecycleEvents.length - 1]).toBe('view1:enter');
    });
  });

  it('should handle errors in command execution gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Suppress console.error in test
    });

    const failingCommand = new MockCommand(
      () => {
        throw new Error('Execute failed');
      },
      () => {
        throw new Error('Undo failed');
      }
    );

    function View1(_props: ViewStackViewProps) {
      const { commitAndPushView } = useViewStack();

      const handlePush = () => {
        void commitAndPushView(
          { id: 'error-view', title: 'Error View', content: <ErrorView /> },
          { commands: [failingCommand] }
        );
      };

      return (
        <div>
          <button onClick={handlePush}>Push with Error</button>
        </div>
      );
    }

    function ErrorView() {
      const { popView } = useViewStack();
      return (
        <div>
          <div>Error View</div>
          <button
            onClick={() => {
              popView();
            }}
          >
            Pop
          </button>
        </div>
      );
    }

    render(
      <ViewStack isOpen={true} onClose={mockOnClose}>
        <View1 viewId="initial" viewTitle="Initial" />
      </ViewStack>
    );

    act(() => {
      fireEvent.click(screen.getByText('Push with Error'));
    });

    await waitFor(() => {
      // Logger calls console.error with formatted string and styles
      expect(consoleErrorSpy).toHaveBeenCalled();
      const calls = consoleErrorSpy.mock.calls;
      const executeErrorCall = calls.find(
        (call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('Command execute failed')
      );
      expect(executeErrorCall).toBeTruthy();
    });

    act(() => {
      fireEvent.click(screen.getByText('Pop'));
    });

    await waitFor(() => {
      const calls = consoleErrorSpy.mock.calls;
      const undoErrorCall = calls.find(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('Command undo failed')
      );
      expect(undoErrorCall).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });
});
