import { defineConfig } from 'astro/config'
import remarkEmotes from './src/plugins/remark-emotes.js'

import mdx from '@astrojs/mdx'

export default defineConfig({
	root: '.',

	publicDir: 'public',
	outDir: 'dist',
	integrations: [mdx()],
	markdown: {
		remarkPlugins: [remarkEmotes],
	},
})
