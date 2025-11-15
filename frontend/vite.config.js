import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.debug(env);
  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        host: "localhost",
        protocol: "ws",
        clientPort: 3000,
      },
	    // --- ADD THIS PROXY CONFIGURATION ---
      proxy: {
        '/api': { // This will proxy any requests that start with /api
          target: 'http://flask_backend:5002', // The address of your Flask backend
          changeOrigin: true, // Needed for virtual hosted sites
          // Optional: If your Flask backend doesn't expect the /api prefix,
          // you can rewrite the path:
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
        // You can add more proxy rules if your backend has other distinct routes,
        // for example, if you serve static files from Flask under /static/
        // '/static': {
        //   target: 'http://localhost:5000',
        //   changeOrigin: true,
        // },
      },
      // --- END OF PROXY CONFIGURATION ---
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern",
        },
      },
    },
  };
});
