import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        order: resolve(__dirname, 'order.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        reservations: resolve(__dirname, 'reservations.html'),
        success: resolve(__dirname, 'success.html'),
        notfound: resolve(__dirname, '404.html'),
        offline: resolve(__dirname, 'offline.html'),
      },
    },
  },
});
