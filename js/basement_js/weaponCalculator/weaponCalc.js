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
	currentWeapon= wepFromHash();
	initiateWeapon(currentWeapon);

	const wearSelectRoot = initCustomSelect(
		wearNameToWearID(currentWeapon.product.blueprint.wear)
	);
	wearSelectRoot.addEventListener('change', e => wearWasChanged(e,currentWeapon));
}

function wepFromHash(){
	const hash = location.hash.substring(1);
	const blueprintObject = blueprintMain(hash,weapons,passives);
	const { stats, wear, passive } = blueprintObject;
	const weapon = weapons[blueprintObject.id];
	//Object.assign(weapon.product.blueprint, { stats, wear, passive });

	return weapon;
}

function wearNameToWearID(inputString){
	const wearValues = { pristine: 3, fine: 2, decent: 1, worn: 0, unknown: 0 };
	return wearValues[inputString] || 0;
}

async function initiateWeapon(weapon){
	fillMissingWeaponInfo(weapon);		

	// TODO: remove this logging statement
	console.log(JSON.parse(JSON.stringify(weapon)));

	await initiatePassiveStuffs(weapon);			
	applyWearToWeapon(
		weapon,
		weapon.product.blueprint.wear
	);
	generateEverything(weapon);	
}

function wearWasChanged(e,weapon){
	applyWearToWeapon(weapon,e.detail.value);
	updateEverything(weapon);
}
