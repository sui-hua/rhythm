/**
 * Jest 配置（从 package.json 迁出为 JS 文件）
 * 原因：lucide-react-native 的 ESM 入口是 .mjs，jest-expo 预设的 transform 不覆盖该扩展名，
 * 而 package.json 无法以 JS 方式合并预设 transform，故迁出后手动合并并补充 .mjs 转译。
 */
const expoPreset = require('jest-expo/jest-preset')

// 与预设一致的 babel 调用方声明，保证 RN 语法按 metro 目标转译
const babelOpts = { caller: { name: 'metro', bundler: 'metro', platform: 'ios' } }

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    ...expoPreset.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    ...expoPreset.transform,
    '\\.mjs$': ['babel-jest', babelOpts]
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*((jest-)?react-native|@react-native|expo|@expo|expo-modules-core|react-navigation|@react-navigation|nativewind|react-native-css-interop|react-native-reanimated|react-native-worklets|@rn-primitives|lucide-react-native))'
  ]
}
