(() => {
  const installActions = () => {
    const solitude = window.Solitude || (window.Solitude = {})

    solitude.openSponsor = () => {
      window.open('https://afdian.net/a/panjoel/', '_blank', 'noopener')
    }

    if (typeof solitude.owoBig !== 'function') {
      const selectors = []
      let bound = false

      solitude.owoBig = options => {
        if (!options?.body || !options?.item) return
        if (!selectors.some(item => item.body === options.body && item.item === options.item)) {
          selectors.push(options)
        }
        if (bound) return
        bound = true

        let preview = document.getElementById('owo-big')
        if (!preview) {
          preview = document.createElement('div')
          preview.id = 'owo-big'
          preview.setAttribute('aria-hidden', 'true')
          document.body.appendChild(preview)
        }

        document.addEventListener('mouseover', event => {
          if (!(event.target instanceof Element)) return

          const matched = selectors.find(item => {
            const emotion = event.target.closest(item.item)
            return emotion && emotion.closest(item.body)
          })
          if (!matched) return

          const emotion = event.target.closest(matched.item)
          const source = emotion?.querySelector('img')?.src
          if (!source) return

          const image = document.createElement('img')
          image.src = source
          image.alt = ''
          image.style.maxWidth = '100%'
          image.style.height = 'auto'
          preview.replaceChildren(image)
          preview.style.display = 'block'

          const rect = emotion.getBoundingClientRect()
          preview.style.left = `${Math.max(8, rect.left - preview.offsetWidth / 4)}px`
          preview.style.top = `${Math.max(8, rect.top)}px`
        })

        document.addEventListener('mouseout', event => {
          if (!(event.target instanceof Element)) return
          if (selectors.some(item => event.target.closest(item.item)?.closest(item.body))) {
            preview.style.display = 'none'
          }
        })
      }
    }
  }

  installActions()
})()
