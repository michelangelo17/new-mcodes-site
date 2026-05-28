// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://michelangelo.codes',
	// Explicitly static. This site is served as plain files by the Express
	// host in the deploy container; the MCP server lives next to it but the
	// site itself has no runtime requirements.
	output: 'static',
	integrations: [mdx(), sitemap()],
	fonts: [
		// Three-font split, each in the role it's good at:
		//   Fira Code (mono)      -> code blocks + the brand wordmark.
		//   Space Grotesk (head)  -> headings, where its display character is
		//                            an asset and reading fatigue is moot.
		//   iA Writer Quattro     -> body. Duospaced: keeps the technical DNA
		//                            but reads far easier than mono for prose.
		// All three are self-hosted: the woff2 files live in src/assets/fonts
		// (pulled from Fontsource), so there is no runtime third-party font
		// request at all. Self-hosting Fira Code from Fontsource also ships its
		// full OpenType feature set, which is what makes the code ligatures
		// (=>, ->, != ...) actually fire — see global.css.
		{
			provider: fontProviders.local(),
			name: 'Fira Code',
			cssVariable: '--font-mono',
			fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
			options: {
				variants: [
					{ src: ['./src/assets/fonts/fira-code-400.woff2'], weight: 400, style: 'normal', display: 'swap' },
					{ src: ['./src/assets/fonts/fira-code-700.woff2'], weight: 700, style: 'normal', display: 'swap' },
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'Space Grotesk',
			cssVariable: '--font-heading',
			fallbacks: ['system-ui', 'sans-serif'],
			options: {
				variants: [
					{ src: ['./src/assets/fonts/space-grotesk-500.woff2'], weight: 500, style: 'normal', display: 'swap' },
					{ src: ['./src/assets/fonts/space-grotesk-700.woff2'], weight: 700, style: 'normal', display: 'swap' },
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'iA Writer Quattro',
			cssVariable: '--font-body',
			fallbacks: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
			options: {
				variants: [
					{ src: ['./src/assets/fonts/ia-writer-quattro-400.woff2'], weight: 400, style: 'normal', display: 'swap' },
					{ src: ['./src/assets/fonts/ia-writer-quattro-700.woff2'], weight: 700, style: 'normal', display: 'swap' },
					{ src: ['./src/assets/fonts/ia-writer-quattro-400-italic.woff2'], weight: 400, style: 'italic', display: 'swap' },
					{ src: ['./src/assets/fonts/ia-writer-quattro-700-italic.woff2'], weight: 700, style: 'italic', display: 'swap' },
				],
			},
		},
	],
});
