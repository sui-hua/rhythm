import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useGenericSummaryForm } from '../useGenericSummaryForm'

describe('useGenericSummaryForm', () => {
  // typeName：week 映射为"周"
  it('typeName week 类型映射为"周"', () => {
    const initialData = ref(null)
    const typeRef = ref('week')
    const { typeName } = useGenericSummaryForm(initialData, typeRef)
    expect(typeName.value).toBe('周')
  })

  // typeName：month 映射为"月"
  it('typeName month 类型映射为"月"', () => {
    const initialData = ref(null)
    const typeRef = ref('month')
    const { typeName } = useGenericSummaryForm(initialData, typeRef)
    expect(typeName.value).toBe('月')
  })

  // typeName：year 映射为"年"
  it('typeName year 类型映射为"年"', () => {
    const initialData = ref(null)
    const typeRef = ref('year')
    const { typeName } = useGenericSummaryForm(initialData, typeRef)
    expect(typeName.value).toBe('年')
  })

  // typeName：未知类型也映射为"年"
  it('typeName 未知类型映射为"年"', () => {
    const initialData = ref(null)
    const typeRef = ref('unknown')
    const { typeName } = useGenericSummaryForm(initialData, typeRef)
    expect(typeName.value).toBe('年')
  })

  // placeholderText：根据 typeName 动态生成
  it('placeholderText 根据类型动态生成占位文本', () => {
    const initialData = ref(null)
    const typeRef = ref('week')
    const { placeholderText } = useGenericSummaryForm(initialData, typeRef)
    expect(placeholderText.value).toBe('在这里写下您的周总结...')
  })

  // placeholderText：类型变化时自动更新
  it('placeholderText 类型变化时自动更新', () => {
    const initialData = ref(null)
    const typeRef = ref('month')
    const { placeholderText } = useGenericSummaryForm(initialData, typeRef)
    expect(placeholderText.value).toContain('月')
    typeRef.value = 'year'
    expect(placeholderText.value).toContain('年')
  })

  // 初始数据为 null 时表单重置
  it('initialData 为 null 时表单字段全为空字符串', () => {
    const initialData = ref(null)
    const typeRef = ref('week')
    const { title, content } = useGenericSummaryForm(initialData, typeRef)
    expect(title.value).toBe('')
    expect(content.value).toBe('')
  })

  // 有初始数据时自动预填
  it('initialData 有内容时自动预填 title 和 content', () => {
    const initialData = ref({
      title: '第一周总结',
      content: { text: '本周完成了项目A' }
    })
    const typeRef = ref('week')
    const { title, content } = useGenericSummaryForm(initialData, typeRef)
    expect(title.value).toBe('第一周总结')
    expect(content.value).toBe('本周完成了项目A')
  })

  // content 为字符串格式时直接使用
  it('initialData content 为字符串时直接使用', () => {
    const initialData = ref({
      title: '总结',
      content: '纯文本内容'
    })
    const typeRef = ref('month')
    const { content } = useGenericSummaryForm(initialData, typeRef)
    expect(content.value).toBe('纯文本内容')
  })

  // content 为对象但无 text 字段时回退到空字符串
  it('initialData content 对象无 text 字段时回退', () => {
    const initialData = ref({
      title: '标题',
      content: { other: 'data' }
    })
    const typeRef = ref('week')
    const { content } = useGenericSummaryForm(initialData, typeRef)
    expect(content.value).toBe('')
  })

  // 初始数据从有值变为 null 时重置
  it('initialData 从有值变为 null 时重置表单', async () => {
    const initialData = ref<any>({
      title: '标题',
      content: { text: '内容' }
    })
    const typeRef = ref('week')
    const { title, content } = useGenericSummaryForm(initialData, typeRef)
    expect(title.value).toBe('标题')

    initialData.value = null
    await nextTick()
    expect(title.value).toBe('')
    expect(content.value).toBe('')
  })

  // buildPayload 返回 title 和 text
  it('buildPayload 返回 trim 后的 title 和原始 content', () => {
    const initialData = ref({
      title: '  带空格的标题  ',
      content: { text: '内容文本' }
    })
    const typeRef = ref('week')
    const { buildPayload } = useGenericSummaryForm(initialData, typeRef)
    const payload = buildPayload()
    expect(payload.title).toBe('带空格的标题')
    expect(payload.text).toBe('内容文本')
  })

  // buildPayload 反映手动修改后的值
  it('buildPayload 反映手动修改后的表单值', () => {
    const initialData = ref<any>(null)
    const typeRef = ref('week')
    const { title, content, buildPayload } = useGenericSummaryForm(initialData, typeRef)
    title.value = '手动标题'
    content.value = '手动内容'
    const payload = buildPayload()
    expect(payload.title).toBe('手动标题')
    expect(payload.text).toBe('手动内容')
  })
})
