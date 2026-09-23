import { loadPets } from '/src/utils/jsonUtil.ts'
import { make } from '/src/utils/injectionUtil.ts'

const modeContainer = document.getElementById('mode-container')
const effectContainer = document.getElementById('effect-container')

const modeSwitchButton = document.querySelector('#mode-switch-button')
const statSpan = document.querySelector('#stat-span')

const inputLvl = document.querySelector('.input-lvl')
const levelWrapper = document.querySelector('#level-wrapper__number-wrapper')
const sliderLvl = document.getElementById('level-wrapper__slider')

const inputs = Array.from(document.querySelectorAll('.pet-input-grid__input'))
const outputs = Array.from(
	document.querySelectorAll('.pet-input-grid__output, .pet-output-grid__output')
)

//for Mode: matching pets
let showPets = true
let pageIdx = 0

let petArray

//for Mode: searching pets
let suggestedPets = []
let chosenPet = []
let selectedIndex = -1

let level = 0

const stats = [
	0, //hp
	0, //wp
	0, //str
	0, //mag
	0, //pr
	0, //mr
	// order is differently here from otherwise, because team stat display is rotated
	// I'm using team stat display as reference here, instead of pet stat display
]

const statAmount = () => stats.reduce((sum, plus) => sum + Number(plus), 0)

const internalStats = [
	0, //hp
	0, //wp
	0, //str
	0, //mag
	0, //iPr
	0, //iMr
]

const outsideStats = [
	0, //hp i=0
	0, //wp i=1
	0, //str i=2
	0, //mag i=3
	0, //pr i=4
	0, //mr i=5
	0, //(pr)ehp i=6
	0, //(mr)ehp i=7
	0, //iPR i=8
	0, //iMR i=9
]

let effects = [
	// {"id":"0", "type":3, "quality":100}
	// {"id":"1", "type":2, "quality":60}
]

const effectMin = [0.05, 0.05, 0.15, 0.1, 0.05, 0.15, 0.05]
const effectMax = [0.2, 0.2, 0.35, 0.3, 0.2, 0.35, 0.15]
const boostSuffix = ['hp', 'str', 'pr', 'wp', 'mag', 'mr', 'rune']

const sortPets = (array) => {
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
				tabIndex: '9',
				onclick: () => swapRenderedPage(false),
			}),
			make('button', {
				className: 'nav-buttons--pet-grid__button',
				textContent: '>',
				tabIndex: '10',
				onclick: () => swapRenderedPage(true),
			}),
		])
	)

	const childrenEls = []
	petArray.forEach((pet, i) => {
		if (i === 0 || pet.tier !== petArray[i - 1].tier) {
			childrenEls.push(renderHeader(pet.tier.prettyName))
		}
		childrenEls.push(renderPet(pet))
	})

	swapRenderedPage(false)
	function swapRenderedPage(direction) {
		direction ? pageIdx++ : pageIdx--
		const pageSize = 30
		pageIdx = Math.max(pageIdx, 0)
		pageIdx = Math.min(pageIdx, Math.floor((childrenEls.length - 1) / pageSize))
		const startIdx = pageIdx * pageSize
		const endIdx = startIdx + pageSize
		petGrid.replaceChildren(...childrenEls.slice(startIdx, endIdx))
	}
}

function outputPetContainerSEARCH() {
	const textInput = make('input', {
		id: 'textInput',
		tabIndex: '9',
		className: 'search-bar',
		autocomplete: 'off',
		placeholder: 'type pet here...',
	})

	const suggestionWrapper = make('div', { className: 'suggestions' })

	textInput.addEventListener('input', () => onInput(textInput, suggestionWrapper))
	textInput.addEventListener('focus', () => onInput(textInput, suggestionWrapper))
	textInput.addEventListener('keydown', (e) => onKeyDown(e, textInput, suggestionWrapper))
	textInput.addEventListener('blur', () => (suggestionWrapper.style.display = 'none'))

	modeContainer.append(textInput, suggestionWrapper)
	if (chosenPet && chosenPet.slug) outputSmallPetContainer(chosenPet)
	textInput.focus()
}

function onInput(textInput, suggestions) {
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

function renderSuggestions(query, suggestions) {
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

function outputSmallPetContainer(pet) {
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

async function onKeyDown(e, textInput, suggestions) {
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
		e.target.blur()
	}
}

async function applyItem(i, suggestions) {
	suggestions.style.display = 'none'
	chosenPet = suggestedPets[i] ?? suggestedPets[0]
	suggestedPets = []

	if (!chosenPet || !chosenPet.slug) return
	petToStats(chosenPet)
	outputSmallPetContainer(chosenPet)
}

const highlight = (suggestions) =>
	Array.from(suggestions.children).forEach((div, i) => {
		div.classList.toggle('active', i === selectedIndex)
	})

function updateInternalStats() {
	const base = [500, 500, 100, 100, 25, 25]
	const multi = [2, 2, 1, 1, 2, 2]

	for (let i = 0; i < internalStats.length; i++) {
		internalStats[i] = base[i] + multi[i] * stats[i] * level
	}

	// buff types are this order: hp, str, pr,  wp,  mag, mr, rune
	// internal stats are this:   hp, wp,  str, mag, pr,  mr
	const statOrder = [0, 2, 4, 1, 3, 5]
	const extraStats = [0, 0, 0, 0, 0, 0]

	effects.forEach((effect) => {
		const stat = statOrder[effect.type]
		const boost = getBoost(effect.type, effect.quality)

		if (effect.type < 6) {
			extraStats[stat] += internalStats[stat] * boost
		} else {
			// rune
			for (let i = 0; i < extraStats.length; i++) {
				extraStats[i] += internalStats[i] * boost
			}
		}
	})

	extraStats.forEach((stat, i) => (internalStats[i] += stat))

	updateOutsideStats()
	updateOutputs()
}

function getBoost(type, quality) {
	let range = effectMax[type] - effectMin[type]
	let boost = effectMin[type] + (range * quality) / 100
	return boost
}

const updateOutsideStats = () =>
	outsideStats.forEach((_, i) => {
		if (i <= 3) {
			outsideStats[i] = internalStats[i] // hp, str, wp, mag
		} else if (i <= 5) {
			outsideStats[i] = (0.8 * internalStats[i]) / (100 + internalStats[i]) // pr mr
		} else if (i <= 7) {
			outsideStats[i] = internalStats[0] / (1 - outsideStats[i - 2]) // ehps
		} else {
			outsideStats[i] = internalStats[i - 4] //ipr imr
		}
	})

const updateOutputs = () =>
	outputs.forEach((output, i) => {
		output.textContent =
			i == 4 || i == 5 ? (outsideStats[i] * 100).toFixed(1) + '%' : outsideStats[i].toFixed(0)
	})

function updateStats() {
	inputs.forEach((input, i) => (stats[i] = input?.value))
	statSpan.textContent = statAmount() + ' stats'
	updateInternalStats()
	updatePetArray()
}

function petToStats(pet) {
	const order = [0, 3, 1, 4, 2, 5]
	inputs.forEach((input, i) => {
		input.value = pet.stats[order[i]]
	})
	updateStats()
}

async function updatePetArray() {
	const statOrder = [0, 2, 4, 1, 3, 5]
	const searchedStats = statOrder.map((i) => Number(stats[i]))
	const filteredPets = allPets.filter((pet) =>
		pet.stats.every((value, i) => value === searchedStats[i])
	)
	petArray = sortPets(filteredPets)
	outputPetContainer()
}

let allPets = []

function setLevelTo(value) {
	value = Math.max(1, value)
	level = value
	sliderLvl.value = value
	inputLvl.value = value
	updateInternalStats()
}

const renderPet = (pet) =>
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

const renderHeader = (string) => make('div', { textContent: string, className: 'pet-grid__cell' })

function addAddEffects() {
	const effectIcons = [
		'f_hp.png',
		'f_str.png',
		'f_pr.png',
		'f_wp.png',
		'f_mag.png',
		'f_mr.png',
		'f_rune.png',
	]
	const text = make('div', {
		className: 'passive-wrapper--adding__original',
		textContent: 'add effect',
	})
	const imgContainer = make('div', { className: 'passive-wrapper--adding__replacement' }, [
		...effectIcons.map((name, i) =>
			make('img', {
				src: '/assets/images/owo_images/battleEmojis/' + name,
				style: { height: i == 6 ? '1.4rem' : '1.5rem' },
				onclick: () => addEffect(i),
			})
		),
	])

	effectContainer.append(
		make('div', { className: 'passive-wrapper--adding' }, [text, imgContainer])
	)
}

function addEffect(type) {
	const effect = { type: type, quality: 100 }
	effects.push(effect)

	const numberInput = make('input', {
		type: 'number',
		className: 'passive-wrapper__number-input',
		min: 0,
		max: 100,
		value: 100,
		oninput() {
			updateUI(this)
		},
	})
	const rangeInput = make('input', {
		type: 'range',
		min: 0,
		max: 100,
		value: 100,
		oninput() {
			updateUI(this)
		},
	})

	const passivePortrait = make('img', {
		className: 'passive-wrapper__passive-portrait',
		src: `/assets/images/owo_images/battleEmojis/${getImageForEffect(effect)}.png`,
	})
	const boostOutput = make('div', {
		className: 'passive-wrapper__boost-output',
		textContent: boostToString(effect),
	})

	function updateUI({ value }) {
		effect.quality = Number(value)
		numberInput.value = Number(value)
		rangeInput.value = Number(value)
		passivePortrait.src = `/assets/images/owo_images/battleEmojis/${getImageForEffect(effect)}.png`
		boostOutput.textContent = boostToString(effect)
		updateInternalStats()
	}

	const button = make('button', {
		className: 'passive-wrapper__removal-button',
		textContent: 'X',
		onclick: () => {
			effects = effects.filter((e) => e !== effect)
			wrapper.remove()
			updateInternalStats()
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
	updateUI({ value: 100 })
}

const boostToString = (effect) =>
	'+' + parseFloat((100 * getBoost(effect.type, effect.quality)).toFixed(1)) + '%'

const getImageForEffect = (effect) => prefix(effect.quality) + boostSuffix[effect.type]

const prefix = (quality) =>
	[
		{ min: -Infinity, prefix: 'c_' },
		{ min: 20, prefix: 'u_' },
		{ min: 40, prefix: 'r_' },
		{ min: 60, prefix: 'e_' },
		{ min: 80, prefix: 'm_' },
		{ min: 94, prefix: 'l_' },
		{ min: 99, prefix: 'f_' },
	].findLast(({ min }) => min < quality).prefix

document.addEventListener('DOMContentLoaded', async () => {
	inputs.forEach((input) => {
		input.addEventListener('change', updateStats)
		input.addEventListener('wheel', (ev) => {
			ev.preventDefault()
			const newValue = Number(input.value) - Math.sign(ev.deltaY)
			input.value = Math.min(Math.max(newValue, input.min), input.max)
			updateStats()
		})
	})
	inputLvl.addEventListener('change', (ev) => setLevelTo(ev.target.value))
	inputLvl.addEventListener('wheel', (ev) => {
		ev.preventDefault()
		setLevelTo((level -= Math.sign(ev.deltaY)))
	})
	levelWrapper.addEventListener('click', () => inputLvl.focus())
	sliderLvl.addEventListener('input', (ev) => setLevelTo(ev.target.value))

	inputs[0].focus()

	modeSwitchButton.addEventListener('click', function () {
		showPets = !showPets
		modeSwitchButton.textContent = showPets ? 'Mode: Matching Pets' : 'Mode:   Search Pets'
		updatePetArray()
	})

	allPets = await loadPets()
	updateStats()
	setLevelTo(0)
	addAddEffects()
})
