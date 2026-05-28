// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://michelangelo.codes',
	output: 'static',
	integrations: [mdx(), sitemap()],
	// Self-hosted from Fontsource (woff2 in src/assets/fonts): Fira Code for
	// code + brand, Space Grotesk for headings, iA Writer Quattro for body.
	fonts: [
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
