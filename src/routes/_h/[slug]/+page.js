/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	if (params.slug) {
		return {
			nickname: params.slug
		};
	}
}
