import * as messageHandler from './messageHandler.js'
import * as passiveHandler from './passiveHandler.js'
import * as weaponHandler from './weapon.js'
import { make } from '@/src/utils/injectionUtil.ts'
import { weaponAssetUrl } from './util.js'
import type { RawBuff } from '../../wpbTypes.js'

export class Buff {
	constructor({
		parent,
		staticData,
	}: {
		parent: weaponHandler.Weapon | passiveHandler.Passive
		staticData: RawBuff
	}) {
		this.objectType = staticData.objectType
		this.name = staticData.name
		this.slug = staticData.slug
		this.traits = staticData.traits
		this.description = staticData.description
		this.parent = parent
		this.image = make('img', {
			src: weaponAssetUrl('owo_images/battleEmojis/' + this.slug + '.png'),
			ariaLabel: this.slug,
			alt: ':' + this.slug + ':',
			draggable: false,
			className: 'buffs__emote',
		})

		this.stats = staticData.rawStatConfigs.map(
			(stat) => new messageHandler.WeaponStat(this, stat)
		)
		appendBuffNode(this)
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
	render() {
		this.parent.render()
	}

	stats: messageHandler.WeaponStat[]

	objectType: 'buff'

	description: string

	slug: string

	name: string

	parent: passiveHandler.Passive | weaponHandler.Weapon

	image: HTMLImageElement

	traits: { slug: string; value?: number }[]
}

export function appendBuffNode(buff: Buff) {
	const wrapper = make('div', { className: 'buffs__item' })
	const title = make('strong', { textContent: ` ${buff.name} - ` })

	wrapper.append(buff.image, title, ...messageHandler.generateDescription(buff))
	buff.parent.bList.appendChild(wrapper)
}
