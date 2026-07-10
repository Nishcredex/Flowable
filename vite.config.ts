import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/flowable-ui': {
//         target: 'http://localhost:8080',
//         changeOrigin: true,
//       }
//     }
//   }
// })



// vite.config.ts — FIXED
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/flowable-api': {
        target: 'http://localhost:8080/flowable-rest',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/flowable-api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const creds = Buffer.from('admin:test').toString('base64');
            proxyReq.setHeader('Authorization', `Basic ${creds}`);
          });
        },
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});