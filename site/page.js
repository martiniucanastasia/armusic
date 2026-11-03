import { CONFIG } from './config.js?v=__V__'

const $ = (id) => document.getElementById(id)
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props)
  n.append(...kids)
  return n
}
const { email, whatsapp, phoneDisplay, instagram } = CONFIG.contact
const waLink = (text) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const saveData = navigator.connection?.saveData === true
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches

/* ---------- contact links ---------- */
document.querySelectorAll('[data-wa]').forEach((a) => {
  a.href = waLink(a.dataset.wa)
  a.target = '_blank'
})
document.querySelectorAll('[data-social]').forEach((a) => {
  const t = a.dataset.social
  a.href = t === 'wa' ? waLink('Hola, me gustaría cotizar mi evento con armusic.') : t === 'ig' ? `https://instagram.com/${instagram}` : `mailto:${email}`
  if (t !== 'mail') Object.assign(a, { target: '_blank', rel: 'noopener' })
})
$('c-wa').href = waLink('Hola, me gustaría cotizar mi evento con armusic.')
$('c-wa').textContent = `WhatsApp: ${phoneDisplay}`
$('c-mail').href = `mailto:${email}`
$('c-mail').textContent = email
$('c-ig').href = `https://instagram.com/${instagram}`
$('c-ig').textContent = `Instagram: @${instagram}`
$('year').textContent = new Date().getFullYear()

/* The quote form has no server: it builds a message and opens WhatsApp or the mail app */
function quoteText() {
  const f = new FormData($('quote'))
  const line = (label, v) => (v ? `${label}: ${v}` : '')
  return [
    'Hola armusic, quiero cotizar un evento.',
    line('Tipo de evento', f.get('tipo')),
    line('Fecha', f.get('fecha')),
    line('Ciudad y lugar', f.get('lugar')),
    line('Invitados', f.get('invitados')),
    line('Duración', f.get('duracion')),
    line('Servicios de interés', f.getAll('svc').join(', ')),
  ]
    .filter(Boolean)
    .join('\n')
}
$('send-wa').onclick = () => window.open(waLink(quoteText()), '_blank', 'noopener')
$('send-mail').onclick = () => {
  location.href = `mailto:${email}?subject=${encodeURIComponent('Cotización de evento')}&body=${encodeURIComponent(quoteText())}`
}

/* ---------- lightbox (photos and videos) ---------- */
const lightbox = $('lightbox')
const lbBody = $('lb-body')
function openLightbox(node) {
  lbBody.replaceChildren(node)
  lightbox.showModal()
}
lightbox.addEventListener('close', () => lbBody.replaceChildren())
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target.classList.contains('lb-close')) lightbox.close()
})

/* ---------- hero: split headline, optional background video, parallax ---------- */
const h1 = document.querySelector('h1.split')
if (h1) {
  let i = 0
  const wrap = (node) => {
    ;[...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) return frag.append(part)
          frag.append(el('span', { className: 'w' }, el('span', { style: `--i:${i++}`, textContent: part })))
        })
        n.replaceWith(frag)
      } else wrap(n)
    })
  }
  wrap(h1)
}

const heroMedia = $('hero-media')
const hv = CONFIG.heroVideo ?? {}
if ((hv.mp4 || hv.webm) && !reduced && !saveData) {
  const v = el('video', { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', poster: hv.poster || '' })
  v.setAttribute('muted', '')
  if (hv.webm) v.append(el('source', { src: hv.webm, type: 'video/webm' }))
  if (hv.mp4) v.append(el('source', { src: hv.mp4, type: 'video/mp4' }))
  v.addEventListener('playing', () => heroMedia.classList.add('playing'))
  heroMedia.prepend(v)
  v.play().catch(() => {})
}

/* ---------- equaliser bars + wave dividers ---------- */
function bars(node, n) {
  for (let k = 0; k < n; k++) {
    const i = el('i')
    i.style.cssText = `--h:${25 + Math.random() * 75};--d:${(0.5 + Math.random() * 1.1).toFixed(2)}s;--dl:${(-Math.random() * 2).toFixed(2)}s`
    node.append(i)
  }
}
const eqCount = Math.max(28, Math.round((innerWidth || 1280) / 18))
bars($('eq-foot'), eqCount)
document.querySelectorAll('.wave').forEach((w) => bars(w, Number(w.dataset.bars) || 48))

/* ---------- reveal on scroll (with stagger) ---------- */
document.querySelectorAll('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)))
const reveal = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        reveal.unobserve(e.target)
      }
    }),
  { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
)
document.querySelectorAll('[data-reveal]').forEach((n) => reveal.observe(n))

/* ---------- colour flow: the background hue follows the section in view ---------- */
const flow = $('flow')
const hueTargets = [...document.querySelectorAll('[data-hue]')]
const hueSpy = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) flow.style.setProperty('--hue', `${e.target.dataset.hue}deg`)
    })
  },
  { rootMargin: '-45% 0px -50% 0px' },
)
hueTargets.forEach((n) => hueSpy.observe(n))

/* ---------- nav: solid-ish after scroll, highlight current section ---------- */
const nav = $('nav')
const links = [...document.querySelectorAll('.nav .links a:not(.cta)')]
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`))
    })
  },
  { rootMargin: '-40% 0px -55% 0px' },
)
links.forEach((a) => {
  const t = document.querySelector(a.getAttribute('href'))
  if (t) spy.observe(t)
})

/* ---------- scroll-driven bits: progress bar, hero parallax, steps line ---------- */
const root = document.documentElement
const heroEl = document.querySelector('.hero')
const steps = $('steps')
let ticking = false
function onScroll() {
  ticking = false
  const y = scrollY
  nav.classList.toggle('scrolled', y > 40)
  const max = root.scrollHeight - innerHeight
  root.style.setProperty('--sp', max > 0 ? Math.min(1, y / max).toFixed(4) : 0)
  if (!reduced && y < innerHeight * 1.2) heroMedia.style.transform = `translate3d(0, ${y * 0.18}px, 0)`
  if (steps) {
    const r = steps.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.2)))
    steps.style.setProperty('--stp', p.toFixed(3))
  }
}
addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(onScroll)
    }
  },
  { passive: true },
)
onScroll()

/* ---------- pointer glow + card spotlight (desktop only) ---------- */
if (fine && !reduced) {
  const glow = $('cursor-glow')
  let gx = 0, gy = 0, raf = 0
  addEventListener('pointermove', (e) => {
    gx = e.clientX
    gy = e.clientY
    glow.style.opacity = 1
    if (!raf) raf = requestAnimationFrame(() => {
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`
      raf = 0
    })
  })
  document.addEventListener('pointerleave', () => (glow.style.opacity = 0))
  document.querySelectorAll('.glass').forEach((c) =>
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect()
      c.style.setProperty('--mx', `${e.clientX - r.left}px`)
      c.style.setProperty('--my', `${e.clientY - r.top}px`)
    }),
  )
}

/* ---------- video rail: vertical and horizontal cards ---------- */
const videos = CONFIG.videos ?? []
if (videos.length) {
  $('videos').hidden = false
  $('nav-videos').hidden = false
  const rail = $('rail')
  const playable = []
  for (const v of videos) {
    const card = el('figure', { className: `vcard ${v.format === 'vertical' ? 'vertical' : 'horizontal'}` })
    if (v.poster) card.append(el('img', { src: v.poster, alt: v.title ?? '', loading: 'lazy' }))
    if (v.src) {
      const vid = el('video', { muted: true, loop: true, playsInline: true, preload: 'none' })
      vid.setAttribute('muted', '')
      vid.dataset.src = v.src
      card.append(vid, el('span', { className: 'play', innerHTML: '<svg class="ico"><use href="#i-play"/></svg>' }))
      playable.push(vid)
      card.onclick = () => {
        const big = el('video', { src: v.src, controls: true, autoplay: true, playsInline: true })
        openLightbox(big)
      }
    } else if (v.poster) {
      card.onclick = () => openLightbox(el('img', { src: v.poster, alt: v.title ?? '' }))
    }
    if (v.title) card.append(el('figcaption', { textContent: v.title }))
    rail.append(card)
  }
  // play muted previews only while on screen
  if (!reduced && !saveData) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const vid = e.target
          if (e.isIntersecting) {
            if (!vid.src) vid.src = vid.dataset.src
            vid.play().catch(() => {})
          } else vid.pause()
        }),
      { threshold: 0.6 },
    )
    playable.forEach((p) => io.observe(p))
  }
  const step = () => Math.max(260, rail.clientWidth * 0.6)
  $('rail-prev').onclick = () => rail.scrollBy({ left: -step(), behavior: 'smooth' })
  $('rail-next').onclick = () => rail.scrollBy({ left: step(), behavior: 'smooth' })
}

/* ---------- feature cards: optional looping video behind Bodas / Eventos ---------- */
const fv = CONFIG.featureVideos ?? {}
for (const [key, id] of [['bodas', 'card-bodas'], ['eventos', 'eventos-sociales']]) {
  const src = fv[key]
  if (!src || reduced || saveData) continue
  const card = $(id)
  const vid = el('video', { className: 'f-media', src, muted: true, loop: true, playsInline: true, preload: 'none' })
  vid.setAttribute('muted', '')
  card.prepend(vid)
  new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? vid.play().catch(() => {}) : vid.pause())), { threshold: 0.3 }).observe(card)
}

/* ---------- gallery ---------- */
const photos = CONFIG.gallery ?? []
if (photos.length) {
  $('galeria').hidden = false
  const box = $('gallery')
  photos.forEach((src, i) => {
    const img = el('img', { src, loading: 'lazy', alt: 'Evento armusic' })
    img.setAttribute('data-reveal', '')
    img.style.setProperty('--i', i % 4)
    img.onerror = () => img.remove()
    img.onclick = () => openLightbox(el('img', { src, alt: 'Evento armusic' }))
    box.append(img)
    reveal.observe(img)
  })
} else {
  $('nav-gallery').hidden = true
}
