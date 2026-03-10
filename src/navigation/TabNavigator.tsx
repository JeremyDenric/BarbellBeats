import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StyleSheet, View } from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { TabIcons } from '../components/Icon';
import { COLORS, IOS_COLORS, SIGNAL, SPACING, TYPOGRAPHY, RADIUS, LAYOUT, TOUCH_TARGET } from '../theme/tokens';
import { lightTap } from '../utils/haptics';
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
  CardioLogScreen,
  AddCardioEntryScreen,
  CardioDetailScreen,
} from '../screens/Cardio';
import FavoriteGymsScreen from '../screens/FavoriteGymsScreen';
import WorkoutTemplatesScreen from '../screens/Workout/WorkoutTemplatesScreen';
import CreateWorkoutScreen from '../screens/Workout/CreateWorkoutScreen';
import ExerciseBrowserScreen from '../screens/Workout/ExerciseBrowserScreen';
import ActiveWorkoutScreen from '../screens/Workout/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '../screens/Workout/WorkoutSummaryScreen';
import ForgeScreen from '../screens/Forge/ForgeScreen';
import ForgeProgramDetailScreen from '../screens/Forge/ForgeProgramDetailScreen';
import ForgePaywallScreen from '../screens/Forge/ForgePaywallScreen';
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
      id="HomeStack"
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
      id="DiscoverStack"
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
      <DiscoverStack.Screen
        name="FavoriteGyms"
        component={FavoriteGymsScreen}
        options={{ title: 'Favorite Gyms', headerLargeTitle: false }}
      />
    </DiscoverStack.Navigator>
  );
}

function TrainingStackNavigator() {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <TrainingStack.Navigator
      id="TrainingStack"
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
        name="CardioLog"
        component={CardioLogScreen}
        options={{ title: 'Cardio Log', headerLargeTitle: false }}
      />
      <TrainingStack.Screen
        name="AddCardioEntry"
        component={AddCardioEntryScreen}
        options={{
          title: 'Log Cardio',
          headerShown: false,
          presentation: 'modal',
          animation: 'fade_from_bottom',
        }}
      />
      <TrainingStack.Screen
        name="CardioDetail"
        component={CardioDetailScreen}
        options={{
          title: 'Entry',
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <TrainingStack.Screen
        name="WorkoutTemplates"
        component={WorkoutTemplatesScreen}
        options={{ title: 'My Workouts', headerLargeTitle: false }}
      />
      <TrainingStack.Screen
        name="CreateWorkout"
        component={CreateWorkoutScreen}
        options={{ title: 'Create Workout', headerLargeTitle: false }}
      />
      <TrainingStack.Screen
        name="ExerciseBrowser"
        component={ExerciseBrowserScreen}
        options={{
          title: 'Exercises',
          headerLargeTitle: false,
          presentation: 'modal',
          animation: 'fade_from_bottom',
        }}
      />
      <TrainingStack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <TrainingStack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <TrainingStack.Screen
        name="ForgeMain"
        component={ForgeScreen}
        options={{ headerShown: false }}
      />
      <TrainingStack.Screen
        name="ForgeProgramDetail"
        component={ForgeProgramDetailScreen}
        options={{ title: 'Program Details', animation: 'slide_from_right' }}
      />
      <TrainingStack.Screen
        name="ForgePaywall"
        component={ForgePaywallScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
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
      id="MusicStack"
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
      id="ProfileStack"
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

  // Music tab uses resonance cyan; all others use forge orange
  const isMusicTab = label === 'Music';
  const activeColor = isMusicTab ? SIGNAL.resonance : colors.primary;
  const iconColor = focused ? activeColor : colors.textTertiary;
  const iconSize = 22;

  const IconComponent = TabIcons[label as keyof typeof TabIcons] || TabIcons.Home;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      {/* Signal line — 2px forge/cyan bar above active tab icon */}
      <View
        style={{
          position: 'absolute',
          top: -8,
          width: 20,
          height: 2,
          borderRadius: 1,
          backgroundColor: focused ? activeColor : 'transparent',
          opacity: focused ? 1 : 0,
        }}
      />
      <IconComponent focused={focused} color={iconColor} size={iconSize} />
    </View>
  );
};

export default function TabNavigator() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <Tab.Navigator
      id="MainTabs"
      detachInactiveScreens
      screenListeners={{
        tabPress: () => lightTap(),
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: iosColors.tint,
        tabBarInactiveTintColor: iosColors.secondaryLabel,
        tabBarStyle: {
          // Flat, edge-to-edge bar — no floating pill.
          // The signal line in the icon handles active state visually.
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 72 : 62,
          paddingBottom: Platform.OS === 'ios' ? 20 : SPACING.sm,
          paddingTop: SPACING.sm,
        },
        tabBarItemStyle: {
          paddingTop: SPACING.xs,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600' as const,
          letterSpacing: 0.8,
          textTransform: 'uppercase' as const,
          marginTop: 2,
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
