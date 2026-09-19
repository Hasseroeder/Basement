import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
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
		processor: unified({
			remarkPlugins: [remarkEmotes, remarkMath],
			rehypePlugins: [rehypeMathjax],
		}),
	},
	compilerOptions: {
		strict: true,
		allowJs: true,
		checkJs: false,
	},
})
