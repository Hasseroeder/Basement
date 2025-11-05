import { make } from "./injectionUtil.js";

export class customSelect{
    constructor(startWear,wrapper,options){
        this._button = make("button",{
            className:"selected",
            type:"button"
        })

        this._options = options.map(o=>
            make("li",{
                className:"option",
                textContent:o
            })
        );
        this._ul = make("ul",{
            className:"options",
            tabIndex:0
        },this._options)


        this._wrapper = wrapper;
        this._wrapper.className = "custom-select";
        this._wrapper.append(this._button, this._ul);

        this._open = false;
        this._selectedIndex = -1;     
        this._highlightedIndex = -1; 

        this._button.addEventListener('click', () => this.openList(!this._open));
        this._options.forEach((opt,i) =>
            opt.addEventListener('click', () => { this.selectIndex(i); this.openList(false); })
        );

        this._button.onkeydown = this.onKeyDown.bind(this);
        this._ul.onkeydown = this.onKeyDown.bind(this);

        const wearID = { pristine: 3, fine: 2, decent: 1 }[startWear] ?? 0;
        this.selectIndex(wearID);

        document.addEventListener("keydown", e=>{ 
            if (e.key == "Tab") this.openList(false) 
        });
        document.addEventListener("pointerdown", e=>{ 
            if (!wrapper.contains(e.target)) this.openList(false) 
        });

        return this._wrapper;
    }

    openList(boolean) {
        if (this._open == boolean) return;
        this._open = boolean;
        this._wrapper.classList.toggle('open', boolean);

        if(boolean){
            this._ul.focus();
            this.setHighlight(this._selectedIndex);
        }else{
            this._button.focus();
            this.clearHighlight();
        }
    }

    selectIndex(index) {
        if (index == undefined || index < 0 || index >= this._options.length) return;
        this._options.forEach(opt => {
            opt.classList.toggle('highlighted', false);
        });
        const opt = this._options[index];
        this._button.textContent = opt.textContent.trim();
        this._selectedIndex = index;

        this._wrapper.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: opt.textContent.trim().toLowerCase() },
                bubbles: true
            })
        );
    }

    setHighlight(index) {
        if (index < 0 || index >= this._options.length) return;
        if (this._highlightedIndex >= 0) this._options[this._highlightedIndex].classList.remove('highlighted');
        this._highlightedIndex = index;
        this._options[this._highlightedIndex].classList.add('highlighted');
    }

    clearHighlight() {
        if (this._highlightedIndex >= 0) this._options[this._highlightedIndex].classList.remove('highlighted');
        this._highlightedIndex = -1;
    }

    move(delta) {
        const last = this._options.length - 1;
        const base = this._open ? (this._highlightedIndex >= 0 ? this._highlightedIndex : this._selectedIndex) : this._selectedIndex;
        const next = Math.min(Math.max(0, base + delta),last);

        if (this._open) this.setHighlight(next); 
        else this.selectIndex(next);
    }

    moveTo(index){
        if (this._open) this.setHighlight(index);
        else this.selectIndex(index);
    }

    handleTypeahead(char) {
        const idx = this._options.findIndex(o => o.textContent.trim().toLowerCase().startsWith(char));
        if (idx == -1) return;
        if (this._open) this.setHighlight(idx);
        else this.selectIndex(idx);
    }

    onKeyDown(e){
        const k = e.key;

        if (this._open && (k === 'Escape' || k === 'Esc')) {
            e.preventDefault();
            this.openList(false);
        }else if (k === ' ' || k === 'Spacebar' || k === 'Enter') {
            e.preventDefault();
            if(this._open){
                this.selectIndex(this._highlightedIndex);
                this.openList(false);
            }
            else {
                this.openList(true);
            }
        }else if (k === 'ArrowDown' || k === 'ArrowRight') {
            e.preventDefault();
            this.move(1);
        }else if (k === 'ArrowUp' || k === 'ArrowLeft') {
            e.preventDefault();
            this.move(-1);
        }else if (k === 'PageDown') {
            e.preventDefault();
            this.moveTo(this._options.length-1);
        }else if (k === 'PageUp') {
            e.preventDefault();
            this.moveTo(0);
        }else if (e.key.length === 1) {
            e.preventDefault();
            this.handleTypeahead(e.key);
        }
    }
}