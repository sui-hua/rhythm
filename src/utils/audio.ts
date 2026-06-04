import successSound from '@/assets/success.mp3'

// 播放成功/完成的音效，浏览器禁止自动播放时静默降级
export function playSuccessSound(): void {
  try {
    const audio = new Audio(successSound)
    // 音量控制在 0.4 避免突兀感
    audio.volume = 0.4
    // Chrome 等浏览器要求用户交互后才能播放，catch 防止控制台报错
    audio.play().catch(err => {
      console.warn('音效播放被阻止:', err)
    })
  } catch (error) {
    console.error('播放音效出错:', error)
  }
}
