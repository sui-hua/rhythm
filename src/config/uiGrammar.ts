/**
 * UI 设计语法配置
 *
 * 定义页面基础布局和样式规范的设计令牌，统一管理页面容器、面板、标题等的样式参数。
 * 各组件通过引用此配置实现样式一致性。
 */

// ── 类型定义 ──
// 页面布局配置：最大宽度和内边距
interface PageConfig {
  maxWidth: string
  padding: string
}

// 面板样式配置：圆角和边框
interface PanelConfig {
  radius: string
  border: string
}

// 区块标题样式配置：眉题字母间距
interface SectionConfig {
  eyebrowTracking: string
}

// UI 语法配置接口
interface UiGrammar {
  page: PageConfig
  panel: PanelConfig
  section: SectionConfig
}

// ── 配置导出 ──
// 设计令牌中心，所有页面和组件共享的样式规范
export const uiGrammar: UiGrammar = {
  page: {
    maxWidth: '1440px',
    padding: '24px'
  },
  panel: {
    radius: '1.5rem',
    border: '1px solid var(--border)'
  },
  section: {
    eyebrowTracking: '0.2em'
  }
}
