import { initCustomSelect } from './customSelect.js';
import { loadJson } from '../util/jsonUtil.js';
import { updateEverything,generateEverything } from './weaponCalcMessageGenerator.js';
import { initiatePassiveStuffs } from './weaponCalcPassive.js';
import { fillMissingWeaponInfo,applyWearToWeapon } from './weaponCalcUtil.js'
import { blueprintMain } from './blueprintParser.js';


document.addEventListener("DOMContentLoaded",initWeaponCalc);

let weapons;
let passives;
let currentWeapon;

async function initWeaponCalc(){
	weapons = await loadJson("../json/weapons.json");
	delete weapons[100]; // gotta get rid of fists
	passives = await loadJson("../json/passives.json");
	initiateFirstWeapon();
	loadWeaponTypeData();

	const wearSelectRoot = initCustomSelect(
		wearNameToWearID(currentWeapon.product.blueprint.wear)
	);
	wearSelectRoot.addEventListener('change', e => wearWasChanged(e));
}

function initiateFirstWeapon(){
	const hash = location.hash.substring(1);
	const blueprintObject = blueprintMain(hash,weapons,passives); // not the real main yet. This returns basically nothing and logs what it does.

	currentWeapon = weapons[blueprintObject.id];
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
	fillMissingWeaponInfo(currentWeapon);		
	await initiatePassiveStuffs(currentWeapon);			
	applyWearToWeapon(
		currentWeapon,
		currentWeapon.product.blueprint.wear
	);
	generateEverything(currentWeapon);	
}

function wearWasChanged(e){
	applyWearToWeapon(currentWeapon,e.detail.value);
	updateEverything(currentWeapon);
}
