export function signedNumberFixedString(input,fixed){
    if (input == undefined || input == NaN) return NaN;
    const formatted = Math.abs(input.toFixed(fixed));
    const sign = input < 0 ? "-" : "+";
    return sign + formatted;
}

export function capitalizeFirstLetter(string){
    return string.slice(0,1).toUpperCase()
         + string.slice(1);
}