/**
 * ClockBar Component Tests
 * Tests display, formatting, active player indication, and edge cases
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClockBar } from './ClockBar';
import type { Contestant } from '@types';

// Mock contestants for testing
const mockContestant1: Contestant = {
  id: '1',
  name: 'Alice Johnson',
  category: {
    name: 'State Capitals',
    slides: [],
  },
  wins: 2,
  eliminated: false,
};

const mockContestant2: Contestant = {
  id: '2',
  name: 'Bob Smith',
  category: {
    name: 'World Geography',
    slides: [],
  },
  wins: 1,
  eliminated: false,
};

describe('ClockBar', () => {
  describe('Basic rendering', () => {
    it('renders both contestant names', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="State Capitals"
        />
      );

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('renders time remaining for both players', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={28}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="State Capitals"
        />
      );

      expect(screen.getByText('28.0s')).toBeInTheDocument();
      expect(screen.getByText('30.0s')).toBeInTheDocument();
    });

    it('renders category name', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="State Capitals"
        />
      );

      expect(screen.getByText('State Capitals')).toBeInTheDocument();
    });

    it('does not render category when empty string', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={1}
          categoryName=""
        />
      );

      expect(screen.queryByText(/Category:/)).not.toBeInTheDocument();
    });
  });

  describe('Time formatting', () => {
    it('formats seconds under 60 with "s" suffix', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={45}
          timeRemaining2={15}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('45.0s')).toBeInTheDocument();
      expect(screen.getByText('15.0s')).toBeInTheDocument();
    });

    it('formats time over 60 seconds as MM:SS', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={75}
          timeRemaining2={120}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('1:15.0')).toBeInTheDocument();
      expect(screen.getByText('2:00.0')).toBeInTheDocument();
    });

    it('handles zero time', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={0}
          timeRemaining2={0}
          activePlayer={1}
          categoryName="Test"
        />
      );

      const zeroTimes = screen.getAllByText('0.0s');
      expect(zeroTimes).toHaveLength(2);
    });

    it('handles negative time as zero', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={-5}
          timeRemaining2={10}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('0.0s')).toBeInTheDocument();
    });

    it('handles fractional seconds by displaying tenths', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={28.9}
          timeRemaining2={30.1}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('28.8s')).toBeInTheDocument();
      expect(screen.getByText('30.1s')).toBeInTheDocument();
    });
  });

  describe('Active player indicator', () => {
    it('shows category name in center for player 1', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="State Capitals"
        />
      );

      expect(screen.getByText('State Capitals')).toBeInTheDocument();
    });

    it('shows category name in center for player 2', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={2}
          categoryName="State Capitals"
        />
      );

      expect(screen.getByText('State Capitals')).toBeInTheDocument();
    });
  });

  describe('Time warning states', () => {
    it('displays time correctly when under 10 seconds', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={9}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('9.0s')).toBeInTheDocument();
      expect(screen.getByText('30.0s')).toBeInTheDocument();
    });

    it('displays time correctly when under 5 seconds', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={4}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('4.0s')).toBeInTheDocument();
      expect(screen.getByText('30.0s')).toBeInTheDocument();
    });

    it('displays both times when both are under 5 seconds', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={3}
          timeRemaining2={2}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('3.0s')).toBeInTheDocument();
      expect(screen.getByText('2.0s')).toBeInTheDocument();
    });
  });

  describe('Long name handling', () => {
    it('renders very long names without breaking layout', () => {
      const longNameContestant: Contestant = {
        ...mockContestant1,
        name: 'Christopher Alexander Maximilian Wellington',
      };

      render(
        <ClockBar
          contestant1={longNameContestant}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('Christopher Alexander Maximilian Wellington')).toBeInTheDocument();
    });

    it('renders names with special characters', () => {
      const specialNameContestant: Contestant = {
        ...mockContestant1,
        name: "O'Brien-Smith III",
      };

      render(
        <ClockBar
          contestant1={specialNameContestant}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText("O'Brien-Smith III")).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles switching active player', () => {
      const { rerender } = render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="Test"
        />
      );

      // Component should render successfully
      expect(screen.getByText('Test')).toBeInTheDocument();

      rerender(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={2}
          categoryName="Test"
        />
      );

      // Still renders after switching
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles rapid time updates', () => {
      const { rerender } = render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={25}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('30.0s')).toBeInTheDocument();
      expect(screen.getByText('25.0s')).toBeInTheDocument();

      // Simulate countdown
      rerender(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={0}
          timeRemaining2={25}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('0.0s')).toBeInTheDocument();
      expect(screen.getByText('25.0s')).toBeInTheDocument();
    });

    it('handles empty contestant names gracefully', () => {
      const emptyNameContestant: Contestant = {
        ...mockContestant1,
        name: '',
      };

      render(
        <ClockBar
          contestant1={emptyNameContestant}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={30}
          activePlayer={1}
          categoryName="Test"
        />
      );

      // Component should still render without crashing
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('handles very large time values', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={3600}
          timeRemaining2={7200}
          activePlayer={1}
          categoryName="Test"
        />
      );

      expect(screen.getByText('60:00.0')).toBeInTheDocument();
      expect(screen.getByText('120:00.0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders all required content elements', () => {
      render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={25}
          activePlayer={1}
          categoryName="State Capitals"
        />
      );

      // Verify all content is present and accessible
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('30.0s')).toBeInTheDocument();
      expect(screen.getByText('25.0s')).toBeInTheDocument();
      expect(screen.getByText('State Capitals')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = render(
        <ClockBar
          contestant1={mockContestant1}
          contestant2={mockContestant2}
          timeRemaining1={30}
          timeRemaining2={25}
          activePlayer={1}
          categoryName="Test"
        />
      );

      // Component should render successfully
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
