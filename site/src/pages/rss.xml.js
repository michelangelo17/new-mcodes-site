import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export const GET = async (context) => {
	const posts = await getCollection('posts');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		// summary -> description, date -> pubDate.
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.summary,
			pubDate: post.data.date,
			link: `/blog/${post.id}/`,
		})),
	});
};
