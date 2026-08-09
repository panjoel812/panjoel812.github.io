(() => {
  const applyBrandGreeting = () => {
    const greeting = document.getElementById('sayhi')
    if (!greeting) return

    greeting.textContent = '你好，我是啵露米'
    greeting.removeAttribute('data-solitude-action')
  }

  const scheduleBrandGreeting = () => {
    requestAnimationFrame(() => requestAnimationFrame(applyBrandGreeting))
  }

  document.addEventListener('DOMContentLoaded', scheduleBrandGreeting)
  document.addEventListener('pjax:complete', scheduleBrandGreeting)
  window.addEventListener('load', scheduleBrandGreeting)
})()
