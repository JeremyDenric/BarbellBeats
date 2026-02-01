import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, IOS_COLORS, SPACING, TYPOGRAPHY, RADIUS, LAYOUT, TOUCH_TARGET } from '../theme/tokens';
import ThemeToggle from '../components/ThemeToggle';

// Screens
import HomeScreen from '../screens/HomeScreen';
import FeaturesScreen from '../screens/FeaturesScreen';
import FeatureDetailScreen from '../screens/FeatureDetailScreen';
import GymListScreen from '../screens/GymListScreen';
import GymDetailsScreen from '../screens/GymDetailsScreen';
import MapScreenAdvanced from '../screens/MapScreenAdvanced';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import TrainingHubScreen from '../screens/TrainingHubScreen';
import WorkoutToolsScreen from '../screens/WorkoutToolsScreen';
import WorkoutLogScreen from '../screens/WorkoutLogScreen';
import ProgressTrackingScreen from '../screens/ProgressTrackingScreen';
import PrsScreen from '../screens/PrsScreen';
import TimersScreen from '../screens/TimersScreen';
import MusicHubScreen from '../screens/MusicHubScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import SpotifyScreen from '../screens/SpotifyScreen';
import SpotifyConnectScreen from '../screens/SpotifyConnectScreen';
import SetlistsScreen from '../screens/SetlistsScreen';
import GymPickerScreen from '../screens/GymPickerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import {
  CardioTypeSelectionScreen,
  CardioSetupScreen,
  LiveCardioTrackingScreen,
  CardioSummaryScreen,
} from '../screens/Cardio';
import {
  HomeStackParamList,
  GymsStackParamList,
  TrainingStackParamList,
  MusicStackParamList,
  ProfileStackParamList,
} from '../types';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DiscoverStack = createNativeStackNavigator<GymsStackParamList>();
const TrainingStack = createNativeStackNavigator<TrainingStackParamList>();
const MusicStack = createNativeStackNavigator<MusicStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: iosColors.systemGroupedBackground },
        headerTintColor: iosColors.tint,
        headerTitleStyle: { color: iosColors.label, ...TYPOGRAPHY.presets.bodyBold },
        headerShadowVisible: false,
        headerBlurEffect: isDark ? 'dark' : 'light',
        headerTransparent: false,
        contentStyle: { backgroundColor: iosColors.systemGroupedBackground },
        animation: 'slide_from_right',
        animationDuration: 250,
        headerRight: () => <ThemeToggle />,
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Features"
        component={FeaturesScreen}
        options={{ title: 'Explore', headerLargeTitle: false }}
      />
      <HomeStack.Screen
        name="FeatureDetail"
        component={FeatureDetailScreen}
        options={{ title: 'Feature', headerLargeTitle: false }}
      />
    </HomeStack.Navigator>
  );
}

function DiscoverStackNavigator() {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <DiscoverStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: iosColors.systemGroupedBackground },
        headerTintColor: iosColors.tint,
        headerTitleStyle: { color: iosColors.label, ...TYPOGRAPHY.presets.bodyBold },
        headerShadowVisible: false,
        headerBlurEffect: isDark ? 'dark' : 'light',
        headerTransparent: false,
        headerLargeTitle: true,
        headerLargeTitleStyle: { color: iosColors.label, ...TYPOGRAPHY.presets.heading1 },
        contentStyle: { backgroundColor: iosColors.systemGroupedBackground },
        animation: 'slide_from_right',
        animationDuration: 250,
        headerRight: () => <ThemeToggle />,
      }}
    >
      <DiscoverStack.Screen
        name="GymListMain"
        component={GymListScreen}
        options={{ title: 'Discover', headerLargeTitle: true }}
      />
      <DiscoverStack.Screen
        name="GymDetails"
        component={GymDetailsScreen}
        options={{ title: 'Gym Details', headerLargeTitle: false }}
      />
      <DiscoverStack.Screen
        name="Map"
        component={MapScreenAdvanced}
        options={{
          title: 'Map',
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <DiscoverStack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard', headerLargeTitle: false }}
      />
    </DiscoverStack.Navigator>
  );
}

function TrainingStackNavigator() {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <TrainingStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: iosColors.systemGroupedBackground },
        headerTintColor: iosColors.tint,
        headerTitleStyle: { color: iosColors.label, ...TYPOGRAPHY.presets.bodyBold },
        headerShadowVisible: false,
        headerBlurEffect: isDark ? 'dark' : 'light',
        headerTransparent: false,
        headerLargeTitle: true,
        headerLargeTitleStyle: { color: iosColors.label, ...TYPOGRAPHY.presets.heading1 },
        contentStyle: { backgroundColor: iosColors.systemGroupedBackground },
        animation: 'slide_from_right',
        animationDuration: 250,
        headerRight: () => <ThemeToggle />,
      }}
    >
      <TrainingStack.Screen
        name="TrainingMain"
        component={TrainingHubScreen}
        options={{ title: 'Training', headerLargeTitle: true }}
      />
      <TrainingStack.Screen
        name="WorkoutToolsMain"
        component={WorkoutToolsScreen}
        options={{ title: 'Workout Tools', headerLargeTitle: false }}
      />
      <TrainingStack.Screen
        name="WorkoutLog"
        component={WorkoutLogScreen}
        options={{ title: 'Workout Log', headerLargeTitle: false }}
      />
      <TrainingStack.Screen
        name="ProgressTracking"
        component={ProgressTrackingScreen}
        options={{ title: 'Progress', headerLargeTitle: false }}
      />
      <TrainingStack.Screen
        name="PRs"
        component={PrsScreen}
        options={{ title: 'Personal Records', headerLargeTitle: false }}
      />
      <TrainingStack.Screen
        name="Timers"
        component={TimersScreen}
        options={{ title: 'Timers', headerLargeTitle: false }}
      />
      <TrainingStack.Screen
        name="CardioTypeSelection"
        component={CardioTypeSelectionScreen}
        options={{
          title: 'Cardio',
          headerShown: false,
          presentation: 'modal',
          animation: 'fade_from_bottom',
        }}
      />
      <TrainingStack.Screen
        name="CardioSetup"
        component={CardioSetupScreen}
        options={{
          title: 'Setup',
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <TrainingStack.Screen
        name="LiveCardioTracking"
        component={LiveCardioTrackingScreen}
        options={{
          title: 'Tracking',
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <TrainingStack.Screen
        name="CardioSummary"
        component={CardioSummaryScreen}
        options={{
          title: 'Summary',
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </TrainingStack.Navigator>
  );
}

function MusicStackNavigator() {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <MusicStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: iosColors.systemGroupedBackground },
        headerTintColor: iosColors.tint,
        headerTitleStyle: { color: iosColors.label, ...TYPOGRAPHY.presets.bodyBold },
        headerShadowVisible: false,
        headerBlurEffect: isDark ? 'dark' : 'light',
        headerTransparent: false,
        contentStyle: { backgroundColor: iosColors.systemGroupedBackground },
        animation: 'slide_from_right',
        animationDuration: 250,
        headerRight: () => <ThemeToggle />,
      }}
    >
      <MusicStack.Screen
        name="MusicMain"
        component={MusicHubScreen}
        options={{ title: 'Music', headerLargeTitle: true }}
      />
      <MusicStack.Screen
        name="GymPlaylist"
        component={PlaylistScreen}
        options={{ title: 'Gym Playlist', headerLargeTitle: false }}
      />
      <MusicStack.Screen
        name="Spotify"
        component={SpotifyScreen}
        options={{ title: 'Spotify', headerLargeTitle: false }}
      />
      <MusicStack.Screen
        name="SpotifyConnect"
        component={SpotifyConnectScreen}
        options={{
          title: 'Connect Spotify',
          headerLargeTitle: false,
          presentation: 'modal',
          animation: 'fade_from_bottom',
          headerRight: () => null,
        }}
      />
      <MusicStack.Screen
        name="Setlists"
        component={SetlistsScreen}
        options={{ title: 'Setlists', headerLargeTitle: false }}
      />
      <MusicStack.Screen
        name="GymPicker"
        component={GymPickerScreen}
        options={{ title: 'Choose Gym', headerLargeTitle: false }}
      />
    </MusicStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: iosColors.systemGroupedBackground },
        headerTintColor: iosColors.tint,
        headerTitleStyle: { color: iosColors.label, ...TYPOGRAPHY.presets.bodyBold },
        headerShadowVisible: false,
        headerBlurEffect: isDark ? 'dark' : 'light',
        headerTransparent: false,
        contentStyle: { backgroundColor: iosColors.systemGroupedBackground },
        animation: 'slide_from_right',
        animationDuration: 250,
        headerRight: () => <ThemeToggle />,
      }}
    >
      <ProfileStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: 'Profile', headerShown: false }}
      />
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', headerLargeTitle: false }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications', headerLargeTitle: false }}
      />
      <ProfileStack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'Friends', headerLargeTitle: false }}
      />
      <ProfileStack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{ title: 'Friend Profile', headerLargeTitle: false }}
      />
    </ProfileStack.Navigator>
  );
}

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
    Home: { active: 'home', inactive: 'home-outline' },
    Discover: { active: 'location', inactive: 'location-outline' },
    Training: { active: 'barbell', inactive: 'barbell-outline' },
    Music: { active: 'musical-notes', inactive: 'musical-notes-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
  };

  const iconConfig = icons[label] || icons.Home;
  const iconName = focused ? iconConfig.active : iconConfig.inactive;

  return (
    <View
      style={{
        width: TOUCH_TARGET.comfortable,
        height: TOUCH_TARGET.comfortable,
        borderRadius: TOUCH_TARGET.comfortable / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.surfaceElevated : 'transparent',
        borderWidth: focused ? 1 : 0,
        borderColor: focused ? colors.border : 'transparent',
      }}
    >
      <Ionicons
        name={iconName}
        size={22}
        color={focused ? colors.primary : colors.textSecondary}
      />
    </View>
  );
};

export default function TabNavigator() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <Tab.Navigator
      detachInactiveScreens
      lazy
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: iosColors.tint,
        tabBarInactiveTintColor: iosColors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: colors.glass,
          borderTopColor: colors.glassBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 70 : 60,
          paddingBottom: Platform.OS === 'ios' ? 16 : SPACING.xs,
          paddingTop: SPACING.xs,
          borderRadius: RADIUS['2xl'],
          marginHorizontal: LAYOUT.screenPadding,
          marginBottom: Platform.OS === 'ios' ? 10 : 6,
          position: 'absolute',
          shadowColor: colors.background,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 18,
          elevation: 12,
        },
        tabBarItemStyle: {
          borderRadius: RADIUS.lg,
          marginVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: iosColors.systemGroupedBackground,
        },
        headerTintColor: iosColors.tint,
        headerTitleStyle: {
          color: iosColors.label,
          ...TYPOGRAPHY.presets.bodyBold,
        },
        headerShadowVisible: false,
        headerBlurEffect: isDark ? 'dark' : 'light',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: 'Home', tabBarLabel: 'Home', headerShown: false }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverStackNavigator}
        options={{ headerShown: false, tabBarLabel: 'Discover' }}
      />
      <Tab.Screen
        name="Training"
        component={TrainingStackNavigator}
        options={{ headerShown: false, tabBarLabel: 'Training' }}
      />
      <Tab.Screen
        name="Music"
        component={MusicStackNavigator}
        options={{ headerShown: false, tabBarLabel: 'Music' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
