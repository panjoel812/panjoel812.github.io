(() => {
  const keyboardTargets = [
    ['.darkmode_switchbutton', 'button', '切换显示模式'],
    ['.asideSwitch', 'button', '切换侧边栏'],
    ['#consoleKeyboard', 'button', '打开键盘快捷键'],
    ['#consoleMusic', 'button', '播放或暂停音乐'],
    ['#nav-totop .totopbtn', 'button', '返回顶部'],
    ['#page-name-text', 'button', '返回顶部'],
    ['#toggle-menu > a', 'button', '打开导航菜单'],
    ['.post-reward .reward-button', 'button', '显示赞赏方式'],
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

        if (element.dataset.poblumiKeyboardReady === 'true') return
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

  const prepareMenuToggle = () => {
    const toggle = document.querySelector('#toggle-menu > a')
    const menu = document.getElementById('sidebar-menus')
    if (!toggle || !menu) return

    toggle.setAttribute('aria-controls', 'sidebar-menus')
    const updateExpandedState = () => {
      toggle.setAttribute('aria-expanded', String(menu.classList.contains('open')))
    }
    updateExpandedState()

    if (toggle.dataset.poblumiMenuStateReady === 'true') return
    toggle.dataset.poblumiMenuStateReady = 'true'
    new MutationObserver(updateExpandedState).observe(menu, {
      attributes: true,
      attributeFilter: ['class']
    })
  }

  const prepareRewardDialog = () => {
    const trigger = document.querySelector('.post-reward .reward-button')
    const panel = document.querySelector('.post-reward .reward-main')
    if (!trigger || !panel) return

    panel.id ||= 'poblumi-reward-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-modal', 'true')
    panel.setAttribute('aria-label', '赞赏作者')
    trigger.setAttribute('aria-controls', panel.id)
    trigger.setAttribute('aria-haspopup', 'dialog')

    const updateExpandedState = () => {
      const isOpen = getComputedStyle(panel).display !== 'none'
      trigger.setAttribute('aria-expanded', String(isOpen))
      panel.setAttribute('aria-hidden', String(!isOpen))
    }
    updateExpandedState()

    if (trigger.dataset.poblumiRewardStateReady === 'true') return
    trigger.dataset.poblumiRewardStateReady = 'true'
    new MutationObserver(updateExpandedState).observe(panel, {
      attributes: true,
      attributeFilter: ['class', 'style']
    })
  }

  const prepareDismissActions = () => {
    if (document.body.dataset.poblumiDismissReady === 'true') return
    document.body.dataset.poblumiDismissReady = 'true'

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return

      const menu = document.getElementById('sidebar-menus')
      if (menu?.classList.contains('open')) {
        document.getElementById('menu-mask')?.click()
        document.querySelector('#toggle-menu > a')?.focus()
        return
      }

      const rewardPanel = document.querySelector('.post-reward .reward-main')
      if (rewardPanel && getComputedStyle(rewardPanel).display !== 'none') {
        document.getElementById('quit-box')?.click()
        document.querySelector('.post-reward .reward-button')?.focus()
      }
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
      prepareMenuToggle()
      prepareRewardDialog()
      prepareDismissActions()
      prepareSkipLink()
      prepareOfflineRetry()
    }))
  }

  document.addEventListener('DOMContentLoaded', scheduleBrandGreeting)
  document.addEventListener('pjax:complete', scheduleBrandGreeting)
  window.addEventListener('load', scheduleBrandGreeting)
})()
