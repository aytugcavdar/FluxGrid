// Tutorial Components
export { TutorialManager } from './TutorialManager';
export { TutorialTooltip } from './TutorialTooltip';
export { TutorialHighlight } from './TutorialHighlight';
export { TutorialConfetti } from './TutorialConfetti';
export { Tutorial, TutorialAPI, useTutorialStore } from './Tutorial';
export type { TutorialProps } from './Tutorial';

// Error Handling Components
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorRecoveryModal, ErrorToast, InlineError, getErrorMessage } from './ErrorRecoveryUI';
export type { ErrorRecoveryProps } from './ErrorRecoveryUI';

// GDPR Consent Components
export { ConsentModal } from './ConsentModal';
export type { ConsentModalProps } from './ConsentModal';

// Tooltip Components
export { Tooltip, TooltipAPI, useTooltipStore } from './Tooltip';
export type { TooltipData, TooltipPosition } from './Tooltip';

// Network & Status Components
export { OfflineIndicator } from './OfflineIndicator';
export { UpdateDialog } from './UpdateDialog';

// Asset Loading Components
export { LazyAsset, LazyImage, LoadingProgress } from './LazyAsset';
export type { LazyAssetProps, LazyImageProps, LoadingProgressProps } from './LazyAsset';

// UI Redesign Components
export { StatCard } from './StatCard';
export { ProgressBar } from './ProgressBar';
export { AchievementCard } from './AchievementCard';
export { ThemeCard } from './ThemeCard';
export { ToggleSwitch } from './ToggleSwitch';
export { PerformanceCard } from './PerformanceCard';
export { ModeCard } from './ModeCard';
export type { ModeCardProps } from './ModeCard';
export { SectionHeader } from './SectionHeader';
export type { SectionHeaderProps } from './SectionHeader';

// Monetization Components
export { StreakBadge } from './StreakBadge';

// Modern UI Components
export { GradientCardBase } from './GradientCardBase';
export type { GradientCardBaseProps } from './GradientCardBase';
export { EnhancedGameModeCard } from './EnhancedGameModeCard';
export type { EnhancedGameModeCardProps } from './EnhancedGameModeCard';
export { PerformanceDNACard } from './PerformanceDNACard';
export type { PerformanceDNACardProps } from './PerformanceDNACard';
export { RecentLogsTimeline } from './RecentLogsTimeline';
export type { RecentLogsTimelineProps } from './RecentLogsTimeline';
export { TrendAnalysisChart } from './TrendAnalysisChart';
export type { TrendAnalysisChartProps } from './TrendAnalysisChart';
export { ScoreDistributionChart } from './ScoreDistributionChart';
