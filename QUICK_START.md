# 🚀 Quick Start Guide - Google Maps Integration

## Setup in 5 Minutes

### Step 1: Get Google Maps API Key (2 min)
1. Go to https://console.cloud.google.com/google/maps-apis
2. Create project or select existing
3. Enable: **Maps SDK for Android** + **Maps SDK for iOS**
4. Create credentials → **API Key**
5. Copy the key

### Step 2: Configure Your App (1 min)
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your key
nano .env
```

Add this line:
```
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Step 3: Rebuild (2 min)
```bash
# Clean and rebuild
npx expo prebuild --clean

# Run on device
npx expo run:ios
# or
npx expo run:android
```

### Step 4: Test It! (30 sec)
1. Open app
2. Tap **"MAP VIEW"** button on home screen
3. Allow location permissions
4. Tap any gym marker
5. Tap **"View Playlist"**

**Done! 🎉**

---

## Troubleshooting

### Map shows blank screen
```bash
# Check API key is set
cat .env | grep GOOGLE_MAPS_API_KEY

# Rebuild app
npx expo prebuild --clean
```

### "Location permission denied"
- Go to Settings → BarbellBeats → Location → "While Using App"

### Markers not showing
- Check console for errors: `console.log("Markers:", gymMarkers)`
- Verify coordinates are valid (lat: -90 to 90, lng: -180 to 180)

---

## Commands Cheat Sheet

```bash
# Start dev server
npm start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Run tests
npm test

# Format code
npm run format

# Check types
npx tsc --noEmit
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/screens/MapScreenAdvanced.tsx` | Main map screen |
| `src/navigation/RootNavigator.tsx` | Navigation setup |
| `src/screens/HomeScreen.tsx` | "MAP VIEW" button |
| `app.config.js` | Google Maps config |
| `.env` | API keys |

---

## Features at a Glance

- 🗺️ **Google Maps** with custom dark theme
- 📍 **Real-time location** tracking
- 🏋️ **Custom markers** with pulse animations
- 🔍 **Search** with animated bar
- 📳 **Haptic feedback** on all interactions
- ⚡ **60fps** smooth animations
- 📱 **Bottom sheet** with gym details
- 🎵 **Now Playing** indicator

---

## Next Steps

1. ✅ Test on physical device
2. ✅ Try search functionality
3. ✅ Test marker selection
4. ✅ Navigate to playlist
5. 📝 Read [MAP_INTEGRATION_GUIDE.md](MAP_INTEGRATION_GUIDE.md) for details
6. 📝 Review [MAP_FEATURES.md](MAP_FEATURES.md) for all features

---

## Support

- Full guide: [MAP_INTEGRATION_GUIDE.md](MAP_INTEGRATION_GUIDE.md)
- Features: [MAP_FEATURES.md](MAP_FEATURES.md)
- All changes: [IMPROVEMENTS_SUMMARY.md](IMPROVEMENTS_SUMMARY.md)

---

**Happy mapping! 🗺️✨**
