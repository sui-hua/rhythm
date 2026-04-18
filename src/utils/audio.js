/**
 * ============================================
 * 音效工具 (utils/audio.js)
 * ============================================
 *
 * 【模块职责】
 * - 提供音效播放功能
 * - 用于任务/习惯完成时播放成功音效
 *
 * 【使用场景】
 * - 任务标记完成时
 * - 习惯打卡成功时
 */
import successSound from '@/assets/success.mp3';

/**
 * 播放成功/完成的音效
 */
export function playSuccessSound() {
  try {
    const audio = new Audio(successSound);
    audio.volume = 0.4; // 设置适中的音量
    audio.play().catch(err => {
      // 捕获浏览器自动播放限制导致的错误
      console.warn('音效播放被阻止:', err);
    });
  } catch (error) {
    console.error('播放音效出错:', error);
  }
}
