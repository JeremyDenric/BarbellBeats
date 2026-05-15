// Expo app configuration with env passthrough
export default ({ config }) => {
  return {
    ...config,
    name: "BarbellBeats",
    slug: "barbellbeats",
    scheme: "barbellbeats",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      backgroundColor: "#0A0A0F",
      resizeMode: "contain",
    },
    extra: {
      ...config.extra,
      API_URL: process.env.API_URL || "http://localhost:3000/api",
      WS_URL: process.env.WS_URL || "ws://localhost:3000/ws",
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    },
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.jeremydenric.barbellbeats",
      supportsTablet: true,
      newArchEnabled: true,
      usesAppleSignIn: true,
      infoPlist: {
        NSFaceIDUsageDescription: "Use Face ID to sign in quickly and securely to BarbellBeats.",
        NSLocationWhenInUseUsageDescription:
          "BarbellBeats uses your location to show nearby gyms on the map.",
        NSPhotoLibraryUsageDescription:
          "Allow BarbellBeats to attach photos to your cardio log entries.",
        NSHealthShareUsageDescription:
          "BarbellBeats reads your workouts from Apple Health to track PRs and activity history.",
        NSHealthUpdateUsageDescription:
          "BarbellBeats saves your completed workouts to Apple Health so they appear in your Activity rings.",
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0A0F",
      },
      package: "com.jeremydenric.barbellbeats",
      newArchEnabled: true,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_MEDIA_IMAGES",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
      ],
    },
    web: {
      bundler: "metro",
    },
    plugins: [
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow BarbellBeats to use your location to show nearby gyms on the map.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow BarbellBeats to attach photos to your cardio log entries.",
        },
      ],
      "expo-local-authentication",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#FF4D00",
        },
      ],
      "expo-apple-authentication",
      "react-native-purchases",
      "@kingstinct/react-native-healthkit",
    ],
  };
};
