import { BackHandler as RNBackHandler, Text } from 'react-native';

import { describe, expect, it, jest } from '@jest/globals';
import { act, userEvent } from '@testing-library/react-native';

import { fireEvent, render, screen } from '../../test-utils';
import BottomSheet, {
  type Props as BottomSheetProps,
} from '../BottomSheet/BottomSheet';
import Portal from '../Portal/Portal';

type BackHandlerStatic = typeof RNBackHandler & {
  mockPressBack(): void;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const BackHandler = RNBackHandler as BackHandlerStatic;

const renderSheet = (props: Partial<BottomSheetProps> = {}) =>
  render(
    <Portal.Host>
      <BottomSheet visible onDismiss={() => {}} testID="sheet" {...props}>
        <Text>Sheet content</Text>
      </BottomSheet>
    </Portal.Host>
  );

// The native sheet reports drags, settles, and close requests as events on
// the view that hosts the sheet's container.
const fireSheetEvent = (
  eventName: 'indexChange' | 'settle' | 'closeRequest',
  index?: number
) =>
  fireEvent(
    screen.getByTestId('sheet'),
    eventName,
    index === undefined ? undefined : { nativeEvent: { index } }
  );

describe('BottomSheet', () => {
  it('renders the content of a visible modal sheet', async () => {
    await renderSheet();

    expect(screen.getByText('Sheet content')).toBeOnTheScreen();
  });

  it('unmounts a modal sheet closed before it opened, with nothing to animate', async () => {
    await renderSheet();

    await screen.rerender(
      <Portal.Host>
        <BottomSheet visible={false} testID="sheet">
          <Text>Sheet content</Text>
        </BottomSheet>
      </Portal.Host>
    );

    expect(screen.queryByText('Sheet content')).not.toBeOnTheScreen();
  });

  it("doesn't render a modal sheet that was never visible", async () => {
    await renderSheet({ visible: false });

    expect(screen.queryByText('Sheet content')).not.toBeOnTheScreen();
  });

  it('keeps a closing modal sheet until it settles closed', async () => {
    await renderSheet({ detents: [300] });

    await screen.rerender(
      <Portal.Host>
        <BottomSheet visible={false} detents={[300]} testID="sheet">
          <Text>Sheet content</Text>
        </BottomSheet>
      </Portal.Host>
    );

    expect(screen.getByText('Sheet content')).toBeOnTheScreen();

    await fireSheetEvent('settle', 0);

    expect(screen.queryByText('Sheet content')).not.toBeOnTheScreen();
  });

  it('shows a drag handle button', async () => {
    await renderSheet();

    expect(
      screen.getByRole('button', { name: 'Drag handle' })
    ).toBeOnTheScreen();
  });

  it('labels the drag handle with dragHandleAccessibilityLabel', async () => {
    await renderSheet({ dragHandleAccessibilityLabel: 'Resize sheet' });

    expect(
      screen.getByRole('button', { name: 'Resize sheet' })
    ).toBeOnTheScreen();
  });

  it('hides the drag handle with showDragHandle={false}', async () => {
    await renderSheet({ showDragHandle: false });

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('cycles through the heights when the drag handle is pressed', async () => {
    const onIndexChange = jest.fn();
    await renderSheet({ detents: [200, 400], onIndexChange });
    const dragHandle = screen.getByRole('button', { name: 'Drag handle' });

    expect(dragHandle).toBeCollapsed();

    await userEvent.press(dragHandle);

    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(dragHandle).toBeExpanded();

    await userEvent.press(dragHandle);

    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    expect(dragHandle).toBeCollapsed();
  });

  it('follows a controlled index', async () => {
    const onIndexChange = jest.fn();
    await renderSheet({ detents: [200, 400], index: 1, onIndexChange });
    const dragHandle = screen.getByRole('button', { name: 'Drag handle' });

    expect(dragHandle).toBeExpanded();

    await userEvent.press(dragHandle);

    expect(onIndexChange).toHaveBeenCalledWith(0);
    expect(dragHandle).toBeExpanded();
  });

  it('dismisses a sheet with one height when the drag handle is pressed', async () => {
    const onDismiss = jest.fn();
    await renderSheet({ detents: [300], onDismiss });

    await userEvent.press(screen.getByRole('button', { name: 'Drag handle' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("doesn't make the drag handle a button when pressing it would do nothing", async () => {
    await renderSheet({ detents: [300], dismissable: false });

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('reports a drag to another height', async () => {
    const onIndexChange = jest.fn();
    await renderSheet({ detents: [200, 400], onIndexChange });

    await fireSheetEvent('indexChange', 2);

    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole('button', { name: 'Drag handle' })).toBeExpanded();
  });

  it('calls onDismiss when the sheet is dragged closed', async () => {
    const onDismiss = jest.fn();
    await renderSheet({ detents: [300], onDismiss });

    await fireSheetEvent('indexChange', 0);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss on a close request, such as a scrim tap', async () => {
    const onDismiss = jest.fn();
    await renderSheet({ onDismiss });

    await fireSheetEvent('closeRequest');

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("doesn't call onDismiss on a close request when not dismissable", async () => {
    const onDismiss = jest.fn();
    await renderSheet({ onDismiss, dismissable: false });

    await fireSheetEvent('closeRequest');

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('absorbs the back button while a sheet that is not dismissable is open', async () => {
    const onDismiss = jest.fn();
    const onBackPress = jest.fn(() => true);
    const subscription = RNBackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    await renderSheet({ onDismiss, dismissable: false });

    await act(() => {
      BackHandler.mockPressBack();
    });

    expect(onBackPress).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();

    subscription.remove();
  });

  it('renders a standard sheet inline, without a portal host', async () => {
    await render(
      <BottomSheet variant="standard" visible detents={[100, 300]}>
        <Text>Player</Text>
      </BottomSheet>
    );

    expect(screen.getByText('Player')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Drag handle' })).toBeCollapsed();
  });

  it("doesn't let the user dismiss a standard sheet by default", async () => {
    const onDismiss = jest.fn();
    await render(
      <BottomSheet variant="standard" visible onDismiss={onDismiss}>
        <Text>Player</Text>
      </BottomSheet>
    );

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('explains how to install the library when it is missing', () => {
    jest.isolateModules(() => {
      jest.doMock('@swmansion/react-native-bottom-sheet', () => {
        throw new Error(
          "Cannot find module '@swmansion/react-native-bottom-sheet'"
        );
      });

      const {
        loadBottomSheetModule,
      }: typeof import('../BottomSheet/loadBottomSheetModule') = require('../BottomSheet/loadBottomSheetModule');

      expect(loadBottomSheetModule).toThrow(
        "BottomSheet requires '@swmansion/react-native-bottom-sheet'"
      );
    });
  });
});
