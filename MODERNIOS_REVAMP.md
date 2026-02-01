# Modern iOS Design System Revamp for BarbellBeats

## Overview
This document outlines the complete transformation of BarbellBeats to match modern iOS 17/18 design patterns including:
- iOS-style inset grouped lists
- Large navigation titles
- Native iOS card styling
- Proper iOS color semantics
- SF Pro font characteristics
- iOS-standard spacing and touch targets

---

## 1. Enhanced Design Tokens

### iOS Color System Updates

```typescript
// Add to src/theme/tokens.ts

export const IOS_COLORS = {
  light: {
    // iOS System Colors
    systemBackground: '#FFFFFF',
    secondarySystemBackground: '#F2F2F7',
    tertiarySystemBackground: '#FFFFFF',

    // Grouped Backgrounds (for Settings-style lists)
    systemGroupedBackground: '#F2F2F7',
    secondarySystemGroupedBackground: '#FFFFFF',
    tertiarySystemGroupedBackground: '#F2F2F7',

    // iOS Label Colors
    label: '#000000',
    secondaryLabel: '#3C3C43',      // 60% opacity
    tertiaryLabel: '#3C3C43',       // 30% opacity
    quaternaryLabel: '#3C3C43',     // 18% opacity

    // iOS Separators
    separator: 'rgba(60, 60, 67, 0.29)',
    opaqueSeparator: '#C6C6C8',

    // iOS Fill Colors (for buttons, etc)
    systemFill: 'rgba(120, 120, 128, 0.2)',
    secondarySystemFill: 'rgba(120, 120, 128, 0.16)',
    tertiarySystemFill: 'rgba(118, 118, 128, 0.12)',
    quaternarySystemFill: 'rgba(116, 116, 128, 0.08)',
  },

  dark: {
    // iOS System Colors
    systemBackground: '#000000',
    secondarySystemBackground: '#1C1C1E',
    tertiarySystemBackground: '#2C2C2E',

    // Grouped Backgrounds
    systemGroupedBackground: '#000000',
    secondarySystemGroupedBackground: '#1C1C1E',
    tertiarySystemGroupedBackground: '#2C2C2E',

    // iOS Label Colors
    label: '#FFFFFF',
    secondaryLabel: '#EBEBF5',      // 60% opacity
    tertiaryLabel: '#EBEBF5',       // 30% opacity
    quaternaryLabel: '#EBEBF5',     // 18% opacity

    // iOS Separators
    separator: 'rgba(84, 84, 88, 0.6)',
    opaqueSeparator: '#38383A',

    // iOS Fill Colors
    systemFill: 'rgba(120, 120, 128, 0.36)',
    secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
    tertiarySystemFill: 'rgba(118, 118, 128, 0.24)',
    quaternarySystemFill: 'rgba(118, 118, 128, 0.18)',
  },
};

// iOS-style elevation
export const IOS_ELEVATION = {
  card: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 1,
    },
  },
  modal: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 25,
      elevation: 10,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 25,
      elevation: 10,
    },
  },
};
```

---

## 2. iOS-Style GymListScreen (Inset Grouped List)

### Implementation

```typescript
// src/screens/GymListScreen.tsx

import React, { useMemo, useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Gym } from '../types';
import { listGyms } from '../services/gymApi';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// iOS-style List Row
interface GymRowProps {
  item: Gym;
  index: number;
  onPress: (gymId: string) => void;
  colors: typeof COLORS.light | typeof COLORS.dark;
}

const GymRow = memo<GymRowProps>(({ item, index, onPress, colors }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.secondarySystemGroupedBackground },
        pressed && styles.rowPressed,
      ]}
      onPress={() => onPress(item.id)}
    >
      {/* Rank Badge */}
      <View style={[styles.rankBadge, { backgroundColor: colors.systemFill }]}>
        <Text style={[styles.rankText, { color: colors.label }]}>
          {index <= 2 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
        </Text>
      </View>

      {/* Gym Info */}
      <View style={styles.content}>
        <Text style={[styles.gymName, { color: colors.label }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.gymAddress, { color: colors.secondaryLabel }]} numberOfLines={1}>
          {item.address}
        </Text>
        <View style={styles.metadata}>
          <Text style={[styles.metadataText, { color: colors.tertiaryLabel }]}>
            👥 {item.memberCount} • 📍 {item.distance?.toFixed(1)} mi
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <Text style={[styles.chevron, { color: colors.tertiaryLabel }]}>›</Text>
    </Pressable>
  );
}, (prev, next) => (
  prev.item.id === next.item.id &&
  prev.item.memberCount === next.item.memberCount
));

export default function GymListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [refreshing, setRefreshing] = useState(false);

  const { data: gyms, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => listGyms(),
    staleTime: 1000 * 60 * 2,
  });

  const totalMembers = useMemo(
    () => gyms?.reduce((sum, gym) => sum + (gym.memberCount || 0), 0) ?? 0,
    [gyms],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleGymPress = (gymId: string) => {
    navigation.navigate('Playlist', { gymId });
  };

  if (isLoading) {
    return <LoadingView message="Finding gyms nearby..." />;
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]}>
        <ErrorView error={error as Error} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={gyms}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <GymRow
              item={item}
              index={index}
              onPress={handleGymPress}
              colors={colors}
            />
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              {/* Large Title */}
              <Text style={[styles.largeTitle, { color: colors.label }]}>
                Nearby Gyms
              </Text>

              {/* Stats Cards */}
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
                  <Text style={[styles.statValue, { color: colors.label }]}>
                    {gyms?.length ?? 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>
                    Gyms Live
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
                  <Text style={[styles.statValue, { color: colors.label }]}>
                    {totalMembers}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>
                    Training Now
                  </Text>
                </View>
              </View>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
          )}
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING['2xl'],
  },
  header: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.lg,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.base,
  },
  statCard: {
    flex: 1,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    minHeight: 76, // iOS-standard row height
  },
  rowPressed: {
    opacity: 0.7,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rankText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  gymName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  gymAddress: {
    fontSize: 15,
    marginBottom: SPACING.xs,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76, // Aligned with content, not badge
  },
});
```

---

## 3. iOS-Style PlaylistScreen (Now Playing + Queue)

### Implementation

```typescript
// Modern iOS Music-style Now Playing

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme/tokens';

export default function PlaylistScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.systemBackground }]}>
      {/* Large Album Art */}
      <View style={styles.artworkContainer}>
        <Image
          source={{ uri: currentSong?.albumArt }}
          style={styles.artwork}
          resizeMode="cover"
        />
      </View>

      {/* Song Info */}
      <View style={styles.infoSection}>
        <Text style={[styles.songTitle, { color: colors.label }]} numberOfLines={1}>
          {currentSong?.title}
        </Text>
        <Text style={[styles.artistName, { color: colors.secondaryLabel }]} numberOfLines={1}>
          {currentSong?.artist}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={[styles.progressBar, { backgroundColor: colors.systemFill }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress}%` }
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.tertiaryLabel }]}>
            {formatTime(currentTime)}
          </Text>
          <Text style={[styles.timeText, { color: colors.tertiaryLabel }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable style={styles.controlButton}>
          <Text style={{ fontSize: 32, color: colors.label }}>⏮</Text>
        </Pressable>
        <Pressable style={[styles.playButton, { backgroundColor: colors.primary }]}>
          <Text style={{ fontSize: 40, color: '#FFF' }}>▶️</Text>
        </Pressable>
        <Pressable style={styles.controlButton}>
          <Text style={{ fontSize: 32, color: colors.label }}>⏭</Text>
        </Pressable>
      </View>

      {/* Queue List (iOS-style) */}
      <View style={styles.queueSection}>
        <Text style={[styles.queueTitle, { color: colors.secondaryLabel }]}>
          UP NEXT
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {queue.map((song, index) => (
            <QueueRow
              key={song.id}
              song={song}
              index={index}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  artworkContainer: {
    width: '100%',
    aspectRatio: 1,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.lg,
  },
  infoSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 17,
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    gap: SPACING.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueSection: {
    flex: 1,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.base,
  },
  queueTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
});
```

---

## 4. iOS Navigation Bar Configuration

### Update TabNavigator.tsx

```typescript
// src/navigation/TabNavigator.tsx

function GymsStackNavigator() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <GymsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.systemGroupedBackground,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerLargeTitle: true, // iOS large title
        headerLargeTitleStyle: {
          fontWeight: '700',
          fontSize: 34,
        },
        headerBlurEffect: isDark ? 'dark' : 'light',
        headerTransparent: false,
        headerShadowVisible: false,
      }}
    >
      {/* screens */}
    </GymsStack.Navigator>
  );
}

export default function TabNavigator() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderTopColor: colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.sm,
          paddingTop: SPACING.sm,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0,
        },
        headerShown: true,
        headerLargeTitle: true, // iOS large titles for tabs
        headerStyle: {
          backgroundColor: colors.systemGroupedBackground,
        },
        headerLargeTitleStyle: {
          fontWeight: '700',
          fontSize: 34,
        },
        headerBlurEffect: isDark ? 'dark' : 'light',
      })}
    >
      {/* tabs */}
    </Tab.Navigator>
  );
}
```

---

## 5. Key iOS Design Patterns to Implement

### 5.1 Inset Grouped Lists (Settings-style)

```typescript
// iOS Settings-style grouped list
<View style={[styles.section, { backgroundColor: colors.systemGroupedBackground }]}>
  <Text style={[styles.sectionHeader, { color: colors.secondaryLabel }]}>
    SECTION TITLE
  </Text>
  <View style={[styles.group, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
    {items.map((item, index) => (
      <View key={item.id}>
        <ListRow item={item} />
        {index < items.length - 1 && <Separator />}
      </View>
    ))}
  </View>
  <Text style={[styles.sectionFooter, { color: colors.secondaryLabel }]}>
    Footer explanation text
  </Text>
</View>

const styles = StyleSheet.create({
  section: {
    paddingTop: SPACING.xl,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: -0.08,
    paddingHorizontal: SPACING.base + 4,
    paddingBottom: SPACING.xs,
  },
  group: {
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.base,
    overflow: 'hidden',
  },
  sectionFooter: {
    fontSize: 13,
    paddingHorizontal: SPACING.base + 4,
    paddingTop: SPACING.xs,
    lineHeight: 18,
  },
});
```

### 5.2 iOS Action Sheets

```typescript
// Modern iOS action sheet
<ActionSheet
  title="Choose Action"
  message="Select an option from below"
  options={[
    { text: 'Delete', style: 'destructive' },
    { text: 'Share', style: 'default' },
    { text: 'Cancel', style: 'cancel' },
  ]}
/>
```

### 5.3 iOS Context Menus

```typescript
// Long press context menu
<Pressable
  onLongPress={() => showContextMenu({
    items: [
      { text: 'Add to Favorites', icon: '★' },
      { text: 'Share', icon: '↗' },
      { text: 'Delete', icon: '🗑', destructive: true },
    ],
  })}
>
  <Content />
</Pressable>
```

---

## 6. Implementation Checklist

### Phase 1: Foundation
- [ ] Update design tokens with iOS system colors
- [ ] Add iOS-specific elevation/shadows
- [ ] Create iOS-style card component
- [ ] Create iOS-style list row component

### Phase 2: Navigation
- [ ] Enable large titles on all navigators
- [ ] Update tab bar styling
- [ ] Add blur effect to navigation bars
- [ ] Implement proper back button styling

### Phase 3: Screens
- [ ] Revamp GymListScreen with inset grouped list
- [ ] Update PlaylistScreen with Now Playing design
- [ ] Modernize LeaderboardScreen
- [ ] Update HomeScreen dashboard
- [ ] Refresh MapScreen with iOS map styling

### Phase 4: Components
- [ ] Create ActionSheet component
- [ ] Create ContextMenu component
- [ ] Create SegmentedControl component
- [ ] Create iOS-style SearchBar
- [ ] Create iOS-style Toggle/Switch wrapper

### Phase 5: Polish
- [ ] Add haptic feedback on interactions
- [ ] Implement smooth scroll animations
- [ ] Add proper loading states
- [ ] Test dark mode thoroughly
- [ ] Verify accessibility

---

## 7. Before & After Comparison

### OLD: Generic Cards
```typescript
<GlassCard>
  <Badge />
  <Text>Content</Text>
</GlassCard>
```

### NEW: iOS Grouped List
```typescript
<View style={[styles.group, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
  <ListRow
    title="Gym Name"
    subtitle="Address"
    trailing={<Chevron />}
    onPress={handlePress}
  />
  <Separator inset={60} />
</View>
```

---

## Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [iOS Design Resources](https://developer.apple.com/design/resources/)
- [SF Symbols](https://developer.apple.com/sf-symbols/)

---

**Next Steps**: Start with Phase 1 (Foundation) to update the design tokens, then progressively implement each phase.
