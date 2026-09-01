import * as cookie from '../../utils/cookieUtil.js'
import { signedNumberFixedString, numStringToSubscript, zeroPad } from '../../utils/stringUtil.js'
import { make } from '../../utils/injectionUtil.js'
import {
	debounce,
	roundToDecimals,
	makeRepeatingButton,
	toFixedDigits,
} from '../../utils/inputUtil.js'
import { loadJson } from '../../utils/jsonUtil.js'

type RawTier = {
	readonly prettyName: string
	readonly huntbotAvailable: boolean
	readonly slug: string
	readonly patreonNeeded: boolean
	readonly _rate: number
	readonly emoteSrc: string
	readonly prefix: string
	readonly value: {
		readonly sell: number
		readonly sac: number
		readonly points: number
		readonly exp: number
	}
	readonly pets: Pet[]
}

type Tier = RawTier & {
	isSac: boolean

	readonly rate: number
	toggleSac: (override?: boolean) => void

	readonly expectedPetAmount: {
		zoo: number
		readonly hb: number[]
	}

	readonly hbRow: visibilityElement
	readonly zooRow: visibilityElement
	readonly hbPetGrid: HTMLDivElement
	readonly zooPetGrid: HTMLDivElement

	readonly hbLuckEls: {
		readonly expectedLuck: HTMLDivElement
		readonly actualLuck: HTMLDivElement
		readonly arrow: LuckArrow
	}

	readonly zooLuckEls: {
		readonly expectedLuck: HTMLDivElement
		readonly actualLuck: HTMLDivElement
		readonly arrow: LuckArrow
	}
}

type RawPet = {
	readonly animated: boolean
	readonly prettyName: string
	readonly slug: string
	readonly emoteSrc: string
	readonly aliases: string[]
	readonly stats: PetStats
}

type Pet = RawPet & {
	readonly caught: { zoo: number; readonly hb: number[] }
	readonly displayed: { zoo: boolean; hb: boolean }
	readonly hbCell: PetCell
	readonly zooCell: PetCell
}

type PetCell = HTMLElement & {
	update: (visible: boolean, str?: string) => void
}

type visibilityElement = HTMLElement & {
	_visibility: boolean
}

type CaughtOptions = { readonly mode: 'zoo' } | { readonly mode: 'hb'; readonly index: number }

type LuckArrow = {
	element: SVGSVGElement
	update(actual: number, expected: number): void
}

type PetStats = [hp: number, str: number, pr: number, wp: number, mag: number, mr: number]

function getElement<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector)
	if (!element) {
		throw new Error(`Required DOM element not found: ${selector}`)
	}
	return element
}

const sellZooValue = getElement('#cowoncyZooValue')
const sacZooValue = getElement('#essenceZooValue')
const sellHbValue = getElement('#cowoncyHbValue')
const sacHbValue = getElement('#essenceHbValue')
const huntbotIdxEl = getElement('#huntbotIdx')
const countContainer = getElement('#tierCountContainer')
const zooLuckContainer = getElement('#zoo-luck-container')
const hbLuckContainer = getElement('#hb-luck-container')
const zooContainer = getElement('#zooContainer')
const hbContainer = getElement('#huntbotContainer')
const tierTable = getElement('.tier-table')
const zpSpan = getElement('#zpSpan')
const tableBox = getElement('#table-box')
const gridContainer = getElement('.gridContainer')
const [firstButton, prevButton, nextButton, lastButton, resetButton] = Array.from(
	document.querySelectorAll<HTMLButtonElement>('#simming-buttons button')
)

const currentHbLines = Array.from(document.querySelectorAll('.huntbotLine'))
if (currentHbLines.length !== 2) {
	throw new Error("Haven't found two .huntbotLine elements")
}
const toggleAllButtons = document.querySelectorAll<HTMLButtonElement>('#sacToggles button')
if (toggleAllButtons.length !== 2) {
	throw new Error("Haven't found two #sacToggles button elements")
}

function updateZooValue(): void {
	const sell = getSell({ mode: 'zoo' })
	const sac = getSac({ mode: 'zoo' })
	if (sellZooValue) sellZooValue.textContent = sell.toLocaleString()
	if (sacZooValue) sacZooValue.textContent = sac.toLocaleString()
}
function updateHbValue(n: number): void {
	if (n < 0) return
	const sell = getSell({ mode: 'hb', index: n })
	const sac = getSac({ mode: 'hb', index: n })
	if (sellHbValue) sellHbValue.textContent = sell.toLocaleString()
	if (sacHbValue) sacHbValue.textContent = sac.toLocaleString()
}

const petBySlug = new Map<string, Pet>()

const makePetCell = ({
	emoteSrc,
	prettyName,
	slug,
}: {
	emoteSrc: string
	prettyName: string
	slug: string
}): PetCell => {
	let displayedVisibility = false
	let displayedStr = ''
	const textEl = make('div')
	const petCell: PetCell = make(
		'div',
		{
			className: 'pet-cell',
			dataset: { prettyName, slug },
			update: (visible: boolean, str?: string) => {
				if (visible !== displayedVisibility) {
					petCell.style.display = visible ? 'flex' : 'none'
					displayedVisibility = visible
				}
				if (visible && str && str !== displayedStr) {
					textEl.textContent = str
					displayedStr = str
				}
			},
		},
		[make('img', { src: emoteSrc, loading: 'lazy', decoding: 'async' }), textEl]
	)
	return petCell
}

let patreon = false
let isDragging = false

const rawZoo: RawTier[] = await loadJson('/src/data/zoo.json')
const zoo = rawZoo
	.filter((rawTier) => rawTier.huntbotAvailable)
	.map((rawTier) => {
		const makeEmote = () => make('img', { src: rawTier.emoteSrc })

		const zooPetGrid = make('div', { className: 'pet-grid' })
		const hbPetGrid = make('div', { className: 'pet-grid' })
		const zooRow: visibilityElement = make('div', { className: 'zoo-row' }, [
			makeEmote(),
			zooPetGrid,
		])
		const hbRow: visibilityElement = make('div', { className: 'zoo-row' }, [
			makeEmote(),
			' | ',
			hbPetGrid,
		])
		zooContainer.append(zooRow)
		hbContainer.append(hbRow)

		const pets: Pet[] = rawTier.pets.map((rawPet) => ({
			...rawPet,
			hbCell: makePetCell(rawPet),
			zooCell: makePetCell(rawPet),
			caught: { zoo: 0, hb: [] },
			displayed: { zoo: false, hb: false },
		}))

		pets.forEach((pet) => {
			petBySlug.set(pet.slug, pet)
			zooPetGrid.append(pet.zooCell)
			hbPetGrid.append(pet.hbCell)
		})

		const sacImg = make('img', { className: 'smol', draggable: false })
		const sacText = make('div')
		const tier: Tier = {
			...rawTier,
			pets: pets,
			isSac: true,
			zooPetGrid: zooPetGrid,
			hbPetGrid: hbPetGrid,
			zooRow: zooRow,
			hbRow: hbRow,
			expectedPetAmount: { zoo: 0, hb: [] },
			toggleSac: function (override?: boolean): void {
				this.isSac = override ?? !this.isSac
				sacText.textContent = this.isSac ? 'Sac' : 'Sell'
				sacImg.src = this.isSac
					? '/src/assets/images/owo_images/essence.gif'
					: '/src/assets/images/owo_images/cowoncy.png'
				drawData()
				updateZooValue()
				updateHbValue(currentHbIdx)
			},
			get rate() {
				if (this.patreonNeeded && !patreon) return 0
				if (typeof this._rate === 'number') return this._rate
				switch (this.slug) {
					case 'common': {
						const sumOther = zoo
							.filter((t) => t.slug !== 'common')
							.reduce((acc, t) => acc + t.rate, 0)

						return Math.max(0, 1 - sumOther)
					}
					case 'bot':
						return 0.00000004 * Radar.level
					default:
						throw new Error('Tier does not have a valid droprate.')
				}
			},
			...generateLuckDom(),
		}

		const makeDetailsRow = ({
			expectedLuck,
			actualLuck,
			arrow,
		}: {
			expectedLuck: HTMLDivElement
			actualLuck: HTMLDivElement
			arrow: LuckArrow
		}): HTMLDivElement =>
			make('div', { className: 'details-row' }, [
				make('div', {}, [make('img', { src: tier.emoteSrc })]),
				make('div', {}, [expectedLuck]),
				make('div', {}, [arrow.element, actualLuck]),
			])

		zooLuckContainer.append(makeDetailsRow(tier.zooLuckEls))
		hbLuckContainer.append(makeDetailsRow(tier.hbLuckEls))

		const wrapper = make(
			'div',
			{
				className: 'tier-cell gray-hover',
				onmousedown: () => tier.toggleSac(),
				onmouseenter: (e: MouseEvent) => {
					if (e.relatedTarget && wrapper.contains(e.relatedTarget)) return
					if (isDragging) tier.toggleSac()
				},
			},
			[
				make('img', { src: tier.emoteSrc, draggable: false }),
				make('div', { className: 'dynamic' }, [sacText, sacImg]),
				tier.patreonNeeded ? make('div', { className: 'patreon-graying' }) : '',
			]
		)
		tierTable.append(wrapper)
		return tier
	})

loadJson('https://neonutil.com/api/animals').then((response) => {
	const cptier = zoo.find((tier: Tier) => tier.slug === 'cpatreon')
	if (!cptier) throw new Error('Invariant violation: "cpatreon" tier not found')
	cptier.pets.length = 0
	cptier.zooPetGrid.textContent = ''
	cptier.hbPetGrid.textContent = ''
	response.data.forEach(
		([animated, prettyName, emote, aliases, stats, tierIdx]: [
			number,
			string,
			string,
			string[],
			PetStats,
			number,
		]) => {
			if (tierIdx !== 6) return // index 6 means Custom Patreon
			const emoteSrc =
				'https://cdn.discordapp.com/emojis/' +
				emote +
				(animated ? '.gif' : '.png') +
				'?size=32'
			const pet: Pet = {
				animated: animated ? true : false,
				prettyName,
				slug: prettyName.toLowerCase(),
				emoteSrc,
				aliases: aliases.map((alias) => alias.toLowerCase()),
				stats,
				caught: { zoo: 0, hb: [] },
				displayed: { zoo: false, hb: false },
				hbCell: makePetCell({ prettyName, emoteSrc, slug: prettyName.toLowerCase() }),
				zooCell: makePetCell({ prettyName, emoteSrc, slug: prettyName.toLowerCase() }),
			}
			cptier.zooPetGrid.append(pet.zooCell)
			cptier.hbPetGrid.append(pet.hbCell)
			petBySlug.set(pet.slug, pet)
			cptier.pets.push(pet)
		}
	)
	cptier.pets.sort((petA, petB) => petA.slug.localeCompare(petB.slug))
})

const huntbotTexts: [string, string][] = []
let currentHbIdx = -1

function getCaught(caught: Tier['pets'][number]['caught'], options: CaughtOptions): number {
	return options.mode === 'zoo' ? caught.zoo : caught.hb[options.index]
}

function reduceCaught<T>(
	options: CaughtOptions,
	initial: T,
	fn: (acc: T, caught: number, tier: Tier) => T
): T {
	let result = initial

	for (const tier of zoo)
		for (const pet of tier.pets) {
			result = fn(result, getCaught(pet.caught, options), tier)
		}

	return result
}

function getMaxCaught(options: CaughtOptions): number {
	return reduceCaught(options, 0, (max, caught) => Math.max(max, caught))
}

function getZP(options: CaughtOptions): number {
	return reduceCaught(options, 0, (zp, caught, { value }) => zp + caught * value.points)
}

function getSac(options: CaughtOptions): number {
	return reduceCaught(options, 0, (sac, caught, { value, isSac }) =>
		isSac ? sac + caught * value.sac : sac
	)
}

function getSell(options: CaughtOptions): number {
	return reduceCaught(options, 0, (sell, caught, { value, isSac }) =>
		!isSac ? sell + caught * value.sell : sell
	)
}

const traitTable = make('table')
{
	//table init
	const cells = ['', 'Cost', 'Essence', 'ROI'].map((textContent) => make('td', { textContent }))
	traitTable.append(make('tr', {}, cells))
	tableBox.append(traitTable)
}

const dailyPets = () => Efficiency.value * 24
const hbPets = () => Math.floor(Efficiency.value * Duration.value)

class Trait {
	constructor({
		name,
		unit,
		title,
		max,
		costParams,
		valueParams,
		upgradeWorth,
		outputs,
	}: {
		name: string
		unit: string
		title?: string
		max: number
		costParams: { mult: number; exponent: number }
		valueParams: { mult: number; base: number }
		upgradeWorth?: () => number
		outputs: (() => string)[]
	}) {
		this.name = name
		this.unit = unit
		this.max = max
		this.costParams = costParams
		this.valueParams = valueParams
		this.outputs = outputs

		this.header = make('span')
		if (title) {
			this.header.title = title
		}
		this.emoji = make('img', {
			src: `/src/assets/images/owo_images/huntbot/${this.name.toLowerCase()}.png`,
			style: { height: '1rem' },
		})

		const header = make('div', { className: 'header-wrapper' }, [this.emoji, this.header])

		if (upgradeWorth) {
			this.upgradeWorth = upgradeWorth
			const cells = [...Array(4)].map(() => make('td'))
			const row = make('tr', {}, cells)
			cells[0].textContent = this.name
			this.roiTableRow = {
				row,
				update: () => {
					const ROIs = [Efficiency, Gain, Radar]
						.filter((trait) => trait.level !== trait.max)
						.map((trait) => trait.ROI)

					row.classList.toggle('maxxed', this.level === this.max)
					row.classList.toggle('recommended', this.ROI === Math.max(...ROIs))
					cells[1].textContent = this.cost.toLocaleString()
					cells[2].textContent = signedNumberFixedString(upgradeWorth(), 1) + ` ess/day`
					cells[3].textContent = (this.ROI * 100).toFixed(1) + '%/day'
				},
			}
			traitTable.append(row)
		}

		const lvlSpan = make('div', {
			textContent: 'Lvl',
			className: 'calculatorLevel',
		})
		this.input = make('input', {
			type: 'number',
			min: 0,
			max: this.max,
			className: 'number-input no-arrows',
			onchange: () => (this.level = Number(this.input.value)),
		})

		const numberWrapper = make(
			'div',
			{ className: 'numberWrapper  rounded gray-hover', onclick: () => this.input.focus() },
			[lvlSpan, this.input]
		)

		const ttImg = make('img', {
			className: 'upgrade-image',
			src: '/src/assets/images/owo_images/essence.gif',
		})
		const ttText = make('div')
		const ttEl = make('span', { className: 'tooltip-text' }, [ttImg, ttText])
		const text = make('div')
		const btnP = make(
			'button',
			{
				className: 'gray-hover tooltip',
				onclick: () => this.level++,
			},
			[text, ttEl]
		)
		const btnM = make('button', {
			className: 'gray-hover',
			onclick: () => this.level--,
		})
		this.btnM = btnM
		this.btnP = { text, ttText, ttEl }

		const inputWrapper = make(
			'div',
			{
				className: 'gapped-box',
				onwheel: (e: WheelEvent) => {
					e.preventDefault()
					if (e.deltaY < 0) this.level++
					else this.level--
				},
			},
			[btnM, numberWrapper, btnP]
		)

		const outputWrapper = make('ul')
		this.outputs.forEach((output, i) => {
			const el = make('li')
			outputWrapper.append(el)
			this.outputs[i] = () => (el.textContent = output())
		})
		gridContainer.append(
			make('div', { className: 'subtle-gray-hover' }, [header, inputWrapper, outputWrapper])
		)
	}

	set level(value) {
		value = Number(value)
		if (!Number.isFinite(value)) value = 0
		value = Math.max(0, value)
		value = Math.min(Number(this.input.max), value)
		this._level = value
		//DOM updates
		this.input.value = String(value)
		this.btnM.textContent = value === 0 ? 'MIN' : '<'
		this.btnP.text.textContent = value === this.max ? 'MAX' : '>'
		this.btnP.ttEl.hidden = value === this.max
		this.btnP.ttText.textContent = String(this.cost)
		drawData()
		save()
	}
	get level() {
		return this._level
	}

	get cost() {
		const { mult, exponent } = this.costParams
		return Math.floor(mult * Math.pow(this.level + 1, exponent))
	}

	get value() {
		const { mult, base } = this.valueParams
		return mult * this.level + base
	}

	get ROI() {
		if (!this.upgradeWorth) return 0
		return this.upgradeWorth() / this.cost
	}

	_level: number = 0
	name: string
	unit: string
	title?: string
	max: number
	costParams: { mult: number; exponent: number }
	valueParams: { mult: number; base: number }

	roiTableRow?: { row: HTMLElement; update: () => void }
	upgradeWorth?: () => number

	outputs: (() => string)[]

	header: HTMLSpanElement
	emoji: HTMLImageElement
	input: HTMLInputElement
	btnM: HTMLButtonElement
	btnP: {
		text: HTMLDivElement
		ttText: HTMLDivElement
		ttEl: HTMLSpanElement
	}
}

const Efficiency = new Trait({
	name: 'Efficiency',
	unit: ' pets/h',
	max: 215,
	costParams: { mult: 10, exponent: 1.748 },
	valueParams: { mult: 1, base: 25 },
	upgradeWorth: () => petValue().sac * 24,
	outputs: [(): string => dailyPets() + ' pets/day', (): string => hbPets() + ' pets/hb'],
})
const Duration = new Trait({
	name: 'Duration',
	unit: 'h',
	max: 235,
	costParams: { mult: 10, exponent: 1.7 },
	valueParams: { mult: 0.1, base: 0.5 },
	outputs: [],
})
const Cost = new Trait({
	name: 'Cost',
	unit: ' cowoncy',
	max: 5,
	costParams: { mult: 1000, exponent: 3.4 },
	valueParams: { mult: -1, base: 10 },
	outputs: [
		(): string => '-' + dailyPets() * Cost.value + ' owo/day',
		(): string => '-' + hbPets() * Cost.value + ' owo/hb',
	],
})
const Gain = new Trait({
	name: 'Gain',
	unit: ' ess/h',
	max: 200,
	costParams: { mult: 10, exponent: 1.8 },
	valueParams: { mult: 25, base: 0 },
	upgradeWorth: () => 600,
	outputs: [
		(): string => Gain.value * 24 + ' ess/day',
		(): string => Math.floor(Gain.value * Duration.value) + ' ess/hb',
	],
})
const Experience = new Trait({
	name: 'Experience',
	unit: ' exp/h',
	max: 200,
	costParams: { mult: 10, exponent: 1.8 },
	valueParams: { mult: 35, base: 0 },
	outputs: [
		(): string => Experience.value * 24 + ' exp/day',
		(): string => Math.floor(Experience.value * Duration.value) + ' exp/hb',
	],
})
const Radar = new Trait({
	name: 'Radar',
	unit: 'ppm',
	title: 'pets per million',
	max: 999,
	costParams: { mult: 50, exponent: 2.5 },
	valueParams: { mult: 0.04, base: 0 },
	upgradeWorth: () => {
		const botTier = zoo.find((tier) => tier.slug === 'bot')
		const commonTier = zoo.find((tier) => tier.slug === 'common')
		if (!botTier || !commonTier) throw new Error('Invariant violation: tier not found')
		return (
			(botTier.isSac ? 0.00000004 * botTier.value.sac * dailyPets() : 0) -
			(commonTier.isSac ? 0.00000004 * commonTier.value.sac * dailyPets() : 0)
		)
	},
	outputs: [
		(): string =>
			'weekly bot: ' +
			(100 - 100 * Math.pow(1 - 0.00000004 * Radar.level, dailyPets() * 7)).toFixed(1) +
			'%',
		(): string =>
			'monthly bot: ' +
			(100 - 100 * Math.pow(1 - 0.00000004 * Radar.level, dailyPets() * 30)).toFixed(1) +
			'%',
	],
})
const traits = [Efficiency, Duration, Cost, Gain, Experience, Radar]

const renderPatreon = (): void =>
	document
		.querySelectorAll<HTMLElement>('.patreon-graying')
		.forEach((el) => (el.hidden = patreon))

toggleAllButtons[0].onclick = () => toggleAllTiers(false)
toggleAllButtons[1].onclick = () => toggleAllTiers(true)
const toggleAllTiers = (override: boolean) => zoo.forEach((tier) => tier.toggleSac(override))

const save = debounce(function () {
	const tempLevels = traits.map((t) => Number(t.level))
	history.replaceState(null, '', '#' + tempLevels.join(','))
	cookie.setCookie('Patreon', patreon.toString(), 30)
	cookie.setCookie('Levels', tempLevels.join(','), 30)
})

const tt = {
	wrapper: make('div', {
		className: 'pet-tooltip consistent-images',
	}),
	title: make('div'),
	statCells: [
		'/src/assets/images/owo_images/battleEmojis/hp.png',
		'/src/assets/images/owo_images/battleEmojis/str.png',
		'/src/assets/images/owo_images/battleEmojis/pr.png',
		'/src/assets/images/owo_images/battleEmojis/wp.png',
		'/src/assets/images/owo_images/battleEmojis/mag.png',
		'/src/assets/images/owo_images/battleEmojis/mr.png',
	].map((src) =>
		make('div', { className: 'gapped-box center-box' }, [make('img', { src }), make('div')])
	),
	rows: [make('div', { className: 'gapped-box' }), make('div', { className: 'gapped-box' })],
	update(pet: Pet) {
		this.title.textContent = pet.prettyName
		pet.stats.forEach((value: number, i: number) => {
			this.statCells[i].querySelector('div').textContent = value
		})
	},
}
tt.rows[0].append(tt.statCells[0], tt.statCells[1], tt.statCells[2])
tt.rows[1].append(tt.statCells[3], tt.statCells[4], tt.statCells[5])
tt.wrapper.append(tt.title, ...tt.rows)
document.body.append(tt.wrapper)

document.addEventListener('pointerover', (e) => {
	const target = e.target
	if (!(target instanceof Element)) return
	const petCell = target.closest<HTMLElement>('.pet-cell')
	if (!petCell) return
	const rect = petCell.getBoundingClientRect()
	if (!petCell.dataset.slug) throw new Error('Invariant violation: petCell missing data-slug')
	const pet = petBySlug.get(petCell.dataset.slug)
	if (!pet) throw new Error('Invariant violation: pet not found for slug ' + petCell.dataset.slug)
	tt.update(pet)
	tt.wrapper.style.visibility = 'visible'
	tt.wrapper.style.left = `${rect.right - 3}px`
	tt.wrapper.style.top = `${rect.bottom - 3}px`
})

document.addEventListener('pointerout', (e) => {
	const target = e.target
	if (!(target instanceof Element)) return
	const petCell = target.closest('.pet-cell')
	if (!petCell) return
	if (!(e.relatedTarget instanceof Node)) return
	if (petCell.contains(e.relatedTarget)) return
	tt.wrapper.style.visibility = 'hidden'
})

const hbWorthEls = Array.from(document.querySelectorAll('.hbworth'))
const petWorthEls = Array.from(document.querySelectorAll('.petworth'))

function petValue() {
	let sacWorth = 0
	let sellWorth = 0
	zoo.forEach((tier) => {
		if (tier.isSac) sacWorth += tier.rate * tier.value.sac
		else sellWorth += tier.rate * tier.value.sell
	})

	return { sac: sacWorth, sell: sellWorth }
}

document.addEventListener('mouseup', () => (isDragging = false))
document.addEventListener('mousedown', () => (isDragging = true))
document.addEventListener('paste', (e) => {
	if (!e.clipboardData) return
	extractLevels(e.clipboardData.getData('text'))
})

const patreonCheckWrapper = getElement<HTMLElement>('#patreonCheck')
const patreonCheck = getElement<HTMLInputElement>('#patreonCheck input')
patreonCheckWrapper.onclick = () => {
	patreon = patreonCheck.checked
	save()
	drawData()
	renderPatreon()
}

function drawData() {
	traits.forEach((trait) => {
		trait.header.textContent = trait.name + ' - ' + roundToDecimals(trait.value, 2) + trait.unit
		trait.outputs.forEach((fn) => fn())
		trait.roiTableRow?.update()
	})

	const { sac, sell } = petValue()
	petWorthEls[0].textContent = sell.toFixed(1) + ' owo/pet'
	hbWorthEls[0].textContent = (sell * hbPets()).toFixed(0) + ' owo/hb'

	petWorthEls[1].textContent = 'Profit: ' + (sell - Cost.value).toFixed(1) + ' owo/pet'
	hbWorthEls[1].textContent = 'Profit: ' + ((sell - Cost.value) * hbPets()).toFixed(0) + ' owo/hb'

	petWorthEls[2].textContent = sac.toFixed(1) + ' ess/pet'
	hbWorthEls[2].textContent = (sac * hbPets()).toFixed(0) + ' ess/hb'

	patreonCheck.checked = patreon
}

const extractLevels = (text: string) =>
	[...text.matchAll(/\bLvl (\d+)\b/g)]
		.slice(0, 6)
		.forEach((m, i) => (traits[i].level = Number(m[1])))

function importFromCookie() {
	const levelsData = cookie.getCookie('Levels')
	stringToLevel(levelsData ?? '0,0,0,0,0,0')

	patreon = cookie.getCookie('Patreon') === 'true'
	patreonCheck.checked = patreon
	renderPatreon()
}

const stringToLevel = (levelString: string) =>
	levelString
		.split(',')
		.slice(0, traits.length)
		.forEach((value, i) => (traits[i].level = Number(value || 0)))

function generateLuckDom(): {
	zooLuckEls: {
		expectedLuck: HTMLDivElement
		actualLuck: HTMLDivElement
		arrow: LuckArrow
	}
	hbLuckEls: {
		expectedLuck: HTMLDivElement
		actualLuck: HTMLDivElement
		arrow: LuckArrow
	}
} {
	const SVG_NS = 'http://www.w3.org/2000/svg'

	const makeArrow = (): LuckArrow => {
		const element = document.createElementNS(SVG_NS, 'svg')
		element.setAttribute('viewBox', '0 0 16 16')
		element.setAttribute('xmlns', SVG_NS)
		const path = document.createElementNS(SVG_NS, 'path')
		path.setAttribute('d', 'M10 8L14 8V10L8 16L2 10V8H6V0L10 4.76995e-08V8Z')
		path.setAttribute('fill', '#ffdc51')
		element.append(path)

		const update = (actual: number, expected: number): void => {
			if (actual > expected) {
				element.style.transform = 'rotate(-180deg)'
				path.setAttribute('fill', '#56caff')
			} else if (actual < expected) {
				element.style.transform = 'rotate(0deg)'
				path.setAttribute('fill', '#ff5656')
			} else {
				element.style.transform = 'rotate(-90deg)'
				path.setAttribute('fill', '#ffdc51')
			}
		}
		return {
			element,
			update,
		}
	}

	return {
		zooLuckEls: {
			expectedLuck: make('code'),
			actualLuck: make('code'),
			arrow: makeArrow(),
		},
		hbLuckEls: {
			expectedLuck: make('code'),
			actualLuck: make('code'),
			arrow: makeArrow(),
		},
	}
}

function newHuntbot() {
	{
		// RUN RNG
		const pets = hbPets()
		let acc = 0
		const rateArray = zoo.map((tier) => (acc += tier.rate))
		zoo.forEach((tier) => {
			const expectedPetAmount = pets * tier.rate
			tier.expectedPetAmount.hb.push(expectedPetAmount)
			tier.expectedPetAmount.zoo += expectedPetAmount
			tier.pets.forEach((pet) => pet.caught.hb.push(0))
		})

		for (let i = 0; i < pets; i++) {
			const r = Math.random()
			const tierIdx = rateArray.findIndex((rate) => r < rate)
			if (tierIdx === -1) throw new Error('Tier rates do not cover the RNG range')
			const petIdx = Math.floor(Math.random() * zoo[tierIdx].pets.length)

			const pet = zoo[tierIdx].pets[petIdx]
			const caught = pet.caught
			caught.hb[caught.hb.length - 1]++
			caught.zoo++
		}
	}

	const essenceGain = (Gain.value * Duration.value).toFixed(0)
	const expGain = (Experience.value * Duration.value).toFixed(0)
	huntbotTexts.push([
		`BEEP BOOP. I AM BACK WITH ${hbPets()} ANIMALS,`,
		`${essenceGain} ESSENCE, AND ${expGain} EXPERIENCE`,
	])
	displayZoo()
	updateZooValue()
	currentHbIdx++
	displayNthHuntbot(currentHbIdx)
	updateHbValue(currentHbIdx)
}

function displayNthHuntbot(n: number) {
	huntbotIdxEl.textContent = n + 1 + '/' + huntbotTexts.length
	currentHbLines[0].textContent = huntbotTexts[n][0]
	currentHbLines[1].textContent = huntbotTexts[n][1]

	const digitsNeeded = String(getMaxCaught({ mode: 'hb', index: n })).length
	for (const tier of zoo) {
		tier.hbRow.style.display = 'none'
		tier.hbRow._visibility = false
		let tierPets = 0
		for (const pet of tier.pets) {
			const visible = pet.caught.hb[n] !== 0
			if (visible && !tier.hbRow._visibility) {
				tier.hbRow.style.display = 'flex'
				tier.hbRow._visibility = true
			}
			const str = numStringToSubscript(zeroPad(pet.caught.hb[n], digitsNeeded))
			pet.hbCell.update(visible, str)
			tierPets += pet.caught.hb[n]
		}
		tier.hbLuckEls.expectedLuck.textContent = toFixedDigits(tier.expectedPetAmount.hb[n], 3)
		tier.hbLuckEls.actualLuck.textContent = tierPets.toLocaleString()
		tier.hbLuckEls.arrow.update(tierPets, tier.expectedPetAmount.hb[n])
	}
}

function displayZoo() {
	zpSpan.textContent = getZP({ mode: 'zoo' }).toLocaleString()
	const digitsNeeded = String(getMaxCaught({ mode: 'zoo' })).length
	const countContainerArray: string[] = []
	for (const tier of zoo) {
		let tierPets = 0
		for (const pet of tier.pets) {
			const visible = pet.caught.zoo !== 0
			if (visible && !tier.zooRow._visibility) {
				tier.zooRow.style.display = 'flex'
				tier.zooRow._visibility = true
			}
			const str = numStringToSubscript(zeroPad(pet.caught.zoo, digitsNeeded))
			pet.zooCell.update(visible, str)
			tierPets += pet.caught.zoo
		}
		tier.zooLuckEls.expectedLuck.textContent = toFixedDigits(tier.expectedPetAmount.zoo, 3)
		tier.zooLuckEls.actualLuck.textContent = tierPets.toLocaleString()
		tier.zooLuckEls.arrow.update(tierPets, tier.expectedPetAmount.zoo)
		if (tierPets) countContainerArray.push(`${tier.prefix}-${tierPets}`)
	}
	countContainer.textContent = countContainerArray.reverse().join(', ')
}

function displayNthHuntbotFull(n: number) {
	displayNthHuntbot(n)
	updateHbValue(n)
}

const prev = () => {
	if (currentHbIdx < 1) return
	currentHbIdx--
	displayNthHuntbotFull(currentHbIdx)
}
const next = () => {
	if (currentHbIdx === huntbotTexts.length - 1) {
		newHuntbot()
	} else {
		currentHbIdx++
		displayNthHuntbotFull(currentHbIdx)
	}
}
const first = () => {
	if (!huntbotTexts.length) return
	currentHbIdx = 0
	displayNthHuntbotFull(currentHbIdx)
}
const last = () => {
	if (!huntbotTexts.length) return
	currentHbIdx = huntbotTexts.length - 1
	displayNthHuntbotFull(currentHbIdx)
}
const reset = () => {
	currentHbIdx = -1
	huntbotTexts.length = 0
	huntbotIdxEl.textContent = '0/0'
	countContainer.textContent = ''
	currentHbLines[0].textContent = 'BEEP BOOP'
	currentHbLines[1].textContent = 'BOOP BEEP BEEP'
	sellZooValue.textContent = '0'
	sacZooValue.textContent = '0'
	sellHbValue.textContent = '0'
	sacHbValue.textContent = '0'
	zpSpan.textContent = '0'
	zoo.forEach((tier) => {
		tier.zooLuckEls.expectedLuck.textContent = ''
		tier.zooLuckEls.actualLuck.textContent = ''
		tier.zooLuckEls.arrow.update(0, 0)
		tier.hbLuckEls.expectedLuck.textContent = ''
		tier.hbLuckEls.actualLuck.textContent = ''
		tier.hbLuckEls.arrow.update(0, 0)
		tier.hbRow.style.display = 'none'
		tier.hbRow._visibility = false
		tier.zooRow.style.display = 'none'
		tier.zooRow._visibility = false
		tier.expectedPetAmount.zoo = 0
		tier.expectedPetAmount.hb.length = 0
		tier.pets.forEach((pet) => {
			pet.zooCell.update(false)
			pet.hbCell.update(false)
			pet.caught.zoo = 0
			pet.caught.hb.length = 0
		})
	})
}
makeRepeatingButton(prevButton, prev)
makeRepeatingButton(nextButton, next)
firstButton.onmousedown = first
lastButton.onmousedown = last
resetButton.onmousedown = reset

document.addEventListener('keydown', (e) => {
	if (e.key === 'p') prev()
	else if (e.key === 'n') next()
	else if (e.key === 'f') first()
	else if (e.key === 'l') last()
	else if (e.key === 'r') reset()
})

importFromCookie()
if (location.hash) stringToLevel(location.hash.slice(1))
toggleAllTiers(true)
