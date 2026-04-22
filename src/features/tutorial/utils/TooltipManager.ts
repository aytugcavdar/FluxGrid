/**
 * Tooltip Manager
 * 
 * Manages feature unlock tooltips with priority queue
 */

interface Tooltip {
  id: string;
  message: string;
  targetElement: string;
  priority: number;
  autoDismiss: boolean;
  dismissTimeout?: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

export class TooltipManager {
  private queue: Tooltip[];
  private activeTooltip: Tooltip | null;
  private tooltipElement: HTMLElement | null;
  private dismissTimer: NodeJS.Timeout | null;
  
  constructor() {
    this.queue = [];
    this.activeTooltip = null;
    this.tooltipElement = null;
    this.dismissTimer = null;
  }
  
  /**
   * Show a tooltip
   */
  show(tooltip: Tooltip): void {
    // Add to queue
    this.queue.push(tooltip);
    
    // Sort by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);
    
    // Show if no active tooltip
    if (!this.activeTooltip) {
      this.showNext();
    }
  }
  
  /**
   * Show next tooltip in queue
   */
  private showNext(): void {
    if (this.queue.length === 0) {
      this.activeTooltip = null;
      return;
    }
    
    const tooltip = this.queue.shift()!;
    this.activeTooltip = tooltip;
    
    // Create tooltip element
    this.createTooltipElement(tooltip);
    
    // Set up auto-dismiss
    if (tooltip.autoDismiss) {
      const timeout = tooltip.dismissTimeout || 5000;
      this.dismissTimer = setTimeout(() => {
        this.hide(tooltip.id);
      }, timeout);
    }
  }
  
  /**
   * Create tooltip DOM element
   */
  private createTooltipElement(tooltip: Tooltip): void {
    // Remove existing tooltip
    if (this.tooltipElement) {
      this.tooltipElement.remove();
    }
    
    // Find target element
    const target = document.querySelector(tooltip.targetElement) as HTMLElement;
    if (!target) {
      console.warn(`[TooltipManager] Target element not found: ${tooltip.targetElement}`);
      this.showNext();
      return;
    }
    
    // Calculate position
    const position = this.calculatePosition(target);
    
    // Create tooltip element
    const element = document.createElement('div');
    element.className = 'feature-tooltip';
    element.innerHTML = `
      <div class="feature-tooltip-content">
        <p>${tooltip.message}</p>
        <button class="feature-tooltip-close">✕</button>
      </div>
      <div class="feature-tooltip-arrow"></div>
    `;
    
    element.style.position = 'fixed';
    element.style.top = `${position.top}px`;
    element.style.left = `${position.left}px`;
    element.style.zIndex = '10000';
    
    // Add click handler for close button
    const closeButton = element.querySelector('.feature-tooltip-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide(tooltip.id);
      });
    }
    
    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (!element.contains(event.target as Node)) {
        this.hide(tooltip.id);
        document.removeEventListener('click', handleClickOutside);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    // Add to DOM
    document.body.appendChild(element);
    this.tooltipElement = element;
    
    // Add styles
    this.addStyles();
  }
  
  /**
   * Calculate tooltip position
   */
  private calculatePosition(target: HTMLElement): TooltipPosition {
    const rect = target.getBoundingClientRect();
    
    // Position below target by default
    return {
      top: rect.bottom + 10,
      left: rect.left + rect.width / 2
    };
  }
  
  /**
   * Add tooltip styles
   */
  private addStyles(): void {
    if (document.getElementById('tooltip-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'tooltip-styles';
    style.textContent = `
      .feature-tooltip {
        transform: translateX(-50%);
        animation: tooltip-fade-in 0.3s ease-out;
      }
      
      @keyframes tooltip-fade-in {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      
      .feature-tooltip-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #00d4ff;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 200px;
        max-width: 300px;
      }
      
      .feature-tooltip-content p {
        color: #fff;
        font-size: 14px;
        margin: 0;
        flex: 1;
      }
      
      .feature-tooltip-close {
        background: transparent;
        border: none;
        color: #999;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }
      
      .feature-tooltip-close:hover {
        color: #00d4ff;
      }
      
      .feature-tooltip-arrow {
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 8px solid #00d4ff;
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Hide a tooltip
   */
  hide(id: string): void {
    if (this.activeTooltip?.id === id) {
      // Clear dismiss timer
      if (this.dismissTimer) {
        clearTimeout(this.dismissTimer);
        this.dismissTimer = null;
      }
      
      // Remove tooltip element
      if (this.tooltipElement) {
        this.tooltipElement.remove();
        this.tooltipElement = null;
      }
      
      // Show next tooltip
      this.showNext();
    } else {
      // Remove from queue
      this.queue = this.queue.filter(t => t.id !== id);
    }
  }
  
  /**
   * Hide all tooltips
   */
  hideAll(): void {
    // Clear queue
    this.queue = [];
    
    // Clear dismiss timer
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    
    // Remove tooltip element
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
    
    this.activeTooltip = null;
  }
  
  /**
   * Check if a tooltip is active
   */
  isActive(id: string): boolean {
    return this.activeTooltip?.id === id;
  }
  
  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}

// Singleton instance
export const tooltipManager = new TooltipManager();
