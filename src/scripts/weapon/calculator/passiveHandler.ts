import * as buffHandler from './buffHandler.js'
import * as weaponHandler from './weapon.js'
import * as messageHandler from './messageHandler.js'
import { getRarity } from './util.js'
import { make } from '@/src/utils/injectionUtil.ts'
import { getElement } from '@/src/utils/domUtil.js'
import type { PreparedPassive } from './main.js'

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
	constructor({
		parent,
		staticData,
	}: {
		parent: weaponHandler.Weapon
		staticData: PreparedPassive
	}) {
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

		this.stats = staticData.stats.map((stat) => stat.initializeWith(this))
		this.stats.forEach((stat) => stat._syncAll(100))
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

	get allStats(): messageHandler.WeaponStat[] {
		const allStats = [...this.stats, ...this.buffs.flatMap((b) => b.stats)]
		allStats.forEach((stat) => {
			if (!stat) throw new Error("We've fucked up somehow and a stat is undefined")
		})
		return allStats as messageHandler.WeaponStat[]
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
		const cumStats = this.allStats.reduce((acc, stat) => acc + stat.withWear, 0)
		return cumStats / this.allStats.length
	}

	get qualityNoWear() {
		const cumStats = this.allStats.reduce((acc, stat) => acc + stat.noWear, 0)
		return cumStats / this.allStats.length
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
