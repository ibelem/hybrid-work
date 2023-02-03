import { sveltekit } from '@sveltejs/kit/vite';
import mkcert from 'vite-plugin-mkcert';

const config = {
	server: {
		https: true
	},
	plugins: [sveltekit(), mkcert()]
};

export default config;
