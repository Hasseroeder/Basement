import * as buffHandler from './buffHandler.js'
import * as weaponHandler from './weapon.js'
import * as messageHandler from './messageHandler.js'
import { getRarity } from './util.js'
import { make } from '@/src/utils/injectionUtil.ts'
import { getElement } from '@/src/utils/domUtil.js'
import type { RawPassive } from '../../wpbTypes.js'

const pList = getElement('#passives')

export function appendPassiveNode(passive: Passive) {
	const wrapper = make('div', { className: 'passives__item' })
	passive.image.onclick = () => {
		passive.remove()
		wrapper.remove()
	}
	passive.render()

	const title = make('strong', {
		textContent: ` ${passive.name} - `,
	})

	wrapper.append(
		passive.image,
		title,
		...messageHandler.generateDescription(passive),
		passive.bList
	)
	pList.appendChild(wrapper)
}

export class Passive {
	constructor({ parent, staticData }: { parent: weaponHandler.Weapon; staticData: RawPassive }) {
		this.objectType = staticData.objectType
		this.name = staticData.name
		this.slug = staticData.slug
		this.aliases = staticData.aliases
		this.description = staticData.description
		this.parent = parent
		this.image = make('img', {
			ariaLabel: this.slug,
			alt: ':' + this.slug + ':',
			draggable: false,
			className: 'passives__emote',
		})
		this.bList = make('div', { className: 'buff-container' })

		this.stats = staticData.rawStatConfigs.map(
			(stat) => new messageHandler.WeaponStat(this, stat)
		)
		this.buffs = staticData.buffSlugs.map((slug) => {
			const buffData = weaponHandler.WeaponFactory.wpbData.buffs.find(
				(buff) => buff.slug === slug
			)
			if (!buffData)
				throw new Error('Invariant Violation: buff for buff slug does not exist.')
			return new buffHandler.Buff({
				parent: this,
				staticData: buffData,
			})
		})

		this.parent.passives.push(this)
		appendPassiveNode(this)
	}

	get passiveStats() {
		return this.stats
	}

	get buffStats() {
		return this.buffs.flatMap((b) => b.stats)
	}

	get prefix() {
		return ''
	}

	get tier() {
		return getRarity(this.qualityWear)
	}

	get wear() {
		return this.parent.wear
	}
	get wearName() {
		return this.parent.wearName
	}
	get wearBonus() {
		return this.parent.wearBonus
	}

	remove() {
		this.parent.passives = this.parent.passives.filter((p) => p !== this)
		this.parent.render()
	}

	render() {
		this.parent.render()
	}

	get qualityWear() {
		const releveantStats = [...this.passiveStats, ...this.buffStats]
		const cumStats = releveantStats.reduce((acc, stat) => acc + stat.withWear, 0)
		return cumStats / releveantStats.length
	}

	slug: string

	name: string

	description: string

	aliases: string[]

	parent: weaponHandler.Weapon

	image: HTMLImageElement

	bList: HTMLDivElement

	stats: messageHandler.WeaponStat[]

	buffs: buffHandler.Buff[]

	objectType: 'passive'
}
