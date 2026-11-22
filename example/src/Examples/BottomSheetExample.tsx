import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  BottomSheet,
  Button,
  Divider,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHARE_TARGETS = [
  { title: 'Copy link', icon: 'link-variant' },
  { title: 'Email', icon: 'email-outline' },
  { title: 'Messages', icon: 'message-outline' },
  { title: 'Save to drive', icon: 'cloud-upload-outline' },
];

const PLAYLIST = Array.from({ length: 30 }, (_, index) => ({
  title: `Track ${index + 1}`,
  description: `Artist ${(index % 5) + 1}`,
}));

type ModalSheet = 'share' | 'playlist' | 'confirm' | null;

// The drag handle's 48dp and the "Now playing" row.
const PLAYER_PEEK_HEIGHT = 48 + 64;

const BottomSheetExample = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalSheet, setModalSheet] = React.useState<ModalSheet>(null);
  const [isPlayerVisible, setIsPlayerVisible] = React.useState(true);
  const [playerIndex, setPlayerIndex] = React.useState(0);

  const closeModalSheet = () => setModalSheet(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium">Modal</Text>
        <Button
          mode="outlined"
          onPress={() => setModalSheet('share')}
          testID="open-share-sheet"
        >
          Share (fits its content)
        </Button>
        <Button
          mode="outlined"
          onPress={() => setModalSheet('playlist')}
          testID="open-playlist-sheet"
        >
          Playlist (opens at half height)
        </Button>
        <Button
          mode="outlined"
          onPress={() => setModalSheet('confirm')}
          testID="open-confirm-sheet"
        >
          Not dismissable
        </Button>

        <Text variant="titleMedium">Standard</Text>
        <Button
          mode="outlined"
          onPress={() => setIsPlayerVisible((visible) => !visible)}
          testID="toggle-player-sheet"
        >
          {isPlayerVisible ? 'Hide player' : 'Show player'}
        </Button>
        <Button
          mode="outlined"
          disabled={!isPlayerVisible}
          onPress={() => setPlayerIndex(2)}
        >
          Expand player
        </Button>
      </ScrollView>

      <BottomSheet
        variant="standard"
        visible={isPlayerVisible}
        detents={[PLAYER_PEEK_HEIGHT + insets.bottom, '50%', '100%']}
        index={playerIndex}
        onIndexChange={setPlayerIndex}
        testID="player-sheet"
      >
        <List.Item
          title="Now playing"
          description="Track 1 · Artist 1"
          left={(props) => <List.Icon {...props} icon="music-note" />}
        />
        <Divider />
        <ScrollView style={styles.fill}>
          {PLAYLIST.map(({ title, description }) => (
            <List.Item key={title} title={title} description={description} />
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={modalSheet === 'share'}
        onDismiss={closeModalSheet}
        testID="share-sheet"
      >
        <List.Subheader>Share with</List.Subheader>
        {SHARE_TARGETS.map(({ title, icon }) => (
          <List.Item
            key={title}
            title={title}
            left={(props) => <List.Icon {...props} icon={icon} />}
            onPress={closeModalSheet}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={modalSheet === 'playlist'}
        onDismiss={closeModalSheet}
        testID="playlist-sheet"
      >
        <ScrollView style={styles.fill}>
          {PLAYLIST.map(({ title, description }) => (
            <List.Item
              key={title}
              title={title}
              description={description}
              left={(props) => <List.Icon {...props} icon="music-note" />}
              onPress={closeModalSheet}
            />
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={modalSheet === 'confirm'}
        onDismiss={closeModalSheet}
        dismissable={false}
        testID="confirm-sheet"
      >
        <View style={styles.confirm}>
          <Text variant="headlineSmall">Discard draft?</Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            The sheet stays open until you choose an action.
          </Text>
          <View style={styles.actions}>
            <Button onPress={closeModalSheet}>Cancel</Button>
            <Button mode="filled" onPress={closeModalSheet}>
              Discard
            </Button>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

BottomSheetExample.title = 'Bottom Sheet';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
    // Room for the collapsed player sheet.
    paddingBottom: 160,
  },
  fill: {
    flex: 1,
  },
  confirm: {
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
});

export default BottomSheetExample;
