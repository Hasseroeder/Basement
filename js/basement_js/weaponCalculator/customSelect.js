const root = document.getElementById('wearSelect');
const button = root.querySelector('.selected');
const listbox = root.querySelector('.options');
const options = Array.from(root.querySelectorAll('.option'));
const hiddenInput = document.getElementById('myCustomSelect');

let open = false;
let selectedIndex = -1;     
let highlightedIndex = -1; 
let typeBuffer = '';
let typeTimer = null;

function openList() {
    if (open) return;
    open = true;
    root.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    listbox.focus({ preventScroll: true });
    // Start highlighted at selected or first
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0, true);
    ensureVisible(highlightedIndex);
    document.addEventListener('pointerdown', onDocPointerDown, { capture: true });
}

function closeList() {
    if (!open) return;
    open = false;
    root.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    button.focus({ preventScroll: true });
    clearHighlight();
    document.removeEventListener('pointerdown', onDocPointerDown, { capture: true });
}

function onDocPointerDown(e) {
    if (!root.contains(e.target)) closeList();
}

export function selectIndex(index) {
    if (index < 0 || index >= options.length) return;
    // Update selected UI
    options.forEach((opt, i) => {
    opt.setAttribute('aria-selected', String(i === index));
    opt.classList.toggle('highlighted', false);
    });
    const opt = options[index];
    button.textContent = opt.textContent.trim();
    hiddenInput.value = opt.dataset.value || opt.textContent.trim();
    selectedIndex = index;

    root.dispatchEvent(
        new CustomEvent('change', {
            detail: { value: hiddenInput.value },
            bubbles: true
        })
    );
}

function setHighlight(index, scrollIntoView = false) {
    if (index < 0 || index >= options.length) return;
    if (highlightedIndex >= 0) options[highlightedIndex].classList.remove('highlighted');
    highlightedIndex = index;
    options[highlightedIndex].classList.add('highlighted');
    if (scrollIntoView) ensureVisible(highlightedIndex);
}

function clearHighlight() {
    if (highlightedIndex >= 0) options[highlightedIndex].classList.remove('highlighted');
    highlightedIndex = -1;
}

function ensureVisible(index) {
    const opt = options[index];
    const lb = listbox;
    const oTop = opt.offsetTop;
    const oBottom = oTop + opt.offsetHeight;
    const vTop = lb.scrollTop;
    const vBottom = vTop + lb.clientHeight;

    if (oTop < vTop) lb.scrollTop = oTop;
    else if (oBottom > vBottom) lb.scrollTop = oBottom - lb.clientHeight;
}

function move(delta) {
    const count = options.length;
    const base = open ? (highlightedIndex >= 0 ? highlightedIndex : selectedIndex) : selectedIndex;
    let next = base + delta;
    if (next < 0) next = 0;
    if (next > count - 1) next = count - 1;

    if (open) {
        setHighlight(next, true);
    } else {
        selectIndex(next);
    }
}

function moveToStart() {
    if (open) setHighlight(0, true);
    else selectIndex(0);
}

function moveToEnd() {
    const last = options.length - 1;
    if (open) setHighlight(last, true);
    else selectIndex(last);
}

// Type-ahead
function handleTypeahead(char) {
    typeBuffer += char.toLowerCase();
    if (typeTimer) clearTimeout(typeTimer);
    typeTimer = setTimeout(() => (typeBuffer = ''), 600);

    const start = (open ? (highlightedIndex >= 0 ? highlightedIndex + 1 : 0) : selectedIndex + 1);
    const match = findMatch(typeBuffer, start);
    const idx = match !== -1 ? match : findMatch(typeBuffer, 0); // wrap

    if (idx !== -1) {
        if (open) {
            setHighlight(idx, true);
        } else {
            selectIndex(idx);
        }
    }
}

function findMatch(prefix, startIndex) {
    for (let i = startIndex; i < options.length; i++) {
        if (options[i].textContent.trim().toLowerCase().startsWith(prefix)) return i;
    }
    return -1;
}

function onButtonKeyDown(e){
    const k = e.key;

    if (k === ' ' || k === 'Spacebar') {
        e.preventDefault();
        openList();
        return;
    }

    if (k === 'ArrowDown' || k === 'ArrowRight') {
        e.preventDefault();
        move(1);
        return;
    }
    if (k === 'ArrowUp' || k === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
        return;
    }
    if (k === 'PageDown') {
        e.preventDefault();
        moveToEnd();
        return;
    }
    if (k === 'PageUp') {
        e.preventDefault();
        moveToStart();
        return;
    }

    if (isTypeChar(e)) {
        e.preventDefault();
        handleTypeahead(e.key);
    }
}

function onListboxKeyDown(e){
    const k = e.key;

    if (k === 'Escape' || k === 'Esc') {
        e.preventDefault();
        closeList();
        return;
    }

    if (k === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0) selectIndex(highlightedIndex);
        closeList();
        return;
    }

    if (k === 'ArrowDown' || k === 'ArrowRight') {
        e.preventDefault();
        move(1);
        return;
    }
    if (k === 'ArrowUp' || k === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
        return;
    }

    if (k === 'PageDown') {
        e.preventDefault();
        moveToEnd();
        return;
    }
    if (k === 'PageUp') {
        e.preventDefault();
        moveToStart();
        return;
    }

    if (isTypeChar(e)) {
        e.preventDefault();
        handleTypeahead(e.key);
        return;
    }
}

function isTypeChar(e) {
    return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
}

function attachEventListeners() {
    button.addEventListener('click', () => open ? closeList() : openList());
    options.forEach((opt,i) =>
        opt.addEventListener('click', () => { selectIndex(i); closeList(); })
    );
    button.addEventListener('keydown', onButtonKeyDown);
    listbox.addEventListener('keydown', onListboxKeyDown);
}

export function initCustomSelect() {
    const root = document.getElementById('wearSelect');
    selectIndex(0);
    attachEventListeners();
    return root;
}