import * as passiveHandler from './passiveHandler'
import * as weaponHandler from './weapon'

const weaponAssets = {
	...import.meta.glob('@/src/assets/images/owo_images/battleEmojis/*', {
		eager: true,
		query: '?url',
		import: 'default',
	}),
	...import.meta.glob('@/src/assets/images/owo_images/tiers/*', {
		eager: true,
		query: '?url',
		import: 'default',
	}),
}

export type TierName = 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic' | 'legendary' | 'fabled'
export type WearName = 'worn' | 'decent' | 'fine' | 'pristine'

export const weaponAssetUrl = (path: string) =>
	weaponAssets[`@/src/assets/images/${path}`] ?? `/assets/images/${path}`

function getRarity(quality: number) {
	const tiers: { maxQuality: number; name: TierName }[] = [
		{ maxQuality: 20, name: 'common' },
		{ maxQuality: 40, name: 'uncommon' },
		{ maxQuality: 60, name: 'rare' },
		{ maxQuality: 80, name: 'epic' },
		{ maxQuality: 94, name: 'mythic' },
		{ maxQuality: 99, name: 'legendary' },
		{ maxQuality: 105, name: 'fabled' },
	]

	const tier = tiers.find((t) => Math.floor(quality) <= t.maxQuality) ?? tiers[tiers.length - 1]
	return tier.name
}

const percentToValue = (percent: number, { min, max }: { min: number; max: number }) => {
	const range = max - min
	return min + (range * percent) / 100
}

const valueToPercent = (value: number, { min, max }: { min: number; max: number }) => {
	const range = max - min
	return Math.round((100 * (value - min)) / range)
}

export async function fileExists(url: string) {
	try {
		const res = await fetch(url, { method: 'HEAD' })
		return res.ok && !res.headers.get('Content-Type')?.includes('text/html')
	} catch {
		return false
	}
}

function getTierEmojiPath(stringOrQuality: TierName | number | undefined): string {
	const paths = {
		common: weaponAssetUrl('owo_images/tiers/common.png'),
		uncommon: weaponAssetUrl('owo_images/tiers/uncommon.png'),
		rare: weaponAssetUrl('owo_images/tiers/rare.png'),
		epic: weaponAssetUrl('owo_images/tiers/epic.png'),
		mythic: weaponAssetUrl('owo_images/tiers/mythic.png'),
		legendary: weaponAssetUrl('owo_images/tiers/legendary.gif'),
		fabled: weaponAssetUrl('owo_images/tiers/fabled.gif'),
	}
	let path = paths['fabled']
	if (typeof stringOrQuality === 'string') {
		path = paths[stringOrQuality]
	} else if (typeof stringOrQuality === 'number') {
		path = paths[getRarity(stringOrQuality)]
	}
	return path
}

const weaponEmojiPath = (statHaver: passiveHandler.Passive | weaponHandler.Weapon) =>
	weaponAssetUrl(
		'owo_images/battleEmojis/' +
			statHaver.prefix +
			statHaver.tier.at(0) +
			'_' +
			statHaver.slug +
			'.png'
	)

export { weaponEmojiPath, valueToPercent, percentToValue, getTierEmojiPath, getRarity }
