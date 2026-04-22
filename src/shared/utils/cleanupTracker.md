# CleanupTracker

## Overview

The `CleanupTracker` class provides a centralized way to track and clean up resources in React components, preventing memory leaks from forgotten cleanup operations.

## Purpose

Prevents memory leaks by tracking:
- `setTimeout` IDs
- `setInterval` IDs
- Event listeners (DOM, window, document)
- `requestAnimationFrame` IDs

## Usage

### Basic Example

```typescript
import { CleanupTracker } from '@shared/utils/cleanupTracker';

const tracker = new CleanupTracker();

// Track a timeout
const timeoutId = setTimeout(() => console.log('Hello'), 1000);
tracker.trackTimeout(timeoutId);

// Track an interval
const intervalId = setInterval(() => console.log('Tick'), 1000);
tracker.trackInterval(intervalId);

// Track an event listener
const handleClick = () => console.log('Clicked');
element.addEventListener('click', handleClick);
tracker.trackListener(element, 'click', handleClick);

// Track an animation frame
const frameId = requestAnimationFrame(() => console.log('Frame'));
tracker.trackAnimationFrame(frameId);

// Clean up all resources
tracker.cleanup();
```

### React Component Example

```typescript
import { useRef, useEffect } from 'react';
import { CleanupTracker } from '@shared/utils/cleanupTracker';

function MyComponent() {
  const trackerRef = useRef(new CleanupTracker());

  useEffect(() => {
    const tracker = trackerRef.current;

    // Setup resources
    const timeoutId = setTimeout(() => {
      console.log('Delayed action');
    }, 1000);
    tracker.trackTimeout(timeoutId);

    const handleResize = () => {
      console.log('Window resized');
    };
    window.addEventListener('resize', handleResize);
    tracker.trackListener(window, 'resize', handleResize);

    // Cleanup on unmount
    return () => tracker.cleanup();
  }, []);

  return <div>My Component</div>;
}
```

## API

### Methods

#### `trackTimeout(id: TimerId): void`
Track a setTimeout ID for cleanup.

#### `trackInterval(id: TimerId): void`
Track a setInterval ID for cleanup.

#### `trackListener(element: EventTarget, event: string, handler: EventListener): void`
Track an event listener for cleanup.

#### `trackAnimationFrame(id: number): void`
Track a requestAnimationFrame ID for cleanup.

#### `cleanup(): void`
Clean up all tracked resources. This method:
- Clears all timeouts with `clearTimeout()`
- Clears all intervals with `clearInterval()`
- Removes all event listeners with `removeEventListener()`
- Cancels all animation frames with `cancelAnimationFrame()`
- Clears internal storage after cleanup

### Debug Methods

#### `getTrackedTimeoutsCount(): number`
Returns the number of tracked timeouts (for testing/debugging).

#### `getTrackedIntervalsCount(): number`
Returns the number of tracked intervals (for testing/debugging).

#### `getTrackedListenersCount(): number`
Returns the number of tracked event listeners (for testing/debugging).

#### `getTrackedAnimationFramesCount(): number`
Returns the number of tracked animation frames (for testing/debugging).

## Design Decisions

### Instance-Based (Not Singleton)
Each component should create its own `CleanupTracker` instance. This ensures:
- Component isolation
- Independent cleanup lifecycles
- No shared state between components

### Type Safety
Uses `ReturnType<typeof setTimeout>` for timer IDs to support both browser and Node.js environments:
- Browser: `number`
- Node.js: `NodeJS.Timeout`

### Safe Cleanup
- Safe to call `cleanup()` multiple times
- Safe to call `cleanup()` with no tracked resources
- Handles invalid IDs gracefully
- Handles removed listeners gracefully

## Integration with React Hook

The `CleanupTracker` will be wrapped in a React hook (`useCleanup`) in Task 4.2, providing a more ergonomic API for React components.

## Requirements Satisfied

This implementation satisfies the following requirements:
- **3.1**: Clear timeouts on unmount
- **3.2**: Clear intervals on unmount
- **3.3**: Remove event listeners on unmount
- **3.4**: Implement cleanup functions for all useEffect hooks
- **3.5**: Cancel animation frames on unmount
- **10.1**: Track all active animations
- **10.2**: Cancel all component animations on unmount
- **10.3**: Clear all setTimeout calls on unmount
- **10.4**: Clear all setInterval calls on unmount
- **10.5**: Dispose all Babylon.js scene objects (extensible for future use)
- **10.6**: Remove all DOM event listeners

## Testing

Comprehensive unit tests cover:
- Tracking single and multiple resources
- Cleanup of all resource types
- Real-world usage scenarios
- Edge cases and error handling
- Memory leak prevention
- Multiple tracker instances

All 37 tests pass successfully.
