module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated worklet transform — not needed in Jest (reanimated is mocked)
      ...(!isTest ? ['react-native-reanimated/plugin'] : []),
    ],
  };
};
