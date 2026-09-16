import { make } from '@/src/utils/injectionUtil.js'
import * as messageHandler from './messageHandler.js'
import { weaponAssetUrl } from './util.js'

export class Buff {
	constructor({ parent, staticData, statOverride }) {
		this.objectType = staticData.objectType
		if (this.objectType !== 'buff')
			throw new Error('Invariant violation: Buff constructor got passed a non-buff input')

		this.name = staticData.name
		this.slug = staticData.slug
		this.statConfig = staticData.statConfig
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

		this.stats = this.statConfig.map((statConfig, i) => ({
			noWearConfig: statConfig,
			noWear: statOverride[i],
		}))

		this.parent.buffs.push(this)
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
	updateQualities() {
		this.parent.updateQualities()
	}
}

export function appendBuffNode(buff) {
	const wrapper = make('div', { className: 'buffs__item' })
	const title = make('strong', { textContent: ` ${buff.name} - ` })

	wrapper.append(buff.image, title, ...messageHandler.generateDescription(buff))
	buff.parent.bList.appendChild(wrapper)
}
