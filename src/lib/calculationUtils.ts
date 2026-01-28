export function randomOutcome(chancePercent: number): boolean {
	const roll = getRandomIntegerInclusive(1, 100);
	return chancePercent >= roll;
}

export function getRandomIntegerInclusive(min: number, max: number): number {
	const minCeiled = Math.ceil(min);
	const maxFloored = Math.floor(max);
	return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

export function sumArray(arr: number[]): number {
	return arr.reduce((acc, x) => acc + x, 0);
}

export function meanOfArray(arr: number[]): number {
	return sumArray(arr) / arr.length;
}
