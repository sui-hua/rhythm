/** 页面布局配置接口 */
interface PageConfig {
  maxWidth: string
  padding: string
}

/** 面板样式配置接口 */
interface PanelConfig {
  radius: string
  border: string
}

/** 段落样式配置接口 */
interface SectionConfig {
  eyebrowTracking: string
}

/** UI 语法配置接口 */
interface UiGrammar {
  page: PageConfig
  panel: PanelConfig
  section: SectionConfig
}

/** UI 语法配置，定义页面基础布局和样式规范 */
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
