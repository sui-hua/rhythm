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
