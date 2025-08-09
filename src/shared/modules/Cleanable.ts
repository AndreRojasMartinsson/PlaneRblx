/**
 * Marks component as cleanable.
 *
 * The onClean method gets called when component
 * is about to be destroyed.
 *
 * NOTE: The onClean method call **CANNOT** be gauranteed!
 */
export interface Cleanable {
	onClean(): void;
}

export function isCleanable(obj: object): obj is object & Cleanable {
	return "onClean" in obj;
}
