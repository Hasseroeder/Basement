export async function loadJson(path) {
	var jsonData
	try {
		const response = await fetch(path)
		jsonData = await response.json()
	} catch (error) {
		console.error('Error loading json:', error)
	}
	return jsonData
}

export async function loadAll(obj) {
	const entries = Object.entries(obj)
	const results = await Promise.all(entries.map(([_, p]) => p))
	return Object.fromEntries(entries.map(([key], i) => [key, results[i]]))
}

export async function loadPets() {
	const tiers = [
		{
			slug: 'common',
			priority: 0,
			prettyName: 'Common',
			folderPath: '/src/images/owo_images/pets/',
		},
		{
			slug: 'uncommon',
			priority: 1,
			prettyName: 'Uncommon',
			folderPath: '/src/images/owo_images/pets/',
		},
		{
			slug: 'rare',
			priority: 2,
			prettyName: 'Rare',
			folderPath: '/src/images/owo_images/pets/',
		},
		{
			slug: 'epic',
			priority: 3,
			prettyName: 'Epic',
			folderPath: '/src/images/owo_images/pets/',
		},
		{
			slug: 'mythical',
			priority: 4,
			prettyName: 'Mythic',
			folderPath: '/src/images/owo_images/pets/',
		},
		{
			slug: 'legendary',
			priority: 5,
			prettyName: 'Legendary',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
		{
			slug: 'gem',
			priority: 5,
			prettyName: 'Gem',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
		{
			slug: 'bot',
			priority: 6,
			prettyName: 'Bot',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
		{
			slug: 'distorted',
			priority: 7,
			prettyName: 'Distorted',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
		{
			slug: 'fabled',
			priority: 8,
			prettyName: 'Fabled',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
		{
			slug: 'hidden',
			priority: 9,
			prettyName: 'Hidden',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
		{
			slug: 'special',
			priority: 10,
			prettyName: 'Special',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
		{
			slug: 'patreon',
			priority: 11,
			prettyName: 'Patreon',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
		{
			slug: 'cpatreon',
			priority: 12,
			prettyName: 'Custom',
			folderPath: 'https://cdn.discordapp.com/emojis/',
		},
	]

	//const fileName = 'https://cdn.discordapp.com/emojis/' + pet.emoji
	//const extension = pet.animated ? '.gif' : '.png'

	const response = await loadJson('https://neonutil.com/api/animals')
	const tierSlugs = response.ranks
	return response.data.map((rawPet) => {
		const animated = rawPet[0] ? true : false
		const tier = tiers.find((tier) => tier.slug == tierSlugs[rawPet[5]])
		const emoteSrc = tier.folderPath + rawPet[2] + animated ? '.gif' : '.png'
		return {
			animated, //bool
			prettyName: rawPet[1], //string
			slug: rawPet[1].toLowerCase(), //string
			emoteSrc, // string
			aliases: rawPet[3].map((alias) => alias.toLowerCase()), // string[]
			stats: rawPet[4], // int[]
			tier, // { slug: string, priority: int, prettyName: string, folderPath: string}
		}
	})
}
