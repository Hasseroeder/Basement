import {
	valueToPercent,
	percentToValue,
	getTierEmojiPath,
	weaponAssetUrl,
	fileExists,
} from './util.js'
import { make } from '@/src/utils/injectionUtil.ts'
import { getElement } from '@/src/utils/domUtil.js'
import * as passiveHandler from './passiveHandler.js'
import * as weaponHandler from './weapon.js'
import * as buffHandler from './buffHandler.js'
import type { RawStatConfig } from '../../wpbTypes.js'

const el = {
	weaponHeader: getElement<HTMLSpanElement>('#weapon-header'),
	weaponName: getElement<HTMLDivElement>('#weapon-name'),
	ownerID: getElement<HTMLDivElement>('#owner-id'),
	weaponID: getElement<HTMLElement>('#weapon-id'),
	shardValue: getElement<HTMLDivElement>('#shard-value'),
	weaponQualityImage: getElement<HTMLImageElement>('#weapon-quality-image'),
	weaponQualitySpan: getElement<HTMLSpanElement>('#weapon-quality-span'),
	wpCost: getElement<HTMLDivElement>('#wp-cost'),
	description: getElement<HTMLDivElement>('#weapon-line--description'),
}

function generateDescription(
	item: passiveHandler.Passive | weaponHandler.Weapon | buffHandler.Buff
) {
	const TOKEN_SPECS = [
		{ name: 'STAT', pattern: '\\[stat\\]' },
		{ name: 'IMAGE', pattern: ':[A-Za-z0-9_+]+:' },
		{ name: 'BOLD', pattern: '\\*\\*[^*]+\\*\\*' },
		{ name: 'ITALIC', pattern: '\\*[^*]+\\*' },
		{ name: 'NEWLINE', pattern: '\\r?\\n' },
	]

	const tokenRegex = new RegExp('(' + TOKEN_SPECS.map((s) => s.pattern).join('|') + ')', 'g')

	const NEWLINE_RE = /^\r?\n$/
	const STAT_TOKEN = '[stat]'
	const IMAGE_RE = /^:([A-Za-z0-9_+]+):$/
	const BOLD_RE = /^\*\*([^*]+)\*\*$/
	const ITALIC_RE = /^\*([^*]+)\*$/

	if (!item.description)
		throw new Error('Tried to generate a description for a not yet initialized item.')
	const parts = item.description.split(tokenRegex)
	let statIndex = 0

	function descriptionEmote(inputString: string) {
		const gifUrl = weaponAssetUrl(`owo_images/battleEmojis/${inputString}.gif`)
		const pngUrl = weaponAssetUrl(`owo_images/battleEmojis/${inputString}.png`)
		if (!item.objectType)
			throw new Error('Tried to generate a description for a not yet initialized item.')
		const className = {
			passive: 'passives__emote',
			buff: 'buffs__emote',
			weapon: 'weapon-line--description__emote',
		}[item.objectType]

		if (!className)
			throw new Error(
				"Invariant violation: Weapon, Buff, or Passive doesn't have a valid objectType"
			)

		const image = make('img', {
			alt: `:${inputString}:`,
			ariaLabel: inputString,
			title: `:${inputString}:`,
			className,
		})

		fileExists(gifUrl).then((exists) => (image.src = exists ? gifUrl : pngUrl))

		return image
	}

	function elif(part: string) {
		if (NEWLINE_RE.test(part)) return document.createElement('br')
		if (part === STAT_TOKEN) return getStatNode()

		const imgMatch = part.match(IMAGE_RE)
		if (imgMatch) return descriptionEmote(imgMatch[1])

		const boldMatch = part.match(BOLD_RE)
		if (boldMatch)
			return make('span', {
				style: { fontWeight: 'bold' },
				textContent: boldMatch[1],
			})

		const italicMatch = part.match(ITALIC_RE)
		if (italicMatch)
			return make('span', {
				style: { fontStyle: 'italic' },
				textContent: italicMatch[1],
			})

		return document.createTextNode(part)
	}

	function getStatNode(): HTMLDivElement {
		const stats = item.stats
		const _statIdx = statIndex++
		if (!stats || !stats[_statIdx].wrapper)
			throw new Error('Tried to generate a description for a not yet initialized item.')
		return stats[_statIdx].wrapper
	}

	return parts.map(elif)
}

function generateWPInput(weapon: weaponHandler.Weapon) {
	//TODO: check whether I really need these characters for nbsp
	const stat = weapon.wpStat
	return stat && stat.wrapper ? stat.wrapper : `\u00A0${0}\u00A0`
}

const clamp = (val: number, { min, max, step }: { min: number; max: number; step: number }) => {
	if (isNaN(val)) val = min
	const offset = (val - min) / step
	const snapped = min + Math.round(offset) * step
	return Math.min(max, Math.max(min, snapped))
}

export class WeaponStat {
	constructor(stat: RawStatConfig) {
		this.max = stat.max
		this.min = stat.min
		this.noWear = 100
		this.emoji = stat.emoji
		this.unit = stat.unit
		this.digits = stat.digits
		// still has uninitialized properties
	}

	initializeWith(parent: buffHandler.Buff | passiveHandler.Passive | weaponHandler.Weapon) {
		this.parent = parent
		this._buildDOM()
		return this
	}

	get step() {
		return this.range / 100
	}
	get range() {
		return this.max - this.min
	}
	get wear() {
		if (!this.parent) throw new Error('WeaponStat.wear asked before parent was set')
		return this.parent.wear
	}
	get wearBonus() {
		if (!this.parent) throw new Error('WeaponStat.wearBonus asked before parent was set')
		return this.parent.wearBonus
	}
	get wearName() {
		if (!this.parent) throw new Error('WeaponStat.wearName asked before parent was set')
		return this.parent.wearName
	}

	get percentageConfig() {
		const bonus = this.wearBonus
		return {
			min: bonus,
			max: 100 + bonus,
			range: 100,
			step: 1,
			unit: '%',
			digits: 3.5,
		}
	}

	get wearConfig() {
		const bonus = this.step * this.wearBonus
		return {
			...this,
			range: this.range,
			step: this.step,
			min: this.min + bonus,
			max: this.max + bonus,
		}
	}

	_buildDOM() {
		const makeUnitLabel = ({ unit }: { unit: string }) =>
			make('span', {
				className: 'input-wrapper__unit-span',
				textContent: unit,
			})

		this.numberInput = createRangedInput('number', this.wearConfig)
		this.numberLabel = makeUnitLabel(this)
		this.qualityInput = createRangedInput('number', this.percentageConfig, { height: '1.5rem' })
		this.qualityLabel = makeUnitLabel(this.percentageConfig)
		this.slider = createRangedInput('range', this.wearConfig)
		this.img = make('img', {
			className: 'input-wrapper__tier-emote',
		})
		this.tooltip = make('div', { className: 'input-wrapper__tooltip' }, [
			this.img,
			this.qualityInput,
			this.qualityLabel,
			this.slider,
		])
		this.wrapper = make('div', { className: 'input-wrapper' }, [
			this.numberInput,
			this.numberLabel,
			this.tooltip,
		])

		this._wireEvents({
			numberInput: this.numberInput,
			qualityInput: this.qualityInput,
			slider: this.slider,
		})
	}

	_wireEvents({
		numberInput,
		qualityInput,
		slider,
	}: {
		numberInput: HTMLInputElement
		qualityInput: HTMLInputElement
		slider: HTMLInputElement
	}) {
		const wire = (input: HTMLInputElement, valueType: 'raw' | 'percent') => {
			// TODO: check everything on whether I need NaN guards again
			input.addEventListener('input', (e) => {
				if (input.value === '' || e.data === '.' || e.data === ',') return
				const val =
					valueType === 'percent'
						? Number(input.value)
						: valueToPercent(Number(input.value), this)
				this._syncAll(val)
			})
			input.addEventListener('change', (e) => {
				const val =
					valueType === 'percent'
						? Number(input.value)
						: valueToPercent(Number(input.value), this)
				this._syncAll(clamp(val, this.percentageConfig))
			})
		}
		wire(numberInput, 'raw')
		wire(qualityInput, 'percent')
		wire(slider, 'raw')
	}

	_syncAll(pct: number) {
		if (!this.parent) throw new Error('WeaponStat._syncAll called before parent was set')
		if (!this.numberInput || !this.slider || !this.img || !this.qualityInput)
			throw new Error('WeaponStat input dom nonexistant at _syncAll call time')
		const noWearPct = pct - this.wearBonus
		const rawValue = percentToValue(pct, this)
		const floatfixValue = String(Number(rawValue.toFixed(10)))

		this.numberInput.value = floatfixValue
		this.slider.value = floatfixValue

		// percentToValue() 100% -> Sword 55% STR
		// valueToPercent() Sword 55% STR -> 100%

		this.qualityInput.value = String(pct)
		this.img.src = getTierEmojiPath(pct)
		this.noWear = noWearPct

		this.parent.render()
	}

	updateWear() {
		;[
			{ el: this.numberInput, config: this.wearConfig },
			{ el: this.slider, config: this.wearConfig },
			{ el: this.qualityInput, config: this.percentageConfig },
		].forEach((input) => {
			if (!input.el)
				throw new Error('wear tried to be updated before input elements were created')
			const { min, max } = input.config
			input.el.min = String(Math.min(min, max))
			input.el.max = String(Math.max(min, max))
		})

		this._syncAll(this.noWear + this.wearBonus)
	}

	noWear: number

	get withWear() {
		return this.noWear + this.wearBonus
	}

	parent?: buffHandler.Buff | passiveHandler.Passive | weaponHandler.Weapon

	min: number

	max: number

	unit: string

	emoji: string[]

	digits: number

	numberInput?: HTMLInputElement

	slider?: HTMLInputElement

	qualityInput?: HTMLInputElement

	tooltip?: HTMLDivElement

	wrapper?: HTMLDivElement

	qualityLabel?: HTMLSpanElement

	numberLabel?: HTMLSpanElement

	img?: HTMLImageElement
}

function displayInfo(weapon: weaponHandler.Weapon) {
	if (!weapon.name || !weapon.qualityWear)
		throw new Error('weapon.name or weapon.qualityWear undefined at displayInfo')

	el.weaponHeader.textContent = weapon.owner.name + "'s " + weapon.wearName + weapon.name
	el.weaponName.textContent = weapon.name
	el.ownerID.textContent = weapon.owner.id
	el.weaponID.textContent = weapon.weaponID
	const wsValue = weapon.shardValue
	const shardString = wsValue ? wsValue + ' selling / ' + wsValue * 2.5 + ' buying' : 'UNSELLABLE'
	el.shardValue.textContent = shardString
	el.weaponQualityImage.src = getTierEmojiPath(weapon.tier)
	el.weaponQualitySpan.textContent = weapon.qualityWear.toFixed(1) + '%'
}

function generateStatInputs(weapon: weaponHandler.Weapon) {
	el.wpCost.append(generateWPInput(weapon))
	el.description.append(...generateDescription(weapon))
}

function createRangedInput(
	type: 'range' | 'number',
	{ min, max, step, digits }: { min: number; max: number; step: number; digits: number },
	style: Partial<CSSStyleDeclaration> = {}
) {
	const className = {
		range: 'input-wrapper__slider',
		number: 'input-wrapper__number-input',
	}[type]

	if (type === 'range' && min > max) style.transform = 'scaleX(-1)'
	else if (type === 'number') style.width = digits * 0.5 + 'rem'

	return make('input', {
		className,
		style,
		min: String(Math.min(max, min)),
		max: String(Math.max(max, min)),
		type,
		step: String(Math.abs(step)),
		lang: 'en',
	})
}

export { generateDescription, displayInfo, generateStatInputs }
