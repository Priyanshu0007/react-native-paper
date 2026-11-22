import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheetTokens } from './tokens';
import { cornerFull } from '../../theme/tokens/sys/shape';
import type { InternalTheme } from '../../theme/types';
import { useFocusRing } from '../../utils/useFocusRing';

type Props = {
  ref?: React.Ref<React.ComponentRef<typeof View>>;
  /**
   * Whether pressing the handle does anything. A handle that doesn't is only
   * drawn, and hidden from assistive technology.
   */
  interactive: boolean;
  /**
   * Whether the sheet is at its tallest height, for a sheet with several.
   */
  expanded: boolean | undefined;
  onPress: () => void;
  accessibilityLabel: string;
  theme: InternalTheme;
  testID?: string;
};

const {
  dragHandleWidth: HANDLE_WIDTH,
  dragHandleHeight: HANDLE_HEIGHT,
  dragHandlePaddingVertical: HANDLE_PADDING_VERTICAL,
  dragHandleTouchTargetSize: TOUCH_TARGET_SIZE,
  dragHandleColor: HANDLE_COLOR,
  focusIndicatorColor: FOCUS_INDICATOR_COLOR,
} = BottomSheetTokens;

/**
 * The drag handle at the top of a sheet. It is a button that moves the sheet
 * through its heights, so the sheet can be resized without dragging.
 */
const BottomSheetDragHandle = ({
  ref,
  interactive,
  expanded,
  onPress,
  accessibilityLabel,
  theme,
  testID,
}: Props) => {
  // The ring is drawn around the handle, not the larger touch target.
  const { target: focusTarget, ring: focusRing } = useFocusRing(
    !interactive,
    theme.colors[FOCUS_INDICATOR_COLOR],
    'outward',
    'descendant'
  );

  const handle = (
    <View
      style={[
        styles.handle,
        { backgroundColor: theme.colors[HANDLE_COLOR] },
        ...focusRing.style,
      ]}
      {...focusRing.dataSetProps}
    />
  );

  return (
    <View style={styles.container}>
      {interactive ? (
        <Pressable
          ref={ref}
          onPress={onPress}
          onFocus={focusTarget.onFocus}
          onBlur={focusTarget.onBlur}
          role="button"
          aria-label={accessibilityLabel}
          aria-expanded={expanded}
          testID={testID}
          style={[styles.touchTarget, ...focusTarget.style]}
          {...focusTarget.dataSetProps}
        >
          {handle}
        </Pressable>
      ) : (
        <View ref={ref} aria-hidden testID={testID} style={styles.touchTarget}>
          {handle}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    // The top 48dp of the sheet: the handle and the space above and below it.
    height: HANDLE_HEIGHT + 2 * HANDLE_PADDING_VERTICAL,
    justifyContent: 'center',
  },
  touchTarget: {
    alignItems: 'center',
    height: TOUCH_TARGET_SIZE,
    justifyContent: 'center',
    width: TOUCH_TARGET_SIZE,
  },
  handle: {
    borderRadius: cornerFull,
    height: HANDLE_HEIGHT,
    width: HANDLE_WIDTH,
  },
});

export default BottomSheetDragHandle;
