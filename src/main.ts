import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'

const ClaimDeskTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eefaf7', 100: '#d5f2e9', 200: '#ace4d7', 300: '#77ceb9',
      400: '#42af98', 500: '#208d79', 600: '#187765', 700: '#176052',
      800: '#174d43', 900: '#174138', 950: '#082820',
    },
    formField: { borderRadius: '7px', paddingX: '0.8rem', paddingY: '0.65rem' },
    colorScheme: { light: { primary: { color: '{primary.700}', hoverColor: '{primary.800}', activeColor: '{primary.900}' } } },
  },
})

createApp(App)
  .use(createPinia())
  .use(PrimeVue, { theme: { preset: ClaimDeskTheme, options: { darkModeSelector: false } } })
  .mount('#app')
