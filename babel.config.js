module.exports = function (api) {
  api.cache(true)

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: false,
          jsxImportSource: 'nativewind'
        }
      ],
      'nativewind/babel'
    ],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src'
          }
        }
      ],
      'react-native-reanimated/plugin'
    ]
  }
}
