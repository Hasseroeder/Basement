export function numberFixedString(input,fixed){
    if (input == undefined || input == NaN) return NaN;
    return Number(input.toFixed(fixed)).toLocaleString();
}

export function capitalizeFirstLetter(string){
    return string.slice(0,1).toUpperCase()
         + string.slice(1);
}