async function loadJson(path: string) {
	var jsonData
	try {
		const response = await fetch(path)
		jsonData = await response.json()
	} catch (error) {
		console.error('Error loading json:', error)
	}
	return jsonData
}

export type RawPet = {
	readonly animated: boolean
	readonly prettyName: string
	readonly slug: string
	readonly emoteSrc: string
	readonly aliases: string[]
	readonly stats: number[]
	readonly tier: { readonly slug: string; readonly prettyName: string }
}

export async function loadPets(): Promise<RawPet[]> {
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
	return response.data.map((rawPet: [number, string, string, string[], number[], number]) => {
		const animated = Boolean(rawPet[0])
		const tier = tiers.find((tier) => tier.slug === tierSlugs[rawPet[5]])
		if (!tier)
			throw new Error('Scientists have discovered a new tier?! -- slug tier not found x3')
		const prettyName = rawPet[1]
		const slug = rawPet[1].toLowerCase()
		const aliases = rawPet[3].map((alias) => alias.toLowerCase())
		const stats = rawPet[4]
		const defaultSrc = cdnPath + rawPet[2] + (animated ? '.gif' : '.png')

		const hiddenSrcOverride = {
			hmonkey: `${localPetPath}monkey.png`,
			hlizard: `${localPetPath}lizard.png`,
			hkoala: `${localPetPath}koala.png`,
			hsquid: `${localPetPath}octopus.png`,
			hsnake: `${localPetPath}snake.png`,
		}[slug]

		const curemSrcOverride = ['common', 'uncommon', 'rare', 'epic', 'mythical'].includes(
			tier.slug
		)
			? localPetPath + slug + '.png'
			: undefined

		const emoteSrc = curemSrcOverride ?? hiddenSrcOverride ?? defaultSrc

		const pet: RawPet = {
			animated,
			prettyName,
			slug,
			emoteSrc,
			aliases,
			stats,
			tier,
		}

		return pet
	})
}
