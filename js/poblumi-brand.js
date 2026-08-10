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

  const setDesktopMenuState = (item, isOpen) => {
    const trigger = item.querySelector(':scope > .site-page')
    const child = item.querySelector(':scope > .menus_item_child')
    if (!trigger || !child) return

    item.classList.toggle('open', isOpen)
    trigger.setAttribute('aria-expanded', String(isOpen))
    child.setAttribute('aria-hidden', String(!isOpen))
    if (isOpen) {
      child.removeAttribute('inert')
    } else {
      child.setAttribute('inert', '')
      delete item.dataset.poblumiClickOpen
    }
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
    ['#toPageButton', 'button', '跳转到指定页'],
    ['.aplayer-icon-back', 'button', '上一首'],
    ['.aplayer-icon-play', 'button', '播放或暂停'],
    ['.aplayer-icon-forward', 'button', '下一首'],
    ['.aplayer-icon-volume-down', 'button', '静音或恢复声音'],
    ['.aplayer-icon-order', 'button', '切换播放顺序'],
    ['.aplayer-icon-loop', 'button', '切换循环模式'],
    ['.aplayer-icon-menu', 'button', '打开播放列表'],
    ['.aplayer-icon-lrc', 'button', '显示或隐藏歌词'],
    ['.aplayer-miniswitcher .aplayer-icon', 'button', '收起或展开播放器']
  ]

  const makeKeyboardAccessible = () => {
    keyboardTargets.forEach(([selector, role, fallbackLabel]) => {
      document.querySelectorAll(selector).forEach(element => {
        if (!element.getAttribute('aria-label')) {
          const title = element.getAttribute('title') || element.getAttribute('heotip')
          const articleTitle = element.querySelector('.article-title, .recent-post-info .article-title')?.textContent
          element.setAttribute('aria-label', (title || articleTitle || fallbackLabel).trim())
        }

        if (element.matches('a[href], button, input, select, textarea')) return

        element.setAttribute('role', role)
        element.setAttribute('tabindex', '0')
        element.classList.add('poblumi-keyboard-target')

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

  const prepareHeadingAnchors = () => {
    document.querySelectorAll('#post .article-container a.headerlink').forEach(anchor => {
      if (anchor.getAttribute('aria-label')) return

      const heading = anchor.closest('h1, h2, h3, h4, h5, h6')
      const headingText = heading?.textContent?.trim().replace(/\s+/g, ' ')
      anchor.setAttribute('aria-label', headingText ? `定位到“${headingText}”` : '定位到本节')
    })
  }

  const prepareDynamicAccessibility = () => {
    makeKeyboardAccessible()
    prepareHeadingAnchors()

    if (document.body.dataset.poblumiDynamicA11yReady === 'true') return
    document.body.dataset.poblumiDynamicA11yReady = 'true'

    let frame = 0
    const observer = new MutationObserver(() => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        makeKeyboardAccessible()
        prepareHeadingAnchors()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }

  const prepareDesktopNavMenus = () => {
    const items = [...document.querySelectorAll('#page-header #menus > .menus_items > .menus_item')]
      .filter(item => item.querySelector(':scope > .menus_item_child'))

    items.forEach((item, index) => {
      const trigger = item.querySelector(':scope > .site-page')
      const child = item.querySelector(':scope > .menus_item_child')
      if (!trigger || !child) return

      child.id ||= `poblumi-desktop-menu-${index + 1}`
      trigger.setAttribute('role', 'button')
      trigger.setAttribute('aria-haspopup', 'true')
      trigger.setAttribute('aria-controls', child.id)
      setDesktopMenuState(item, false)

      if (item.dataset.poblumiDesktopMenuReady === 'true') return
      item.dataset.poblumiDesktopMenuReady = 'true'

      item.addEventListener('mouseenter', () => {
        delete item.dataset.poblumiSuppressFocusOpen
        setDesktopMenuState(item, true)
      })
      item.addEventListener('mouseleave', () => {
        if (!item.contains(document.activeElement)) setDesktopMenuState(item, false)
      })
      item.addEventListener('focusin', () => {
        if (item.dataset.poblumiSuppressFocusOpen !== 'true') setDesktopMenuState(item, true)
      })
      item.addEventListener('focusout', () => requestAnimationFrame(() => {
        if (!item.contains(document.activeElement) && !item.matches(':hover')) {
          delete item.dataset.poblumiSuppressFocusOpen
          setDesktopMenuState(item, false)
        }
      }))
      trigger.addEventListener('click', event => {
        event.preventDefault()
        delete item.dataset.poblumiSuppressFocusOpen
        const shouldClose = item.dataset.poblumiClickOpen === 'true' && item.classList.contains('open')
        if (shouldClose) {
          setDesktopMenuState(item, false)
        } else {
          setDesktopMenuState(item, true)
          item.dataset.poblumiClickOpen = 'true'
        }
      })
      trigger.addEventListener('keydown', event => {
        if (event.key === ' ') {
          event.preventDefault()
          trigger.click()
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          delete item.dataset.poblumiSuppressFocusOpen
          setDesktopMenuState(item, true)
          getFocusableElements(child)[0]?.focus()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          item.dataset.poblumiSuppressFocusOpen = 'true'
          setDesktopMenuState(item, false)
          trigger.focus({ preventScroll: true })
        }
      })
      child.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        item.dataset.poblumiSuppressFocusOpen = 'true'
        setDesktopMenuState(item, false)
        trigger.focus({ preventScroll: true })
      })
    })

    if (document.body.dataset.poblumiDesktopMenusReady === 'true') return
    document.body.dataset.poblumiDesktopMenusReady = 'true'
    document.addEventListener('click', event => {
      document.querySelectorAll('#page-header #menus > .menus_items > .menus_item.open').forEach(item => {
        if (!item.contains(event.target)) setDesktopMenuState(item, false)
      })
    })
  }

  const prepareKeyboardShortcutGuard = () => {
    if (document.body.dataset.poblumiShortcutGuardReady === 'true') return
    document.body.dataset.poblumiShortcutGuardReady = 'true'

    document.addEventListener('keydown', event => {
      if (!(event.target instanceof Element)) return
      const editable = event.target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
      )
      if (editable) event.stopPropagation()
    })
  }

  const prepareConsoleDialog = () => {
    const trigger = document.querySelector('#nav-console .console_switchbutton')
    const root = document.getElementById('console')
    const content = root?.querySelector('.console-content')
    if (!trigger || !root || !content) return

    content.id ||= 'poblumi-console-dialog'
    content.setAttribute('role', 'dialog')
    content.setAttribute('aria-modal', 'true')
    content.setAttribute('aria-label', '中控台')
    content.setAttribute('tabindex', '-1')
    trigger.setAttribute('role', 'button')
    trigger.setAttribute('aria-controls', content.id)
    trigger.setAttribute('aria-haspopup', 'dialog')

    let wasOpen = root.classList.contains('show')
    const updateConsoleState = () => {
      const isOpen = root.classList.contains('show')
      trigger.setAttribute('aria-expanded', String(isOpen))
      trigger.setAttribute('aria-label', isOpen ? '关闭中控台' : '打开中控台')
      root.setAttribute('aria-hidden', String(!isOpen))

      if (isOpen) root.removeAttribute('inert')
      if (isOpen && !wasOpen) {
        requestAnimationFrame(() => content.focus({ preventScroll: true }))
      } else if (!isOpen && wasOpen) {
        trigger.focus({ preventScroll: true })
      }
      if (!isOpen) root.setAttribute('inert', '')
      wasOpen = isOpen
    }
    updateConsoleState()

    if (trigger.dataset.poblumiConsoleReady === 'true') return
    trigger.dataset.poblumiConsoleReady = 'true'
    trigger.addEventListener('keydown', event => {
      if (event.key !== ' ') return
      event.preventDefault()
      trigger.click()
    })
    document.addEventListener('keydown', event => {
      if (!root.classList.contains('show') || event.key !== 'Tab') return

      const inside = getFocusableElements(root)
      const first = inside[0] || content
      const last = inside.at(-1) || content
      const active = document.activeElement
      if (active === content || (active !== trigger && !root.contains(active))) {
        event.preventDefault()
        ;(event.shiftKey ? trigger : first).focus()
      } else if (active === trigger) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        trigger.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        trigger.focus()
      }
    })
    new MutationObserver(updateConsoleState).observe(root, {
      attributes: true,
      attributeFilter: ['class']
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

      const consoleRoot = document.getElementById('console')
      if (consoleRoot?.classList.contains('show')) {
        window.Solitude?.hideConsole?.()
        document.querySelector('#nav-console .console_switchbutton')?.focus()
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
      prepareDynamicAccessibility()
      prepareDesktopNavMenus()
      prepareKeyboardShortcutGuard()
      prepareConsoleDialog()
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
