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
	const localPetPath = '/assets/images/owo_images/pets/'
	const cdnPath = 'https://cdn.discordapp.com/emojis/'
	const tiers = [
		{ priority: 0, slug: 'common', prettyName: 'Common', folderPath: localPetPath },
		{ priority: 1, slug: 'uncommon', prettyName: 'Uncommon', folderPath: localPetPath },
		{ priority: 2, slug: 'rare', prettyName: 'Rare', folderPath: localPetPath },
		{ priority: 3, slug: 'epic', prettyName: 'Epic', folderPath: localPetPath },
		{ priority: 4, slug: 'mythic', prettyName: 'Mythic', folderPath: localPetPath },
		{ priority: 5, slug: 'legendary', prettyName: 'Legendary', folderPath: cdnPath },
		{ priority: 6, slug: 'gem', prettyName: 'Gem', folderPath: cdnPath },
		{ priority: 7, slug: 'bot', prettyName: 'Bot', folderPath: cdnPath },
		{ priority: 8, slug: 'distorted', prettyName: 'Distorted', folderPath: cdnPath },
		{ priority: 9, slug: 'fabled', prettyName: 'Fabled', folderPath: cdnPath },
		{ priority: 10, slug: 'hidden', prettyName: 'Hidden', folderPath: cdnPath },
		{ priority: 11, slug: 'special', prettyName: 'Special', folderPath: cdnPath },
		{ priority: 12, slug: 'patreon', prettyName: 'Patreon', folderPath: cdnPath },
		{ priority: 13, slug: 'cpatreon', prettyName: 'Custom', folderPath: cdnPath },
	]

	const response = await loadJson('https://neonutil.com/api/animals')
	const tierSlugs = response.ranks
	return response.data.map((rawPet) => {
		const animated = Boolean(rawPet[0])
		const tier = tiers.find((tier) => tier.slug == tierSlugs[rawPet[5]])
		const emoteSrc = tier.folderPath + rawPet[2] + (animated ? '.gif' : '.png')
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
