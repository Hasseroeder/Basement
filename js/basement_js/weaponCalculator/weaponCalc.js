import { initCustomSelect, selectIndex } from './customSelect.js';
import { loadJson } from '../util/jsonUtil.js';
import { generateDescription,generateWPInput,displayInfo } from './weaponCalcMessageGenerator.js';
import { initiatePassiveStuffs, displayPassives } from './weaponCalcPassive.js';

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
	initiatePassiveStuffs(currentWeapon);
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

function loadWeaponTypeData(){
	// from the .json
	currentWeapon = weapons[currentWeaponID];
	fillMissingWeaponInfo();												//fills weapon on init
	selectIndex(wearNameToWearID(currentWeapon.product.blueprint.wear));	//displays actual wear in outside on init
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

function fillMissingWeaponInfo(){
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

	currentWeapon.product.blueprint.passive.forEach(entry => {
		entry.stats.forEach(stat => generateMissingStat(stat));
    });
	currentWeapon.product.blueprint.stats.forEach(stat => generateMissingStat(stat));
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

	updateWPCost();
	el.description.replaceChildren(
    	generateDescription(currentWeapon,currentWeapon)
  	);
}