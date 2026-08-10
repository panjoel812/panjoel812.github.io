(() => {
  if (!('serviceWorker' in navigator)) return

  const root = document.documentElement
  const hadController = Boolean(navigator.serviceWorker.controller)
  let controllerChanged = false

  const announceUpdate = () => {
    let status = document.getElementById('poblumi-pwa-status')
    if (!status) {
      status = document.createElement('div')
      status.id = 'poblumi-pwa-status'
      status.className = 'poblumi-visually-hidden'
      status.setAttribute('role', 'status')
      status.setAttribute('aria-live', 'polite')
      status.setAttribute('aria-atomic', 'true')
      document.body.append(status)
    }

    const message = 'Poblumi 已更新到最新版本'
    status.textContent = message
    window.Solitude?.snackbarShow?.(message)
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || controllerChanged) return

    controllerChanged = true
    root.dataset.poblumiPwa = 'updated'
    requestAnimationFrame(announceUpdate)
  })

  const register = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(registration => {
        root.dataset.poblumiPwa = 'registered'
        registration.update()
        return navigator.serviceWorker.ready
      })
      .then(() => {
        if (!controllerChanged) root.dataset.poblumiPwa = 'active'
      })
      .catch(error => {
        root.dataset.poblumiPwa = 'failed'
        console.warn('Poblumi offline support could not start:', error)
      })
  }

  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
})()
