/**
 * CardioTypeSelectionScreen
 * Screen for selecting cardio activity type
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ActivityType } from '../../../shared/src/types/cardio';
import { CardioActivityCard } from '../../components/cardio';
import { Icon, IconName } from '../../components/Icon';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

type CardioStackParamList = {
  CardioTypeSelection: undefined;
  CardioSetup: { activityType: ActivityType };
};

type NavigationProp = NativeStackNavigationProp<CardioStackParamList, 'CardioTypeSelection'>;

// Activity definitions
const ACTIVITIES: Array<{
  type: ActivityType;
  icon: IconName;
  label: string;
  description: string;
}> = [
  { type: 'running', icon: 'person-run', label: 'Running', description: 'Outdoor or Treadmill' },
  { type: 'cycling', icon: 'bicycle', label: 'Cycling', description: 'Road or Stationary' },
  { type: 'walking', icon: 'person-walk', label: 'Walking', description: 'Low Impact' },
  { type: 'rowing', icon: 'rowing', label: 'Rowing', description: 'Full Body Cardio' },
  { type: 'elliptical', icon: 'lightning', label: 'Elliptical', description: 'Joint Friendly' },
  { type: 'stairs', icon: 'stairs', label: 'Stairs', description: 'High Intensity' },
];

export default function CardioTypeSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);

  const handleActivitySelect = (activityType: ActivityType) => {
    setSelectedType(activityType);
  };

  const handleContinue = () => {
    if (selectedType) {
      navigation.navigate('CardioSetup', { activityType: selectedType });
    }
  };

  return (
    <LinearGradient
      colors={['#060A07', '#0B120D', '#08100B']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#22C55E', '#10B981', '#A3E635']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Icon name="person-run" size="xl" color="#060A07" />
              </LinearGradient>

              <Text style={styles.title}>CHOOSE ACTIVITY</Text>
              <Text style={styles.subtitle}>
                Select your cardio workout type
              </Text>

              {/* Accent bar */}
              <LinearGradient
                colors={['#22C55E', '#A3E635']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accentBar}
              />
            </View>

            {/* Activity Grid */}
            <View style={styles.activitiesSection}>
              <View style={styles.activityGrid}>
                {ACTIVITIES.map((activity) => (
                  <View key={activity.type} style={styles.activityCardContainer}>
                    <CardioActivityCard
                      activityType={activity.type}
                      icon={activity.icon}
                      label={activity.label}
                      description={activity.description}
                      selected={selectedType === activity.type}
                      onPress={() => handleActivitySelect(activity.type)}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Continue Button */}
            {selectedType && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Continue"
                >
                  <LinearGradient
                    colors={['#22C55E', '#15803D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>CONTINUE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Accent */}
            <View style={styles.bottomSection}>
              <Text style={styles.bottomText}>TRACK YOUR PROGRESS</Text>
              <LinearGradient
                colors={['#A3E635', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomBar}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 40,
    minHeight: 700,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: '#22C55E',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.light.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  accentBar: {
    width: 80,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  activitiesSection: {
    flex: 1,
    marginBottom: SPACING['2xl'],
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.base,
  },
  activityCardContainer: {
    width: '48%',
    marginBottom: SPACING.base,
  },
  buttonContainer: {
    marginBottom: SPACING['2xl'],
  },
  button: {
    borderRadius: RADIUS.lg,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  bottomText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.light.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  bottomBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
  },
});
