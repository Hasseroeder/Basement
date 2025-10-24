const make = (tag, props = {}, children) => {
  const el = document.createElement(tag);
  if (props.style && typeof props.style == "object") {
    Object.assign(el.style, props.style);
    delete props.style;
  }
  if (children){
    el.append(...children);
  }
  return Object.assign(el, props);
};

function createUnitSpan(unit){
    if (!unit) return;
    return make("span",{
        style:{marginRight:"0.2rem"},
        textContent:unit
    });
}

function createStatTooltip(children) {
    return make("div",
        {className:'hidden tooltip-lite-child'},
        children
    );
}
    
function createRangedInput(type, {min, max, step, digits}, extraStyles={}) {
    const common = { 
        min: Math.min(max,min), 
        max: Math.max(max,min), 
        required: true, 
        type, step, lang: "en" 
    };

    const className = type=="range"?'weaponSlider':
                      type=="number"?'inputFromWeaponCalculator no-arrows':"";

    const variantStyles = 
        type=="range"?{
            margin: '0 0 0 0.2rem',
            background: '#555',
            transform: min>max ? 'scaleX(-1)' : '',
            transformOrigin: min>max ? 'center' : '',
            pointer: 'var(--cur-pointer)'
        }:
        type=="number"?{
            width:(digits*0.5)+'rem'
        }:{};

    const style = Object.assign({}, extraStyles, variantStyles);

    return make("input",{className,style,...common});
}

export {createRangedInput,createStatTooltip,createUnitSpan,make};