import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import DialogService from 'primevue/dialogservice';
import "primevue/resources/themes/mdc-dark-indigo/theme.css";
import "primevue/resources/primevue.min.css";
import "primeicons/primeicons.css";

const app = createApp(App)

app.use(createPinia())
app.use(router);
app.use(DialogService);
app.use(PrimeVue);

app.mount('#app')
