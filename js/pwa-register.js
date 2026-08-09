(() => {
  if (!('serviceWorker' in navigator)) return

  const register = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(registration => {
        document.documentElement.dataset.poblumiPwa = 'registered'
        registration.update()
        return navigator.serviceWorker.ready
      })
      .then(() => {
        document.documentElement.dataset.poblumiPwa = 'active'
      })
      .catch(error => {
        document.documentElement.dataset.poblumiPwa = 'failed'
        console.warn('Poblumi offline support could not start:', error)
      })
  }

  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
})()
