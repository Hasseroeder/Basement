import { defineConfig } from 'astro/config'
import remarkEmotes from './src/plugins/remark-emotes.js'
import remarkMath from 'remark-math'
import rehypeMathjax from 'rehype-mathjax'

import mdx from '@astrojs/mdx'

export default defineConfig({
	root: '.',
	integrations: [mdx()],
	publicDir: 'public',
	outDir: 'dist',
	markdown: {
		remarkPlugins: [remarkEmotes, remarkMath],
		rehypePlugins: [rehypeMathjax],
	},
	compilerOptions: {
		strict: false,
		allowJs: true,
		checkJs: false,
	},
})
