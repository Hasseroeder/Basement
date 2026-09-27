import * as messageHandler from './messageHandler.js'
import * as weaponHandler from './weapon.ts'
import { valueToPercent } from './util.js'
import type { PreparedWeapon, PreparedPassive, PreparedBuff } from './main.js'

export type StatOverrides = {
	baseStatOverrides: number[]
	buffStatOverrides: number[][]
	wpStatOverride?: number
}

const fabledPercent = 100 // default to this quality if can't read stats

function splitHypenSpaces(str: string) {
	const normalized = str
		.replace(/-+/g, '-') // "---" → "-"
		.replace(/\s+/g, ' ') // "   " → " "
		.replace(/,+/g, ',') // ",,," → ","
		.replace(/\.{2,}/g, '.') // "..." → "."
		.trim()

	// split on hyphen or space
	// but don't split when it's between two digits
	const parts = normalized.split(/(?<!\d)[ -]|[ -](?!\d)/)

	// drop any empty tokens just in case
	return parts.filter(Boolean)
}

const isValidJoinedNumbers = (str: string, separator: string) =>
	str.split(separator).every((part) => /^\d+(?:\.\d+)?$/.test(part))
// "5,20,30"   → valid
// "5 30 30"   → valid
// "5-20-30"   → valid
// "5"		   → valid
// "5.2-30"    → valid
// "5-20,30"   → invalid due to mixed seperator
// "5.2,30"    → valid for now, I will round later due to comma
// "5.2"       → valid for now, I will round later due to implied comma

function isCorrectStatAmount(str: string, statsNeeded: number) {
	const matches = str.match(/\d+(?:\.\d+)?/g)
	const amount = matches ? matches.length : 0
	return amount === statsNeeded
}

const isOnlyNumbers = (str: string) => /^[\d.,\s-]+$/.test(str)

function getStats(
	wear: string,
	{ item, statToken }: { item: PreparedWeapon | PreparedPassive; statToken: string },
	{ buffs }: { buffs: PreparedBuff[] }
): StatOverrides {
	const separator = statToken.match(/\d([,\- ])\d/)?.[1] ?? ','

	const buffArray = item.buffSlugs.map((slug) => {
		const buff = buffs.find((buff) => buff.slug === slug)
		if (!buff) throw new Error("Buff for buff slug doesn't seem to exist")
		return buff
	})

	const buffStatAmount = buffArray.flatMap((buff) => buff?.stats).length
	const itemStatAmount = item.stats.length
	const wpStatAmount = item.objectType === 'weapon' && item.wpStat ? 1 : 0

	const statAmount = buffStatAmount + itemStatAmount + wpStatAmount

	if (
		isOnlyNumbers(statToken) &&
		isValidJoinedNumbers(statToken, separator) &&
		isCorrectStatAmount(statToken, statAmount)
	) {
		const statInts = statToken
			.replace(/^[\s,-]+|[\s,-]+$/g, '')
			.split(separator)
			.map(Number)
		const wearBonus = { pristine: 5, fine: 3, decent: 1 }[wear] ?? 0
		let wpStatOverride: number | undefined = undefined
		const percentageMode = separator === ','
		let cursor = 0
		const read = (config: messageHandler.WeaponStat) => {
			const raw = statInts[cursor++]
			return percentageMode ? raw : valueToPercent(raw, config) - wearBonus
		}

		if (item.objectType === 'weapon' && item.wpStat) {
			const wpIndex = percentageMode ? statInts.length - 1 : 0
			wpStatOverride = percentageMode
				? statInts[wpIndex]
				: valueToPercent(statInts[wpIndex], item.wpStat) - wearBonus
			if (!percentageMode) cursor++
			// Move cursor past wpStat if it's at the front
		}

		return {
			baseStatOverrides: item.stats.map(read),
			buffStatOverrides: buffArray.map((buff) => buff.stats.map(read)),
			wpStatOverride,
		}
	}
	return {
		baseStatOverrides: item.stats.map((_) => fabledPercent),
		buffStatOverrides: buffArray.map((buff) => buff.stats.map((_) => fabledPercent)),
		wpStatOverride: item.objectType === 'weapon' && item.wpStat ? fabledPercent : undefined,
	}
}

function getMatches<T extends PreparedWeapon | PreparedPassive>(
	arrayToSearch: T[],
	query: string[]
): { item: T; statToken: string }[] {
	const queries = query.map((q) => q.toLowerCase())
	const checkItemMatch = (item: T, q: string) =>
		[item.name, item.slug, ...item.aliases].some((n) => n.toLowerCase() == q)

	return queries.flatMap((q, idx) =>
		arrayToSearch
			.filter((item) => checkItemMatch(item, q))
			.map((item) => ({
				item,
				statToken: query[idx + 1] ?? '',
			}))
	)
}

export function applyToWeapon(
	weapon: weaponHandler.Weapon,
	inputHash: string,
	wpbData: { weapons: PreparedWeapon[]; passives: PreparedPassive[]; buffs: PreparedBuff[] }
) {
	const { weapons, passives } = wpbData
	const tokens = splitHypenSpaces(inputHash)
	const weaponMatch = getMatches<PreparedWeapon>(weapons, tokens)[0] ?? {
		item: weapons[0],
		statToken: '',
	}
	// default to the first weapon entry if we don't get a valid match from the blueprint
	const wear = ['decent', 'fine', 'pristine'].includes(tokens[0]) ? tokens[0] : 'worn'

	weapon.setType(weaponMatch.item)
	weapon.applyStatOverrides(getStats(wear, weaponMatch, wpbData))
	getMatches<PreparedPassive>(passives, tokens).forEach((passiveMatch) =>
		weapon.addPassive(passiveMatch.item, getStats(wear, passiveMatch, wpbData))
	)
	weapon.wear = wear
	messageHandler.generateStatInputs(weapon)
}

export function toString(weapon: weaponHandler.Weapon) {
	const formatStats = (stats: messageHandler.WeaponStat[]) => {
		const isFabled = stats.every(({ noWear }) => noWear === 100)
		return isFabled ? '' : stats.map(({ noWear }) => noWear).join(',')
	}

	const wearString = weapon.wear !== 'worn' ? weapon.wear : ''
	const statstring = formatStats(weapon.selfStats)

	const passiveParts =
		weapon.passives.length === 0
			? ['none']
			: weapon.passives.flatMap((passive) => [passive.slug, formatStats(passive.allStats)])

	return [wearString, weapon.slug, statstring, ...passiveParts].filter(Boolean).join('-')
}
