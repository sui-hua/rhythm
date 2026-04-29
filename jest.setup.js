Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
  value: {},
  configurable: true,
  writable: true
})

Object.defineProperty(globalThis, 'structuredClone', {
  value:
    globalThis.structuredClone ??
    ((value) => {
      return JSON.parse(JSON.stringify(value))
    }),
  configurable: true,
  writable: true
})

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native')
  const animationBuilder = {
    delay: () => animationBuilder,
    duration: () => animationBuilder
  }

  return {
    __esModule: true,
    default: { View },
    FadeIn: animationBuilder,
    FadeOut: animationBuilder
  }
})
