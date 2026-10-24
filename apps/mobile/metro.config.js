const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const projectRoot = __dirname
// monorepo 根目录，包含 pnpm 提升后的公共依赖
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 监听 workspace 根目录，公共依赖变更才能触发 Metro 刷新
config.watchFolders = [workspaceRoot]

// 同时在包内与根 node_modules 解析模块
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css' })
