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
	const localPetPath = '/src/assets/images/owo_images/pets/'
	const cdnPath = 'https://cdn.discordapp.com/emojis/'
	const tiers = [
		['common', 0, 'Common', localPetPath],
		['uncommon', 1, 'Uncommon', localPetPath],
		['rare', 2, 'Rare', localPetPath],
		['epic', 3, 'Epic', localPetPath],
		['mythical', 4, 'Mythic', localPetPath],
		['legendary', 5, 'Legendary', cdnPath],
		['gem', 5, 'Gem', cdnPath],
		['bot', 6, 'Bot', cdnPath],
		['distorted', 7, 'Distorted', cdnPath],
		['fabled', 8, 'Fabled', cdnPath],
		['hidden', 9, 'Hidden', cdnPath],
		['special', 10, 'Special', cdnPath],
		['patreon', 11, 'Patreon', cdnPath],
		['cpatreon', 12, 'Custom', cdnPath],
	].map(([slug, priority, prettyName, folderPath]) => ({ slug, priority, prettyName, folderPath }))

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
