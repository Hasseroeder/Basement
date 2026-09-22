async function loadJson(path) {
	var jsonData
	try {
		const response = await fetch(path)
		jsonData = await response.json()
	} catch (error) {
		console.error('Error loading json:', error)
	}
	return jsonData
}

export async function loadPets() {
	const localPetPath = '/assets/images/owo_images/pets/'
	const cdnPath = 'https://cdn.discordapp.com/emojis/'
	const tiers = [
		{ slug: 'common', prettyName: 'Common' },
		{ slug: 'uncommon', prettyName: 'Uncommon' },
		{ slug: 'rare', prettyName: 'Rare' },
		{ slug: 'epic', prettyName: 'Epic' },
		{ slug: 'mythical', prettyName: 'Mythic' },
		{ slug: 'legendary', prettyName: 'Legendary' },
		{ slug: 'gem', prettyName: 'Gem' },
		{ slug: 'bot', prettyName: 'Bot' },
		{ slug: 'distorted', prettyName: 'Distorted' },
		{ slug: 'fabled', prettyName: 'Fabled' },
		{ slug: 'hidden', prettyName: 'Hidden' },
		{ slug: 'special', prettyName: 'Special' },
		{ slug: 'patreon', prettyName: 'Patreon' },
		{ slug: 'cpatreon', prettyName: 'Custom' },
	]

	const response = await loadJson('https://neonutil.com/api/animals')
	//const response = await loadJson('/data/neonutilAnimalAPI.json')
	/*
		Neon's API doesn't give you a valid CORS response for local development.
		The CORS allows for just owo.bwep.net to have access to this data.
		Either you build a reverse proxy that serves this API for you. 
		Or you use this slightly outdated data at /public/data/neonutilAnimalAPI.json,
		as I've been doing when developing.
	*/
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
			tier, // { slug: string, prettyName: string }
		}
	})
}
