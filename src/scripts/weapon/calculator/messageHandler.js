import {
	valueToPercent,
	percentToValue,
	getTierEmojiPath,
	weaponAssetUrl,
	fileExists,
} from './util.js'
import { make } from '@/src/utils/injectionUtil.js'

const el = {
	weaponHeader: document.getElementById('weapon-header'),
	weaponName: document.getElementById('weaponName'),
	ownerID: document.getElementById('ownerID'),
	weaponID: document.getElementById('weaponID'),
	shardValue: document.getElementById('shardValue'),
	weaponQualityImage: document.getElementById('weaponQualityImage'),
	weaponQualitySpan: document.getElementById('weaponQualitySpan'),
	wpCost: document.getElementById('WP-Cost'),
	description: document.getElementById('weapon-line--description'),
}

function generateDescription(weaponOrPassive) {
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

	const parts = weaponOrPassive.description.split(tokenRegex)
	let statIndex = 0

	function descriptionEmote(inputString) {
		const gifUrl = weaponAssetUrl(`owo_images/battleEmojis/${inputString}.gif`)
		const pngUrl = weaponAssetUrl(`owo_images/battleEmojis/${inputString}.png`)
		const className = {
			passive: 'passives__emote',
			buff: 'buffs__emote',
			weapon: 'weapon-line--description__emote',
		}[weaponOrPassive.objectType]

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

	function elif(part) {
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

	function getStatNode() {
		const stat = weaponOrPassive.stats[statIndex++]
		return ((stat.IO = new WeaponStat(stat, weaponOrPassive)), stat.IO.wrapper)
	}

	return parts.map(elif)
}

function generateWPInput(weapon) {
	const stat = weapon.wpStat
	return stat ? ((stat.IO = new WeaponStat(stat, weapon)), stat.IO.wrapper) : `\u00A0${0}\u00A0`
}

const clamp = (val, config) => {
	const { min, max, step } = config
	val = parseFloat(val) // because we might get a string as input
	if (isNaN(val)) val = min // because we might get a stupid string as input
	const offset = (val - min) / step
	const snapped = min + Math.round(offset) * step
	return Math.min(max, Math.max(min, snapped))
}

class WeaponStat {
	constructor(stat, parent) {
		this.stat = stat
		this.parent = parent
		this._buildDOM()
		this._syncAll(this.stat.noWear + this.wearBonus)
		// initiate initial stats
	}

	get wear() {
		return this.parent.wear
	}
	get wearBonus() {
		return this.parent.wearBonus
	}
	get wearName() {
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

	get noWearConfig() {
		return this.stat.noWearConfig
	}

	get wearConfig() {
		const bonus = (this.noWearConfig.range / 100) * this.wearBonus
		return {
			...this.noWearConfig,
			min: this.noWearConfig.min + bonus,
			max: this.noWearConfig.max + bonus,
		}
	}

	_buildDOM() {
		const makeUnitLabel = (config) =>
			config.unit
				? make('span', {
						className: 'input-wrapper__unit-span',
						textContent: config.unit,
					})
				: ''

		this.numberInput = createRangedInput('number', this.wearConfig)
		this.numberLabel = makeUnitLabel(this.noWearConfig)
		this.qualityInput = createRangedInput('number', this.percentageConfig, { height: '1.5rem' })
		this.qualityLabel = makeUnitLabel(this.percentageConfig)
		this.slider = createRangedInput('range', this.wearConfig)
		this.img = make('img', {
			src: getTierEmojiPath(this.parent.tier),
			alt: this.parent.tier,
			ariaLabel: this.parent.tier,
			title: `:${this.parent.tier}:`,
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

		this._wireEvents()
	}

	_wireEvents() {
		const wire = (input, valueType) => {
			input.addEventListener('input', (e) => {
				if (e.target.value === '' || e.data === '.' || e.data === ',') return
				const val =
					valueType === 'percent'
						? e.target.value
						: valueToPercent(e.target.value, this.noWearConfig)
				if (isNaN(val)) return
				this._syncAll(val)
			})

			input.addEventListener('change', (e) => {
				const val =
					valueType === 'percent'
						? e.target.value
						: valueToPercent(e.target.value, this.noWearConfig)
				this._syncAll(clamp(val, this.percentageConfig))
			})
		}

		wire(this.numberInput, 'raw')
		wire(this.qualityInput, 'percent')
		wire(this.slider, 'raw')
	}

	_syncAll(pct) {
		pct = Number(pct)
		const noWearPct = pct - this.wearBonus
		const rawValue = percentToValue(pct, this.noWearConfig)
		const floatfixValue = Number(rawValue.toFixed(10))

		this.numberInput.value = floatfixValue
		this.slider.value = floatfixValue

		// percentToValue() 100% -> Sword 55% STR
		// valueToPercent() Sword 55% STR -> 100%

		this.qualityInput.value = pct
		this.img.src = getTierEmojiPath(pct)
		this.stat.noWear = noWearPct
		this.stat.withWear = pct

		this.parent.updateQualities()
	}

	updateWear() {
		;[
			{ el: this.numberInput, config: this.wearConfig },
			{ el: this.slider, config: this.wearConfig },
			{ el: this.qualityInput, config: this.percentageConfig },
		].forEach((input) => {
			const { min, max } = input.config
			input.el.min = Math.min(min, max)
			input.el.max = Math.max(min, max)
		})

		this._syncAll(this.stat.noWear + this.wearBonus)
	}
}

function displayInfo(weapon) {
	el.weaponHeader.textContent = weapon.owner.name + "'s " + weapon.wearName + weapon.typeName
	el.weaponName.textContent = weapon.typeName
	el.ownerID.textContent = weapon.owner.id
	el.weaponID.textContent = weapon.weaponID
	const wsValue = weapon.shardValue
	const shardString = wsValue ? wsValue + ' selling / ' + wsValue * 2.5 + ' buying' : 'UNSELLABLE'
	el.shardValue.textContent = shardString
	el.weaponQualityImage.src = getTierEmojiPath(weapon.tier)
	el.weaponQualitySpan.textContent = weapon.qualityWear.toFixed(1) + '%'
}

function generateStatInputs(weapon) {
	el.wpCost.append(generateWPInput(weapon))
	el.description.append(...generateDescription(weapon))
}

function createRangedInput(type, { min, max, step, digits }, style = {}) {
	const className = {
		range: 'input-wrapper__slider',
		number: 'input-wrapper__number-input',
	}[type]

	if (!className)
		throw new Error('Invariant violation: ranged input type is not either range or number')

	if (type === 'range' && min > max) style.transform = 'scaleX(-1)'
	else if (type === 'number') style.width = digits * 0.5 + 'rem'

	return make('input', {
		className,
		style,
		min: Math.min(max, min),
		max: Math.max(max, min),
		type,
		step: Math.abs(step),
		lang: 'en',
	})
}

export { generateDescription, displayInfo, generateStatInputs }
