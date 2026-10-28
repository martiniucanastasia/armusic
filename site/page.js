import { CONFIG } from './config.js?v=__V__'

const $ = (id) => document.getElementById(id)
const { email, whatsapp, phoneDisplay, instagram } = CONFIG.contact
const waLink = (text) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`

// WhatsApp buttons with a prefilled message
document.querySelectorAll('[data-wa]').forEach((a) => {
  a.href = waLink(a.dataset.wa)
  a.target = '_blank'
})

// Social icons (nav + hero)
document.querySelectorAll('[data-social]').forEach((a) => {
  const t = a.dataset.social
  a.href = t === 'wa' ? waLink('Hola, me gustaría cotizar mi evento con armusic.') : t === 'ig' ? `https://instagram.com/${instagram}` : `mailto:${email}`
  if (t !== 'mail') Object.assign(a, { target: '_blank', rel: 'noopener' })
})

// Direct contact links
$('c-wa').href = waLink('Hola, me gustaría cotizar mi evento con armusic.')
$('c-wa').textContent = `WhatsApp: ${phoneDisplay}`
$('c-mail').href = `mailto:${email}`
$('c-mail').textContent = email
$('c-ig').href = `https://instagram.com/${instagram}`
$('c-ig').textContent = `Instagram: @${instagram}`
$('year').textContent = new Date().getFullYear()

// The quote form has no server: it builds a message and opens WhatsApp or the mail app
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

// Gallery: hidden until photos are listed in config.js; broken files are dropped
const photos = CONFIG.gallery ?? []
if (photos.length) {
  $('galeria').hidden = false
  const box = $('gallery')
  const lightbox = $('lightbox')
  for (const src of photos) {
    const img = Object.assign(document.createElement('img'), { src, loading: 'lazy', alt: 'Evento armusic' })
    img.onerror = () => img.remove()
    img.onclick = () => {
      lightbox.querySelector('img').src = src
      lightbox.showModal()
    }
    box.append(img)
  }
  lightbox.onclick = () => lightbox.close()
} else {
  $('nav-gallery').hidden = true
}

// Sticky nav: solid background once scrolled, and highlight the section being viewed
const nav = $('nav')
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40)
onScroll()
window.addEventListener('scroll', onScroll, { passive: true })

const links = [...document.querySelectorAll('.nav .links a:not(.cta)')]
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`))
    }
  },
  { rootMargin: '-40% 0px -55% 0px' },
)
links.forEach((a) => {
  const target = document.querySelector(a.getAttribute('href'))
  if (target) spy.observe(target)
})
