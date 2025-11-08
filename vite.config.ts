import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const parseNum = (v: any, def: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : def;
    };
    const devPort = parseNum(env.VITE_DEV_PORT ?? env.PORT, 3000);
    const apiPort = parseNum(env.VITE_API_PORT ?? env.PORT, 8787);
    return {
      server: {
        port: devPort,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: `http://localhost:${apiPort}`,
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
