import { Platform, type ColorValue, type ViewStyle } from 'react-native';

import color from 'color';

import { BottomSheetTokens } from './tokens';
import {
  androidElevationLevels,
  shadow,
} from '../../theme/tokens/sys/elevation';

/**
 * A height the sheet snaps to: a number of layout units, a share of the
 * available height such as `'50%'`, or `'content'` for the height of the
 * sheet's content.
 */
export type BottomSheetDetent = number | `${number}%` | 'content';

const {
  maxWidth: MAX_WIDTH,
  topMargin: TOP_MARGIN,
  wideTopMargin: WIDE_TOP_MARGIN,
  wideSideMargin: WIDE_SIDE_MARGIN,
  modalInitialHeightRatio: MODAL_INITIAL_HEIGHT_RATIO,
  containerElevation: CONTAINER_ELEVATION,
} = BottomSheetTokens;

/**
 * The sheet spans the window up to 640dp. A wider window keeps 56dp on each
 * side and above the sheet, a narrower one 72dp above it. The space above
 * never leaves the sheet under the status bar.
 */
export const getSheetFrame = (
  windowWidth: number,
  topSafeAreaInset: number
) => {
  const isWide = windowWidth > MAX_WIDTH;

  return {
    maxWidth: isWide
      ? Math.min(MAX_WIDTH, windowWidth - 2 * WIDE_SIDE_MARGIN)
      : undefined,
    topInset: Math.max(isWide ? WIDE_TOP_MARGIN : TOP_MARGIN, topSafeAreaInset),
  };
};

/**
 * The heights an open sheet snaps to. Without `detents`, a standard sheet fits
 * its content, and a modal sheet fits its content too, except that it first
 * opens at half the window's height when the content is taller than that, and
 * can then be dragged up to show the rest.
 *
 * Returns `null` while a modal sheet's content hasn't been measured yet.
 */
export const getOpenDetents = ({
  detents,
  isModal,
  contentHeight,
  windowHeight,
}: {
  detents: BottomSheetDetent[] | undefined;
  isModal: boolean;
  contentHeight: number | null;
  windowHeight: number;
}): BottomSheetDetent[] | null => {
  if (detents) {
    if (detents.length === 0) {
      throw new Error(
        'BottomSheet: `detents` must contain at least one height.'
      );
    }

    return detents;
  }

  if (!isModal) {
    return ['content'];
  }

  if (contentHeight === null) {
    return null;
  }

  const initialHeight = Math.round(windowHeight * MODAL_INITIAL_HEIGHT_RATIO);

  return contentHeight > initialHeight
    ? [initialHeight, 'content']
    : ['content'];
};

type ContainerShadow = Pick<
  ViewStyle,
  | 'boxShadow'
  | 'elevation'
  | 'shadowColor'
  | 'shadowOffset'
  | 'shadowOpacity'
  | 'shadowRadius'
>;

/**
 * The level 1 container shadow. Android casts its own elevation shadow, as
 * native Material sheets do. Elsewhere both layers of Paper's elevation shadow
 * are drawn as a `boxShadow`, since the sheet clips its content and takes
 * shadows as part of its surface.
 */
export const getContainerShadow = (
  shadowColor: ColorValue
): ContainerShadow => {
  if (Platform.OS === 'android') {
    return {
      elevation: androidElevationLevels[CONTAINER_ELEVATION],
      shadowColor,
    };
  }

  const [spotShadow, ambientShadow] = shadow(CONTAINER_ELEVATION, shadowColor);

  if ('boxShadow' in spotShadow) {
    return { boxShadow: spotShadow.boxShadow };
  }

  // A platform color has no alpha to scale, so it casts only the spot shadow.
  if (typeof shadowColor !== 'string') {
    return spotShadow;
  }

  return {
    boxShadow: [spotShadow, ambientShadow].flatMap((layer) =>
      layer
        ? [
            {
              offsetX: layer.shadowOffset.width,
              offsetY: layer.shadowOffset.height,
              // iOS draws `shadowRadius` at about half a blur radius.
              blurRadius: layer.shadowRadius * 2,
              color: color(shadowColor)
                .alpha(layer.shadowOpacity)
                .rgb()
                .string(),
            },
          ]
        : []
    ),
  };
};
