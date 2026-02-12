import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['localhost', '127.0.0.1', 'console-dev.haveri.app']
  },
  plugins: [tailwindcss(), sveltekit()]
});
