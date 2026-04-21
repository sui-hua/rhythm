module.exports = function (api) {
  api.cache(true)

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: false
        }
      ]
    ],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src'
          }
        }
      ]
    ]
  }
}
