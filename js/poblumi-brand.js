(() => {
  const focusableSelector = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',')

  const getFocusableElements = container => [...container.querySelectorAll(focusableSelector)]
    .filter(element => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true')

  const containTabFocus = (event, container) => {
    if (event.key !== 'Tab') return

    const focusable = getFocusableElements(container)
    if (!focusable.length) {
      event.preventDefault()
      container.focus({ preventScroll: true })
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || !container.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !container.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  const createCloseButton = (container, label, onClose) => {
    let button = container.querySelector(':scope > .poblumi-dialog-close')
    if (!button) {
      button = document.createElement('button')
      button.type = 'button'
      button.className = 'poblumi-dialog-close'
      button.innerHTML = '<span aria-hidden="true"></span>'
      container.append(button)
    }

    button.setAttribute('aria-label', label)
    if (button.dataset.poblumiCloseReady !== 'true') {
      button.dataset.poblumiCloseReady = 'true'
      button.addEventListener('click', onClose)
    }
    return button
  }

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
    menu.setAttribute('role', 'dialog')
    menu.setAttribute('aria-modal', 'true')
    menu.setAttribute('aria-label', '移动导航')
    menu.setAttribute('tabindex', '-1')

    let toolbar = menu.querySelector(':scope > .poblumi-dialog-toolbar')
    if (!toolbar) {
      toolbar = document.createElement('div')
      toolbar.className = 'poblumi-dialog-toolbar'
      const title = document.createElement('span')
      title.className = 'poblumi-dialog-title'
      title.textContent = '导航'
      toolbar.append(title)
      menu.prepend(toolbar)
    }
    createCloseButton(toolbar, '关闭导航菜单', () => {
      document.getElementById('menu-mask')?.click()
      toggle.focus({ preventScroll: true })
    })

    let wasOpen = menu.classList.contains('open')
    const updateExpandedState = () => {
      const isOpen = menu.classList.contains('open')
      toggle.setAttribute('aria-expanded', String(isOpen))
      toggle.setAttribute('aria-label', isOpen ? '关闭导航菜单' : '打开导航菜单')
      menu.setAttribute('aria-hidden', String(!isOpen))

      if (isOpen) menu.removeAttribute('inert')

      if (isOpen && !wasOpen) {
        requestAnimationFrame(() => {
          const first = getFocusableElements(menu)[0]
          ;(first || menu).focus({ preventScroll: true })
        })
      } else if (!isOpen && wasOpen && menu.contains(document.activeElement)) {
        toggle.focus({ preventScroll: true })
      }
      if (!isOpen) menu.setAttribute('inert', '')
      wasOpen = isOpen
    }
    updateExpandedState()

    if (toggle.dataset.poblumiMenuStateReady === 'true') return
    toggle.dataset.poblumiMenuStateReady = 'true'
    menu.addEventListener('keydown', event => containTabFocus(event, menu))
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
    panel.setAttribute('tabindex', '-1')
    trigger.setAttribute('aria-controls', panel.id)
    trigger.setAttribute('aria-haspopup', 'dialog')

    const closeButton = createCloseButton(panel, '关闭赞赏', () => {
      document.getElementById('quit-box')?.click()
      trigger.focus({ preventScroll: true })
    })
    panel.prepend(closeButton)

    let wasOpen = getComputedStyle(panel).display !== 'none'
    const updateExpandedState = () => {
      const isOpen = getComputedStyle(panel).display !== 'none'
      trigger.setAttribute('aria-expanded', String(isOpen))
      panel.setAttribute('aria-hidden', String(!isOpen))

      if (isOpen) panel.removeAttribute('inert')

      if (isOpen && !wasOpen) {
        requestAnimationFrame(() => {
          const first = getFocusableElements(panel)[0]
          ;(first || panel).focus({ preventScroll: true })
        })
      } else if (!isOpen && wasOpen && panel.contains(document.activeElement)) {
        trigger.focus({ preventScroll: true })
      }
      if (!isOpen) delete panel.dataset.poblumiExplicitOpen
      if (!isOpen) panel.setAttribute('inert', '')
      wasOpen = isOpen
    }
    updateExpandedState()

    if (trigger.dataset.poblumiRewardStateReady === 'true') return
    trigger.dataset.poblumiRewardStateReady = 'true'
    trigger.addEventListener('click', () => {
      panel.dataset.poblumiExplicitOpen = 'true'
    }, true)
    panel.addEventListener('keydown', event => containTabFocus(event, panel))
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
