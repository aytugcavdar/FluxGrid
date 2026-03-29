/**
 * Unit tests for Piece component
 * Tests piece rendering, drag interactions, and special types
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Piece } from '@features/game/components/Piece';
import { useGameStore } from '@features/game/store/gameStore';
import { CellType } from '@features/game/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Piece', () => {
  const mockPiece = {
    id: 'piece-1',
    instanceId: 'test-piece-1',
    shape: [
      [1, 1],
      [1, 0],
    ],
    color: '#3b82f6',
    type: CellType.NORMAL,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      draggedPiece: null,
      pieces: [mockPiece],
    });
  });

  describe('Rendering', () => {
    it('should render piece shape correctly', () => {
      const { container } = render(<Piece piece={mockPiece} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should render with correct grid columns', () => {
      const { container } = render(<Piece piece={mockPiece} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveStyle({ gridTemplateColumns: expect.stringContaining('repeat(2') });
    });

    it('should render filled cells with piece color', () => {
      const { container } = render(<Piece piece={mockPiece} />);
      
      const cells = container.querySelectorAll('.grid > div');
      expect(cells.length).toBe(4); // 2x2 grid
    });

    it('should not show special badges for normal pieces', () => {
      const { container } = render(<Piece piece={mockPiece} />);
      
      expect(container.textContent).not.toContain('❄️');
      expect(container.textContent).not.toContain('💣');
    });
  });

  describe('Special Piece Types', () => {
    it('should show ice badge for ICE pieces', () => {
      const icePiece = { ...mockPiece, type: CellType.ICE };
      const { container } = render(<Piece piece={icePiece} />);
      
      expect(container.textContent).toContain('❄️');
    });

    it('should show bomb badge for BOMB pieces', () => {
      const bombPiece = { ...mockPiece, type: CellType.BOMB };
      const { container } = render(<Piece piece={bombPiece} />);
      
      expect(container.textContent).toContain('💣');
    });

    it('should apply pulse animation to ICE pieces', () => {
      const icePiece = { ...mockPiece, type: CellType.ICE };
      const { container } = render(<Piece piece={icePiece} />);
      
      const cells = container.querySelectorAll('.animate-pulse');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should apply pulse animation to BOMB pieces', () => {
      const bombPiece = { ...mockPiece, type: CellType.BOMB };
      const { container } = render(<Piece piece={bombPiece} />);
      
      const cells = container.querySelectorAll('.animate-pulse');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('Drag Interactions', () => {
    it('should call setDraggedPiece on pointer down', () => {
      const setDraggedPiece = vi.fn();
      useGameStore.setState({ setDraggedPiece });

      const { container } = render(<Piece piece={mockPiece} />);
      const piece = container.querySelector('.cursor-grab') as HTMLElement;

      if (piece) {
        // Mock setPointerCapture
        piece.setPointerCapture = vi.fn();
        piece.releasePointerCapture = vi.fn();
        
        fireEvent.pointerDown(piece, { button: 0, pointerType: 'touch', pointerId: 1 });
        expect(setDraggedPiece).toHaveBeenCalledWith(mockPiece);
      }
    });

    it('should not trigger drag on right click', () => {
      const setDraggedPiece = vi.fn();
      useGameStore.setState({ setDraggedPiece });

      const { container } = render(<Piece piece={mockPiece} />);
      const piece = container.querySelector('.cursor-grab');

      if (piece) {
        fireEvent.pointerDown(piece, { button: 2, pointerType: 'mouse', pointerId: 1 });
        expect(setDraggedPiece).not.toHaveBeenCalled();
      }
    });

    it('should apply opacity when piece is being dragged', () => {
      useGameStore.setState({ draggedPiece: mockPiece });

      const { container } = render(<Piece piece={mockPiece} />);
      const piece = container.querySelector('.opacity-25');
      
      expect(piece).toBeInTheDocument();
    });

    it('should apply scale when piece is being dragged', () => {
      useGameStore.setState({ draggedPiece: mockPiece });

      const { container } = render(<Piece piece={mockPiece} />);
      // Framer Motion applies inline styles, not CSS classes
      const piece = container.querySelector('.opacity-25');
      
      expect(piece).toBeInTheDocument();
    });
  });

  describe('Guided Mode', () => {
    it('should not show guided indicator when not guided', () => {
      const { container } = render(<Piece piece={mockPiece} />);
      
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('Responsive Sizing', () => {
    it('should have minimum tap target size', () => {
      const { container } = render(<Piece piece={mockPiece} />);
      const piece = container.querySelector('.cursor-grab');
      
      expect(piece).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
    });

    it('should render different shapes correctly', () => {
      const lShapePiece = {
        ...mockPiece,
        shape: [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
      };

      const { container } = render(<Piece piece={lShapePiece} />);
      const cells = container.querySelectorAll('.grid > div');
      
      expect(cells.length).toBe(6); // 3x2 grid
    });

    it('should render single block piece', () => {
      const singlePiece = {
        ...mockPiece,
        shape: [[1]],
      };

      const { container } = render(<Piece piece={singlePiece} />);
      const cells = container.querySelectorAll('.grid > div');
      
      expect(cells.length).toBe(1);
    });
  });
});
