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
		{ priority: 0, slug: 'common', prettyName: 'Common' },
		{ priority: 1, slug: 'uncommon', prettyName: 'Uncommon' },
		{ priority: 2, slug: 'rare', prettyName: 'Rare' },
		{ priority: 3, slug: 'epic', prettyName: 'Epic' },
		{ priority: 4, slug: 'mythical', prettyName: 'Mythic' },
		{ priority: 5, slug: 'legendary', prettyName: 'Legendary' },
		{ priority: 6, slug: 'gem', prettyName: 'Gem' },
		{ priority: 7, slug: 'bot', prettyName: 'Bot' },
		{ priority: 8, slug: 'distorted', prettyName: 'Distorted' },
		{ priority: 9, slug: 'fabled', prettyName: 'Fabled' },
		{ priority: 10, slug: 'hidden', prettyName: 'Hidden' },
		{ priority: 11, slug: 'special', prettyName: 'Special' },
		{ priority: 12, slug: 'patreon', prettyName: 'Patreon' },
		{ priority: 13, slug: 'cpatreon', prettyName: 'Custom' },
	]

	const response = await loadJson('https://neonutil.com/api/animals')
	const tierSlugs = response.ranks
	return response.data.map((rawPet) => {
		const animated = Boolean(rawPet[0])
		const tier = tiers.find((tier) => tier.slug === tierSlugs[rawPet[5]])
		const prettyName = rawPet[1]
		const slug = rawPet[1].toLowerCase()
		const aliases = rawPet[3].map((alias) => alias.toLowerCase())
		const stats = rawPet[4]
		let emoteSrc = cdnPath + rawPet[2] + (animated ? '.gif' : '.png')

		if (tier.slug === 'hidden')
			emoteSrc = {
				hmonkey: `${localPetPath}monkey.png`,
				hlizard: `${localPetPath}lizard.png`,
				hkoala: `${localPetPath}koala.png`,
				hsquid: `${localPetPath}octopus.png`,
				hsnake: `${localPetPath}snake.png`,
			}[slug]
		else if (['common', 'uncommon', 'rare', 'epic', 'mythical'].includes(tier.slug))
			emoteSrc = localPetPath + slug + '.png'

		return {
			animated, //bool
			prettyName, //string
			slug, //string
			emoteSrc, // string
			aliases, // string[]
			stats, // int[]
			tier, // { slug: string, priority: int, prettyName: string }
		}
	})
}
