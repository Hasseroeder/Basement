import * as cookie from '/js/util/cookieUtil.js'
import { signedNumberFixedString, numStringToSubscript, zeroPad } from '/js/util/stringUtil.js'
import { make, doTimestamps } from '/js/util/injectionUtil.js'
import { debounce, roundToDecimals, makeRepeatingButton } from '/js/util/inputUtil.js'
import { loadJson } from '/js/util/jsonUtil.js'

const sellZooValue = document.querySelector('#cowoncyZooValue')
const sacZooValue = document.querySelector('#essenceZooValue')
const sellHbValue = document.querySelector('#cowoncyHbValue')
const sacHbValue = document.querySelector('#essenceHbValue')
const zpSpan = document.querySelector('#zpSpan')
const [firstButton, prevButton, nextButton, lastButton] = Array.from(
	document.querySelectorAll('#simming-buttons button')
)
const huntbotIdxEl = document.querySelector('#huntbotIdx')
const currentHbLines = Array.from(document.querySelectorAll('#huntbotLine'))
const countContainer = document.querySelector(`#tierCountContainer`)

let patreon = false
let isDragging = false

const DATA = await loadJson('/huntbot/calculator/zoo.json')
const zoo = DATA.zoo.filter((tier) => tier.huntbotAvailable)
const { petFolder, tierFolder } = DATA.config

const archive = {
	huntbot: JSON.parse(JSON.stringify(zoo)),
	text: [],
}
archive.huntbot.forEach((tier) => tier.pets.forEach((pet) => (pet.caught = [])))
// storing each new huntbot in a new index of this then
let currentHbIdx = -1

zoo.getMaxCaught = function () {
	let maxCaught = 0
	for (const { pets } of this) {
		for (const { caught } of pets) maxCaught = Math.max(caught, maxCaught)
	}
	return maxCaught
}

zoo.getZP = function () {
	let ZP = 0
	for (const tier of this) {
		for (const pet of tier.pets) ZP += pet.caught * tier.value.points
	}
	return ZP
}

zoo.getValue = function () {
	let sac = 0
	let sell = 0
	for (const tier of this) {
		for (const pet of tier.pets) {
			if (tier.isSac) sac += pet.caught * tier.value.sac
			else sell += pet.caught * tier.value.sell
		}
	}
	return { sac, sell }
}

archive.huntbot.getMaxCaught = function (idx) {
	let maxCaught = 0
	for (const { pets } of this) {
		for (const { caught } of pets) maxCaught = Math.max(caught[idx], maxCaught)
	}
	return maxCaught
}

archive.huntbot.getValue = function (idx) {
	let sac = 0
	let sell = 0
	for (const tier of this) {
		for (const pet of tier.pets) {
			if (tier.isSac) sac += pet.caught[idx] * tier.value.sac
			else sell += pet.caught[idx] * tier.value.sell
		}
	}
	return { sac, sell }
}

const tierTable = document.querySelector('.tier-table')
zoo.forEach((tier) => {
	Object.defineProperty(tier, 'rate', {
		get() {
			if (tier.patreonNeeded && !patreon) return 0
			if (typeof tier._rate === 'number') return tier._rate

			switch (tier.slug) {
				case 'common': {
					// common = 1 - sum(other active rates)
					const sumOther = zoo
						.filter((t) => t.slug !== 'common')
						.reduce((acc, t) => acc + t.rate, 0)
					return Math.max(0, 1 - sumOther)
				}
				case 'bot':
					// scales with Radar.level
					return 0.00000004 * Radar.level
			}
		},
	})

	const img = make('img', { className: 'smol', draggable: false })
	const text = make('div')
	const siblingTier = archive.huntbot.find((archiveTier) => archiveTier.slug == tier.slug)
	tier.toggle = function (override) {
		this.isSac = override ?? !this.isSac
		siblingTier.isSac = this.isSac
		text.innerHTML = this.isSac ? 'Sac' : 'Sell'
		img.src = this.isSac ? '/media/owo_images/essence.gif' : '/media/owo_images/cowoncy.png'
		drawData()
	}

	const wrapper = make(
		'div',
		{
			className: 'tier-cell gray-hover',
			onmousedown: () => tier.toggle(),
			onmouseenter: (e) => {
				if (e.relatedTarget && wrapper.contains(e.relatedTarget)) return
				if (isDragging) tier.toggle()
			},
		},
		[
			make('img', { src: tierFolder + tier.emoteSrc, draggable: false }),
			make('div', { className: 'dynamic' }, [text, img]),
			tier.patreonNeeded ? make('div', { className: 'patreon-graying' }) : '',
		]
	)
	tierTable.append(wrapper)
})

const traitTable = make('table')
{
	//table init
	const cells = ['', 'Cost', 'Essence', 'ROI'].map((textContent) => make('td', { textContent }))
	traitTable.append(make('tr', {}, cells))
	document.querySelector('#table-box').append(traitTable)
}

const gridContainer = document.querySelector('.gridContainer')

const dailyPets = () => Efficiency.value * 24
const hbPets = () => Math.floor(Efficiency.value * Duration.value)

class Trait {
	constructor(opts) {
		Object.assign(this, opts)
		this.header = make('span')
		this.emoji = make('img', {
			src: `/media/owo_images/huntbot/${this.name.toLowerCase()}.png`,
			style: { height: '1rem' },
		})

		const header = make('div', { className: 'header-wrapper' }, [this.emoji, this.header])

		if (this.upgradeWorth) {
			const cells = [...Array(4)].map(() => make('td'))
			const row = make('tr', {}, cells)
			cells[0].textContent = this.name
			this.table = {
				row,
				update: () => {
					const ROIs = [Efficiency, Gain, Radar]
						.filter((trait) => trait.level != trait.max)
						.map((trait) => trait.ROI)

					row.classList.toggle('maxxed', this.level === this.max)
					row.classList.toggle('recommended', this.ROI === Math.max(...ROIs))
					cells[1].textContent = this.cost.toLocaleString()
					cells[2].textContent =
						signedNumberFixedString(this.upgradeWorth(), 1) + ` ess/day`
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
			onchange: () => (this.level = this.input.value),
		})

		const numberWrapper = make(
			'div',
			{ className: 'numberWrapper  rounded gray-hover', onclick: () => this.input.focus() },
			[lvlSpan, this.input]
		)

		const ttImg = make('img', {
			className: 'upgrade-image',
			src: '/media/owo_images/essence.gif',
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
				onwheel: (e) => {
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
		value = Math.min(this.input.max, Math.max(0, value))
		this._level = value
		//DOM updates
		this.input.value = value
		this.btnM.textContent = value == 0 ? 'MIN' : '<'
		this.btnP.text.textContent = value == this.max ? 'MAX' : '>'
		this.btnP.ttEl.hidden = value == this.max
		this.btnP.ttText.textContent = this.cost
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
		const { mult = 1, base = 0 } = this.valueParams
		return mult * this.level + base
	}

	get ROI() {
		return this.upgradeWorth() / this.cost
	}
}

const Efficiency = new Trait({
	name: 'Efficiency',
	unit: ' pets/h',
	max: 215,
	costParams: { mult: 10, exponent: 1.748 },
	valueParams: { base: 25 },
	upgradeWorth: () => petValue().sac * 24,
	outputs: [() => dailyPets() + ' pets/day', () => hbPets() + ' pets/hb'],
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
		() => '-' + dailyPets() * Cost.value + ' owo/day',
		() => '-' + hbPets() * Cost.value + ' owo/hb',
	],
})
const Gain = new Trait({
	name: 'Gain',
	unit: ' ess/h',
	max: 200,
	costParams: { mult: 10, exponent: 1.8 },
	valueParams: { mult: 25 },
	upgradeWorth: () => 600,
	outputs: [
		() => Gain.value * 24 + ' ess/day',
		() => Math.floor(Gain.value * Duration.value) + ' ess/hb',
	],
})
const Experience = new Trait({
	name: 'Experience',
	unit: ' exp/h',
	max: 200,
	costParams: { mult: 10, exponent: 1.8 },
	valueParams: { mult: 35 },
	outputs: [
		() => Experience.value * 24 + ' exp/day',
		() => Math.floor(Experience.value * Duration.value) + ' exp/hb',
	],
})
const Radar = new Trait({
	name: 'Radar',
	unit: 'ppm',
	max: 999,
	costParams: { mult: 50, exponent: 2.5 },
	valueParams: { mult: 0.04 },
	upgradeWorth: () => {
		const botTier = zoo.find((tier) => tier.slug == 'bot')
		const commonTier = zoo.find((tier) => tier.slug == 'common')
		return (
			(botTier.isSac ? 0.00000004 * botTier.value.sac * dailyPets() : 0) -
			(commonTier.isSac ? 0.00000004 * commonTier.value.sac * dailyPets() : 0)
		)
	},
	outputs: [
		() =>
			'weekly bot: ' +
			(100 - 100 * Math.pow(1 - 0.00000004 * Radar.level, dailyPets() * 7)).toFixed(1) +
			'%',
		() =>
			'monthly bot: ' +
			(100 - 100 * Math.pow(1 - 0.00000004 * Radar.level, dailyPets() * 30)).toFixed(1) +
			'%',
	],
})
const traits = [Efficiency, Duration, Cost, Gain, Experience, Radar]

const renderPatreon = () =>
	Array.from(document.querySelectorAll('.patreon-graying')).forEach((el) => (el.hidden = patreon))

doTimestamps()
const toggleAllButtons = document.getElementById('sacToggles').querySelectorAll('button')
toggleAllButtons[0].onclick = () => toggleAllTiers(false)
toggleAllButtons[1].onclick = () => toggleAllTiers(true)
const toggleAllTiers = (boolean) => zoo.forEach((tier) => tier.toggle(boolean))

const save = debounce(function () {
	const tempLevels = traits.map((t) => Number(t.level))
	history.replaceState(null, '', '#' + tempLevels.join(','))
	cookie.setCookie('Patreon', patreon.toString(), 30)
	cookie.setCookie('Levels', tempLevels.join(','), 30)
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
document.addEventListener('paste', (e) => extractLevels(e.clipboardData.getData('text')))

const patreonCheckWrapper = document.getElementById('patreonCheck')
const patreonCheck = patreonCheckWrapper.querySelector('input')
patreonCheckWrapper.onclick = () => {
	patreon = patreonCheck.checked
	save()
	drawData()
	renderPatreon()
}

function drawData() {
	displayZoo()
	if (currentHbIdx >= 0) displayNthHuntbot(currentHbIdx)

	traits.forEach((trait) => {
		trait.header.textContent = trait.name + ' - ' + roundToDecimals(trait.value, 2) + trait.unit
		trait.outputs.forEach((fn) => fn())
		trait.table?.update()
	})

	const { sac, sell } = petValue()
	petWorthEls[0].textContent = sell.toFixed(1) + ' owo/pet'
	hbWorthEls[0].textContent = (sell * hbPets()).toFixed(0) + ' owo/hb'

	petWorthEls[1].textContent = 'Profit: ' + (sell - Cost.value).toFixed(1) + ' owo/pet'
	hbWorthEls[1].textContent = 'Profit: ' + ((sell - Cost.value) * hbPets()).toFixed(0) + ' owo/hb'

	petWorthEls[2].textContent = sac.toFixed(1) + ' ess/pet'
	hbWorthEls[2].textContent = (sac * hbPets()).toFixed(0) + ' ess/hb'

	patreonCheckWrapper.checked = patreon
}

const extractLevels = (text) =>
	[...text.matchAll(/\bLvl (\d+)\b/g)].slice(0, 6).forEach((m, i) => (traits[i].level = m[1]))

function importFromCookie() {
	const levelsData = cookie.getCookie('Levels')
	stringToLevel(levelsData ?? '0,0,0,0,0,0')

	patreon = cookie.getCookie('Patreon') === 'true'
	patreonCheck.checked = patreon
	renderPatreon()
}

const stringToLevel = (levelString) =>
	levelString.split(',').forEach((value, i) => (traits[i].level = value || 0))

initDom(zoo, document.getElementById('zooContainer'))
initDom(archive.huntbot, document.getElementById('huntbotContainer'), ' | ')

function initDom(zoo, container, separator) {
	for (const tier of zoo) {
		tier.row = {
			el: make('div', { className: 'zoo-row' }, [
				make('img', { src: tierFolder + tier.emoteSrc }),
			]),
			initialized: false,
		}
		container.append(tier.row.el)
		separator && tier.row.el.append(separator)

		for (const pet of tier.pets) {
			const textEl = make('div')
			pet.cell = {
				wrapper: make('div', { className: 'pet-cell' }, [
					make('img', { src: petFolder + pet.emoteSrc }),
					textEl,
				]),
				textEl,
				initialized: false,
			}
			tier.row.el.append(pet.cell.wrapper)
		}
	}
}

function newHuntbot() {
	{
		// RUN RNG
		const pets = hbPets()
		let acc = 0
		const rateArray = zoo.map((tier) => (acc += tier.rate))
		archive.huntbot.forEach((tier) => tier.pets.forEach((pet) => pet.caught.push(0)))
		currentHbIdx = archive.huntbot[0].pets[0].caught.length - 1

		for (let i = 0; i < pets; i++) {
			const r = Math.random()
			const tierIdx = rateArray.findIndex((rate) => r < rate)
			const petIdx = Math.floor(Math.random() * zoo[tierIdx].pets.length)

			archive.huntbot[tierIdx].pets[petIdx].caught[currentHbIdx]++
			zoo[tierIdx].pets[petIdx].caught++
		}
	}

	archive.text.push([
		`BEEP BOOP. I AM BACK WITH ${hbPets()} ANIMALS,`,
		`${Gain.value * Duration.value} ESSENCE, AND ${Experience.value * Duration.value} EXPERIENCE`,
	])
	displayZoo()
	displayNthHuntbot(currentHbIdx)
}

function displayNthHuntbot(n) {
	const { sell, sac } = archive.huntbot.getValue(n)
	sellHbValue.textContent = sell.toLocaleString()
	sacHbValue.textContent = sac.toLocaleString()

	huntbotIdxEl.textContent = n + 1 + '/' + archive.huntbot[0].pets[0].caught.length
	currentHbLines[0].textContent = archive.text[n][0]
	currentHbLines[1].textContent = archive.text[n][1]

	const digitsNeeded = String(archive.huntbot.getMaxCaught(n)).length
	for (const tier of archive.huntbot) {
		tier.row.el.style.display = 'none'
		for (const pet of tier.pets) processPet(pet.caught[n], pet, digitsNeeded, tier)
	}
}

function displayZoo() {
	zpSpan.textContent = zoo.getZP().toLocaleString()
	const { sell, sac } = zoo.getValue()
	sellZooValue.textContent = sell.toLocaleString()
	sacZooValue.textContent = sac.toLocaleString()

	const digitsNeeded = String(zoo.getMaxCaught()).length
	const countContainerArray = []
	for (const tier of zoo) {
		var tierPets = 0
		for (const pet of tier.pets) {
			processPet(pet.caught, pet, digitsNeeded, tier)
			tierPets += pet.caught
		}
		if (tierPets) countContainerArray.push(`${tier.prefix}-${tierPets}`)
	}
	countContainer.textContent = countContainerArray.reverse().join(', ')
}

function processPet(caughtInt, pet, digitsNeeded, tier) {
	if (caughtInt) {
		pet.cell.textEl.textContent = numStringToSubscript(zeroPad(caughtInt, digitsNeeded))
		pet.cell.wrapper.style.display = 'flex'
		tier.row.el.style.display = 'flex'
	} else {
		pet.cell.wrapper.style.display = 'none'
	}
}

makeRepeatingButton(prevButton, () => {
	if (currentHbIdx > 0) {
		currentHbIdx--
		displayNthHuntbot(currentHbIdx)
	}
})

makeRepeatingButton(nextButton, () => {
	if (currentHbIdx === archive.text.length - 1) {
		newHuntbot()
	} else {
		currentHbIdx++
		displayNthHuntbot(currentHbIdx)
	}
})

firstButton.onmousedown = () => {
	currentHbIdx = 0
	displayNthHuntbot(currentHbIdx)
}

lastButton.onmousedown = () => {
	currentHbIdx = archive.text.length - 1
	displayNthHuntbot(currentHbIdx)
}

importFromCookie()
if (location.hash) stringToLevel(location.hash.slice(1))
toggleAllTiers(true)
