import * as React from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetDragHandle from './BottomSheetDragHandle';
import { loadBottomSheetModule } from './loadBottomSheetModule';
import { BottomSheetTokens } from './tokens';
import {
  getContainerShadow,
  getOpenDetents,
  getSheetFrame,
  type BottomSheetDetent,
} from './utils';
import { useInternalTheme } from '../../core/theming';
import { useReduceMotion } from '../../theme/accessibility/ReduceMotionContext';
import { tokens } from '../../theme/tokens';
import type { ThemeProp } from '../../theme/types';
import { useOverlayDismiss } from '../../utils/useOverlayDismiss';
import {
  useOverlayFocus,
  type OverlayFocusTarget,
} from '../../utils/useOverlayFocus';
import Portal from '../Portal/Portal';

export type Props = {
  /**
   * - `modal` (default): shown above the screen and a scrim, which block the
   *   rest of the app until the sheet is dismissed.
   * - `standard`: shown inline, filling its parent, alongside content that
   *   stays interactive, such as a music player above a list.
   */
  variant?: 'modal' | 'standard';
  /**
   * Whether the sheet is open.
   */
  visible: boolean;
  /**
   * Called when the user dismisses the sheet: by dragging it down, tapping the
   * scrim, pressing back or Escape, or with a screen reader's dismiss action.
   * Set `visible` to `false` in it to close the sheet. A sheet that is still
   * `visible` afterwards moves back to where it was.
   */
  onDismiss?: () => void;
  /**
   * Whether the user can dismiss the sheet. A sheet that isn't dismissable
   * still takes the back button and Escape key while it is open, and closes
   * only when `visible` turns `false`.
   *
   * Defaults to `true` for a `modal` sheet and `false` for a `standard` one.
   */
  dismissable?: boolean;
  /**
   * The heights the open sheet snaps to, from shortest to tallest: a number of
   * layout units, a percentage of the height available to the sheet such as
   * `'50%'`, or `'content'` for the height of its content. The sheet opens at
   * the first one.
   *
   * By default, the sheet fits its content. A `modal` sheet with content
   * taller than half the window first opens at half the window's height, and
   * can be dragged up to show the rest.
   */
  detents?: BottomSheetDetent[];
  /**
   * Index in `detents` of the height the open sheet is at. Pass it with
   * `onIndexChange` to control the height. Without it, the sheet opens at the
   * first height and follows the user's drags.
   */
  index?: number;
  /**
   * Called with the index in `detents` of the height the user moves the open
   * sheet to, by dragging it or with the drag handle.
   */
  onIndexChange?: (index: number) => void;
  /**
   * Whether to show the drag handle at the top of the sheet. Pressing it, or
   * pressing Enter or Space while it has focus, moves the sheet to its next
   * height, or dismisses a sheet that has only one.
   */
  showDragHandle?: boolean;
  /**
   * Accessibility label for the drag handle.
   */
  dragHandleAccessibilityLabel?: string;
  /**
   * Accessibility label for the scrim of a dismissable `modal` sheet, which
   * screen readers expose as a button that dismisses the sheet.
   */
  dismissAccessibilityLabel?: string;
  /**
   * Element to focus when a `modal` sheet opens.
   *
   * By default, focus moves to the drag handle, or on web to the first
   * focusable element inside the sheet when there is no drag handle.
   */
  initialFocusRef?: React.RefObject<OverlayFocusTarget | null>;
  /**
   * Element to focus when a `modal` sheet closes.
   *
   * On web, focus returns to the element that had it before the sheet opened,
   * and this prop picks another one. On iOS and Android, nothing is restored
   * unless this prop is given.
   */
  restoreFocusRef?: React.RefObject<OverlayFocusTarget | null>;
  /**
   * Content of the sheet. To fill the tallest height, such as with a list,
   * give the content `flex: 1`.
   */
  children: React.ReactNode;
  /**
   * Style of the view that hosts the sheet, which fills the parent of a
   * `standard` sheet, for example to set its `zIndex`.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * @optional
   */
  theme?: ThemeProp;
  /**
   * testID of the sheet's container. The drag handle gets `${testID}-drag-handle`.
   */
  testID?: string;
};

const {
  containerShape: CONTAINER_SHAPE,
  containerColor: CONTAINER_COLOR,
  scrimColor: SCRIM_COLOR,
} = BottomSheetTokens;

const SCRIM_OPACITY = tokens.md.sys.scrim.alpha;
// The sheet's spring is analytic, so a duration this short jumps to the end.
const REDUCED_MOTION_SETTLE_DURATION = 1;

/**
 * Bottom sheets show secondary content anchored to the bottom of the screen.
 * They follow Material Design 3, and are built on
 * [React Native Bottom Sheet](https://docs.swmansion.com/react-native-bottom-sheet/),
 * which needs to be installed:
 *
 * ```bash
 * npx expo install @swmansion/react-native-bottom-sheet
 * ```
 *
 * ## Usage
 * ```js
 * import * as React from 'react';
 * import { View } from 'react-native';
 * import { BottomSheet, Button, List } from 'react-native-paper';
 *
 * const MyComponent = () => {
 *   const [visible, setVisible] = React.useState(false);
 *
 *   return (
 *     <View>
 *       <Button onPress={() => setVisible(true)}>Share</Button>
 *       <BottomSheet visible={visible} onDismiss={() => setVisible(false)}>
 *         <List.Item title="Copy link" left={(props) => <List.Icon {...props} icon="link" />} />
 *         <List.Item title="Email" left={(props) => <List.Icon {...props} icon="email" />} />
 *       </BottomSheet>
 *     </View>
 *   );
 * };
 *
 * export default MyComponent;
 * ```
 *
 * ## Theming
 * Customize by overriding these `theme.colors` roles:
 * - `surfaceContainerLow`: container
 * - `onSurfaceVariant`: drag handle
 * - `scrim`: scrim of a `modal` sheet, at 32% opacity
 * - `shadow`: container shadow
 * - `secondary`: drag handle focus indicator
 *
 * The top corners use `theme.shapes.corner.extraLarge`.
 */
const BottomSheet = ({
  variant = 'modal',
  visible,
  onDismiss,
  dismissable = variant === 'modal',
  detents,
  index: indexProp,
  onIndexChange,
  showDragHandle = true,
  dragHandleAccessibilityLabel = 'Drag handle',
  dismissAccessibilityLabel,
  initialFocusRef,
  restoreFocusRef,
  children,
  style,
  theme: themeOverrides,
  testID,
}: Props) => {
  const {
    BottomSheet: InlineSheet,
    BottomSheetProvider,
    ModalBottomSheet,
  } = loadBottomSheetModule();
  const theme = useInternalTheme(themeOverrides);
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isModal = variant === 'modal';

  // A modal sheet is in the tree only while it is open or closing, so the one
  // opened last mounts last and stacks above the others.
  const [isMounted, setIsMounted] = React.useState(visible);
  const [hasRequestedOpen, setHasRequestedOpen] = React.useState(false);
  const [contentHeight, setContentHeight] = React.useState<number | null>(null);

  if (visible && !isMounted) {
    setIsMounted(true);
  }

  const measuredOpenDetents = getOpenDetents({
    detents,
    isModal,
    contentHeight,
    windowHeight,
  });
  const openDetents = measuredOpenDetents ?? ['content'];
  const lastOpenIndex = openDetents.length - 1;

  const [uncontrolledIndex, setUncontrolledIndex] = React.useState(0);
  const [wasVisible, setWasVisible] = React.useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);

    if (visible) {
      setUncontrolledIndex(0);
    }
  }

  // Default detents change with the content's height, so an index can
  // outlive the detent it pointed at.
  const openIndex = Math.min(
    Math.max(indexProp ?? uncontrolledIndex, 0),
    lastOpenIndex
  );

  // Set when the user drags the sheet closed, so it stays closed while
  // `onDismiss` takes effect, and moves back if the sheet is still `visible`.
  const [isDraggedClosed, setIsDraggedClosed] = React.useState(false);

  React.useEffect(() => {
    if (isDraggedClosed) {
      setIsDraggedClosed(false);
    }
  }, [isDraggedClosed]);

  const isOpen = visible && measuredOpenDetents !== null && !isDraggedClosed;

  if (isOpen && !hasRequestedOpen) {
    setHasRequestedOpen(true);
  }

  // A sheet closed before it measured its content never moved, so it has no
  // closing animation to wait for.
  if (isModal && isMounted && !visible && !hasRequestedOpen) {
    setIsMounted(false);
    setContentHeight(null);
  }

  const canDismiss = dismissable && onDismiss !== undefined;
  const isDragHandleInteractive = openDetents.length > 1 || canDismiss;
  const dragHandleRef = React.useRef<React.ComponentRef<typeof View>>(null);
  const contentRef = React.useRef<React.ComponentRef<typeof View>>(null);

  const { focusInitialTarget, restoreFocus } = useOverlayFocus({
    visible: isModal && visible,
    containerRef: contentRef,
    initialFocusRef:
      initialFocusRef ??
      (showDragHandle && isDragHandleInteractive ? dragHandleRef : undefined),
    restoreFocusRef,
  });

  const changeOpenIndex = (nextIndex: number) => {
    if (indexProp === undefined) {
      setUncontrolledIndex(nextIndex);
    }

    onIndexChange?.(nextIndex);
  };

  const handleSheetIndexChange = (sheetIndex: number) => {
    if (sheetIndex === 0) {
      setIsDraggedClosed(true);
      onDismiss?.();

      return;
    }

    changeOpenIndex(sheetIndex - 1);
  };

  // A sheet that isn't dismissable gives the library no close request handler,
  // so screen readers don't announce a scrim button that does nothing. The
  // library then passes back and Escape on, and they are absorbed here.
  useOverlayDismiss({
    enabled: isModal && visible && !dismissable,
    dismissable: false,
  });

  const handleSettle = (sheetIndex: number) => {
    if (!isModal) {
      return;
    }

    if (sheetIndex > 0) {
      focusInitialTarget();

      return;
    }

    if (!visible) {
      restoreFocus();
      setIsMounted(false);
      setHasRequestedOpen(false);
      setContentHeight(null);
    }
  };

  const handleDragHandlePress = () => {
    if (openIndex < lastOpenIndex) {
      changeOpenIndex(openIndex + 1);
    } else if (lastOpenIndex > 0) {
      changeOpenIndex(0);
    } else if (dismissable) {
      onDismiss?.();
    }
  };

  // Only the default detents of a modal sheet depend on the content's height.
  const measuresContent = isModal && detents === undefined;

  const handleContentEndLayout = (event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.y);
  };

  const cornerRadius = theme.shapes.corner[CONTAINER_SHAPE];
  const shadowColor = theme.colors.shadow;
  // The library resolves the surface style again whenever its identity changes.
  const surfaceStyle = React.useMemo(
    () => ({
      borderTopLeftRadius: cornerRadius,
      borderTopRightRadius: cornerRadius,
      ...getContainerShadow(shadowColor),
    }),
    [cornerRadius, shadowColor]
  );

  const { maxWidth, topInset } = getSheetFrame(windowWidth, insets.top);

  const sheetDetents = [
    // A sheet that isn't dismissable can't be dragged closed.
    { value: 0, programmatic: !dismissable },
    ...openDetents.map((value) =>
      isModal ? { value, scrimOpacity: SCRIM_OPACITY } : value
    ),
  ];

  const sheetProps = {
    detents: sheetDetents,
    index: isOpen ? openIndex + 1 : 0,
    onIndexChange: handleSheetIndexChange,
    onSettle: handleSettle,
    maxWidth,
    topInset,
    style,
    animateIn: !reduceMotion,
    settleDuration: reduceMotion ? REDUCED_MOTION_SETTLE_DURATION : undefined,
    surfaceStyle,
    surface: (
      <View
        testID={testID}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors[CONTAINER_COLOR] },
        ]}
      />
    ),
    children: (
      // Lays the content out as children of the sheet itself, so content with
      // `flex: 1` fills it.
      <View ref={contentRef} style={styles.content}>
        {showDragHandle ? (
          <BottomSheetDragHandle
            ref={dragHandleRef}
            interactive={isDragHandleInteractive}
            expanded={
              lastOpenIndex > 0 ? openIndex === lastOpenIndex : undefined
            }
            onPress={handleDragHandlePress}
            accessibilityLabel={dragHandleAccessibilityLabel}
            theme={theme}
            testID={testID ? `${testID}-drag-handle` : undefined}
          />
        ) : null}
        {children}
        <View style={{ height: insets.bottom }} />
        {measuresContent ? (
          <View pointerEvents="none" onLayout={handleContentEndLayout} />
        ) : null}
      </View>
    ),
  };

  if (!isModal) {
    return <InlineSheet {...sheetProps} />;
  }

  if (!isMounted) {
    return null;
  }

  return (
    <Portal modal={visible} theme={themeOverrides}>
      <BottomSheetProvider>
        <ModalBottomSheet
          {...sheetProps}
          scrimColor={theme.colors[SCRIM_COLOR]}
          scrimAccessibilityLabel={dismissAccessibilityLabel}
          onCloseRequest={dismissable ? onDismiss : undefined}
        />
      </BottomSheetProvider>
    </Portal>
  );
};

const styles = StyleSheet.create({
  content: {
    display: 'contents',
  },
});

export default BottomSheet;
