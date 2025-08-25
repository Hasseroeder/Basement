function createUnitSpan(unit){
    const span = document.createElement("span");
    span.style.marginRight="0.2rem";
    span.textContent=unit;
    return span;
}

function createStatTooltip(children) {
    const tip = document.createElement('div');
    tip.className = 'hidden tooltip-lite-child';
    children.forEach(node => tip.append(node));
    return tip;
}

function createStatWrapper(classNames) {
    const wrapper = document.createElement('div');
    wrapper.className = classNames;
    return wrapper;
}
    
function createRangedInput(type, {min, max, step, digits}, percentageInput) {
    const input = document.createElement('input');

    if (type === 'range') {
        input.className = 'weaponSlider';
        Object.assign(input.style, {
            margin: '0 0 0 0.2rem',
            background: '#555',
            transform: min>max ? 'scaleX(-1)' : '',
            transformOrigin: min>max ? 'center' : ''
        });
    }else if(type=="number"){
        input.className = 'inputFromWeaponCalculator no-arrows';
        input.style.width = (digits*0.5)+'rem';
    }

    if (percentageInput){
        input.style.height="1.5rem";
    }

    const [nMin, nMax] = min>max ? [max,min] : [min,max];
    Object.assign(input, {
        min: nMin,
        max: nMax,
        required: true,
        type, step
    });

    return input;
}

export {createRangedInput,createStatTooltip,createStatWrapper,createUnitSpan};