import { initGlobal } from "./globalExp.js";
import { createInjectAble } from "../util/injectionUtil.js";

async function loadMathJax() {
	const s = document.createElement('script');
    s.src= 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    document.head.appendChild(s);
    await new Promise(resolve => (s.onload = resolve));
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

function doMathJax(){
    window.MathJax.typesetPromise([this.cachedDiv]);
}

async function init(){
    await loadMathJax();
    const pathName="../donatorPages/exp/";
    const extraHtml = [
        {created: false, name: "knowledge"},
        {created: false, name: "global", init:initGlobal},
        {created: false, name: "streakWorth", init:doMathJax}
    ];

    extraHtml.forEach(html => createInjectAble(html,pathName));
}