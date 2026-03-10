import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { GymsStackParamList, Gym, TabParamList } from '../types';
import { listGyms } from '../services/gymApi';
import { useThemeMode } from '../contexts/ThemeContext';
import { useGym } from '../contexts/GymContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useFavoriteGyms } from '../hooks/useFavoriteGyms';
import { EmptyState, IOSListRow } from '../components/UI';
import { SkeletonListItem } from '../components/SkeletonLoader';
import { Icon } from '../components/Icon';
import { COLORS, IOS_COLORS, SIGNAL, SPACING, LAYOUT, RADIUS } from '../theme/tokens';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<GymsStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export default function FavoriteGymsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const compact = preferences.compactMode;
  const { setActiveGymId } = useGym();

  const { data: allGyms, isLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => listGyms(),
    staleTime: 1000 * 60 * 2,
  });

  const { favoriteGyms, toggleFavorite } = useFavoriteGyms(allGyms ?? []);

  const handleGymPress = useCallback((gymId: string) => {
    setActiveGymId(gymId);
    navigation.navigate('Music', { screen: 'GymPlaylist', params: { gymId } });
  }, [navigation, setActiveGymId]);

  const renderRow = useCallback(({ item, index }: { item: Gym; index: number }) => (
    <IOSListRow
      onPress={() => handleGymPress(item.id)}
      chevron={true}
      separator={index < favoriteGyms.length - 1}
      separatorInset={60}
    >
      <View style={styles.rowContainer}>
        {/* Star icon as left accent */}
        <View style={[styles.iconBadge, { backgroundColor: iosColors.systemFill }]}>
          <Text style={styles.starIcon}>★</Text>
        </View>

        {/* Gym info */}
        <View style={styles.gymContent}>
          <Text
            style={[styles.gymName, compact && styles.gymNameCompact, { color: iosColors.label }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.gymAddress, compact && styles.gymAddressCompact, { color: iosColors.secondaryLabel }]}
            numberOfLines={1}
          >
            {item.address}
          </Text>
          <Text
            style={[styles.metadataText, compact && styles.metadataTextCompact, { color: iosColors.tertiaryLabel }]}
            numberOfLines={1}
          >
            {item.memberCount} training • {item.distance?.toFixed(1)} mi away
          </Text>
        </View>

        {/* Unfavorite button */}
        <Pressable
          onPress={() => toggleFavorite(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.starButton}
          accessibilityLabel="Remove from favorites"
          accessibilityRole="button"
        >
          <Text style={[styles.starIcon, { color: SIGNAL.gold }]}>★</Text>
        </Pressable>
      </View>
    </IOSListRow>
  ), [compact, favoriteGyms.length, handleGymPress, iosColors, toggleFavorite]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.skeletonWrapper}>
            {[...Array(5)].map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={favoriteGyms}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, compact && styles.listCompact]}
          ListHeaderComponent={
            favoriteGyms.length > 0 ? (
              <View style={styles.listHeader}>
                <View style={[styles.groupedStart, { backgroundColor: iosColors.secondarySystemGroupedBackground }]} />
              </View>
            ) : null
          }
          ListFooterComponent={
            favoriteGyms.length > 0 ? (
              <View style={[styles.groupedEnd, { backgroundColor: iosColors.secondarySystemGroupedBackground }]} />
            ) : null
          }
          CellRendererComponent={({ children, index, style, ...props }) => (
            <View
              style={[
                style,
                index === 0 && styles.firstCell,
                index === favoriteGyms.length - 1 && styles.lastCell,
              ]}
              {...props}
            >
              <View
                style={[
                  styles.cellWrapper,
                  { backgroundColor: iosColors.secondarySystemGroupedBackground },
                ]}
              >
                {children}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Icon name="star" size="xxl" color={iosColors.tertiaryLabel} />}
              title="No favorite gyms yet"
              message="Tap the star on any gym to save it here."
              action={{ label: 'Browse Gyms', onPress: () => navigation.goBack() }}
            />
          }
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
  list: {
    paddingBottom: SPACING.xl,
  },
  listCompact: {
    paddingBottom: SPACING.lg,
  },
  listHeader: {
    marginTop: SPACING.base,
  },
  groupedStart: {
    marginHorizontal: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    height: 0,
  },
  groupedEnd: {
    marginHorizontal: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    height: 0,
    marginBottom: 8,
  },
  cellWrapper: {
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  firstCell: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  lastCell: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },
  skeletonWrapper: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACING.lg,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gymContent: {
    flex: 1,
    gap: 2,
  },
  gymName: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  gymNameCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  gymAddress: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  gymAddressCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  metadataText: {
    fontSize: 13,
    lineHeight: 18,
  },
  metadataTextCompact: {
    fontSize: 11,
    lineHeight: 16,
  },
  starButton: {
    paddingLeft: SPACING.sm,
  },
  starIcon: {
    fontSize: 20,
    color: SIGNAL.gold,
  },
});
