import * as blueprinter from './blueprintParser.js'
import * as passiveHandler from './passiveHandler.js'
import * as buffHandler from './buffHandler.js'
import * as messageHandler from './messageHandler.js'
import { getRarity, weaponEmojiPath } from './util.js'
import { debounce } from '@/src/utils/inputUtil.ts'
import { getElement } from '@/src/utils/domUtil.js'
import type { PreparedWeapon, PreparedPassive, PreparedBuff } from './main.js'

export type WpbData = {
	weapons: PreparedWeapon[]
	passives: PreparedPassive[]
	buffs: PreparedBuff[]
}

export class WeaponFactory {
	static fromRandom(
		id: number,
		settings = {
			doPassives: true,
			defaultQuality: NaN,
			defaultWear: 'worn',
		}
	) {
		// will need to generate random weapon stats and passives and such
		// note: rune needs special stats
	}

	static fromHash() {
		const weapon = new Weapon()
		blueprinter.applyToWeapon(weapon, location.hash.slice(1), WeaponFactory.wpbData)
		return weapon
	}

	static wpbData: WpbData
}

export class Weapon {
	constructor() {
		this.owner = { id: '@hsse', name: 'Heather' }
		this.weaponID = '664DFC' // TODO: get rid of these stupid defaults
		this.bList = getElement<HTMLDivElement>('#buff-container')
		this.image = getElement<HTMLImageElement>('#weapon-portrait')
		this._wear = 'worn'
		this.passives = []
		this.buffs = []
		// all staticData still uninitialized, which will need to be added before this is functional.
		// see below: setType()
	}

	setType(staticData: PreparedWeapon) {
		this.objectType = staticData.objectType
		this.slug = staticData.slug
		this.name = staticData.name
		this.aliases = staticData.aliases
		this.description = staticData.description
		this.normalPassiveAmount = staticData.normalPassiveAmount

		this.wpStat = staticData.wpStat?.initializeWith(this)
		this.stats = staticData.stats.map((stat) => stat.initializeWith(this))

		this.buffs = staticData.buffSlugs.map((slug) => {
			const buffData = WeaponFactory.wpbData.buffs.find((buff) => buff.slug === slug)
			if (!buffData)
				throw new Error('Invariant Violation: buff for buff slug does not exist.')
			return new buffHandler.Buff({
				parent: this,
				staticData: buffData,
			})
		})
	}

	objectType?: 'weapon'

	owner: {
		id: string
		name: string
	}

	weaponID: string

	bList: HTMLDivElement

	image: HTMLImageElement

	_wear: string

	passives: passiveHandler.Passive[]

	buffs: buffHandler.Buff[]

	slug?: string

	name?: string

	aliases?: string[]

	description?: string

	normalPassiveAmount?: 1 | 2

	get qualityWear() {
		const cumStats = this.allStats.reduce((acc, stat) => acc + stat.withWear, 0)
		return cumStats / this.allStats.length
	}

	get qualityNoWear() {
		const cumStats = this.allStats.reduce((acc, stat) => acc + stat.noWear, 0)
		return cumStats / this.allStats.length
	}

	stats?: messageHandler.WeaponStat[]

	wpStat?: messageHandler.WeaponStat

	applyStatOverrides({
		baseStatOverrides,
		buffStatOverrides,
		wpStatOverride,
	}: blueprinter.StatOverrides) {
		// TODO: oh my god this function looks ugly
		if (!this.stats) throw new Error('weapon.stats undefined when overrides applied')
		this.stats.forEach((stat, i) => (stat.noWear = baseStatOverrides[i]))
		this.buffs.forEach((buff, i) => {
			if (!buff.stats) throw new Error('buff.stats undefined when overrides applied')
			buff.stats.forEach((stat, j) => (stat.noWear = buffStatOverrides[i][j]))
		})
		if (this.wpStat && wpStatOverride) this.wpStat.noWear = wpStatOverride
		else if ((!this.wpStat && wpStatOverride) || (this.wpStat && !wpStatOverride))
			throw new Error('wpStat data corrupt')
	}

	addPassive(staticData: PreparedPassive, statOverride?: blueprinter.StatOverrides) {
		return new passiveHandler.Passive({
			parent: this,
			staticData: staticData,
		})
	}

	get isEmpowered() {
		if (!this.normalPassiveAmount) throw new Error('weapon.normalPassiveAmount undefined')
		return this.passives.length > this.normalPassiveAmount
	}

	get hasWear() {
		return this.wearBonus !== 0
	}

	get prefix() {
		if (this.isEmpowered) return 'b'
		else if (this.hasWear) return 'p'
		else return ''
	}

	get shardValue() {
		if (this.slug === 'rune') return
		var value = {
			common: 1,
			uncommon: 3,
			rare: 5,
			epic: 25,
			mythic: 300,
			legendary: 1000,
			fabled: 5000,
		}[this.tier]
		if (this.prefix === 'b') value = 1.5 * value
		return value
	}

	set wear(v) {
		this._wear = v
		this.allStats.forEach((stat) => stat.updateWear())
		this.render()
	}
	get wear() {
		return this._wear
	}
	get wearName() {
		return (
			{
				pristine: 'Pristine\u00A0',
				fine: 'Fine\u00A0',
				decent: 'Decent\u00A0',
			}[this.wear] ?? ''
		)
	}
	get wearBonus() {
		return (
			{
				pristine: 5,
				fine: 3,
				decent: 1,
			}[this.wear] ?? 0
		)
	}

	get tier() {
		return getRarity(this.qualityWear)
	}

	get allStats(): messageHandler.WeaponStat[] {
		if (!this.stats) throw new Error('weapon.stats undefined')
		return [
			...this.stats,
			...this.buffs.flatMap((b) => b.stats),
			this.wpStat,
			...this.passives.flatMap((p) => p.allStats),
		].filter((stat) => stat !== undefined)
		// I'd love to use .filter(Boolean) but TypeScript doesn't understand that
	}

	get selfStats(): messageHandler.WeaponStat[] {
		if (!this.stats) throw new Error('weapon.stats undefined')
		const allStats = [...this.stats, ...this.buffs.flatMap((b) => b.stats), this.wpStat]
		return allStats.filter((stat) => stat !== undefined)
		// I'd love to use .filter(Boolean) but TypeScript doesn't understand that
	}

	updateHash = debounce(() => history.replaceState(null, '', '#' + blueprinter.toString(this)))

	render() {
		this.image.src = weaponEmojiPath(this)
		this.passives.forEach((passive) => (passive.image.src = weaponEmojiPath(passive)))
		messageHandler.displayInfo(this)
		this.updateHash()
	}
}
