const input        = document.getElementById('search');
const container    = document.getElementById('suggestions');
const STATIC_LIST  = [
    "apple",
    "banana",
    "application",
    "bamboo",
    "boobs",
    "penis"
];
let items          = [];      // current array of suggestions
let selectedIndex  = -1;      // for arrow navigation
let debounceTimer;

const neonURL = "https://neonutil.vercel.app/zoo-stats?";

input.addEventListener('input', onInput);
input.addEventListener('keydown', onKeyDown);
document.addEventListener('click', e => {
    if (!container.contains(e.target) && e.target!==input) {
        hideSuggestions();
    }
});

function fetchNeon(petString){
    const order = [0, 2, 4, 1, 3, 5];
    let fetchURL = neonURL;
    fetchURL += ( petString? 
                    petString
                    : `s=${order.map(i => stats[i]).join('.')}`
                );

    return fetch( fetchURL) 
    .then(response => {
        return response.json();
    })
}

function throttle(fn, delay) {
  let last = 0,
      timer = null,
      pending = null;

  return function throttled(...args) {
    const now       = Date.now();
    const remaining = delay - (now - last);

    if (remaining <= 0) {
      clearTimeout(timer);
      timer  = null;
      last   = now;
      return Promise.resolve(fn.apply(this, args));
    }

    if (pending) {
      return pending;
    }

    pending = new Promise(resolve => {
      timer = setTimeout(() => {
        last    = Date.now();
        timer   = null;
        const result = fn.apply(this, args);
        resolve(result);
        pending = null;
      }, remaining);
    });

    return pending;
  };
}

const fetchNeonThrottled = throttle(fetchNeon, 500);

function onInput(e) {

    console.log("hello world");

    const q = e.target.value.trim();
    if (!q) return hideSuggestions();

    //items = STATIC_LIST.filter(s =>
    //  s.toLowerCase().startsWith(q.toLowerCase())
    //).slice(0,5);
    //renderSuggestions();

    console.log(items);

    // Or if you need to fetch from server, debounce it:
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async ()=> {

        items.length = 0;
        const tempArray = await fetchNeonThrottled("n="+encodeURIComponent(q));
        tempArray.forEach((item,i)=>{
            items.push(tempArray[i][0]);
        })
        renderSuggestions();
    }, 200);
}

// 3) Build the drop-down
function renderSuggestions() {
    container.innerHTML = '';
    selectedIndex = -1;
    if (!items.length) return hideSuggestions();

    items.forEach((text, i) => {
        const div = document.createElement('div');
        div.className = 'suggestion';
        div.textContent = text;
        div.addEventListener('mousedown', e => {
        e.preventDefault();
        applyItem(i);
        });
        console.log("we're hopefully appending!");
        container.appendChild(div);
    });
    showSuggestions();
}

function showSuggestions() {
    container.style.display = 'block';
}

function hideSuggestions() {
    container.style.display = 'none';
    items = [];
    selectedIndex = -1;
}

function onKeyDown(e) {
    const max = items.length - 1;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex < max ? selectedIndex + 1 : 0);
        highlight();
    }
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex > 0 ? selectedIndex - 1 : max);
        highlight();
    }
    else if (e.key === 'Enter' && selectedIndex > -1) {
        e.preventDefault();
        applyItem(selectedIndex);
    }
    else if (e.key === 'Escape') {
        hideSuggestions();
    }
}

function highlight() {
    Array.from(container.children).forEach((div, i) => {
        div.classList.toggle('active', i === selectedIndex);
    });
}

function applyItem(i) {
    input.value = items[i];
    hideSuggestions();
    input.focus();
}