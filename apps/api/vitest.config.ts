import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [
    tsconfigPaths(),
    // esbuild 不产出 design:paramtypes 元数据，NestJS 构造函数注入会拿到 undefined，
    // 因此改用 swc 转译以保留 legacyDecorator + decoratorMetadata。
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2023',
      },
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
