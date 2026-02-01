// Expo app configuration with env passthrough
export default ({ config }) => {
  return {
    ...config,
    name: "BarbellBeats",
    slug: "barbellbeats",
    scheme: "barbellbeats",
    version: "1.0.0",
    extra: {
      API_URL: process.env.API_URL || "http://localhost:3000/api",
      WS_URL: process.env.WS_URL || "ws://localhost:3000/ws",
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      eas: {
        projectId: "d4b89579-912e-49bd-8f84-24512a8ca64d"
      },
    },
    newArchEnabled: false,
    ios: {
      bundleIdentifier: "com.jeremydenric.barbellbeats",
      supportsTablet: true,
      newArchEnabled: false,
      usesAppleSignIn: true,
      infoPlist: {
        NSFaceIDUsageDescription: "Use Face ID to sign in quickly and securely to BarbellBeats.",
        NSCameraUsageDescription: "Required for Face ID authentication.",
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST || "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.jeremydenric.barbellbeats",
      newArchEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    },
    web: {
      bundler: "metro",
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow BarbellBeats to use your location to find nearby gyms.",
          locationAlwaysPermission: "Allow BarbellBeats to use your location to find nearby gyms.",
          locationWhenInUsePermission: "Allow BarbellBeats to use your location to find nearby gyms.",
        }
      ],
      "expo-local-authentication",
      "expo-notifications",
      "expo-apple-authentication",
    ],
  };
};
