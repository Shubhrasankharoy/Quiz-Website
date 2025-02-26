import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Quiz-Website/',  // 🔹 Replace with your GitHub repo name
});
