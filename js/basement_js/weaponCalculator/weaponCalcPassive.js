import { loadJson } from '../util/jsonUtil.js';
import { generateDescription }  from '../weaponCalculator/weaponCalcMessageGenerator.js'
import { getWeaponImage,fillMissingWeaponInfo } from './weaponCalcUtil.js';
import { selectIndex } from './customSelect.js';

var passives;

export async function initiatePassiveStuffs(weapon){
    const gridContainer = document.querySelector('.passiveGrid');
    const listContainer = document.querySelector('.passiveContainer');
    passives = await loadJson("../json/passives.json");

    Object.entries(passives).forEach(([id, passive]) => {
        const img = document.createElement('img');
        img.className = 'passiveGridImage';
        img.src = `media/owo_images/f_${passive.aliases[0]}.png`;
        img.dataset.passiveId = id;
        img.alt = passive.aliases[0];
        img.title = passive.aliases[0];
        img.addEventListener('click', () => {
            //{
            //  "id":"19",
            //  "stats":[{},{}]
            //}
            const newPassive = {
                id: id,
                stats: [{}]
            }
            weapon.product.blueprint.passive.push(newPassive);
            console.log(weapon);
            fillMissingWeaponInfo(weapon);		
            selectIndex();
        });
        gridContainer.appendChild(img);
    });

    //displayPassives(weapon);
    //console.log(weapon);
}

export function displayPassives(weapon){
    const listContainer = document.querySelector('.passiveContainer');
    listContainer.innerHTML="";

    if (weapon.product.blueprint.passive.length == 0) appendNoPassiveSpan(listContainer);
    else {
        for (var i = 0; i< weapon.product.blueprint.passive.length; i++){
            appendPassive(listContainer,weapon, weapon.product.blueprint.passive[i]);

        }
    } 
    // this is simply hardcoded to use a first passive for now, other stuff doesn't work

}

function appendNoPassiveSpan(container){
    const span = document.createElement("span");
    span.innerHTML="<b>Passives:</b> none";
    container.append(span);
    // <span><b>Passives:</b> none</span> 
}

function appendPassive(container,weapon, passive){
    const wrapper = document.createElement("div");
    wrapper.style="display:flex; gap: 0.1rem;";
    const passiveConfig = passives[passive.id];
    Object.assign(passive, passiveConfig);

    const image = getWeaponImage(passive);
    image.className = 'discord-embed-emote';
    image.style.margin = "0.11rem 0 0 0";
    passive.image = image;

    wrapper.append(image,generateDescription(passive,weapon))
    container.append(wrapper);
}