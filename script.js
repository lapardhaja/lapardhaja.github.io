const menuButton = document.querySelector('.menu-toggle')
const navigation = document.querySelector('.site-nav')
const compactNavigation = window.matchMedia('(max-width: 900px)')
const inlineDetailLayout = window.matchMedia('(max-width: 620px)')

const setMenuOpen = open => {
  if (!menuButton || !navigation) return
  const isCompact = compactNavigation.matches
  menuButton.setAttribute('aria-expanded', String(open))
  menuButton.querySelector('.sr-only').textContent = open ? 'Close navigation' : 'Open navigation'
  navigation.classList.toggle('is-open', open)
  navigation.toggleAttribute('inert', isCompact && !open)
  navigation.setAttribute('aria-hidden', String(isCompact && !open))
  document.body.classList.toggle('menu-open', isCompact && open)
  if (open && isCompact) requestAnimationFrame(() => navigation.querySelector('a')?.focus())
}

menuButton?.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'))
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)))
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false)
    menuButton.focus()
  }
})
compactNavigation.addEventListener('change', () => setMenuOpen(false))
setMenuOpen(false)

const scrollProgress = document.querySelector('[data-scroll-progress]')
const updateScrollProgress = () => {
  if (!scrollProgress) return
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0
  scrollProgress.style.setProperty('--progress', String(Math.min(1, Math.max(0, progress))))
}

let scrollProgressFrame = 0
window.addEventListener('scroll', () => {
  if (scrollProgressFrame) return
  scrollProgressFrame = requestAnimationFrame(() => {
    updateScrollProgress()
    scrollProgressFrame = 0
  })
}, { passive: true })
window.addEventListener('resize', updateScrollProgress)
updateScrollProgress()

const initializeTabs = (selector, keys) => document.querySelectorAll(selector).forEach(root => {
  const tabs = [...root.querySelectorAll('[role="tab"]')]
  const panels = [...root.querySelectorAll('[role="tabpanel"]')]
  const inlinePanels = root.matches('[data-experience], [data-education]')
  const panelOrigins = new Map(panels.map(panel => [panel, { parent: panel.parentElement, nextSibling: panel.nextSibling }]))
  const restorePanel = panel => {
    const origin = panelOrigins.get(panel)
    if (!origin) return
    if (origin.nextSibling?.parentElement === origin.parent) origin.parent.insertBefore(panel, origin.nextSibling)
    else origin.parent.append(panel)
  }
  const placePanel = (panel, tab) => {
    if (inlinePanels && inlineDetailLayout.matches) tab.insertAdjacentElement('afterend', panel)
    else restorePanel(panel)
  }
  const syncPanelPlacement = () => {
    if (!inlinePanels || !inlineDetailLayout.matches) {
      panels.forEach(restorePanel)
      return
    }
    const selectedTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true')
    const selectedPanel = panels.find(panel => panel.id === selectedTab?.getAttribute('aria-controls'))
    if (selectedPanel && selectedTab) placePanel(selectedPanel, selectedTab)
  }
  const activate = (tab, { focus = false, revealPanel = false } = {}) => {
    tabs.forEach(candidate => {
      const selected = candidate === tab
      candidate.setAttribute('aria-selected', String(selected))
      candidate.tabIndex = selected ? 0 : -1
    })
    const panel = panels.find(candidate => candidate.id === tab.getAttribute('aria-controls'))
    panels.forEach(candidate => candidate.hidden = candidate !== panel)
    if (panel) placePanel(panel, tab)
    if (focus) tab.focus()
    if (revealPanel && panel) requestAnimationFrame(() => panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }))
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab, { revealPanel: (root.matches('[data-experience]') && compactNavigation.matches) || (root.matches('[data-education]') && inlineDetailLayout.matches) }))
    tab.addEventListener('keydown', event => {
      if (!keys.includes(event.key)) return
      event.preventDefault()
      const delta = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + delta + tabs.length) % tabs.length
      activate(tabs[next], { focus: true, revealPanel: (root.matches('[data-experience]') && compactNavigation.matches) || (root.matches('[data-education]') && inlineDetailLayout.matches) })
    })
  })
  inlineDetailLayout.addEventListener('change', syncPanelPlacement)
  syncPanelPlacement()
})

initializeTabs('[data-experience]', ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'])
initializeTabs('[data-education]', ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])
initializeTabs('[data-publications]', ['ArrowLeft', 'ArrowRight', 'Home', 'End'])

document.querySelectorAll('.publication-card').forEach(card => {
  const source = card.querySelector(':scope > a[href]')
  if (!source) return
  card.classList.add('is-linkable')
  card.addEventListener('click', event => {
    if (event.target.closest('a, button')) return
    if (window.getSelection()?.toString()) return
    source.click()
  })
})

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('is-visible')
    revealObserver.unobserve(entry.target)
  })
}, { threshold: .12 })
document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element))

const navLinks = [...document.querySelectorAll('.site-nav a')]
const sections = navLinks.map(link => document.querySelector(link.hash)).filter(Boolean)
const navigationObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
  if (!visible) return
  navLinks.forEach(link => link.setAttribute('aria-current', String(link.hash === `#${visible.target.id}`)))
}, { rootMargin: '-30% 0px -60% 0px', threshold: .01 })
sections.forEach(section => navigationObserver.observe(section))
