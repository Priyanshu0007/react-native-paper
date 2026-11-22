import type {
  ColorRole,
  Elevation,
  ThemeShapeCorners,
} from '../../theme/types';

/**
 * MD3 bottom sheet spec dimensions and color-role tokens. Standard and modal
 * sheets share them, except for the scrim, which only modal sheets have.
 * @see https://m3.material.io/components/bottom-sheets/specs
 */
const sizes = {
  dragHandleWidth: 32,
  dragHandleHeight: 4,
  /** Above and below the drag handle, so the top 48dp of the sheet is its touch target. */
  dragHandlePaddingVertical: 22,
  /** Minimum interactive area around the drag handle. */
  dragHandleTouchTargetSize: 48,
  /** The sheet spans the window up to this width. */
  maxWidth: 640,
  /** Space between the window's top and an expanded sheet. */
  topMargin: 72,
  /** Space between the window's top and an expanded sheet, in a window wider than `maxWidth`. */
  wideTopMargin: 56,
  /** Space on each side of the sheet, in a window wider than `maxWidth`. */
  wideSideMargin: 56,
  /** A modal sheet first opens no taller than this share of the window's height. */
  modalInitialHeightRatio: 0.5,
} as const;

const shape = {
  containerShape: 'extraLarge',
} as const satisfies Record<string, keyof ThemeShapeCorners>;

const elevation = {
  containerElevation: 1,
} as const satisfies Record<string, Elevation>;

const colors = {
  containerColor: 'surfaceContainerLow',
  dragHandleColor: 'onSurfaceVariant',
  scrimColor: 'scrim',
  focusIndicatorColor: 'secondary',
} as const satisfies Record<string, ColorRole>;

export const BottomSheetTokens = {
  ...sizes,
  ...shape,
  ...elevation,
  ...colors,
};
