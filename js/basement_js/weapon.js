let   currentWeapon = 100;

const weaponDisplay ={
    image: document.getElementById("weaponImage"),
    text: document.getElementById("weaponText")
}

const weaponContainer= document.getElementById("weaponContainer");

const buttons ={
    previous:document.getElementById("previous"),
    next:    document.getElementById("next")
}

const weaponTexts = {
    100:"Fists",
    101:"Sword",
    102:"Hstaff",
    103:"Bow",
    104:"Rune",
    105:"Shield",
    106:"Orb",
    107:"Vstaff",
    108:"Dagger",
    109:"Wand",
    110:"Fstaff",
    111:"Estaff",
    112:"Sstaff",
    113:"Scepter",
    114:"Rstaff",
    115:"Axe",
    116:"Banner",
    117:"Scythe",
    118:"Crune",
    119:"Pstaff",
    120:"Lscythe",
    121:"Ffish",
    122:"Lrune"
}

function importFromHash(){
    const hash = window.location.hash;
    if (hash) {
        const value = decodeURIComponent(hash.slice(1));
        currentWeapon = Number(value);
    }
}

function importHTML(){

}

function updateWeaponDisplay(){
    let weaponName=weaponTexts[currentWeapon];

    if (currentWeapon == 100){
        //exception for fists, because they don't really have any ID, nor image
        weaponDisplay.text.textContent= `??? - Fists`;
    }else{
        weaponDisplay.text.textContent= `${currentWeapon} - ${weaponName}`;
    }
    weaponDisplay.image.src=        `media/owo_images/f_${weaponName.toLowerCase()}.png`;

    fetch(`donatorPages/weapons/${currentWeapon}.html`)
        .then(r => r.text())
        .then(html => weaponContainer.innerHTML = html)
        .catch(console.error);

}

function main(){
    pageNewLoad();
    buttons.next.addEventListener("click", ()=>swapWeapon(+1));
    buttons.previous.addEventListener("click", ()=>swapWeapon(-1));
}

function pageNewLoad(){

    importFromHash();
    updateWeaponDisplay();
}

function swapWeapon (change){
    wantToSwapTo = currentWeapon + change;
    if (weaponTexts[wantToSwapTo]){
        currentWeapon = wantToSwapTo;
        updateWeaponDisplay();
    }
}

document.addEventListener("DOMContentLoaded", main);
window.addEventListener("hashchange", pageNewLoad);