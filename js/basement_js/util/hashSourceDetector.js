// A self-contained script to detect how the URL hash was changed:
//  • script  – via location.hash or history.pushState/replaceState
//  • link    – by clicking <a href="#…">
//  • history – via back/forward navigation (popstate)
//  • manual  – typing in the address bar or other untagged methods

// unused right now
// gpt made this and it does not work

export function initHashSourceDetector() {
    let lastSource = null;

    // 1. history.pushState / replaceState
    ['pushState', 'replaceState'].forEach(method => {
        const orig = history[method]
        history[method] = function(...args) {
            lastSource = 'script'
            return orig.apply(this, args)
        }
    })

    // 2. direct location.hash assignments
    const locProto = Location.prototype;
    const originalHashDescriptor = Object.getOwnPropertyDescriptor(locProto, 'hash');
    Object.defineProperty(locProto, 'hash', {
        get() {
            return originalHashDescriptor.get.call(this);
        },
        set(newHash) {
            lastSource = 'script';
            originalHashDescriptor.set.call(this, newHash);
        },
        configurable: true,
        enumerable: true
    });

    // 3. Report on actual hash changes
    window.addEventListener('hashchange', () => {
        const cause = lastSource || 'manual/history/link/other';
        console.log(`Hash changed by: ${cause}`);
        lastSource = null;
    })
}