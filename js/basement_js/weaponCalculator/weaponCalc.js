import { initCustomSelect, selectIndex } from './customSelect.js';
import { loadJson } from '../util/jsonUtil.js';
import { generateDescription,generateWPInput,displayInfo } from './weaponCalcMessageGenerator.js';
import { initiatePassiveStuffs, displayPassives } from './weaponCalcPassive.js';
import { fillMissingWeaponInfo } from './weaponCalcUtil.js'

const el = {
	weaponHeader:	document.getElementById("weaponHeader"), 
	weaponName:		document.getElementById("weaponName"),
	ownerID:		document.getElementById("ownerID"),
	weaponID:		document.getElementById("weaponID"),
	shardValue:		document.getElementById("shardValue"),
	weaponQuality:	document.getElementById("weaponQuality"),
	weaponImage: 	document.getElementById("weaponImage"),
	wpCost:			document.getElementById("WP-Cost"),
	description:	document.getElementById("description")
}

document.addEventListener("DOMContentLoaded",initWeaponCalc);

let weapons;
let currentWeapon;
let currentWeaponID;
const initWeaponID = 101;

async function initWeaponCalc(){
	const wearSelectRoot = initCustomSelect();
	wearSelectRoot.addEventListener('change', e => wearWasChanged(e));
	initiateFirstID();
	weapons = await loadJson("../json/weapons.json");
	loadWeaponTypeData();
}

function initiateFirstID(){
	const hash = location.hash.substring(1);
	currentWeaponID = hash
		? Number(hash)
		: initWeaponID;
}

function wearNameToWearID(inputString){
	const wearValues = {
		pristine: 3,
		fine:     2,
		decent:   1,
		worn:     0,
	};
	return wearValues[inputString] || 0;
}

async function loadWeaponTypeData(){
	// from the .json
	currentWeapon = weapons[currentWeaponID];
	fillMissingWeaponInfo(currentWeapon);		
	await initiatePassiveStuffs(currentWeapon);				
	selectIndex(wearNameToWearID(currentWeapon.product.blueprint.wear));

	console.log(currentWeapon);
}

function wearWasChanged(e){
	function getWearBonus(wear){
		const wearValues = {
			pristine: 5,
			fine:     3,
			decent:   1,
			worn:     0,
			unknown:  0
		};
		return wearValues[wear] || 0;
	}
	function getWearName(wear){
		const wearValues = {
			pristine: "Pristine\u00A0",
			fine:     "Fine\u00A0",
			decent:   "Decent\u00A0",
			worn:     "",
			unknown:  ""
		};
		return wearValues[wear] || "";
	}
	function applyValues(toApply){
		toApply.wear = e.detail.value;
		toApply.wearBonus = getWearBonus(e.detail.value);
		toApply.wearName = getWearName(e.detail.value);
	}
	applyValues(currentWeapon.product.blueprint);
	currentWeapon.product.blueprint.passive.forEach(passive => applyValues(passive));
	
	generateNew();
}

function generateNew(){
	generateStatInputs();
	displayInfo(currentWeapon);
	displayPassives(currentWeapon);
}

function generateStatInputs(){
	async function updateWPCost() {
		const inputElement = await generateWPInput(currentWeapon);
		el.wpCost.replaceChildren(inputElement);
	}
	function updateDescription(){
		el.description.replaceChildren(generateDescription(currentWeapon,currentWeapon));
	}

	updateWPCost();
	updateDescription();
}