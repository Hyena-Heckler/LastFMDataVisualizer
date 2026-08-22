import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                albums: resolve(__dirname, "albums/index.html"),
                artists: resolve(__dirname, "artists/index.html"),
                songs: resolve(__dirname, "songs/index.html"),
            },
        },
    },
});