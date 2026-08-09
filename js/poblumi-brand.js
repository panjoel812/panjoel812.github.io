(() => {
  const keyboardTargets = [
    ['.darkmode_switchbutton', 'button', '切换显示模式'],
    ['.asideSwitch', 'button', '切换侧边栏'],
    ['#consoleKeyboard', 'button', '打开键盘快捷键'],
    ['#consoleMusic', 'button', '播放或暂停音乐'],
    ['#nav-totop', 'button', '返回顶部'],
    ['#toPageButton', 'button', '跳转到指定页']
  ]

  const makeKeyboardAccessible = () => {
    keyboardTargets.forEach(([selector, role, fallbackLabel]) => {
      document.querySelectorAll(selector).forEach(element => {
        if (element.matches('a[href], button, input, select, textarea')) return

        element.setAttribute('role', role)
        element.setAttribute('tabindex', '0')
        element.classList.add('poblumi-keyboard-target')

        if (!element.getAttribute('aria-label')) {
          const title = element.getAttribute('title') || element.getAttribute('heotip')
          const articleTitle = element.querySelector('.article-title, .recent-post-info .article-title')?.textContent
          element.setAttribute('aria-label', (title || articleTitle || fallbackLabel).trim())
        }

        const needsActivationHandler = element.tagName === 'A' && !element.hasAttribute('href')
        if (!needsActivationHandler || element.dataset.poblumiKeyboardReady === 'true') return
        element.dataset.poblumiKeyboardReady = 'true'
        element.addEventListener('keydown', event => {
          const activate = event.key === 'Enter' || (role === 'button' && event.key === ' ')
          if (!activate) return
          event.preventDefault()
          element.click()
        })
      })
    })
  }

  const prepareOfflineRetry = () => {
    const retry = document.getElementById('poblumi-offline-retry')
    if (!retry || retry.dataset.poblumiReady === 'true') return

    retry.dataset.poblumiReady = 'true'
    retry.addEventListener('click', () => window.location.reload())
  }

  const prepareSkipLink = () => {
    const link = document.querySelector('.poblumi-skip-link')
    if (!link || link.dataset.poblumiReady === 'true') return

    link.dataset.poblumiReady = 'true'
    link.addEventListener('click', event => {
      const target = document.querySelector(link.hash)
      if (!target) return

      event.preventDefault()
      target.focus({ preventScroll: true })
      target.scrollIntoView({ block: 'start' })
      window.history.replaceState(null, '', link.hash)
    })
  }

  const applyBrandGreeting = () => {
    const greeting = document.getElementById('sayhi')
    if (!greeting) return

    greeting.textContent = '你好，我是啵露米'
    greeting.removeAttribute('data-solitude-action')
  }

  const scheduleBrandGreeting = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      applyBrandGreeting()
      makeKeyboardAccessible()
      prepareSkipLink()
      prepareOfflineRetry()
    }))
  }

  document.addEventListener('DOMContentLoaded', scheduleBrandGreeting)
  document.addEventListener('pjax:complete', scheduleBrandGreeting)
  window.addEventListener('load', scheduleBrandGreeting)
})()
