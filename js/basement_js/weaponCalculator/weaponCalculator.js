import { initCustomSelect } from '../weaponCalculator/customSelect.js';
import { loadJson } from '../util/jsonUtil.js';
import { generateDescription,generateWPInput,syncWear,displayInfo } from './weaponCalcMessageGenerator.js';

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
	wearSelectRoot.addEventListener('change', e => {
		currentWeapon.product.blueprint.wear = e.detail.value;
		updateWear();
	});
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

function loadWeaponTypeData(){
	// from the .json
	currentWeapon = weapons[currentWeaponID];
	fillMissingWeaponInfo();
	updateWear();
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

function updateWear(){
	syncWear(currentWeapon);
	generateStatInputs();
	displayInfo();
}

function generateStatInputs(){
	el.wpCost.replaceChildren(
		generateWPInput(currentWeapon,el)
	);
	el.description.replaceChildren(
    	generateDescription(currentWeapon,el)
  	);
}