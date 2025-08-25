export function clampedInput(el,value) {
    const min = parseFloat(el.min)
    const max = parseFloat(el.max)

    if (isNaN(value))       {return}
    else if (value < min)   {el.value = min}
    else if (value > max)   {el.value = max}
    else                    {el.value = value}
}

export function clampNumber(min, max, value) {
  if (isNaN(value)) return;
  return Math.min(Math.max(value, min), max);
}