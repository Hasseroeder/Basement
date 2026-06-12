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
		{ name: 'common', priority: 0, prettyName: 'Common' },
		{ name: 'uncommon', priority: 1, prettyName: 'Uncommon' },
		{ name: 'rare', priority: 2, prettyName: 'Rare' },
		{ name: 'epic', priority: 3, prettyName: 'Epic' },
		{ name: 'mythical', priority: 4, prettyName: 'Mythic' },
		{ name: 'legendary', priority: 5, prettyName: 'Legendary' },
		{ name: 'gem', priority: 5, prettyName: 'Gem' },
		{ name: 'bot', priority: 6, prettyName: 'Bot' },
		{ name: 'distorted', priority: 7, prettyName: 'Distorted' },
		{ name: 'fabled', priority: 8, prettyName: 'Fabled' },
		{ name: 'hidden', priority: 9, prettyName: 'Hidden' },
		{ name: 'special', priority: 10, prettyName: 'Special' },
		{ name: 'patreon', priority: 11, prettyName: 'Patreon' },
		{ name: 'customPatreon', priority: 12, prettyName: 'Custom' },
	]
	const response = await loadJson('https://neonutil.com/api/animals')
	const tierNames = response.ranks
	return response.data.map((rawPet) => ({
		animated: rawPet[0],
		name: rawPet[1],
		lowerName: rawPet[1].toLowerCase(),
		emoji: rawPet[2],
		aliases: rawPet[3].map((alias) => alias.toLowerCase()),
		stats: rawPet[4],
		tier: tiers.find((tier) => tier.name == tierNames[rawPet[5]]),
	}))
}
