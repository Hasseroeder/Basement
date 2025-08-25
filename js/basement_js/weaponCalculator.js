(function () {
	const root = document.getElementById('wearSelect');
	const button = root.querySelector('.selected');
	const listbox = root.querySelector('.options');
	const options = Array.from(root.querySelectorAll('.option'));
	const hiddenInput = document.getElementById('myCustomSelect');

	let open = false;
	let selectedIndex = -1;     
	let highlightedIndex = -1; 
	let typeBuffer = '';
	let typeTimer = null;

	selectIndex(0);

	function openList() {
		if (open) return;
		open = true;
		root.classList.add('open');
		button.setAttribute('aria-expanded', 'true');
		listbox.focus({ preventScroll: true });
		// Start highlighted at selected or first
		setHighlight(selectedIndex >= 0 ? selectedIndex : 0, true);
		ensureVisible(highlightedIndex);
		document.addEventListener('pointerdown', onDocPointerDown, { capture: true });
	}

	function closeList() {
		if (!open) return;
		open = false;
		root.classList.remove('open');
		button.setAttribute('aria-expanded', 'false');
		button.focus({ preventScroll: true });
		clearHighlight();
		document.removeEventListener('pointerdown', onDocPointerDown, { capture: true });
	}

	function onDocPointerDown(e) {
		if (!root.contains(e.target)) closeList();
	}

	function selectIndex(index, { fromTypeahead = false } = {}) {
		if (index < 0 || index >= options.length) return;
		// Update selected UI
		options.forEach((opt, i) => {
		opt.setAttribute('aria-selected', String(i === index));
		opt.classList.toggle('highlighted', false);
		});
		const opt = options[index];
		button.textContent = opt.textContent.trim();
		hiddenInput.value = opt.dataset.value || opt.textContent.trim();
		selectedIndex = index;

		root.dispatchEvent(
			new CustomEvent('change', {
				detail: { value: hiddenInput.value },
				bubbles: true
			})
		);
	}

	function setHighlight(index, scrollIntoView = false) {
		if (index < 0 || index >= options.length) return;
		if (highlightedIndex >= 0) options[highlightedIndex].classList.remove('highlighted');
		highlightedIndex = index;
		options[highlightedIndex].classList.add('highlighted');
		if (scrollIntoView) ensureVisible(highlightedIndex);
	}

	function clearHighlight() {
		if (highlightedIndex >= 0) options[highlightedIndex].classList.remove('highlighted');
		highlightedIndex = -1;
	}

	function ensureVisible(index) {
		const opt = options[index];
		const lb = listbox;
		const oTop = opt.offsetTop;
		const oBottom = oTop + opt.offsetHeight;
		const vTop = lb.scrollTop;
		const vBottom = vTop + lb.clientHeight;

		if (oTop < vTop) lb.scrollTop = oTop;
		else if (oBottom > vBottom) lb.scrollTop = oBottom - lb.clientHeight;
	}

	function move(delta) {
		const count = options.length;
		const base = open ? (highlightedIndex >= 0 ? highlightedIndex : selectedIndex) : selectedIndex;
		let next = base + delta;
		if (next < 0) next = 0;
		if (next > count - 1) next = count - 1;

		if (open) {
		setHighlight(next, true);
		} else {
		selectIndex(next);
		}
	}

	function moveToStart() {
		if (open) setHighlight(0, true);
		else selectIndex(0);
	}

	function moveToEnd() {
		const last = options.length - 1;
		if (open) setHighlight(last, true);
		else selectIndex(last);
	}

	// Type-ahead
	function handleTypeahead(char) {
		typeBuffer += char.toLowerCase();
		if (typeTimer) clearTimeout(typeTimer);
		typeTimer = setTimeout(() => (typeBuffer = ''), 600);

		const start = (open ? (highlightedIndex >= 0 ? highlightedIndex + 1 : 0) : selectedIndex + 1);
		const match = findMatch(typeBuffer, start);
		const idx = match !== -1 ? match : findMatch(typeBuffer, 0); // wrap

		if (idx !== -1) {
		if (open) {
			setHighlight(idx, true);
		} else {
			selectIndex(idx, { fromTypeahead: true });
		}
		}
	}

	function findMatch(prefix, startIndex) {
		for (let i = startIndex; i < options.length; i++) {
		if (options[i].textContent.trim().toLowerCase().startsWith(prefix)) return i;
		}
		return -1;
	}

	// Click interactions
	button.addEventListener('click', () => {
		open ? closeList() : openList();
	});

	options.forEach((opt, i) => {
		opt.addEventListener('click', () => {
		selectIndex(i);
		closeList();
		});
	});

	button.addEventListener('keydown', (e) => {
		const k = e.key;

		// Open with Space
		if (k === ' ' || k === 'Spacebar') {
		e.preventDefault();
		openList();
		return;
		}

		// Navigation while closed
		if (k === 'ArrowDown' || k === 'ArrowRight') {
		e.preventDefault();
		move(1);
		return;
		}
		if (k === 'ArrowUp' || k === 'ArrowLeft') {
		e.preventDefault();
		move(-1);
		return;
		}
		if (k === 'PageDown') {
		e.preventDefault();
		moveToEnd();
		return;
		}
		if (k === 'PageUp') {
		e.preventDefault();
		moveToStart();
		return;
		}

		// Type-to-select
		if (isTypeChar(e)) {
		e.preventDefault();
		handleTypeahead(e.key);
		}
	});

	listbox.addEventListener('keydown', (e) => {
		const k = e.key;

		if (k === 'Escape' || k === 'Esc') {
		e.preventDefault();
		closeList();
		return;
		}

		if (k === 'Enter') {
		e.preventDefault();
		if (highlightedIndex >= 0) selectIndex(highlightedIndex);
		closeList();
		return;
		}

		if (k === 'ArrowDown' || k === 'ArrowRight') {
		e.preventDefault();
		move(1);
		return;
		}
		if (k === 'ArrowUp' || k === 'ArrowLeft') {
		e.preventDefault();
		move(-1);
		return;
		}

		if (k === 'PageDown') {
		e.preventDefault();
		moveToEnd();
		return;
		}
		if (k === 'PageUp') {
		e.preventDefault();
		moveToStart();
		return;
		}

		if (isTypeChar(e)) {
		e.preventDefault();
		handleTypeahead(e.key);
		return;
		}
	});

	function isTypeChar(e) {
		return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
	}
})();

let weapons;

async function loadWeapons() {
    try {
        const response = await fetch("../json/weapons.json");
        weapons = await response.json();
    } catch (error) {
        console.error("Error loading weapons:", error);
    }
} 

const percentageConfig = {
	get bonus() {
		return getWearBonus();
	},
	get min() {
		return this.bonus;
	},
	get max() {
		return 100 + this.bonus;
	},
	get range() {
		return this.max - this.min;
	},
	step: 1,
	unit: "%",
	digits:3
};

const el = {
	weaponHeader:	document.getElementById("weaponHeader"), 
	weaponName:		document.getElementById("weaponName"),
	ownerID:		document.getElementById("ownerID"),
	weaponID:		document.getElementById("weaponID"),
	shardValue:		document.getElementById("shardValue"),
	weaponQuality:	document.getElementById("weaponQuality"),
	wearSelect: 	document.getElementById("wearSelect"),
	weaponImage: 	document.getElementById("weaponImage"),
	wpCost:			document.getElementById("WP-Cost"),
	description:	document.getElementById("description")
}

document.addEventListener("DOMContentLoaded",initWeaponCalc);

let currentWeapon;
let currentWeaponID;
const initWeaponID = 101;

async function initWeaponCalc(){
	initiateFirstID();
	await loadWeapons();
	loadWeaponTypeData();

	el.wearSelect.addEventListener('change', e => {
		currentWeapon.product.blueprint.wear = e.detail.value;
		updateWear();
		//TODO: update a bunch of stuff once wear is changed
	});
}

function initiateFirstID(){
	const hash = location.hash.substring(1);
	currentWeaponID = hash
		? Number(hash)
		: initWeaponID;
}

function loadWeaponTypeData(){
	// from the .json
	currentWeapon = weapons[currentWeaponID];
	fillMissingWeaponInfo();
	completeUpdateWeaponData();
}

function fillMissingWeaponInfo(){
	currentWeapon.product.blueprint.passive.forEach(entry => {
		entry.stats.forEach(stat => generateMissingStat(stat));
    });
	currentWeapon.product.blueprint.stats.forEach(stat => generateMissingStat(stat));
}

function generateMissingStat(stat){
	if (!stat.noWear && currentWeaponID == 104){
		const qualities = [
			{ quality: 20,  chance: 40},
			{ quality: 40,  chance: 60},
			{ quality: 60,  chance: 75},
			{ quality: 75,  chance: 85},
			{ quality: 85,  chance: 95},
			{ quality: 95,  chance: 99},
			{ quality: 100, chance: 100}
		];
		const match = qualities.find(t => Math.floor(Math.random() * 101) <= t.chance);
		stat.noWear = match.quality;
		//when we generate a rune stat, it generally shouldn't be at any value
	}else if (!stat.noWear){
		stat.noWear=Math.floor(Math.random() * 101);
	}
}

function completeUpdateWeaponData(){
	updateWear();
	updateWeaponData();
}

function updateWeaponData(){
	calculateQualities(currentWeapon);
	displayInfo();
}

function getRarity(quality) {
	const tiers = [
		{ maxQuality: 20, name: "common" },
		{ maxQuality: 40, name: "uncommon" },
		{ maxQuality: 60, name: "rare" },
		{ maxQuality: 80, name: "epic" },
		{ maxQuality: 94, name: "mythic" },
		{ maxQuality: 99, name: "legendary" },
		{ maxQuality: 105, name: "fabled" }
		//  -- Annoying stuff in scoot's code: --
		// 	Weapons and Passives work differently with these values
		// 	example: 
		// 	- for weapons, anything 81<=x<95 would be considered mythic
		//	- for passives, anything 80<x<=94 would be considered mythic
		// --------------------------------------
	];

	const tier = tiers.find(t => quality <= t.maxQuality)
				|| tiers.at(-1);
				//default to fabled if we have nonsensical input
	return tier.name;
}

function getTierEmoji(tier){
	const img = document.createElement("img");
	img.src = getTierEmojiPath(tier);
	img.alt = tier;
	img.ariaLabel = tier;
	img.title = `:${tier}:`;
	img.className = "discord-embed-emote";
	return img;
}

function getTierEmojiPath(stringOrQuality){
	const paths = {
		common: 	"../media/owo_images/common.png",
		uncommon:   "../media/owo_images/uncommon.png",
		rare:   	"../media/owo_images/rare.png",
		epic:     	"../media/owo_images/epic.png",
		mythic:  	"../media/owo_images/mythic.png",
		legendary:	"../media/owo_images/legendary.gif",
		fabled: 	"../media/owo_images/fabled.gif"
	};
	if (typeof stringOrQuality === "string"){
		return paths[stringOrQuality];
	}else if(typeof stringOrQuality === "number"){
		return paths[getRarity(stringOrQuality)];
	}
}

function updateWear(){
	syncWear();
	calculateQualities(currentWeapon);
	displayInfo();
	generateStatInput();
}

function syncWear(){
	currentWeapon.product.blueprint.passive.forEach(entry => {
		entry.stats.forEach(stat => {
			stat.withWear = stat.noWear + getWearBonus();
		});
    });
	currentWeapon.product.blueprint.stats.forEach(stat => {
		stat.withWear = stat.noWear + getWearBonus();
	});
}

function calculateQualities(weapon) {
    const blueprint = weapon.product.blueprint;
    const baseStats = Array.isArray(blueprint.stats) ? blueprint.stats : [];
    const passives  = Array.isArray(blueprint.passive) ? blueprint.passive : [];

    passives.forEach(entry => {
        const { sumWear, sumNoWear } = entry.stats.reduce((acc, stat) => ({ 
			sumWear: acc.sumWear     + stat.withWear, 
			sumNoWear: acc.sumNoWear + stat.noWear
		}), { sumWear: 0, sumNoWear: 0 });

        entry.qualityWear   = sumWear / entry.stats.length;
        entry.qualityNoWear = sumNoWear / entry.stats.length;
        entry.tier          = getRarity(entry.qualityNoWear);
    });

    const allStats = [
        ...baseStats,
        ...passives.flatMap(entry => entry.stats)
    ];

    const { sumWear, sumNoWear } = allStats.reduce((acc, stat) => ({
        sumWear:   acc.sumWear   + stat.withWear,
        sumNoWear: acc.sumNoWear + stat.noWear 
    }), { sumWear: 0, sumNoWear: 0 });

    blueprint.qualityWear = sumWear   / allStats.length;
    blueprint.qualityNoWear = sumNoWear / allStats.length;
	blueprint.tier = getRarity(Math.floor(blueprint.qualityWear));

	// TODO: I can now calculate quality with wear
	// but I can't do anything with the result
	// nor get the actual output stat yet
}

function getWearBonus(){
	var wear = currentWeapon.product.blueprint.wear;
	const wearValues = {
		pristine: 5,
		fine:     3,
		decent:   1,
		worn:     0,
		unknown:  0
	};
	return wearValues[wear] || 0;
}

function getWearName(){
	var wear = currentWeapon.product.blueprint.wear;
	const wearValues = {
		pristine: "Pristine\u00A0",
		fine:     "Fine\u00A0",
		decent:   "Decent\u00A0",
		worn:     "",
		unknown:  ""
	};
	return wearValues[wear] || "";
}

function getShardValue(){
	const shardValue = {
		common: 	1,
		uncommon:   3,
		rare:   	5,
		epic:     	25,
		mythic:  	300,
		legendary:	1000,
		fabled: 	5000
	};
	const tier  = currentWeapon.product.blueprint.tier;
	const value = shardValue[tier] || 0;
	if (currentWeaponID==104){return "UNSELLABLE"};
	return value + " selling / " + Math.ceil(value*2.5) + " buying"
}

function displayInfo(){
	displayBasicInfo();
}

function getWeaponShorthand(){
	const shorthand = currentWeapon.aliases[0]? currentWeapon.aliases[0]: currentWeapon.name;
	return shorthand.toLowerCase();
}

function getWeaponImage(){
	const letters = {
		common: 	"c",
		uncommon:   "u",
		rare:   	"r",
		epic:     	"e",
		mythic:  	"m",
		legendary:	"l",
		fabled: 	"f"
	};

	const img = document.createElement("img");
	const p = getWearBonus()==0?"":"p";
	const q = letters[currentWeapon.product.blueprint.tier];
	const w = getWeaponShorthand();
	img.src = `media/owo_images/${p+q+"_"+w}.png`;
	img.ariaLabel= getWeaponShorthand();
	img.alt=":"+getWeaponShorthand()+":";
	img.style.borderRadius="0.2rem";
	img.draggable=false;
	img.className="discord-pet-display";

	return img;
}

function getStat(keyOrIndex){
	const idx =
		typeof keyOrIndex === 'number'
		? keyOrIndex
		: currentWeapon.stats.findIndex(stat => stat.type === keyOrIndex);

	return [
		currentWeapon.product.blueprint.stats[idx]?? undefined, 
		currentWeapon.stats[idx]?? undefined
	];
}

function displayBasicInfo(){
	el.weaponHeader.textContent=currentWeapon.product.owner.displayName+"'s "+getWearName()+currentWeapon.name;
	el.weaponName.innerHTML="<strong>Name:&nbsp;</strong> " + currentWeapon.name;
	el.ownerID.innerHTML="<strong>Owner:&nbsp;</strong> " + currentWeapon.product.owner.name;
	el.weaponID.innerHTML=`<strong>ID:&nbsp;</strong> <code class="discord-code" style="font-size: 0.8rem; height: 1rem; line-height: 1rem;">${currentWeapon.product.id}</code>`;
	el.shardValue.innerHTML= "<strong>Shard Value:&nbsp;</strong> " + getShardValue();
	el.weaponQuality.innerHTML= "<strong>Quality:&nbsp;</strong> ";
	el.weaponQuality.append(getTierEmoji(currentWeapon.product.blueprint.tier));
	el.weaponQuality.innerHTML+= numberFixedString(currentWeapon.product.blueprint.qualityWear,1)+"%"
	el.weaponImage.innerHTML="";
	el.weaponImage.append(getWeaponImage());
}

function numberFixedString(input,fixed){
    return Number(input.toFixed(fixed)).toLocaleString();
}

function generateStatInput(){
	generateWPInput();
	el.description.innerHTML="";
	el.description.append(generateDescription());
}

function generateWPInput(){	
	el.wpCost.innerHTML="<strong>WP Cost:</strong>";
	const WPStat = getStat("WP-Cost");
	const WPimage = getStatImage("WP");
	WPimage.style.margin="0 0 0.05rem -0.2rem";
	el.wpCost.append(WPStat[0]? createWeaponStatInput(...WPStat): "\u00A00\u00A0",WPimage);
}

const percentToValue = 
	(percent, { min, range }) =>
  	min + (range * percent) / 100;

const valueToPercent =
	(value, { min, range}) =>
	Math.round(100 * (value - min) / range);

/*
	config ={
		max: 55,
		min: 35,
		range: 20,
		step: 0.2,
		unit: "%"
	};

	productStat={
		noWear: 30,​​
		withWear: 30
	}
*/

function getStatImage(inputString){
	const img = document.createElement("img");
	img.src = `../media/owo_images/${inputString}.gif`;
	img.onerror = function () {
		this.onerror = null; 
		this.src = `../media/owo_images/${inputString}.png`;
	};
	img.alt = `:${inputString}:`;
	img.ariaLabel = `${inputString}`;
	img.title = `:${inputString}:`;
	img.className="discord-embed-emote";
	img.style="margin: 0 0 -0.01rem -0.2rem;";
	return img;
}

function createRangedInput(type, {min, max, step, digits}, percentageInput) {
	const input = document.createElement('input');

	if (type === 'range') {
		input.className = 'weaponSlider';
		Object.assign(input.style, {
			margin: '0 0 0 0.2rem',
			background: '#555',
			transform: min>max ? 'scaleX(-1)' : '',
			transformOrigin: min>max ? 'center' : ''
		});
	}else if(type=="number"){
		input.className = 'inputFromWeaponCalculator no-arrows';
		input.style.width = (digits*0.5)+'rem';
	}

	if (percentageInput){
		input.style.height="1.5rem";
	}

	const [nMin, nMax] = min>max ? [max,min] : [min,max];
	Object.assign(input, {
		min: nMin,
		max: nMax,
		required: true,
		type, step
	});

	return input;
}

function enhanceConfig(config, wearBonus) {
	const bonus = (config.range / 100) * wearBonus;
	return {
		...config,
		min: config.min + bonus,
		max: config.max + bonus
	};
}

function createStatWrapper(classNames) {
	const wrapper = document.createElement('div');
	wrapper.className = classNames;
	return wrapper;
}

function createStatTooltip(children) {
	const tip = document.createElement('div');
	tip.className = 'hidden tooltip-lite-child';
	children.forEach(node => tip.append(node));
	return tip;
}

function createUnitSpan(unit){
	const span = document.createElement("span");
	span.style.marginRight="0.2rem";
	span.textContent=unit;
	return span;
}

function createWeaponStatInput(productStat,config) {
	const wearConfig 		= enhanceConfig(config,getWearBonus());
	const initialValue 		= percentToValue(productStat.noWear,wearConfig);
	const outerWrapper		= createStatWrapper("outerInputWrapperFromCalculator");
	const wrapper 			= createStatWrapper("inputWrapperFromCalculator tooltip-lite");
	const numberInput 		= createRangedInput('number', wearConfig);
	const numberLabel 		= createUnitSpan(wearConfig.unit);
	const img 				= getTierEmoji(getRarity(productStat.withWear));
	const qualityInput 		= createRangedInput('number', percentageConfig,true);
	const qualityLabel 		= createUnitSpan(percentageConfig.unit);
	const slider 			= createRangedInput('range',  wearConfig);
	const tooltipChildren 	= [img, qualityInput, qualityLabel, slider];
  	const tooltip         	= createStatTooltip(tooltipChildren);

	function syncAll(value) {
		numberInput.value  = value;
		slider.value       = value;
		const pct = valueToPercent(value, config);
		const noWearPtc = valueToPercent(value, wearConfig);
		qualityInput.value = pct;
		img.src = getTierEmojiPath(pct);
		productStat.noWear=noWearPtc;
		statChange();
	}
	[slider, numberInput].forEach(el =>
		el.addEventListener('input', () => syncAll(Number(el.value)))
	);
	qualityInput.addEventListener('input', () => { 
		syncAll(percentToValue(Number(qualityInput.value), config));	
	});

	wrapper.append(
		numberInput, 
		...(wearConfig.unit === "" ? [] : [numberLabel]), 
		tooltip);
	outerWrapper.append(wrapper);
	syncAll(initialValue);
	return outerWrapper;
}

function statChange(){
	syncWear();
	calculateQualities(currentWeapon);
	displayInfo();
}

function digitsToRem(digits){
	const rem = digits*0.5;
	return `${rem}rem`
}

function generateDescription() {
	const description = currentWeapon.description;
	const wrapper = document.createElement("div");
	wrapper.style.display      	= "inline";
  	wrapper.style.whiteSpace   	= "normal";
	wrapper.style.lineHeight	= "1.4rem";

	let statIndex = 0;

	description.forEach(node => {
		switch (node.type) {
		case "text":
			wrapper.append(document.createTextNode(node.value));
			break;
		case "stat":
			const statContainer = createWeaponStatInput(...getStat(statIndex));
			statContainer.style.margin="0 -0.2rem";
			wrapper.append(statContainer);
			statIndex++;
			break;
		case "emoji":
			const img = getStatImage(node.value);
			const imgWrapper = document.createElement("div");
			img.style.margin = "0 0 0.17rem 0";
			imgWrapper.style.display="inline-block";
			imgWrapper.append(img);
			wrapper.append(imgWrapper);
			break;
		case "strongSpan":
			const span = document.createElement("span");
			span.style.fontWeight="bold";
			span.innerHTML=node.value;
			wrapper.append(span);
		}	
	});
	return wrapper;
}