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
      backgroundColor: "#060A07",
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
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "BarbellBeats uses your location to find nearby gyms and track outdoor cardio workouts like runs and bike rides.",
        NSLocationWhenInUseUsageDescription:
          "BarbellBeats uses your location to find nearby gyms and track outdoor cardio workouts.",
        UIBackgroundModes: ["location"],
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#060A07",
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
        "ACCESS_BACKGROUND_LOCATION",
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
          isIosBackgroundLocationEnabled: true,
          locationAlwaysAndWhenInUsePermission:
            "Allow BarbellBeats to use your location to find nearby gyms and track outdoor workouts.",
          locationAlwaysPermission:
            "Allow BarbellBeats to use your background location for continuous cardio tracking during runs and rides.",
          locationWhenInUsePermission:
            "Allow BarbellBeats to use your location to find nearby gyms and track outdoor workouts.",
        },
      ],
      "expo-local-authentication",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#22C55E",
        },
      ],
      "expo-apple-authentication",
    ],
  };
};
