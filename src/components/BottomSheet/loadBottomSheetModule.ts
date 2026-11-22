type BottomSheetModule = typeof import('@swmansion/react-native-bottom-sheet');

let bottomSheetModule: BottomSheetModule | null | undefined;

/**
 * `@swmansion/react-native-bottom-sheet` is an optional peer dependency, so
 * apps that never render a `BottomSheet` don't need its native code. It is
 * required on first use, which Metro allows inside `try`.
 */
export const loadBottomSheetModule = (): BottomSheetModule => {
  if (bottomSheetModule === undefined) {
    try {
      bottomSheetModule = require('@swmansion/react-native-bottom-sheet');
    } catch (e) {
      bottomSheetModule = null;
    }
  }

  if (!bottomSheetModule) {
    throw new Error(
      "BottomSheet requires '@swmansion/react-native-bottom-sheet'. Install it with `npx expo install @swmansion/react-native-bottom-sheet` or `npm install @swmansion/react-native-bottom-sheet`, then rebuild the native app."
    );
  }

  return bottomSheetModule;
};
