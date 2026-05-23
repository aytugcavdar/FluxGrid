import { GridState, Piece } from '../../types';
import { createMiniEventState } from './miniEventSystem';

export interface GameStateSnapshot {
  version: number;
  timestamp: number;
  score: number;
  level: number;
  grid: GridState;
  pieces: Piece[];
  combo: number;
  difficultyTier: number;
  activeEvent: string | null;
  eventMovesRemaining: number;
  miniEventState: ReturnType<typeof createMiniEventState>;
  totalMovesPlayed: number;
  tierStartMove?: number;
}

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
}

/**
 * Serialize game state to JSON string
 */
export function serializeGameState(state: GameStateSnapshot): string {
  try {
    return JSON.stringify(state);
  } catch (error) {
    console.error('[Serialization] Failed to serialize game state:', error);
    throw new Error(`Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse JSON string to game state
 * Returns ParseResult with success flag and data or error
 */
export function parseGameState(json: string): ParseResult<GameStateSnapshot> {
  try {
    const data = JSON.parse(json);
    
    // Validate parsed data
    if (!validateGameState(data)) {
      return {
        success: false,
        error: {
          message: 'Invalid game state: missing required fields'
        }
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    // Extract line and column from SyntaxError if available
    let line: number | undefined;
    let column: number | undefined;
    
    if (error instanceof SyntaxError) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1], 10);
        // Calculate line and column from position
        const lines = json.substring(0, position).split('\n');
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }
    }
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Parse error',
        line,
        column
      }
    };
  }
}

/**
 * Validate game state object has all required fields
 */
export function validateGameState(state: unknown): state is GameStateSnapshot {
  if (!state || typeof state !== 'object') {
    return false;
  }
  
  const s = state as any;
  
  // Check required fields
  const hasRequiredFields = 
    typeof s.score === 'number' &&
    typeof s.level === 'number' &&
    typeof s.timestamp === 'number' &&
    Array.isArray(s.grid);
  
  if (!hasRequiredFields) {
    console.warn('[Serialization] Validation failed: missing required fields', {
      hasScore: typeof s.score === 'number',
      hasLevel: typeof s.level === 'number',
      hasTimestamp: typeof s.timestamp === 'number',
      hasGrid: Array.isArray(s.grid)
    });
  }
  
  return hasRequiredFields;
}

/**
 * Pretty print game state for human-readable output
 */
export function prettyPrintGameState(state: GameStateSnapshot): string {
  try {
    return JSON.stringify(state, null, 2);
  } catch (error) {
    console.error('[Serialization] Failed to pretty print game state:', error);
    throw new Error(`Pretty print failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test round-trip property: parse(serialize(state)) should equal state
 */
export function testRoundTrip(state: GameStateSnapshot): boolean {
  try {
    const serialized = serializeGameState(state);
    const parsed = parseGameState(serialized);
    
    if (!parsed.success || !parsed.data) {
      return false;
    }
    
    // Deep equality check (simplified - could use lodash.isEqual in production)
    const reserialized = serializeGameState(parsed.data);
    return serialized === reserialized;
  } catch (error) {
    console.error('[Serialization] Round-trip test failed:', error);
    return false;
  }
}
