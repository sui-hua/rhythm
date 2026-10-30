const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const projectRoot = __dirname
// monorepo 根目录，依赖被提升到这里
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 只监听应用自身目录。
// 不能把 workspaceRoot 塞进 watchFolders：根 node_modules 有一千多个包，
// 而本机没有 watchman，Metro 只能用 Node 自身递归 crawl 数十万个文件，
// 首次编译会卡十几分钟甚至不返回。依赖解析靠下面的 nodeModulesPaths，
// 那只是解析路径，不参与 crawl，因此仍能正确找到提升后的依赖。
config.watchFolders = [projectRoot]

// 先查包内 node_modules，再回退到根目录
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css' })
