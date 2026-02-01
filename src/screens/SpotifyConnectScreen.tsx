/**
 * Spotify Connect Screen
 * Dedicated flow for connecting Spotify account (separate from login)
 * Shows connection status, user info, and disconnect option
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSpotify } from '../contexts/SpotifyContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { SPOTIFY_THEME, SPACING, TOUCH_TARGET } from '../theme/tokens';
import SpotifyTemplate from '../components/SpotifyTemplate';
import SpotifyButton from '../components/SpotifyButton';

export default function SpotifyConnectScreen() {
  const navigation = useNavigation();
  const {
    isConnected,
    user,
    connectSpotify,
    disconnectSpotify,
    isLoading,
    error,
  } = useSpotify();
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;

  const colors = SPOTIFY_THEME;

  const handleConnect = async () => {
    try {
      await connectSpotify();
    } catch (err) {
      Alert.alert('Connection Failed', 'Could not connect to Spotify. Please try again.');
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Spotify',
      'Are you sure you want to disconnect your Spotify account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: disconnectSpotify,
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SpotifyTemplate>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, compact && styles.loadingTextCompact, { color: colors.textSecondary }]}>
            Connecting to Spotify...
          </Text>
        </View>
      </SpotifyTemplate>
    );
  }

  return (
    <SpotifyTemplate>
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Header */}
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View
            style={[
              styles.spotifyLogo,
              compact && styles.spotifyLogoCompact,
              { backgroundColor: colors.surface, shadowColor: colors.accent },
            ]}
          >
            <Text style={[styles.spotifyIcon, compact && styles.spotifyIconCompact]}>🎵</Text>
          </View>
          <Text style={[styles.title, compact && styles.titleCompact, { color: colors.textPrimary }]}>
            {isConnected ? 'Spotify Connected' : 'Connect Spotify'}
          </Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact, { color: colors.textSecondary }]}>
            {isConnected
              ? 'Get personalized recommendations and play music'
              : 'Connect your Spotify account to unlock premium features'}
          </Text>
        </View>

        {/* Connected State */}
        {isConnected && user && (
          <View
            style={[
              styles.userCard,
              compact && styles.userCardCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {user.images?.[0] && (
              <Image
                source={{ uri: user.images[0].url }}
                style={[styles.userAvatar, compact && styles.userAvatarCompact]}
              />
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, compact && styles.userNameCompact, { color: colors.textPrimary }]}>
                {user.display_name}
              </Text>
              <Text style={[styles.userEmail, compact && styles.userEmailCompact, { color: colors.textSecondary }]}>
                {user.email}
              </Text>
            </View>
            <View style={[styles.connectedBadge, compact && styles.connectedBadgeCompact, { backgroundColor: colors.accent }]}>
              <Text style={[styles.connectedText, compact && styles.connectedTextCompact]}>✓</Text>
            </View>
          </View>
        )}

        {/* Features List */}
        <View style={[styles.featuresList, compact && styles.featuresListCompact]}>
          <Text style={[styles.featuresTitle, compact && styles.featuresTitleCompact, { color: colors.textPrimary }]}>
            Features
          </Text>

          <View
            style={[
              styles.featureItem,
              compact && styles.featureItemCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.featureIcon, compact && styles.featureIconCompact, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.featureEmoji, compact && styles.featureEmojiCompact]}>🎯</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, compact && styles.featureTitleCompact, { color: colors.textPrimary }]}>
                Smart Recommendations
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  compact && styles.featureDescriptionCompact,
                  { color: colors.textSecondary },
                ]}
              >
                Get workout tracks based on your listening history
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.featureItem,
              compact && styles.featureItemCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.featureIcon, compact && styles.featureIconCompact, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.featureEmoji, compact && styles.featureEmojiCompact]}>📊</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, compact && styles.featureTitleCompact, { color: colors.textPrimary }]}>
                Top Tracks
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  compact && styles.featureDescriptionCompact,
                  { color: colors.textSecondary },
                ]}
              >
                Quick access to your most-listened songs
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.featureItem,
              compact && styles.featureItemCompact,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.featureIcon, compact && styles.featureIconCompact, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.featureEmoji, compact && styles.featureEmojiCompact]}>🎧</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, compact && styles.featureTitleCompact, { color: colors.textPrimary }]}>
                In-App Playback
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  compact && styles.featureDescriptionCompact,
                  { color: colors.textSecondary },
                ]}
              >
                Control Spotify directly from the app
              </Text>
            </View>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View
            style={[
              styles.errorContainer,
              compact && styles.errorContainerCompact,
              { backgroundColor: colors.error + '20', borderColor: colors.error },
            ]}
          >
            <Text style={[styles.errorText, compact && styles.errorTextCompact, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actions}>
          {isConnected ? (
            <>
              <SpotifyButton
                title="Go to Spotify Section"
                onPress={() => navigation.navigate('Spotify' as never)}
                variant="primary"
                fullWidth
                style={[styles.actionButton, compact && styles.actionButtonCompact]}
              />
              <TouchableOpacity
                style={[
                  styles.disconnectButton,
                  compact && styles.disconnectButtonCompact,
                  { borderColor: colors.error },
                ]}
                onPress={handleDisconnect}
                activeOpacity={0.7}
              >
                <Text style={[styles.disconnectText, compact && styles.disconnectTextCompact, { color: colors.error }]}>
                  Disconnect Spotify
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <SpotifyButton
              title="Connect with Spotify"
              onPress={handleConnect}
              variant="primary"
              fullWidth
              loading={isLoading}
              style={[styles.actionButton, compact && styles.actionButtonCompact]}
            />
          )}
        </View>

        {/* Privacy Note */}
        <Text style={[styles.privacyNote, compact && styles.privacyNoteCompact, { color: colors.textTertiary }]}>
          We only access your music data. We never post on your behalf.
        </Text>
      </View>
    </SpotifyTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['3xl'],
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingTextCompact: {
    marginTop: SPACING.md,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  contentCompact: {
    padding: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  headerCompact: {
    marginBottom: SPACING.lg,
  },
  spotifyLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  spotifyLogoCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: SPACING.md,
  },
  spotifyIcon: {
    fontSize: 40,
  },
  spotifyIconCompact: {
    fontSize: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 22,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.xl,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: SPACING.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: SPACING['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardCompact: {
    padding: SPACING.sm,
    borderRadius: 14,
    marginBottom: SPACING.lg,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: SPACING.md,
  },
  userAvatarCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: SPACING.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  userNameCompact: {
    fontSize: 16,
  },
  userEmail: {
    fontSize: 14,
  },
  userEmailCompact: {
    fontSize: 12,
  },
  connectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedBadgeCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  connectedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  connectedTextCompact: {
    fontSize: 14,
  },
  featuresList: {
    marginBottom: SPACING['2xl'],
  },
  featuresListCompact: {
    marginBottom: SPACING.lg,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuresTitleCompact: {
    fontSize: 14,
    marginBottom: SPACING.sm,
    letterSpacing: 0.6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  featureItemCompact: {
    padding: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureIconCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureEmojiCompact: {
    fontSize: 18,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureTitleCompact: {
    fontSize: 14,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureDescriptionCompact: {
    fontSize: 12,
    lineHeight: 18,
  },
  errorContainer: {
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  errorContainerCompact: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorTextCompact: {
    fontSize: 12,
  },
  actions: {
    marginTop: 'auto',
  },
  actionButton: {
    marginBottom: SPACING.md,
    minHeight: TOUCH_TARGET.comfortable,
  },
  actionButtonCompact: {
    marginBottom: SPACING.sm,
    minHeight: TOUCH_TARGET.min,
  },
  disconnectButton: {
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    minHeight: TOUCH_TARGET.min,
    justifyContent: 'center',
  },
  disconnectButtonCompact: {
    padding: SPACING.sm,
    borderRadius: 12,
  },
  disconnectText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectTextCompact: {
    fontSize: 13,
  },
  privacyNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
  privacyNoteCompact: {
    fontSize: 11,
    marginTop: SPACING.md,
    lineHeight: 16,
  },
});
