// Simple character utilities

import { Option } from "@rbxts/rust-classes";
import { Players } from "@rbxts/services";

export function getRootPartFromCharacter(character: Instance): Option<BasePart> {
	if (!character.IsA("Model")) return Option.none();

	const player = Players.GetPlayerFromCharacter(character);
	if (player === undefined) return Option.none();

	const humanoid = character.FindFirstChildOfClass("Humanoid");
	if (humanoid === undefined) return Option.none();

	return Option.wrap(humanoid.RootPart);
}

export function getHumanoidFromCharacter(character: Instance): Option<Humanoid> {
	if (!character.IsA("Model")) return Option.none();

	const player = Players.GetPlayerFromCharacter(character);
	if (player === undefined) return Option.none();

	const humanoid = character.FindFirstChildOfClass("Humanoid");

	return Option.wrap(humanoid);
}

export function getHumanoidFromPlayer(player: Player): Option<Humanoid> {
	const character = player.Character;

	if (character === undefined) return Option.none();

	const humanoid = character.FindFirstChildOfClass("Humanoid");

	return Option.wrap(humanoid);
}

export function getRootPartFromPlayer(player: Player): Option<BasePart> {
	const character = player.Character;

	if (character === undefined) return Option.none();

	const humanoid = character.FindFirstChildOfClass("Humanoid");
	if (humanoid === undefined) return Option.none();

	return Option.wrap(humanoid.RootPart);
}

// AWAITS

export function awaitRootPartFromCharacter(character: Instance): Promise<Option<BasePart>> {
	if (!character.IsA("Model")) return Promise.resolve(Option.none());

	const player = Players.GetPlayerFromCharacter(character);
	if (player === undefined) return Promise.resolve(Option.none());

	const clock = os.clock();
	let humanoid: Humanoid | undefined;

	while (os.clock() - clock < 10 || humanoid === undefined) {
		humanoid = character.FindFirstChildOfClass("Humanoid");
		task.wait();
	}

	if (humanoid === undefined) return Promise.resolve(Option.none());

	return Promise.resolve(Option.wrap(humanoid.RootPart));
}

export function awaitHumanoidFromCharacter(character: Instance): Promise<Option<Humanoid>> {
	if (!character.IsA("Model")) return Promise.resolve(Option.none());

	const player = Players.GetPlayerFromCharacter(character);
	if (player === undefined) return Promise.resolve(Option.none());

	const clock = os.clock();
	let humanoid: Humanoid | undefined;

	while (os.clock() - clock < 10 || humanoid === undefined) {
		humanoid = character.FindFirstChildOfClass("Humanoid");
		task.wait();
	}

	return Promise.resolve(Option.wrap(humanoid));
}

export function awaitHumanoidFromPlayer(player: Player): Promise<Option<Humanoid>> {
	const character = player.Character;

	if (character === undefined) return Promise.resolve(Option.none());

	const clock = os.clock();
	let humanoid: Humanoid | undefined;

	while (os.clock() - clock < 10 || humanoid === undefined) {
		humanoid = character.FindFirstChildOfClass("Humanoid");
		task.wait();
	}

	return Promise.resolve(Option.wrap(humanoid));
}

export function awaitRootPartFromPlayer(player: Player): Promise<Option<BasePart>> {
	const character = player.Character;
	if (character === undefined) return Promise.resolve(Option.none());

	const clock = os.clock();
	let humanoid: Humanoid | undefined;

	while (os.clock() - clock < 10 || humanoid === undefined) {
		humanoid = character.FindFirstChildOfClass("Humanoid");
		task.wait();
	}

	if (humanoid === undefined) return Promise.resolve(Option.none());

	return Promise.resolve(Option.wrap(humanoid.RootPart));
}
