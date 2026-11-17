import React, { useState, useEffect, useRef } from 'react'
import { ArrowRight, Loader2, ChevronDown } from 'lucide-react'

interface LoginViewProps {
  onLogin: () => void
  showToast?: (msg: string) => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, showToast }) => {
  const [loading, setLoading] = useState(false)
  const [showSmsForm, setShowSmsForm] = useState(false)

  // 短信验证码表单状态
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // 1. 本机号码一键免密快捷登录
  const handleOneClickLogin = () => {
    if (loading) return
    setLoading(true)

    // 模拟 400ms 运营商网关认证微延时
    setTimeout(() => {
      setLoading(false)
      showToast?.('欢迎回到 Rhythm')
      onLogin()
    }, 450)
  }

  // 2. 发送短信验证码
  const handleSendCode = () => {
    if (countdown > 0) return
    if (!phone.trim() || phone.trim().length < 11) {
      showToast?.('请输入有效的 11 位手机号码')
      return
    }

    setCountdown(60)
    showToast?.('验证码已发送 (演示码: 888888)')
    setCode('888888')

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 3. 短信验证码手动登录
  const handleSmsLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || phone.trim().length < 11) {
      showToast?.('请输入有效的 11 位手机号码')
      return
    }
    if (!code.trim()) {
      showToast?.('请输入验证码')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      showToast?.('登录成功')
      onLogin()
    }, 400)
  }

  return (
    <div className="h-full w-full flex flex-col justify-between px-7 py-6 bg-white select-none relative overflow-hidden">
      {/* 顶部：灵动岛与原生状态栏 (严格 40px) */}
      <div className="h-10 -mx-1 flex items-center justify-between text-xs font-semibold tracking-tight shrink-0">
        <span className="font-mono text-[13px] text-zinc-800">09:41</span>
        <div className="w-22 h-4.5 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.6 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
          </svg>
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>
      </div>

      {/* 1. 上段：品牌区（Web 端官方莲花 Logo，纯粹大留白） */}
      <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-4">
        <div className="w-20 h-20 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-105 select-none">
          <img
            src="/logo.png"
            alt="Rhythm Logo"
            className="w-full h-full object-contain scale-[2.2] pointer-events-none"
          />
        </div>
      </div>

      {/* 2. 中段：手机号快捷登录操作区 */}
      <div className="w-full space-y-4 pb-12 shrink-0">
        {!showSmsForm ? (
          /* ── 主通道：本机号码一键免密 ── */
          <div className="space-y-4">
            {/* 脱敏手机号与运营商认证提示 */}
            <div className="text-center space-y-1">
              <div className="text-[26px] font-mono font-bold tracking-wider text-zinc-900">
                138 **** 9527
              </div>
              <p className="text-[11.5px] text-zinc-400 font-medium tracking-tight">
                中国移动提供网络认证服务
              </p>
            </div>

            {/* 本机号码一键登录大胶囊 */}
            <button
              type="button"
              onClick={handleOneClickLogin}
              disabled={loading}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold text-[14.5px] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.14)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-zinc-300" />
                  <span>认证登入中...</span>
                </>
              ) : (
                <>
                  <span>本机号码一键登录</span>
                  <ArrowRight size={15} className="text-zinc-400" />
                </>
              )}
            </button>

            {/* 切换其他手机号入口 */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setShowSmsForm(true)}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer select-none py-1 flex items-center gap-1"
              >
                <span>其他手机号登录</span>
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
        ) : (
          /* ── 副通道：其他手机号短信验证码登录 ── */
          <form onSubmit={handleSmsLogin} className="space-y-3">
            {/* 手机号输入框 */}
            <div className="flex items-center bg-zinc-50 border border-zinc-200/80 rounded-2xl px-3.5 py-2.5 focus-within:border-zinc-900 focus-within:bg-white transition-all">
              <span className="text-xs font-mono font-bold text-zinc-500 pr-2 border-r border-zinc-200 shrink-0">
                +86
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full pl-2.5 text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                autoFocus
              />
            </div>

            {/* 验证码输入框 */}
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200/80 rounded-2xl px-3.5 py-2.5 focus-within:border-zinc-900 focus-within:bg-white transition-all">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.trim().slice(0, 6))}
                placeholder="6 位验证码"
                maxLength={6}
                className="w-28 text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="text-xs font-medium text-zinc-700 hover:text-zinc-950 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
              >
                {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
              </button>
            </div>

            {/* 确认登录按钮 */}
            <button
              type="submit"
              disabled={loading || !phone || !code}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-2xl shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-zinc-300" />
                  <span>登录中...</span>
                </>
              ) : (
                <span>登 录</span>
              )}
            </button>

            {/* 返回本机号码快捷登录 */}
            <div className="flex justify-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowSmsForm(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer select-none py-1"
              >
                返回本机一键登录
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. 下段：留空（按要求合规文字留由用户后续自行定制） */}
      <div className="h-6 shrink-0" />
    </div>
  )
}
