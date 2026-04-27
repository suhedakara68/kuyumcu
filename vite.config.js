import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5174,
    https: false // ngrok zaten bize HTTPS sağlayacağı için burayı kapatıyoruz
  }
});
