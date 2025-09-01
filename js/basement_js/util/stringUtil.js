export function numberFixedString(input,fixed){
    if (input == undefined || input == NaN) return NaN;
    return Number(input.toFixed(fixed)).toLocaleString();
}