import { loadPets } from '@/src/utils/jsonUtil.ts'
import type { RawPet } from '@/src/utils/jsonUtil.ts'
import { make } from '@/src/utils/injectionUtil.ts'
import { getElement } from '@/src/utils/domUtil'

const modeContainer = getElement<HTMLDivElement>('#mode-container')
const effectContainer = getElement<HTMLDivElement>('#effect-container')

const modeSwitchButton = getElement<HTMLButtonElement>('#mode-switch-button')

const inputLvl = getElement<HTMLInputElement>('.input-lvl')
const levelWrapper = getElement<HTMLDivElement>('#level-wrapper__number-wrapper')
const sliderLvl = getElement<HTMLInputElement>('#level-wrapper__slider')

//for Mode: matching pets
let showPets = true
let renderedPageIdx = 0

let petArray: RawPet[]

//for Mode: searching pets
let suggestedPets: RawPet[] = []
let chosenPet: RawPet
let selectedIndex = -1

let level = 0

const renderStatSpan = () => {
	const span = getElement<HTMLSpanElement>('#inner-stat-span')
	const statAmount = inputtableStats.reduce((acc, stat) => acc + stat.dexStat, 0)
	span.textContent = String(statAmount)
}

type Stat = {
	readonly stat: number
	renderOutput: () => void
}

type InputtableStat = Stat & {
	dexStat: number
	base: number
	multi: number
	boost: number
	setStat: (n: number) => void
}

function inputtableStatFactory(props: {
	slug: string
	base: number
	multi: number
	formatOutput?: (n: number) => string
}): InputtableStat {
	const input = getElement<HTMLInputElement>(`#${props.slug}-input`)

	const stat = statFactory<InputtableStat>({
		slug: props.slug,
		formatOutput: props.formatOutput,
		getStat(stat) {
			const withoutBoost = stat.dexStat * stat.multi * level + stat.base
			return withoutBoost * (1 + stat.boost)
		},
	})

	stat.dexStat = Number(input.value)
	stat.base = props.base
	stat.multi = props.multi
	stat.setStat = (n: number) => {
		input.value = String(n)
		stat.dexStat = n
		renderStatSpan()
		renderStatOutputs()
		updatePetArray()
	}

	Object.defineProperty(stat, 'boost', {
		get() {
			return effects.reduce(
				(acc, { affectedStats, boost }) => acc + (affectedStats.includes(stat) ? boost : 0),
				0
			)
		},
	})
	input.addEventListener('change', () => stat.setStat(Number(input.value)))
	input.addEventListener('wheel', (e) => {
		e.preventDefault()
		const [nvalue, nmin, nmax] = [Number(input.value), Number(input.min), Number(input.max)]
		const newValue = nvalue - Math.sign(e.deltaY)
		const cappedValue = Math.min(Math.max(newValue, nmin), nmax)
		stat.setStat(cappedValue)
	})
	return stat
}

function statFactory<T extends Stat>(props: {
	slug: string
	formatOutput?: (n: number) => string
	getStat: (stat: T) => number
}): T {
	const output = getElement<HTMLElement>(`#${props.slug}-output`)
	const _formatOutput = props.formatOutput ?? ((n: number) => n.toFixed(0))
	const stat = {
		get stat() {
			return props.getStat(stat)
		},
		renderOutput() {
			output.textContent = _formatOutput(stat.stat)
		},
	} as T
	return stat
}

const hp = inputtableStatFactory({ slug: 'hp', base: 500, multi: 2 })
const wp = inputtableStatFactory({ slug: 'wp', base: 500, multi: 2 })
const str = inputtableStatFactory({ slug: 'str', base: 100, multi: 1 })
const mag = inputtableStatFactory({ slug: 'mag', base: 100, multi: 1 })
const ipr = inputtableStatFactory({ slug: 'ipr', base: 25, multi: 2 })
const imr = inputtableStatFactory({ slug: 'imr', base: 25, multi: 2 })
const pr = statFactory({
	slug: 'pr',
	formatOutput: (n: number) => (n * 100).toFixed(1) + '%',
	getStat: () => (0.8 * ipr.stat) / (100 + ipr.stat),
})
const mr = statFactory({
	slug: 'mr',
	formatOutput: (n: number) => (n * 100).toFixed(1) + '%',
	getStat: () => (0.8 * imr.stat) / (100 + imr.stat),
})
const prEhp = statFactory({ slug: 'prEhp', getStat: () => hp.stat / (1 - pr.stat) })
const mrEhp = statFactory({ slug: 'mrEhp', getStat: () => hp.stat / (1 - mr.stat) })

const inputtableStats = [hp, str, ipr, wp, mag, imr]
const derivedStats = [pr, mr, prEhp, mrEhp]
const renderStatOutputs = () =>
	[...inputtableStats, ...derivedStats].forEach((stat) => stat.renderOutput())

function effectFactory(props: EffectBlueprint): Effect {
	return {
		emote: props.emote,
		min: props.min,
		max: props.max,
		affectedStats: props.affectedStats,
		quality: 0,
		get boost() {
			const range = this.max - this.min
			const boost = 0.01 * this.quality * range + this.min
			return boost
		},
		get boostString() {
			return '+' + (100 * this.boost).toFixed(1) + '%'
		},
	}
}

type EffectBlueprint = (typeof effectBlueprints)[number]
const effectBlueprints = [
	{ emote: 'hp.png', min: 0.05, max: 0.2, affectedStats: [hp] },
	{ emote: 'wp.png', min: 0.1, max: 0.3, affectedStats: [wp] },
	{ emote: 'str.png', min: 0.05, max: 0.2, affectedStats: [str] },
	{ emote: 'mag.png', min: 0.05, max: 0.2, affectedStats: [mag] },
	{ emote: 'pr.png', min: 0.15, max: 0.35, affectedStats: [ipr] },
	{ emote: 'mr.png', min: 0.15, max: 0.35, affectedStats: [imr] },
	{ emote: 'rune.png', min: 0.05, max: 0.15, affectedStats: [hp, wp, str, mag, ipr, imr] },
]

type Effect = {
	readonly emote: string
	readonly min: number
	readonly max: number
	readonly affectedStats: InputtableStat[]
	quality: number
	readonly boost: number
	readonly boostString: string
}
let effects: Effect[] = []

const sortPets = (array: RawPet[]) => {
	const tierOrder = [
		'common',
		'uncommon',
		'rare',
		'epic',
		'mythical',
		'legendary',
		'gem',
		'bot',
		'distorted',
		'fabled',
		'hidden',
		'special',
		'patreon',
		'cpatreon',
	]

	return array.sort((petA, petB) => {
		if (tierOrder.indexOf(petA.tier.slug) !== tierOrder.indexOf(petB.tier.slug))
			return tierOrder.indexOf(petA.tier.slug) - tierOrder.indexOf(petB.tier.slug)
		else return petA.slug.localeCompare(petB.slug)
	})
}

function outputPetContainer() {
	if (showPets) {
		modeContainer.innerHTML = ''
		outputPetContainerMATCHING()
	} else if (!document.getElementById('textInput')) {
		modeContainer.innerHTML = ''
		outputPetContainerSEARCH()
	}
}

function outputPetContainerMATCHING() {
	const petGrid = make('div', {
		className: 'pet-grid',
	})
	modeContainer.append(
		petGrid,
		make('div', { className: 'nav-buttons--pet-grid' }, [
			make('button', {
				className: 'nav-buttons--pet-grid__button',
				textContent: '<',
				onclick: () => swapRenderedPage(renderedPageIdx - 1),
			}),
			make('button', {
				className: 'nav-buttons--pet-grid__button',
				textContent: '>',
				onclick: () => swapRenderedPage(renderedPageIdx + 1),
			}),
		])
	)

	const childrenEls: HTMLDivElement[] = []
	petArray.forEach((pet, i) => {
		if (i === 0 || pet.tier !== petArray[i - 1].tier) {
			childrenEls.push(renderHeader(pet.tier.prettyName))
		}
		childrenEls.push(renderPet(pet))
	})

	swapRenderedPage(0)
	function swapRenderedPage(askedIdx: number) {
		const pageSize = 30
		renderedPageIdx = Math.max(askedIdx, 0)
		renderedPageIdx = Math.min(renderedPageIdx, Math.floor((childrenEls.length - 1) / pageSize))
		const startIdx = renderedPageIdx * pageSize
		const endIdx = startIdx + pageSize
		petGrid.replaceChildren(...childrenEls.slice(startIdx, endIdx))
	}
}

function outputPetContainerSEARCH() {
	const textInput = make('input', {
		id: 'textInput',
		className: 'search-bar',
		autocomplete: 'off',
		placeholder: 'type pet here...',
	})

	const suggestionWrapper = make('div', { className: 'suggestions' })

	textInput.addEventListener('input', () => onInput(textInput, suggestionWrapper))
	textInput.addEventListener('focus', () => onInput(textInput, suggestionWrapper))
	textInput.addEventListener('keydown', (e) => onKeyDown(e, suggestionWrapper))
	textInput.addEventListener('blur', () => (suggestionWrapper.style.display = 'none'))

	modeContainer.append(textInput, suggestionWrapper)
	if (chosenPet) outputSmallPetContainer(chosenPet)
	textInput.focus()
}

function onInput(textInput: HTMLInputElement, suggestions: HTMLDivElement) {
	const q = textInput.value.trim().toLowerCase()

	suggestedPets = allPets.filter(
		(pet) => pet.slug.includes(q) || pet.aliases.some((alias) => alias.includes(q))
	)
	suggestedPets = sortPets(suggestedPets)
	suggestedPets = suggestedPets.slice(0, 5)
	if (!suggestedPets.length || !q || q.length <= 2) {
		return (suggestions.style.display = 'none')
	}
	renderSuggestions(q, suggestions)
}

function renderSuggestions(query: string, suggestions: HTMLDivElement) {
	const normalizedQuery = query.toLowerCase()
	suggestions.innerHTML = ''
	suggestions.style.display = 'block'
	selectedIndex = -1

	suggestedPets.forEach((pet, i) => {
		const aliases = pet.aliases.filter((a) => a.includes(normalizedQuery))

		suggestions.appendChild(
			make(
				'div',
				{
					className: 'suggestions__suggestion',
					textContent: pet.prettyName,
					onmousedown: (_) => applyItem(i, suggestions),
				},
				[
					make('div', {
						className: 'suggestions__pet-aliases',
						innerHTML: aliases.join(', '),
					}),
				]
			)
		)
	})
}

function outputSmallPetContainer(pet: RawPet) {
	const children = [
		make('img', {
			src: pet.emoteSrc,
			className: 'pet-output__portrait',
		}),
		make('div', {
			innerHTML: pet.prettyName,
			className: 'pet-output__name',
		}),
		make('div', {
			innerHTML: 'Aliases: ' + (pet.aliases[0] ? pet.aliases.join(', ') : 'none'),
			className: 'pet-output__aliases',
		}),
	]

	const oldOutput = document.getElementById('pet-output')
	if (oldOutput) oldOutput.replaceChildren(...children)
	else {
		modeContainer.append(
			make(
				'div',
				{
					className: 'pet-output',
					id: 'pet-output',
				},
				children
			)
		)
	}
}

async function onKeyDown(e: KeyboardEvent, suggestions: HTMLDivElement) {
	const max = suggestedPets.length - 1
	if (e.key === 'ArrowDown') {
		e.preventDefault()
		selectedIndex = selectedIndex < max ? selectedIndex + 1 : 0
		highlight(suggestions)
	} else if (e.key === 'ArrowUp') {
		e.preventDefault()
		selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : max
		highlight(suggestions)
	} else if (e.key === 'Enter') {
		applyItem(selectedIndex, suggestions)
	} else if (e.key === 'Escape') {
		if (!(e.target instanceof HTMLInputElement)) return
		e.target.blur()
	}
}

async function applyItem(i: number, suggestions: HTMLDivElement) {
	suggestions.style.display = 'none'
	chosenPet = suggestedPets[i] ?? suggestedPets[0]
	suggestedPets = []

	if (!chosenPet) return
	inputtableStats.forEach((stat, j) => stat.setStat(chosenPet.stats[j]))
	outputSmallPetContainer(chosenPet)
}

const highlight = (suggestions: HTMLDivElement) => {
	const children = Array.from(suggestions.children)
	children.forEach((div: Element, i) => {
		div.classList.toggle('active', i === selectedIndex)
	})
}

async function updatePetArray() {
	const filteredPets = allPets.filter((pet) =>
		pet.stats.every((value, i) => value === inputtableStats[i].dexStat)
	)
	petArray = sortPets(filteredPets)
	outputPetContainer()
}

let allPets: RawPet[] = []

function setLevelTo(value: number) {
	value = Math.max(1, value)
	level = value
	sliderLvl.value = String(value)
	inputLvl.value = String(value)
	renderStatOutputs()
}

const renderPet = (pet: RawPet) =>
	make('div', { className: 'pet-grid__cell' }, [
		make('img', {
			src: pet.emoteSrc,
			className: 'pet-grid__img',
		}),
		make(
			'code',
			{
				textContent: pet.prettyName,
				className: 'pet-grid__name',
			},
			[
				make('span', {
					innerHTML: pet.aliases.length ? pet.aliases.join(', ') : 'no Alias',
					className: 'pet-grid__aliases-tooltip',
				}),
			]
		),
	])

const renderHeader = (str: string) => make('div', { textContent: str, className: 'pet-grid__cell' })

function addAddEffects() {
	const text = make('div', {
		className: 'passive-wrapper--adding__original',
		textContent: 'add effect',
	})
	const imgContainer = make(
		'div',
		{ className: 'passive-wrapper--adding__replacement' },
		effectBlueprints.map((blueprint) =>
			make('img', {
				src: '/assets/images/owo_images/battleEmojis/f_' + blueprint.emote,
				style: { height: blueprint.emote === 'rune.png' ? '1.4rem' : '1.5rem' },
				onclick: () => addEffect(blueprint),
			})
		)
	)
	effectContainer.append(
		make('div', { className: 'passive-wrapper--adding' }, [text, imgContainer])
	)
}

function addEffect(blueprint: EffectBlueprint) {
	const effect = effectFactory(blueprint)
	effects.push(effect)

	const numberInput = make('input', {
		type: 'number',
		className: 'passive-wrapper__number-input',
		min: '0',
		max: '100',
		value: '100',
		oninput(e) {
			if (!(e.target instanceof HTMLInputElement))
				throw new Error('Invariant violation: we fucked up')
			updateUI(Number(e.target.value))
		},
	})
	const rangeInput = make('input', {
		type: 'range',
		min: '0',
		max: '100',
		value: '100',
		oninput(e) {
			if (!(e.target instanceof HTMLInputElement))
				throw new Error('Invariant violation: we fucked up')
			updateUI(Number(e.target.value))
		},
	})

	const passivePortrait = make('img', {
		className: 'passive-wrapper__passive-portrait',
		src: `/assets/images/owo_images/battleEmojis/${getImageForEffect(effect)}`,
	})
	const boostOutput = make('div', {
		className: 'passive-wrapper__boost-output',
		textContent: effect.boostString,
	})

	function updateUI(value: number) {
		effect.quality = value
		numberInput.value = String(value)
		rangeInput.value = String(value)
		passivePortrait.src = `/assets/images/owo_images/battleEmojis/${getImageForEffect(effect)}`
		boostOutput.textContent = effect.boostString
		renderStatOutputs()
	}

	const button = make('button', {
		className: 'passive-wrapper__removal-button',
		textContent: 'X',
		onclick: () => {
			effects = effects.filter((e) => e !== effect)
			wrapper.remove()
			renderStatOutputs()
		},
	})

	const wrapper = make('div', { className: 'passive-wrapper' }, [
		make('div', { className: 'passive-wrapper__identity-wrapper' }, [
			passivePortrait,
			boostOutput,
		]),
		make(
			'div',
			{ className: 'passive-wrapper__number-wrapper', onclick: () => numberInput.focus() },
			[numberInput, make('div', { textContent: '%' })]
		),
		make('div', { className: 'passive-wrapper__range-wrapper' }, [rangeInput]),
		button,
	])
	effectContainer.insertBefore(wrapper, effectContainer.lastChild)
	updateUI(100)
}

const getImageForEffect = (effect: Effect) => prefix(effect.quality) + effect.emote

const prefix = (quality: number) => {
	const tier = [
		{ min: 0, prefix: 'c_' },
		{ min: 20, prefix: 'u_' },
		{ min: 40, prefix: 'r_' },
		{ min: 60, prefix: 'e_' },
		{ min: 80, prefix: 'm_' },
		{ min: 94, prefix: 'l_' },
		{ min: 99, prefix: 'f_' },
	].findLast(({ min }) => min < quality)
	if (tier) return tier.prefix
	else return 'f_'
}
document.addEventListener('DOMContentLoaded', async () => {
	inputLvl.addEventListener('change', (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error('Invariant violation: input element is somehow not an input element?')
		setLevelTo(Number(e.target.value))
	})
	inputLvl.addEventListener('wheel', (e: WheelEvent) => {
		e.preventDefault()
		setLevelTo((level -= Math.sign(e.deltaY)))
	})
	levelWrapper.addEventListener('click', () => inputLvl.focus())
	sliderLvl.addEventListener('input', (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error('Invariant violation: input element is somehow not an input element?')
		setLevelTo(Number(e.target.value))
	})
	modeSwitchButton.addEventListener('click', function () {
		showPets = !showPets
		modeSwitchButton.textContent = showPets ? 'Mode: Matching Pets' : 'Mode:   Search Pets'
		outputPetContainer()
	})

	allPets = await loadPets()
	updatePetArray()
	setLevelTo(1)
	addAddEffects()
})
