describe('tailwind config', () => {
  it('uses class-based dark mode for NativeWind web color scheme switching', () => {
    // Requiring the config keeps this test close to the actual runtime behavior.
    const tailwindConfig = require('../../tailwind.config.js')

    expect(tailwindConfig.darkMode).toBe('class')
  })
})
