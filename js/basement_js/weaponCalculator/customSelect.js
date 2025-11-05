const wrapper = document.getElementById('wearSelect');
const button  = wrapper.querySelector('.selected');
const listbox = wrapper.querySelector('.options');
const options = Array.from(wrapper.querySelectorAll('.option'));

let open = false;
let selectedIndex = -1;
let highlightedIndex = -1;

document.onkeydown = e => { if (e.key == "Tab") openList(false) };
document.onpointerdown = e => { if (!wrapper.contains(e.target)) openList(false) };

function openList(boolean) {
    if (open == boolean) return;
    open = boolean;
    wrapper.classList.toggle('open', boolean);
    button.setAttribute('aria-expanded', String(boolean));

    if(boolean){
        listbox.focus();
        setHighlight(selectedIndex);
    }else{
        button.focus();
        clearHighlight();
    }
}

function selectIndex(index) {
    if (index == undefined || index < 0 || index >= options.length) return;
    options.forEach(opt => {
        opt.classList.toggle('highlighted', false);
    });
    const opt = options[index];
    button.textContent = opt.textContent.trim();
    selectedIndex = index;

    wrapper.dispatchEvent(
        new CustomEvent('change', {
            detail: { value: opt.textContent.trim().toLowerCase() },
            bubbles: true
        })
    );
}

function setHighlight(index) {
    if (index < 0 || index >= options.length) return;
    if (highlightedIndex >= 0) options[highlightedIndex].classList.remove('highlighted');
    highlightedIndex = index;
    options[highlightedIndex].classList.add('highlighted');
}

function clearHighlight() {
    if (highlightedIndex >= 0) options[highlightedIndex].classList.remove('highlighted');
    highlightedIndex = -1;
}

function move(delta) {
    const last = options.length - 1;
    const base = open ? (highlightedIndex >= 0 ? highlightedIndex : selectedIndex) : selectedIndex;
    const next = Math.min(Math.max(0, base + delta),last);

    if (open) setHighlight(next); 
    else selectIndex(next);
}

function moveTo(index){
    if (open) setHighlight(index);
    else selectIndex(index);
}

function handleTypeahead(char) {
    const idx = options.findIndex(o => o.textContent.trim().toLowerCase().startsWith(char));
    if (idx == -1) return;
    if (open) setHighlight(idx);
    else selectIndex(idx);
}

function onKeyDown(e){
    const k = e.key;

    if (open && (k === 'Escape' || k === 'Esc')) {
        e.preventDefault();
        openList(false);
    }else if (open && k === 'Enter') {
        e.preventDefault();
        selectIndex(highlightedIndex);
        openList(false);
    }else if (!open && (k === ' ' || k === 'Spacebar')) {
        e.preventDefault();
        openList(true);
    }else if (k === 'ArrowDown' || k === 'ArrowRight') {
        e.preventDefault();
        move(1);
    }else if (k === 'ArrowUp' || k === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
    }else if (k === 'PageDown') {
        e.preventDefault();
        moveTo(options.length-1);
    }else if (k === 'PageUp') {
        e.preventDefault();
        moveTo(0);
    }else if (e.key.length === 1) {
        e.preventDefault();
        handleTypeahead(e.key);
    }
}

function attachEventListeners() {
    button.addEventListener('click', () => openList(!open));
    options.forEach((opt,i) =>
        opt.addEventListener('click', () => { selectIndex(i); openList(false); })
    );
    button.addEventListener('keydown', onKeyDown);
    listbox.addEventListener('keydown', onKeyDown);
}

export function initCustomSelect(inputWear) {
    const wearID = { pristine: 3, fine: 2, decent: 1 }[inputWear] ?? 0;
    const root = document.getElementById('wearSelect');
    selectIndex(wearID);
    attachEventListeners();
    return root;
}

class customSelect{
    constructor(wrapper,options){                                  // options: ["WORN","DECENT","FINE","PRISTINE"]
        this._wrapper = document.getElementById('wearWrapper');    //TODO: change this
        this._wrapper.className = "custom-select";

        this._button = make("button",{
            className:"selected",
            type:"button"
        })

        this._options = options.map(o=>
            make("li",{
                className:"option",
                role:"option",
            })
        );
        this._ul = make("ul",{

        })

        this._open = false;
        this._selectedIndex = -1;     
        this._highlightedIndex = -1; 
    }
    /*
    <div class="custom-select" id="wearSelect">
        <button></button>
        <ul class="options" id="wearOptions" role="listbox" tabindex="0">
            <li class="option" role="option" id="opt-worn" data-value="worn"  aria-selected="false">WORN</li>
            <li class="option" role="option" id="opt-decent" data-value="decent" aria-selected="false">DECENT</li>
            <li class="option" role="option" id="opt-fine" data-value="fine" aria-selected="false">FINE</li>
            <li class="option" role="option" id="opt-pristine" data-value="pristine" aria-selected="false">PRISTINE</li>
        </ul>
    </div>
    */
}