import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('@tiptap')) return 'editor-vendor';
          if (id.includes('recharts')) return 'chart-vendor';
          if (
            id.includes('@stomp') ||
            id.includes('sockjs-client')
          ) {
            return 'realtime-vendor';
          }
          if (
            id.includes('@radix-ui') ||
            id.includes('cmdk')
          ) {
            return 'ui-vendor';
          }
          if (
            id.includes('react-router-dom') ||
            id.includes('@tanstack/react-query')
          ) {
            return 'app-vendor';
          }
          if (
            id.includes('react') ||
            id.includes('react-dom')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
})
