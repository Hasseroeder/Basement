import * as blueprinter from './blueprintParser.js'
import * as passiveHandler from './passiveHandler.js'
import * as buffHandler from './buffHandler.js'
import * as messageHandler from './messageHandler.js'
import { getRarity, wpEmojiPath } from './util.js'
import { debounce } from '@/src/utils/inputUtil.js'

export class WeaponFactory {
	static fromRandom(
		id,
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
}

class Weapon {
	constructor() {
		this.objectType = 'weapon'
		this.owner = { id: '@hsse', name: 'Heather' }
		this.weaponID = '664DFC' // TODO: get rid of these stupid defaults
		this.bList = document.getElementById('buff-container')
		this.image = document.getElementById('weapon-portrait')
		this._wear = 'worn'
		this.passives = []
		this.buffs = []
		// all staticData still uninitialized, which will need to be added before this is functional.
		// see below: setType()
	}

	setType(staticData) {
		if (staticData.objectType !== this.objectType)
			throw new Error('Invariant violation: Weapon type must use weapon static data')

		this.slug = staticData.slug
		this.stats = staticData.statConfig.map((noWearConfig) => ({ noWearConfig, noWear: 100 }))
		this.wpStat = staticData.wpStatConfig
			? { noWearConfig: staticData.wpStatConfig, noWear: 100 }
			: undefined

		this.name = staticData.name
		this.aliases = staticData.aliases
		this.statConfig = staticData.statConfig
		this.description = staticData.description
		this.buffSlugs = staticData.buffSlugs
		this.normalPassiveAmount = staticData.normalPassiveAmount

		this.buffs = []
		this.buffSlugs.forEach((slug) => {
			const staticData = WeaponFactory.wpbData.buffs.find((buff) => buff.slug === slug)
			new buffHandler.Buff({
				parent: this,
				staticData,
				statOverride: staticData.statConfig.map(() => 100),
			})
		})
	}

	applyStatOverrides({ base, buff: buffOverrides, wpStat }) {
		this.stats.forEach((stat, i) => (stat.noWear = base[i]))
		this.buffs.forEach((buff, i) =>
			buff.stats.forEach((stat, j) => (stat.noWear = buffOverrides[i][j]))
		)
		if (this.wpStat) this.wpStat.noWear = wpStat
	}

	addPassive(staticData, statOverride) {
		return new passiveHandler.Passive({
			parent: this,
			staticData,
			statOverride,
			wpbData: WeaponFactory.wpbData,
		})
	}

	finishBlueprint(wear) {
		messageHandler.generateStatInputs(this)
		this.wear = wear
	}

	get isEmpowered() {
		return this.passives.length > this.normalPassiveAmount
	}

	get hasWear() {
		return this.wearBonus != 0
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
		this.allStats.forEach((stat) => stat.IO.updateWear())
		this.updateQualities()
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

	get allStats() {
		return [
			...this.stats,
			...this.buffs.flatMap((b) => b.stats),
			this.wpStat,
			...this.passives.flatMap((p) => p.allStats),
		].filter(Boolean)
	}

	get selfStats() {
		return [...this.stats, ...this.buffs.flatMap((b) => b.stats), this.wpStat].filter(Boolean)
	}

	render() {
		messageHandler.displayInfo(this)
		this.updateHash()
	}

	updateHash = debounce(() => history.replaceState(null, '', '#' + blueprinter.toString(this)))

	updateImage() {
		this.image.src = wpEmojiPath(this)
	}

	updateQualities() {
		const calculateQualities = (statArray) =>
			statArray
				.reduce((acc, { withWear, noWear }) => [acc[0] + withWear, acc[1] + noWear], [0, 0])
				.map((v) => v / statArray.length)

		;[this, ...this.passives].forEach((statHaver) => {
			;[statHaver.qualityWear, statHaver.qualityNoWear] = calculateQualities(
				statHaver.allStats
			)
			statHaver.updateImage()
		})

		this.render()
	}
}
