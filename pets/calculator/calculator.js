import { loadJson, loadPets } from '/js/util/jsonUtil.js'
import { make, doTimestamps } from '/js/util/injectionUtil.js'

const petContainer = document.getElementById('petContainer')
const effectContainer = document.getElementById('effectContainer')

const petButton = document.querySelector('.pet-button')
const statSpan = document.getElementById('statSpan')

const inputLvl = document.querySelector('.input-lvl')
const levelWrapper = document.querySelector('#level-wrapper')
const sliderLvl = document.getElementById('sliderLvl')

const inputs = Array.from(document.querySelectorAll('.myInputs'))
const outputs = Array.from(document.querySelectorAll('.myOutputs'))

//for Mode: matching pets
let showPets = true
let page = 0
let columns = []
const maxDisplayColumns = 3

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

const sortPets = (array) =>
	array.sort((petA, petB) => {
		if (petA.tier.priority !== petB.tier.priority)
			return petA.tier.priority - petB.tier.priority
		else return petA.name.localeCompare(petB.name)
	})

function outputPetContainer() {
	if (showPets) {
		petContainer.innerHTML = ''
		outputPetContainerMATCHING()
	} else if (!document.getElementById('textInput')) {
		petContainer.innerHTML = ''
		outputPetContainerSEARCH()
	}
}

function outputPetContainerMATCHING() {
	columns = [make('div', { className: 'column' })]
	page = 0
	let headersCreated = 0
	petArray.forEach((_, i) => {
		if (i === 0 || petArray[i].tier != petArray[i - 1].tier) {
			headersCreated++
			columns.at(-1).append(createHeader(petArray[i].tier.prettyName))
		}
		if ((i + headersCreated) % 20 == 0) {
			columns.push(make('div', { className: 'column' }))
		}
		columns.at(-1).append(displayPet(petArray[i]))
	})

	petContainer.append(
		make('div', { style: { display: 'flex' } }),
		make('div', { className: 'nav-button-wrapper' }, [
			make('button', {
				textContent: '<',
				tabIndex: '9',
				onclick: () => swapPages(page - 1),
			}),
			make('button', {
				textContent: '>',
				tabIndex: '10',
				onclick: () => swapPages(page + 1),
			}),
		])
	)

	function swapPages(newPage) {
		page = Math.min(Math.max(newPage, 0), Math.ceil(columns.length / maxDisplayColumns) - 1)
		displayColumns()
	}
	displayColumns()
}

function outputPetContainerSEARCH() {
	const textInput = make('input', {
		id: 'textInput',
		tabIndex: '9',
		className: 'discord-code search-bar',
		autocomplete: 'off',
		placeholder: 'type pet here...',
	})

	const suggestionWrapper = make('div', { className: 'suggestions' })

	textInput.addEventListener('input', () => onInput(textInput, suggestionWrapper))
	textInput.addEventListener('focus', () => onInput(textInput, suggestionWrapper))
	textInput.addEventListener('keydown', (e) => onKeyDown(e, textInput, suggestionWrapper))
	textInput.addEventListener('blur', () => (suggestionWrapper.style.display = 'none'))

	petContainer.append(textInput, suggestionWrapper)
	if (chosenPet && chosenPet.name) outputSmallPetContainer(chosenPet)
	textInput.focus()
}

const displayColumns = () =>
	petContainer.firstChild.replaceChildren(
		...columns.slice(page * maxDisplayColumns, page * maxDisplayColumns + maxDisplayColumns)
	)

function onInput(textInput, suggestions) {
	const q = textInput.value.trim().toLowerCase()

	suggestedPets = allPets.filter(
		(pet) => pet.lowerName.includes(q) || pet.aliases.some((alias) => alias.includes(q))
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
					className: 'suggestion',
					textContent: pet.name,
					onmousedown: (_) => applyItem(i, suggestions),
				},
				[
					make('div', {
						className: 'alias',
						innerHTML: aliases.join(', '),
					}),
				]
			)
		)
	})
}

function outputSmallPetContainer(pet) {
	document.getElementById('petOutput')?.remove()

	const children = [
		make('img', {
			src: getPetImage(pet, true),
			style: { width: '3rem' },
		}),
		make('div', {
			innerHTML: pet.name,
			className: 'discord-code light name',
		}),
		pet.aliases &&
			pet.aliases[0] &&
			make('div', {
				innerHTML: 'Aliases: ' + pet.aliases.join(', '),
				className: 'discord-code light alias',
			}),
	].filter(Boolean)

	petContainer.append(
		make(
			'div',
			{
				className: 'pet-output-wrapper',
				id: 'petOutput',
			},
			children
		)
	)
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

	if (!chosenPet || !chosenPet.name) return
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
	// internal stats are this;   hp, wp,  str, mag, pr,  mr
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
}

function getBoost(type, quality) {
	let range = effectMax[type] - effectMin[type]
	let boost = effectMin[type] + (range * quality) / 100
	return boost
}

function updateOutsideStats() {
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
	updateOutputs()
}

function updateOutputs() {
	outputs.forEach((output, i) => {
		output.textContent =
			i == 4 || i == 5 ? (outsideStats[i] * 100).toFixed(1) + '%' : outsideStats[i].toFixed(0)
	})
}

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

function displayPet(pet) {
	const children = [
		make('img', {
			src: getPetImage(pet),
			className: 'one-rem',
		}),
		make('code', {
			textContent: pet.name,
			className: 'discord-code pet-name',
		}),
		make('span', {
			innerHTML: pet.aliases.length ? pet.aliases.join(', ') : 'no Alias',
			className: 'tooltip',
		}),
	]

	return make('div', { className: 'pet-row' }, [
		make('div', { className: 'tooltip-parent' }, children),
	])
}

const createHeader = (string) => make('div', { textContent: string, className: 'pet-row' })

function getPetImage(pet, wantAnimated) {
	if (wantAnimated && pet.animated == 1) {
		return `https://cdn.discordapp.com/emojis/${pet.emoji}.gif?size=96`
	} else if (
		['common', 'uncommon', 'rare', 'epic', 'mythical', 'hidden'].includes(pet.tier.name)
	) {
		return `/media/owo_images/pets/${pet.name}.png`
	} else {
		return `https://cdn.discordapp.com/emojis/${pet.emoji}.png?size=96`
	}
}

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
	const text = make('div', { className: 'original', textContent: 'add effect' })
	const imgContainer = make('div', { className: 'replacement passive-emoji-wrapper' }, [
		...effectIcons.map((name, i) =>
			make('img', {
				src: '/media/owo_images/battleEmojis/' + name,
				style: { height: i == 6 ? '1.4rem' : '1.5rem' },
				onclick: () => addEffect(i),
			})
		),
	])

	effectContainer.append(make('div', { className: 'passive-wrapper' }, [text, imgContainer]))
}

function addEffect(type) {
	const effect = { type: type }
	effects.push(effect)

	const inputs = [
		make('input', {
			type: 'number',
			className: 'passive-number-input no-arrows',
			min: 0,
			max: 100,
		}),
		make('input', { type: 'range', min: 0, max: 100 }),
	]
	inputs.forEach((input) => (input.oninput = () => updateValue(input.value)))

	const imagechildren = [
		make('img', { style: 'height:1.5rem; display:block;' }),
		make('div', { style: 'font-size:0.5rem;' }),
	]

	function updateValue(value) {
		effect.quality = +value
		inputs.forEach((i) => (i.value = +value))
		imagechildren[0].src = `/media/owo_images/battleEmojis/${getImageForEffect(effect)}.png`
		imagechildren[1].textContent = boostToString(effect)
		updateInternalStats()
	}

	const button = make('div', {
		className: 'fake-button',
		textContent: 'X',
		onclick: () => {
			effects = effects.filter((e) => e !== effect)
			wrapper.remove()
			updateInternalStats()
		},
	})

	const numberWrapper = make('div', { className: 'grayOnHover number-wrapper' }, [
		inputs[0],
		make('div', { textContent: '%', className: 'percent-span' }),
	])

	const wrapper = make('div', { className: 'passive-wrapper' }, [
		make('div', { className: 'passive-image-wrapper' }, imagechildren),
		make('div', { className: 'listening-wrapper', onclick: () => inputs[0].focus() }, [
			numberWrapper,
		]),
		inputs[1],
		button,
	])
	effectContainer.insertBefore(wrapper, effectContainer.lastChild)
	updateValue(100)
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
	doTimestamps()
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

	petButton.addEventListener('click', function () {
		showPets = !showPets
		petButton.textContent = showPets ? 'Mode: Matching Pets' : 'Mode:   Search Pets'
		updatePetArray()
	})

	allPets = await loadPets()
	updateStats()
	setLevelTo(0)
	addAddEffects()
})
