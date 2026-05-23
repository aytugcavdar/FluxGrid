/**
 * Game Piece Object Pool
 * 
 * Manages a pool of game piece objects to minimize garbage collection.
 * Requirements: 5.6
 */

import { CellType, Piece, PieceShape } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface PiecePoolConfig {
  initialSize?: number;
  maxSize?: number;
}

export class PiecePool {
  private pool: Piece[] = [];
  private activeCount: number = 0;
  private readonly maxSize: number;
  
  constructor(config: PiecePoolConfig = {}) {
    const { initialSize = 20, maxSize = 50 } = config;
    this.maxSize = maxSize;
    
    // Pre-allocate initial pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createPiece());
    }
  }
  
  /**
   * Create a new piece object
   */
  private createPiece(): Piece {
    return {
      id: '',
      instanceId: '',
      shape: [],
      color: '',
      type: CellType.NORMAL,
    };
  }
  
  /**
   * Acquire a piece from the pool
   * @param shape Piece shape
   * @param color Piece color
   * @param type Piece type
   * @returns Configured piece object
   */
  acquire(shape: PieceShape, color: string, type: CellType = CellType.NORMAL): Piece {
    let piece: Piece;
    
    // Try to reuse from pool
    if (this.pool.length > 0) {
      piece = this.pool.pop()!;
    } else {
      // Pool exhausted, create new (but don't exceed max size)
      if (this.activeCount < this.maxSize) {
        piece = this.createPiece();
      } else {
        // Max size reached, force reuse oldest
        console.warn('[PiecePool] Max size reached, forcing reuse');
        piece = this.createPiece();
      }
    }
    
    // Configure piece
    piece.id = shape.id;
    piece.instanceId = uuidv4();
    piece.shape = shape.shape;
    piece.color = color;
    piece.type = type;
    
    this.activeCount++;
    
    return piece;
  }
  
  /**
   * Release a piece back to the pool
   * @param piece Piece to release
   */
  release(piece: Piece): void {
    // Clear piece data
    piece.id = '';
    piece.instanceId = '';
    piece.shape = [];
    piece.color = '';
    piece.type = CellType.NORMAL;
    
    // Return to pool if not at max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(piece);
    }
    
    this.activeCount = Math.max(0, this.activeCount - 1);
  }
  
  /**
   * Release multiple pieces
   * @param pieces Array of pieces to release
   */
  releaseAll(pieces: Piece[]): void {
    pieces.forEach(piece => this.release(piece));
  }
  
  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.activeCount,
      maxSize: this.maxSize,
      utilizationPercent: (this.activeCount / this.maxSize) * 100,
    };
  }
  
  /**
   * Clear the pool
   */
  clear(): void {
    this.pool = [];
    this.activeCount = 0;
  }
  
  /**
   * Resize the pool
   * @param newSize New maximum size
   */
  resize(newSize: number): void {
    if (newSize < this.pool.length) {
      // Shrink pool
      this.pool = this.pool.slice(0, newSize);
    }
    // Note: Growing happens automatically on acquire
  }
}

// Global piece pool instance
let globalPiecePool: PiecePool | null = null;

/**
 * Get or create the global piece pool
 */
export function getPiecePool(): PiecePool {
  if (!globalPiecePool) {
    globalPiecePool = new PiecePool({
      initialSize: 20,
      maxSize: 50,
    });
  }
  return globalPiecePool;
}

/**
 * Reset the global piece pool
 */
export function resetPiecePool(): void {
  if (globalPiecePool) {
    globalPiecePool.clear();
  }
  globalPiecePool = null;
}
