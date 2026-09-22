export function signedNumberFixedString(input: number, fixed: number) {
	const formatted = Math.abs(Number(input.toFixed(fixed)))
	const sign = input < 0 ? '-' : '+'
	return sign + formatted
}

export const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')

export function numStringToSubscript(string: string) {
	;['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'].forEach(
		(subscript, i) => (string = string.replaceAll(String(i), subscript))
	)
	return string
}
