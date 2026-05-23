# Tooltip Component

Contextual tooltip system that appears when users first interact with specific features. Helps users discover features and understand their purpose.

**Requirements:** 8.2

## Features

- ✅ Show tooltips on first feature interaction
- ✅ Track shown tooltips in localStorage
- ✅ Dismissible tooltips
- ✅ Reset capability for testing
- ✅ Positioned near target elements
- ✅ Auto-dismiss support
- ✅ Follows existing tutorial system patterns
- ✅ Accessibility support (reduced motion)

## Architecture

### Storage System

Tooltips use localStorage to track which tooltips have been shown:
- **Storage Key:** `flux_tooltips_shown_v1`
- **Format:** JSON array of tooltip IDs
- **Persistence:** Survives app restarts

### State Management

Uses Zustand for state management:
- `currentTooltip`: Currently displayed tooltip
- `shownTooltips`: Set of tooltip IDs that have been shown
- Actions for showing, hiding, and resetting tooltips

### Positioning

Supports 5 placement options:
- `top`: Above the target element
- `bottom`: Below the target element
- `left`: Left of the target element
- `right`: Right of the target element
- `center`: Center of the screen (default)

## Usage

### Basic Setup

1. Add the Tooltip component to your app root:

```tsx
import { Tooltip } from '@/components/Tooltip';

function App() {
  return (
    <>
      {/* Your app content */}
      <Tooltip />
    </>
  );
}
```

### Show Tooltip on First Ability Use

```tsx
import { useTooltipStore } from '@/components/Tooltip';
import { useAbilityStore } from '@/features/abilities/store/abilityStore';

function AbilityButton({ abilityType }: { abilityType: string }) {
  const { showTooltip, hasShownTooltip } = useTooltipStore();
  const { activateAbility } = useAbilityStore();
  
  const handleClick = (event: React.MouseEvent) => {
    // Show tooltip on first use
    if (!hasShownTooltip(`ability_${abilityType}`)) {
      const rect = event.currentTarget.getBoundingClientRect();
      showTooltip({
        id: `ability_${abilityType}`,
        title: 'Rotate Ability',
        description: 'Rotate the current piece 90 degrees clockwise',
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
          placement: 'top',
        },
        duration: 5000, // Auto-dismiss after 5 seconds
        icon: '🔄',
      });
    }
    
    // Activate ability
    activateAbility(abilityType);
  };
  
  return <button onClick={handleClick}>Rotate</button>;
}
```

### Show Tooltip on Settings Access

```tsx
import { useTooltipStore } from '@/components/Tooltip';

function SettingsButton() {
  const { showTooltip, hasShownTooltip } = useTooltipStore();
  
  const handleClick = (event: React.MouseEvent) => {
    if (!hasShownTooltip('settings_first_access')) {
      const rect = event.currentTarget.getBoundingClientRect();
      showTooltip({
        id: 'settings_first_access',
        title: 'Settings',
        description: 'Customize your game experience, change language, and manage preferences',
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom,
          placement: 'bottom',
        },
        duration: 4000,
        icon: '⚙️',
      });
    }
    
    // Open settings
    navigateToSettings();
  };
  
  return <button onClick={handleClick}>⚙️</button>;
}
```

### Programmatic API

```tsx
import { TooltipAPI } from '@/components/Tooltip';

// Show tooltip
TooltipAPI.show({
  id: 'feature_x',
  title: 'New Feature',
  description: 'Try out this new feature!',
  position: { x: 100, y: 200, placement: 'center' },
  duration: 3000,
  icon: '✨',
});

// Hide current tooltip
TooltipAPI.hide();

// Check if tooltip has been shown
if (!TooltipAPI.hasShown('feature_x')) {
  // Show tooltip
}

// Mark as shown without displaying
TooltipAPI.markAsShown('feature_x');

// Reset specific tooltip
TooltipAPI.reset('feature_x');

// Reset all tooltips (for testing)
TooltipAPI.resetAll();
```

## Tooltip IDs Convention

Use descriptive, namespaced IDs:

- **Abilities:** `ability_rotate`, `ability_swap`, `ability_bomb`, etc.
- **Settings:** `settings_first_access`, `settings_language`, etc.
- **Features:** `feature_daily_reward`, `feature_achievements`, etc.
- **UI Elements:** `ui_flux_meter`, `ui_score_multiplier`, etc.

## Positioning Guide

### Get Element Position

```tsx
const handleClick = (event: React.MouseEvent) => {
  const rect = event.currentTarget.getBoundingClientRect();
  
  // Center of element
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Show tooltip above element
  showTooltip({
    id: 'my_tooltip',
    title: 'Title',
    description: 'Description',
    position: {
      x: centerX,
      y: rect.top,
      placement: 'top',
    },
  });
};
```

### Fixed Position

```tsx
// Center of screen
showTooltip({
  id: 'my_tooltip',
  title: 'Title',
  description: 'Description',
  position: {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    placement: 'center',
  },
});
```

## Auto-Dismiss

Tooltips can auto-dismiss after a duration:

```tsx
showTooltip({
  id: 'my_tooltip',
  title: 'Title',
  description: 'Description',
  position: { x: 100, y: 200 },
  duration: 5000, // Auto-dismiss after 5 seconds
});

// Manual dismiss only (duration: 0 or omit)
showTooltip({
  id: 'my_tooltip',
  title: 'Title',
  description: 'Description',
  position: { x: 100, y: 200 },
  // No duration - user must dismiss manually
});
```

## Testing

### Reset All Tooltips

```tsx
import { TooltipAPI } from '@/components/Tooltip';

// In settings or dev tools
function resetTooltips() {
  TooltipAPI.resetAll();
  console.log('All tooltips reset');
}
```

### Reset Specific Tooltip

```tsx
// Reset a specific tooltip for testing
TooltipAPI.reset('ability_rotate');
```

## Accessibility

- **Reduced Motion:** Respects `prefers-reduced-motion` media query
- **Keyboard:** Dismiss button is keyboard accessible
- **ARIA:** Dismiss button has `aria-label`

## Styling

Tooltips use the same cyberpunk theme as the tutorial system:
- Dark background with blur effect
- Blue border with glow
- White text with semi-transparent description
- Smooth animations (respects reduced motion)

## Integration Points

### Abilities

Show tooltips when abilities are first used:
- `ability_rotate`: First time rotating a piece
- `ability_swap`: First time swapping pieces
- `ability_bomb`: First time using bomb
- `ability_magnet`: First time using magnet
- `ability_freeze`: First time freezing pieces
- `ability_undo`: First time undoing a move
- `ability_shatter`: First time shattering a piece
- `ability_reroll`: First time rerolling pieces

### Settings

Show tooltips when accessing settings features:
- `settings_first_access`: First time opening settings
- `settings_language`: First time changing language
- `settings_sound`: First time adjusting sound
- `settings_haptics`: First time toggling haptics

### Game Features

Show tooltips for game features:
- `feature_combo_timer`: First time combo timer starts
- `feature_daily_reward`: First time claiming daily reward
- `feature_streak`: First time building a streak

## Best Practices

1. **Show Once:** Tooltips should only show once per feature
2. **Contextual:** Show tooltips when the feature is relevant
3. **Brief:** Keep descriptions short and actionable
4. **Timed:** Use auto-dismiss for non-critical tooltips
5. **Positioned:** Position tooltips near the relevant UI element
6. **Icons:** Use emojis to make tooltips more engaging

## Example: Complete Integration

```tsx
import React from 'react';
import { useTooltipStore } from '@/components/Tooltip';
import { useAbilityStore } from '@/features/abilities/store/abilityStore';
import { ActiveAbilityType } from '@/features/abilities/types';

const ABILITY_TOOLTIPS: Record<ActiveAbilityType, { title: string; description: string; icon: string }> = {
  [ActiveAbilityType.ROTATE]: {
    title: 'Rotate Ability',
    description: 'Rotate the current piece 90 degrees clockwise',
    icon: '🔄',
  },
  [ActiveAbilityType.SWAP]: {
    title: 'Swap Ability',
    description: 'Swap two pieces in your queue',
    icon: '🔀',
  },
  [ActiveAbilityType.BOMB]: {
    title: 'Bomb Ability',
    description: 'Clear a 3x3 area on the grid',
    icon: '💣',
  },
  // ... more abilities
};

function AbilityButton({ abilityType }: { abilityType: ActiveAbilityType }) {
  const { showTooltip, hasShownTooltip } = useTooltipStore();
  const { activateAbility } = useAbilityStore();
  
  const handleClick = (event: React.MouseEvent) => {
    const tooltipId = `ability_${abilityType}`;
    
    // Show tooltip on first use
    if (!hasShownTooltip(tooltipId)) {
      const rect = event.currentTarget.getBoundingClientRect();
      const tooltipData = ABILITY_TOOLTIPS[abilityType];
      
      showTooltip({
        id: tooltipId,
        title: tooltipData.title,
        description: tooltipData.description,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
          placement: 'top',
        },
        duration: 5000,
        icon: tooltipData.icon,
      });
    }
    
    // Activate ability
    activateAbility(abilityType);
  };
  
  return (
    <button onClick={handleClick}>
      {ABILITY_TOOLTIPS[abilityType].icon}
    </button>
  );
}
```

## Troubleshooting

### Tooltip Not Showing

1. Check if tooltip has already been shown: `TooltipAPI.hasShown('tooltip_id')`
2. Verify Tooltip component is rendered in app root
3. Check console for errors
4. Verify position is within viewport

### Tooltip Position Wrong

1. Ensure position coordinates are in viewport space
2. Use `getBoundingClientRect()` for element-relative positioning
3. Check placement option matches desired position

### Tooltip Not Persisting

1. Check localStorage is available
2. Verify storage key is correct
3. Check for localStorage quota errors in console

## Future Enhancements

- [ ] Tooltip sequences (show multiple tooltips in order)
- [ ] Tooltip animations (bounce, pulse)
- [ ] Tooltip themes (success, warning, info)
- [ ] Tooltip with actions (buttons)
- [ ] Tooltip with images
- [ ] Tooltip analytics (track which tooltips are most helpful)
