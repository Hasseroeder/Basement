import { initGlobal } from "./globalExp.js";
import { make, createInjectAble } from "../util/injectionUtil.js";

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

function doMathJax(){
    window.MathJax.typesetPromise([this.cachedDiv]);
}

async function init(){
    const pathName="../donatorPages/exp/";
    const extraHtml = [
        {created: false, name: "knowledge"},
        {created: false, name: "global", init:initGlobal},
        {created: false, name: "streakWorth", init:doMathJax}
    ];

    extraHtml.forEach(html => createInjectAble(html,pathName));
}