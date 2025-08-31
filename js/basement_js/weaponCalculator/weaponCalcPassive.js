import { loadJson } from '../util/jsonUtil.js';

var passives;

export async function initiatePassiveStuffs(weapon){
    //const passiveGridImages = Array.from(document.querySelectorAll('.passiveGridImage'));
    //passiveGridImages.forEach(image => {
    //    console.log(passives);
    //    image.addEventListener("click", ()=>{
    //        // something in here
    //    })
    //});

    const container = document.querySelector('.passiveGrid');
    passives = await loadJson("../json/passives.json");
    console.log(passives);


    Object.entries(passives).forEach(([id, passive]) => {
        const img = document.createElement('img');
        img.className = 'passiveGridImage';
        img.src = `media/owo_images/f_${passive.shorthand}.png`;
        img.dataset.passiveId = id;
        img.alt = passive.shorthand;
        img.title = passive.shorthand;

        img.addEventListener('click', () => {
            // something in here
        });

        container.appendChild(img);
    });

}