import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const apiTarget =
    env.VITE_API_PROXY_TARGET ||
    env.API_PROXY_TARGET ||
    `http://${env.API_HOST || '127.0.0.1'}:${env.API_PORT || '3000'}`;

  return {
    plugins: [vue()],
    root: path.resolve(__dirname),
    css: {
      postcss: path.resolve(__dirname, 'postcss.config.cjs'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
  };
});
