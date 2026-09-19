import { make } from '@/src/utils/injectionUtil.js'

const weaponAssets = {
	...import.meta.glob('../../../assets/images/owo_images/battleEmojis/*', {
		eager: true,
		query: '?url',
		import: 'default',
	}),
	...import.meta.glob('../../../assets/images/owo_images/tiers/*', {
		eager: true,
		query: '?url',
		import: 'default',
	}),
}

export const weaponAssetUrl = (path) =>
	weaponAssets[`../../../assets/images/${path}`] ?? `/assets/images/${path}`

function getRarity(quality) {
	const tiers = [
		{ maxQuality: 20, name: 'common' },
		{ maxQuality: 40, name: 'uncommon' },
		{ maxQuality: 60, name: 'rare' },
		{ maxQuality: 80, name: 'epic' },
		{ maxQuality: 94, name: 'mythic' },
		{ maxQuality: 99, name: 'legendary' },
		{ maxQuality: 105, name: 'fabled' },
	]

	const tier = tiers.find((t) => Math.floor(quality) <= t.maxQuality) || tiers.at(-1)
	//default to fabled
	return tier.name
}

const percentToValue = (percent, { min, range }) => min + (range * percent) / 100

const valueToPercent = (value, { min, range }) => Math.round((100 * (value - min)) / range)

export async function fileExists(url) {
	try {
		const res = await fetch(url, { method: 'HEAD' })
		return res.ok && !res.headers.get('Content-Type')?.includes('text/html')
	} catch {
		return false
	}
}

function getTierEmojiPath(stringOrQuality) {
	const paths = {
		common: weaponAssetUrl('owo_images/tiers/common.png'),
		uncommon: weaponAssetUrl('owo_images/tiers/uncommon.png'),
		rare: weaponAssetUrl('owo_images/tiers/rare.png'),
		epic: weaponAssetUrl('owo_images/tiers/epic.png'),
		mythic: weaponAssetUrl('owo_images/tiers/mythic.png'),
		legendary: weaponAssetUrl('owo_images/tiers/legendary.gif'),
		fabled: weaponAssetUrl('owo_images/tiers/fabled.gif'),
	}
	if (stringOrQuality === undefined) {
		return paths['fabled']
	} else if (typeof stringOrQuality === 'string') {
		return paths[stringOrQuality]
	} else if (typeof stringOrQuality === 'number') {
		return paths[getRarity(stringOrQuality)]
	}
}

const wpEmojiPath = (wp) =>
	weaponAssetUrl('owo_images/battleEmojis/' + wp.prefix + wp.tier.at(0) + '_' + wp.slug + '.png')

export { wpEmojiPath, valueToPercent, percentToValue, getTierEmojiPath, getRarity }
