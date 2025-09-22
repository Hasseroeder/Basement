import { initCustomSelect } from './customSelect.js';
import { loadJson } from '../util/jsonUtil.js';
import { updateEverything,generateEverything } from './weaponCalcMessageGenerator.js';
import { initiatePassiveStuffs } from './weaponCalcPassive.js';
import { fillMissingWeaponInfo,applyWearToWeapon } from './weaponCalcUtil.js'
import { blueprintStringToWeapon } from './blueprintParser.js';


document.addEventListener("DOMContentLoaded",initWeaponCalc);

let weapons;
let passives;
let currentWeapon;

async function initWeaponCalc(){
	const weaponsPromise = loadJson("../json/weapons.json");
	const passivesPromise = loadJson("../json/passives.json");
	const [weaponsData, passivesData] = await Promise.all([
		weaponsPromise,
		passivesPromise
	]);

	weapons = weaponsData;
	delete weapons[100]; // gotta get rid of fists
	passives = passivesData;



	currentWeapon= wepFromHash();
	initiateWeapon(currentWeapon);

	const wearSelectRoot = initCustomSelect(
		wearNameToWearID(currentWeapon.product.blueprint.wear)
	);
	wearSelectRoot.addEventListener('change', e => wearWasChanged(e,currentWeapon));
}

function wepFromHash(){
	const hash = location.hash.substring(1);
	const blueprintObject = blueprintStringToWeapon(hash,weapons,passives);

	const weapon = weapons[blueprintObject.id];

	weapon.product.blueprint = {
		...weapon.product.blueprint,
		stats: JSON.parse(JSON.stringify(blueprintObject.stats)),
		wear: JSON.parse(JSON.stringify(blueprintObject.wear)),
		passive: JSON.parse(JSON.stringify(blueprintObject.passive))
		// I HAVE NO IDEA WHY I NEED TO CLONE THIS
		// BUT ITS THE ONLY WAY TO GET IT WORKING
	};

	return weapon;
}

function wearNameToWearID(inputString){
	const wearValues = { pristine: 3, fine: 2, decent: 1, worn: 0, unknown: 0 };
	return wearValues[inputString] || 0;
}

async function initiateWeapon(weapon){
	fillMissingWeaponInfo(weapon);		
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
