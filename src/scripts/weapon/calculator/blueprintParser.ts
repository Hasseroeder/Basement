import * as messageHandler from './messageHandler.js'
import * as weaponHandler from './weapon.ts'
import { valueToPercent } from './util.js'
import type { RawBuff, RawPassive, RawStatConfig, RawWeapon } from '../../wpbTypes.ts'
import { Weapon } from './weapon.ts'
import { getElement } from '@/src/utils/domUtil.ts'

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
	{ item, statToken }: { item: RawWeapon | RawPassive; statToken: string },
	{ buffs }: { buffs: RawBuff[] }
): StatOverrides {
	const separator = statToken.match(/\d([,\- ])\d/)?.[1] ?? ','

	const buffArray = item.buffSlugs.map((slug) => {
		const buff = buffs.find((buff) => buff.slug === slug)
		if (!buff) throw new Error("Buff for buff slug doesn't seem to exist")
		return buff
	})

	const buffStatAmount = buffArray.flatMap((buff) => buff?.rawStatConfigs).length
	const itemStatAmount = item.rawStatConfigs.length
	const wpStatAmount = item.objectType === 'weapon' && item.rawWPStatConfig ? 1 : 0

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
		const read = (config: RawStatConfig) => {
			const raw = statInts[cursor++]
			return percentageMode ? raw : valueToPercent(raw, config) - wearBonus
		}

		if (item.objectType === 'weapon' && item.rawWPStatConfig) {
			const wpIndex = percentageMode ? statInts.length - 1 : 0
			wpStatOverride = percentageMode
				? statInts[wpIndex]
				: valueToPercent(statInts[wpIndex], item.rawWPStatConfig) - wearBonus
			if (!percentageMode) cursor++
			// Move cursor past wpStat if it's at the front
		}

		return {
			baseStatOverrides: item.rawStatConfigs.map(read),
			buffStatOverrides: buffArray.map((buff) => buff.rawStatConfigs.map(read)),
			wpStatOverride,
		}
	}
	return {
		baseStatOverrides: item.rawStatConfigs.map((_) => fabledPercent),
		buffStatOverrides: buffArray.map((buff) => buff.rawStatConfigs.map((_) => fabledPercent)),
		wpStatOverride:
			item.objectType === 'weapon' && item.rawWPStatConfig ? fabledPercent : undefined,
	}
}

function getMatches<T extends RawWeapon | RawPassive>(
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

export function createWeapon(
	inputHash: string,
	wpbData: { weapons: RawWeapon[]; passives: RawPassive[]; buffs: RawBuff[] }
) {
	const { weapons, passives } = wpbData
	const tokens = splitHypenSpaces(inputHash)
	const weaponMatch = getMatches<RawWeapon>(weapons, tokens)[0] ?? {
		item: weapons[0],
		statToken: '',
	}
	// default to the first weapon entry if we don't get a valid match from the blueprint
	const wear = ['decent', 'fine', 'pristine'].includes(tokens[0]) ? tokens[0] : 'worn'

	const weapon = new Weapon(weaponMatch.item, getStats(wear, weaponMatch, wpbData), wpbData)
	getMatches<RawPassive>(passives, tokens).forEach((passiveMatch) =>
		weapon.addPassive(passiveMatch.item, wpbData, getStats(wear, passiveMatch, wpbData))
	)
	weapon.wear = wear
	getElement<HTMLSelectElement>('#wear-select').value = wear

	messageHandler.generateStatInputs(weapon)

	return weapon
}

export function weaponToString(weapon: weaponHandler.Weapon) {
	const formatStats = (stats: messageHandler.WeaponStat[]) => {
		const isFabled = stats.every(({ noWear: noWear }) => noWear === 100)
		return isFabled ? '' : stats.map(({ noWear: noWear }) => noWear).join(',')
	}

	const wearString = weapon.wear !== 'worn' ? weapon.wear : ''
	const weaponStats = [...weapon.stats, ...weapon.buffStats, weapon.wpStat].filter(
		(stat) => stat !== undefined
	)
	const statstring = formatStats(weaponStats)

	const passiveParts =
		weapon.passives.length === 0
			? ['none']
			: weapon.passives.flatMap((passive) => [
					passive.slug,
					formatStats([...passive.passiveStats, ...passive.buffStats]),
				])

	return [wearString, weapon.slug, statstring, ...passiveParts].filter(Boolean).join('-')
}
