import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Use the environment variable if it exists (Netlify Dashboard), otherwise use the hardcoded key
  const apiKey = env.API_KEY || "AIzaSyAogVbjVnOxsCSKAFNiGRywN1o6tsUOGF4";

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so the code works
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});