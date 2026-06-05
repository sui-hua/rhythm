import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDailySummaryForm } from '../useDailySummaryForm'

describe('useDailySummaryForm', () => {
  // 初始数据为 null 时表单重置为空
  it('initialData 为 null 时表单字段全为空字符串', () => {
    const initialData = ref(null)
    const { formData } = useDailySummaryForm(initialData)
    expect(formData.value).toEqual({ done: '', improve: '', tomorrow: '' })
  })

  // 有初始数据时自动预填表单
  it('initialData 有内容时自动预填表单', () => {
    const initialData = ref({
      content: {
        done: '完成了任务A',
        improve: '时间管理',
        tomorrow: '继续任务B'
      }
    })
    const { formData } = useDailySummaryForm(initialData)
    expect(formData.value.done).toBe('完成了任务A')
    expect(formData.value.improve).toBe('时间管理')
    expect(formData.value.tomorrow).toBe('继续任务B')
  })

  // content 字段缺失时回退为空字符串
  it('initialData content 字段部分缺失时回退为空', () => {
    const initialData = ref({
      content: {
        done: '完成了',
        // improve 和 tomorrow 缺失
      }
    })
    const { formData } = useDailySummaryForm(initialData)
    expect(formData.value.done).toBe('完成了')
    expect(formData.value.improve).toBe('')
    expect(formData.value.tomorrow).toBe('')
  })

  // content 为非对象格式时回退为空
  it('initialData content 为数组时回退为空对象', () => {
    const initialData = ref({
      content: ['invalid'] as any
    })
    const { formData } = useDailySummaryForm(initialData)
    expect(formData.value).toEqual({ done: '', improve: '', tomorrow: '' })
  })

  // 初始数据从有值变为 null 时重置表单
  it('initialData 从有值变为 null 时重置表单', async () => {
    const initialData = ref<any>({
      content: { done: '做了', improve: '改进', tomorrow: '计划' }
    })
    const { formData } = useDailySummaryForm(initialData)
    expect(formData.value.done).toBe('做了')

    // 切换为 null，等待 watch 回调触发
    initialData.value = null
    await nextTick()
    expect(formData.value).toEqual({ done: '', improve: '', tomorrow: '' })
  })

  // 初始数据变化时自动更新表单
  it('initialData 变化时自动更新表单', async () => {
    const initialData = ref<any>({
      content: { done: 'v1', improve: '', tomorrow: '' }
    })
    const { formData } = useDailySummaryForm(initialData)
    expect(formData.value.done).toBe('v1')

    initialData.value = {
      content: { done: 'v2', improve: '新改进', tomorrow: '' }
    }
    await nextTick()
    expect(formData.value.done).toBe('v2')
    expect(formData.value.improve).toBe('新改进')
  })

  // buildPayload 返回当前表单数据的副本
  it('buildPayload 返回当前表单数据副本', () => {
    const initialData = ref({
      content: { done: '完成', improve: '改进', tomorrow: '计划' }
    })
    const { buildPayload } = useDailySummaryForm(initialData)
    const payload = buildPayload()
    expect(payload).toEqual({ done: '完成', improve: '改进', tomorrow: '计划' })
    // 副本与原数据不是同一引用
    expect(payload).not.toBe(initialData.value.content)
  })

  // buildPayload 反映表单修改后的值
  it('buildPayload 反映手动修改后的表单值', () => {
    const initialData = ref<any>(null)
    const { formData, buildPayload } = useDailySummaryForm(initialData)
    formData.value.done = '手动输入'
    formData.value.improve = '手动改进'
    const payload = buildPayload()
    expect(payload.done).toBe('手动输入')
    expect(payload.improve).toBe('手动改进')
  })
})
