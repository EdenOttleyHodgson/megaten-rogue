export function exhaustGuard(_: never): never {
	throw new Error('exhausted switch case hit default!');
}
