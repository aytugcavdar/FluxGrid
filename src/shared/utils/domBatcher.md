# DOMBatcher - Prevent Layout Thrashing

## Overview

The `DOMBatcher` utility prevents layout thrashing by batching DOM read and write operations within a single animation frame. This optimization is crucial for maintaining 60 FPS performance, especially when multiple components need to interact with the DOM simultaneously.

## What is Layout Thrashing?

Layout thrashing (also called "forced synchronous layout" or "reflow thrashing") occurs when JavaScript alternates between reading and writing to the DOM, forcing the browser to recalculate layout multiple times per frame.

### Bad Example (Causes Layout Thrashing)

```typescript
// ❌ BAD: Causes multiple reflows
elements.forEach(element => {
  const height = element.offsetHeight; // READ - triggers layout
  element.style.height = height + 10 + 'px'; // WRITE - invalidates layout
  // Next iteration: READ triggers another layout calculation!
});
```

In this example, each iteration causes a reflow because we read `offsetHeight` (which requires layout calculation), then immediately write to `style.height` (which invalidates the layout), then read again in the next iteration.

### Good Example (Using DOMBatcher)

```typescript
// ✅ GOOD: Batches all reads, then all writes
import { domBatcher } from '@/shared/utils/domBatcher';

elements.forEach(element => {
  let height: number;
  
  // Schedule all reads first
  domBatcher.scheduleRead(() => {
    height = element.offsetHeight;
  });
  
  // Schedule all writes second
  domBatcher.scheduleWrite(() => {
    element.style.height = height + 10 + 'px';
  });
});

// DOMBatcher executes in optimal order:
// 1. All reads (one layout calculation)
// 2. All writes (one layout invalidation)
```

## API

### `scheduleRead(callback: () => void): void`

Schedule a DOM read operation. All reads are executed before writes.

```typescript
domBatcher.scheduleRead(() => {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  // Use measurements...
});
```

### `scheduleWrite(callback: () => void): void`

Schedule a DOM write operation. All writes are executed after reads.

```typescript
domBatcher.scheduleWrite(() => {
  element.style.width = '100px';
  element.style.height = '200px';
});
```

### `clear(): void`

Clear all pending operations and cancel scheduled animation frame.

```typescript
// Cleanup on component unmount
useEffect(() => {
  return () => {
    domBatcher.clear();
  };
}, []);
```

### Utility Methods

```typescript
// Check pending operations
const pendingReads = domBatcher.getPendingReads();
const pendingWrites = domBatcher.getPendingWrites();

// Check if flush is scheduled
const isScheduled = domBatcher.isFlushScheduled();
```

## Usage Examples

### Example 1: Measuring and Updating Multiple Elements

```typescript
import { domBatcher } from '@/shared/utils/domBatcher';

function resizeElements(elements: HTMLElement[]) {
  const measurements: number[] = [];
  
  // Batch all measurements
  elements.forEach((element, index) => {
    domBatcher.scheduleRead(() => {
      measurements[index] = element.offsetHeight;
    });
  });
  
  // Batch all updates
  elements.forEach((element, index) => {
    domBatcher.scheduleWrite(() => {
      element.style.height = measurements[index] * 1.5 + 'px';
    });
  });
}
```

### Example 2: React Component with DOM Measurements

```typescript
import React, { useEffect, useRef } from 'react';
import { domBatcher } from '@/shared/utils/domBatcher';

export const AdaptiveComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    const container = containerRef.current;
    const content = contentRef.current;
    
    // Measure container
    domBatcher.scheduleRead(() => {
      const containerHeight = container.offsetHeight;
      
      // Update content based on measurement
      domBatcher.scheduleWrite(() => {
        content.style.maxHeight = containerHeight - 40 + 'px';
      });
    });
    
    // Cleanup on unmount
    return () => {
      domBatcher.clear();
    };
  }, []);
  
  return (
    <div ref={containerRef}>
      <div ref={contentRef}>Content</div>
    </div>
  );
};
```

### Example 3: Animation with DOM Reads

```typescript
import { domBatcher } from '@/shared/utils/domBatcher';
import { frameScheduler } from '@/features/visual-effects/utils/frameScheduler';

function animateElements(elements: HTMLElement[]) {
  const positions: { x: number; y: number }[] = [];
  
  frameScheduler.scheduleAnimation((deltaTime) => {
    // Read phase: measure current positions
    elements.forEach((element, index) => {
      domBatcher.scheduleRead(() => {
        const rect = element.getBoundingClientRect();
        positions[index] = { x: rect.left, y: rect.top };
      });
    });
    
    // Write phase: update positions
    elements.forEach((element, index) => {
      domBatcher.scheduleWrite(() => {
        const pos = positions[index];
        element.style.transform = `translate(${pos.x + 10}px, ${pos.y}px)`;
      });
    });
  });
}
```

### Example 4: Grid Layout Calculations

```typescript
import { domBatcher } from '@/shared/utils/domBatcher';

function layoutGrid(gridElement: HTMLElement, items: HTMLElement[]) {
  let gridWidth: number;
  const itemWidths: number[] = [];
  
  // Measure grid container
  domBatcher.scheduleRead(() => {
    gridWidth = gridElement.offsetWidth;
  });
  
  // Measure all items
  items.forEach((item, index) => {
    domBatcher.scheduleRead(() => {
      itemWidths[index] = item.offsetWidth;
    });
  });
  
  // Calculate and apply layout
  domBatcher.scheduleWrite(() => {
    const columns = Math.floor(gridWidth / Math.max(...itemWidths));
    gridElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  });
}
```

## Performance Benefits

### Before DOMBatcher

```
Frame 1:
  Read  → Layout calculation (10ms)
  Write → Layout invalidation
  Read  → Layout calculation (10ms)
  Write → Layout invalidation
  Read  → Layout calculation (10ms)
  Write → Layout invalidation
Total: 30ms+ (causes frame drop at 60 FPS)
```

### After DOMBatcher

```
Frame 1:
  Read  → Layout calculation (10ms)
  Read  → (uses cached layout)
  Read  → (uses cached layout)
  Write → Layout invalidation
  Write → (batched)
  Write → (batched)
Total: 10ms (smooth 60 FPS)
```

## Best Practices

1. **Always batch reads and writes separately**
   ```typescript
   // ✅ Good
   domBatcher.scheduleRead(() => { /* read */ });
   domBatcher.scheduleWrite(() => { /* write */ });
   
   // ❌ Bad
   domBatcher.scheduleRead(() => {
     const height = element.offsetHeight;
     element.style.height = height + 'px'; // Don't write in read!
   });
   ```

2. **Use with animation frames**
   ```typescript
   // Combine with frameScheduler for optimal performance
   frameScheduler.scheduleAnimation(() => {
     domBatcher.scheduleRead(() => { /* measure */ });
     domBatcher.scheduleWrite(() => { /* update */ });
   });
   ```

3. **Clean up on unmount**
   ```typescript
   useEffect(() => {
     // ... use domBatcher
     
     return () => {
       domBatcher.clear();
     };
   }, []);
   ```

4. **Avoid mixing with direct DOM manipulation**
   ```typescript
   // ❌ Bad: Mixing batched and direct access
   domBatcher.scheduleRead(() => {
     const height = element.offsetHeight;
   });
   element.style.height = '100px'; // Direct write breaks batching!
   
   // ✅ Good: Batch everything
   domBatcher.scheduleRead(() => {
     const height = element.offsetHeight;
   });
   domBatcher.scheduleWrite(() => {
     element.style.height = '100px';
   });
   ```

## When to Use DOMBatcher

Use DOMBatcher when:
- ✅ Measuring multiple elements in a loop
- ✅ Updating layouts based on measurements
- ✅ Implementing custom animations with DOM reads
- ✅ Building responsive components that measure and adapt
- ✅ Working with complex grid or flex layouts

Don't use DOMBatcher when:
- ❌ Only reading OR only writing (no mixing)
- ❌ Single element measurement/update
- ❌ Using CSS-only animations
- ❌ Working with virtual DOM only (React state)

## Integration with Performance Optimization

DOMBatcher is part of the Animation Performance Manager (Phase 2) in the performance optimization spec. It works together with:

- **FrameScheduler**: Manages requestAnimationFrame timing
- **ParticlePool**: Reuses particle objects
- **AnimationManager**: Controls animation concurrency

Together, these utilities ensure smooth 60 FPS performance across all devices.

## Browser Support

DOMBatcher uses `requestAnimationFrame`, which is supported in all modern browsers:
- Chrome 24+
- Firefox 23+
- Safari 6.1+
- Edge (all versions)
- iOS Safari 7.1+
- Android Browser 4.4+

## References

- [Avoid Large, Complex Layouts and Layout Thrashing](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/)
- [What forces layout / reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- [FastDOM](https://github.com/wilsonpage/fastdom) - Similar library that inspired this implementation
