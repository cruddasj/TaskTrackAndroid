import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPagesBuild = process.env.BUILD_TARGET === 'github-pages';
const githubPagesBase = repositoryName ? `/${repositoryName}/` : '/';

export default defineConfig({
  plugins: [react()],
  base: isGitHubPagesBuild ? githubPagesBase : '/',
});
