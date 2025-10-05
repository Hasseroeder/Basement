let mathJaxLoadPromise = null;
function loadMathJax(url) {
    if (mathJaxLoadPromise) return mathJaxLoadPromise;
    mathJaxLoadPromise =  new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => {
            const M = window.MathJax;
            if (!M) return reject(new Error('MathJax did not register global MathJax'));
            M.startup.promise.then(() => resolve(M), reject);
        };
        script.onerror = () => reject(new Error('Failed to load MathJax script'));
        document.head.appendChild(script);
    });
    return mathJaxLoadPromise;
} // this is what a girl has to do, simply to import MathJax...

const url = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';

window.addEventListener('DOMContentLoaded', async () => {
    const extraHtml = [
        {created: false, name: "knowledge"},
        {created: false, name: "global", mathJax: true},
        {created: false, name: "streakWorth", mathJax: true}
    ];

    await Promise.all(extraHtml.map(async html => {
        const response = await fetch(`../donatorPages/${html.name}.html`);
        const htmlContent = await response.text();
        html.cachedDiv = document.createElement('div');
        html.cachedDiv.innerHTML = htmlContent;

        if (html.mathJax) {
            const MathJax = await loadMathJax(url);
            await MathJax.typesetPromise([html.cachedDiv]);
        }

        const container = document.getElementById(`${html.name}Container`);
        container.querySelector('button').addEventListener("click", async () => {
            html.created ? container.lastElementChild.remove() 
                         : container.appendChild(html.cachedDiv);
            html.created = !html.created;
        });

        if (window.location.hash === "#global" && html.name == "global") {
            container.appendChild(html.cachedDiv);
            html.created= true;
            container.scrollIntoView({ behavior: "smooth", block: "start"});
        }
    }));
});