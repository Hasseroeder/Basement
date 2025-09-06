import { initCustomSelect, selectIndex } from './customSelect.js';
import { loadJson } from '../util/jsonUtil.js';
import { updateEverything,generateEverything } from './weaponCalcMessageGenerator.js';
import { initiatePassiveStuffs } from './weaponCalcPassive.js';
import { fillMissingWeaponInfo,applyWearToWeapon } from './weaponCalcUtil.js'

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
	
	//TODO: remove following lines
	generateEverything(currentWeapon);	

}

function wearWasChanged(e){
	applyWearToWeapon(currentWeapon,e.detail.value);
	updateEverything(currentWeapon);
}
