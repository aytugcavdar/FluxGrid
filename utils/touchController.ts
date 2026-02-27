import { TouchGesture, TouchControllerState } from '../types';
import { GESTURE_THRESHOLDS } from '../constants';

class TouchController {
  private state: TouchControllerState = {
    activeGestures: new Map(),
    lastTapTime: 0,
    draggedElement: null,
    zoomLevel: 1,
    cameraRotation: { x: 0, y: 0 }
  };

  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    if (typeof window === 'undefined') return;

    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }

  private handleTouchStart(e: TouchEvent) {
    const touches = Array.from(e.touches);
    
    touches.forEach(touch => {
      const gesture: TouchGesture = {
        type: 'TAP',
        startPos: { x: touch.clientX, y: touch.clientY },
        currentPos: { x: touch.clientX, y: touch.clientY },
        startTime: Date.now(),
        fingers: e.touches.length
      };
      
      this.state.activeGestures.set(touch.identifier, gesture);
    });

    // Haptic feedback on touch
    this.triggerHaptic([20]);
    
    // Check for double tap
    const now = Date.now();
    if (now - this.state.lastTapTime < GESTURE_THRESHOLDS.DOUBLE_TAP_MAX_INTERVAL) {
      // Double tap detected - ignore it
      e.preventDefault();
      return;
    }
    this.state.lastTapTime = now;
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    
    const touches = Array.from(e.touches);
    
    touches.forEach(touch => {
      const gesture = this.state.activeGestures.get(touch.identifier);
      if (!gesture) return;
      
      gesture.currentPos = { x: touch.clientX, y: touch.clientY };
      
      const distance = this.calculateDistance(gesture.startPos, gesture.currentPos);
      const duration = Date.now() - gesture.startTime;
      
      // Determine gesture type
      if (e.touches.length === 2 && gesture.fingers === 2) {
        // Two-finger gesture
        const touches = Array.from(e.touches);
        if (touches.length === 2) {
          this.handleTwoFingerGesture(touches[0], touches[1]);
        }
      } else if (distance > GESTURE_THRESHOLDS.DRAG_MIN_DISTANCE) {
        gesture.type = 'DRAG';
        this.emit('drag', {
          position: gesture.currentPos,
          delta: {
            x: gesture.currentPos.x - gesture.startPos.x,
            y: gesture.currentPos.y - gesture.startPos.y
          }
        });
      }
      
      // Check for long press
      if (duration > GESTURE_THRESHOLDS.LONG_PRESS_DURATION && distance < GESTURE_THRESHOLDS.DRAG_MIN_DISTANCE) {
        gesture.type = 'LONG_PRESS';
        this.emit('longpress', { position: gesture.currentPos });
        this.triggerHaptic([50, 30, 50]);
      }
    });
  }

  private handleTouchEnd(e: TouchEvent) {
    const changedTouches = Array.from(e.changedTouches);
    
    changedTouches.forEach(touch => {
      const gesture = this.state.activeGestures.get(touch.identifier);
      if (!gesture) return;
      
      const duration = Date.now() - gesture.startTime;
      const distance = this.calculateDistance(gesture.startPos, gesture.currentPos);
      
      // Determine final gesture type
      if (gesture.type === 'TAP' && duration < GESTURE_THRESHOLDS.TAP_MAX_DURATION) {
        this.emit('tap', { position: gesture.currentPos });
      } else if (gesture.type === 'DRAG') {
        this.emit('dragend', { position: gesture.currentPos });
      } else if (distance > GESTURE_THRESHOLDS.DRAG_MIN_DISTANCE) {
        // Swipe
        const velocity = distance / duration;
        if (velocity > GESTURE_THRESHOLDS.SWIPE_MIN_VELOCITY) {
          gesture.type = 'SWIPE';
          const direction = this.getSwipeDirection(gesture.startPos, gesture.currentPos);
          this.emit('swipe', { direction, velocity });
        }
      }
      
      this.state.activeGestures.delete(touch.identifier);
    });
  }

  private handleTouchCancel(e: TouchEvent) {
    const changedTouches = Array.from(e.changedTouches);
    changedTouches.forEach(touch => {
      this.state.activeGestures.delete(touch.identifier);
    });
  }

  private handleTwoFingerGesture(touch1: Touch, touch2: Touch) {
    const gesture1 = this.state.activeGestures.get(touch1.identifier);
    const gesture2 = this.state.activeGestures.get(touch2.identifier);
    
    if (!gesture1 || !gesture2) return;
    
    // Calculate pinch (zoom)
    const currentDistance = this.calculateDistance(
      { x: touch1.clientX, y: touch1.clientY },
      { x: touch2.clientX, y: touch2.clientY }
    );
    
    const startDistance = this.calculateDistance(gesture1.startPos, gesture2.startPos);
    const scaleChange = currentDistance / startDistance;
    
    if (Math.abs(scaleChange - 1) > GESTURE_THRESHOLDS.PINCH_MIN_SCALE_CHANGE) {
      this.emit('pinch', { scale: scaleChange });
    }
    
    // Calculate rotation (two-finger swipe)
    const deltaX = (touch1.clientX + touch2.clientX) / 2 - (gesture1.startPos.x + gesture2.startPos.x) / 2;
    const deltaY = (touch1.clientY + touch2.clientY) / 2 - (gesture1.startPos.y + gesture2.startPos.y) / 2;
    
    if (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20) {
      this.emit('rotate', { deltaX, deltaY });
    }
  }

  private calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getSwipeDirection(start: { x: number; y: number }, end: { x: number; y: number }): string {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  private triggerHaptic(pattern: number[]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // Event emitter methods
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Public methods
  enableDragPreview(element: HTMLElement) {
    this.state.draggedElement = element;
  }

  disableDragPreview() {
    this.state.draggedElement = null;
  }

  getZoomLevel(): number {
    return this.state.zoomLevel;
  }

  setZoomLevel(level: number) {
    this.state.zoomLevel = Math.max(0.5, Math.min(2, level));
  }

  getCameraRotation(): { x: number; y: number } {
    return { ...this.state.cameraRotation };
  }

  setCameraRotation(x: number, y: number) {
    this.state.cameraRotation = { x, y };
  }

  destroy() {
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.listeners.clear();
  }
}

// Singleton instance
let touchControllerInstance: TouchController | null = null;

export function getTouchController(): TouchController {
  if (!touchControllerInstance) {
    touchControllerInstance = new TouchController();
  }
  return touchControllerInstance;
}

export function destroyTouchController() {
  if (touchControllerInstance) {
    touchControllerInstance.destroy();
    touchControllerInstance = null;
  }
}
