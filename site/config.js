export const CONFIG = {
  brand: 'armusic',
  contact: {
    email: 'armusicmexico@me.com',
    whatsapp: '525611608901', // digits only, with country code
    phoneDisplay: '+52 56 1160 8901',
    instagram: 'armusic_mx', // handle without @
  },
  // Hero background video (muted loop). Leave empty to show the photo with a slow zoom.
  // Put files in site/assets/video/ and write the paths here, e.g. mp4: 'assets/video/hero.mp4'.
  heroVideo: { mp4: '', webm: '', poster: 'assets/hero.jpg' },

  // "En acción" row. format: 'vertical' (9:16) or 'horizontal' (16:9). Add src for a video; without src the card shows its photo.
  videos: [
    { title: 'La primera pista', format: 'horizontal', src: '', poster: 'assets/gallery/09.jpg' },
    { title: 'Iluminación de pista', format: 'vertical', src: '', poster: 'assets/gallery/05.jpg' },
    { title: 'Bodas', format: 'vertical', src: '', poster: 'assets/gallery/06.jpg' },
    { title: 'Montajes', format: 'horizontal', src: '', poster: 'assets/gallery/12.jpg' },
    { title: 'Eventos sociales', format: 'vertical', src: '', poster: 'assets/gallery/10.jpg' },
  ],

  // Optional looping videos behind the Bodas / Eventos sociales cards
  featureVideos: { bodas: '', eventos: '' },

  // Photos shown in the gallery, in order. Put the files in site/assets/gallery/.
  gallery: [
    'assets/gallery/02.jpg',
    'assets/gallery/04.jpg',
    'assets/gallery/05.jpg',
    'assets/gallery/06.jpg',
    'assets/gallery/07.jpg',
    'assets/gallery/08.jpg',
    'assets/gallery/09.jpg',
    'assets/gallery/10.jpg',
    'assets/gallery/12.jpg',
    'assets/gallery/13.jpg',
    'assets/gallery/14.jpg',
    'assets/gallery/15.jpg',
    'assets/gallery/16.jpg',
    'assets/gallery/17.jpg',
    'assets/gallery/18.jpg',
    'assets/gallery/19.jpg',
  ],
}
