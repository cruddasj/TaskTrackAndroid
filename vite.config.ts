import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPagesBuild = process.env.BUILD_TARGET === 'github-pages';
const githubPagesBase = repositoryName ? `/${repositoryName}/` : '/';
const base = isGitHubPagesBuild ? githubPagesBase : '/';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg'],
      manifest: {
        name: 'TaskTrack',
        short_name: 'TaskTrack',
        description: 'Plan your rounds, focus with Pomodoro, and track daily tasks.',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#16a34a',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.ico',
            sizes: '64x64',
            type: 'image/x-icon',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
  base,
});
