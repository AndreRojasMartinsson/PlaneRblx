import { Controller, Modding, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { waitForChildWhichIsA } from "@rbxts/wait-for";

@Controller()
export class LifecycleController implements OnStart {
	listeners = {
		playerDied: new Set<OnPlayerDied>(),
		characterAdded: new Set<OnCharacterAdded>(),
	};

	private setupListenerEvents() {
		Modding.onListenerAdded<OnPlayerDied>(obj => this.listeners.playerDied.add(obj));
		Modding.onListenerAdded<OnCharacterAdded>(obj => this.listeners.characterAdded.add(obj));

		Modding.onListenerRemoved<OnPlayerDied>(obj => this.listeners.playerDied.delete(obj));
		Modding.onListenerRemoved<OnCharacterAdded>(obj => this.listeners.characterAdded.delete(obj));
	}

	private setupEvents() {
		const onCharacterAdded = async (character: Model) => {
			const humanoid = await waitForChildWhichIsA(character, "Humanoid");

			for (const listener of this.listeners.characterAdded) {
				task.spawn(() => listener.onCharacterAdded(character));
			}

			humanoid.Died.Once(() => {
				for (const listener of this.listeners.playerDied) {
					task.spawn(() => listener.onPlayerDied());
				}
			});
		};

		const player = Players.LocalPlayer;
		const character = player.Character;

		if (!character) {
			player.CharacterAdded.Connect(char => onCharacterAdded(char).await());
			return;
		}

		onCharacterAdded(character).await();
	}

	onStart(): void {
		this.setupListenerEvents();

		this.setupEvents();
	}
}

export interface OnCharacterAdded {
	onCharacterAdded(character: Model): void;
}

export interface OnPlayerDied {
	onPlayerDied(): void;
}
