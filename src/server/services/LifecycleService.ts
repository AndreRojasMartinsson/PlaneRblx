import { Modding, OnStart, Service } from "@flamework/core";
import { Players, RunService } from "@rbxts/services";
import { waitForChildWhichIsA } from "@rbxts/wait-for";

@Service()
export class LifecycleService implements OnStart {
	listeners = {
		playerAdded: new Set<OnPlayerJoined>(),
		playerRemoving: new Set<OnPlayerLeaving>(),
		playerDied: new Set<OnPlayerDied>(),
		characterAdded: new Set<OnCharacterAdded>(),
	};

	private setupListenerEvents() {
		Modding.onListenerAdded<OnPlayerJoined>(obj => this.listeners.playerAdded.add(obj));
		Modding.onListenerAdded<OnPlayerDied>(obj => this.listeners.playerDied.add(obj));
		Modding.onListenerAdded<OnPlayerLeaving>(obj => this.listeners.playerRemoving.add(obj));
		Modding.onListenerAdded<OnCharacterAdded>(obj => this.listeners.characterAdded.add(obj));

		Modding.onListenerRemoved<OnPlayerJoined>(obj => this.listeners.playerAdded.delete(obj));
		Modding.onListenerRemoved<OnPlayerDied>(obj => this.listeners.playerDied.delete(obj));
		Modding.onListenerRemoved<OnPlayerLeaving>(obj => this.listeners.playerRemoving.delete(obj));
		Modding.onListenerRemoved<OnCharacterAdded>(obj => this.listeners.characterAdded.delete(obj));
	}

	private setupEvents() {
		const onCharacterAdded = async (player: Player, character: Model) => {
			const humanoid = await waitForChildWhichIsA(character, "Humanoid");

			for (const listener of this.listeners.characterAdded) {
				task.spawn(() => listener.onCharacterAdded(player, character));
			}

			humanoid.Died.Once(() => {
				for (const listener of this.listeners.playerDied) {
					task.spawn(() => listener.onPlayerDied(player));
				}
			});
		};

		const onPlayerAdded = (player: Player) => {
			for (const listener of this.listeners.playerAdded) {
				task.spawn(() => listener.onPlayerJoined(player));
			}

			const character = player.Character;

			if (!character) {
				player.CharacterAdded.Connect(char => onCharacterAdded(player, char).await());
				return;
			}

			onCharacterAdded(player, character).await();
		};

		const onPlayerRemoving = (player: Player) => {
			for (const listener of this.listeners.playerRemoving) {
				task.spawn(() => listener.onPlayerLeaving(player));
			}
		};

		Players.PlayerAdded.Connect(onPlayerAdded);
		Players.PlayerRemoving.Connect(onPlayerRemoving);

		for (const player of Players.GetPlayers()) {
			task.spawn(() => onPlayerAdded(player));
		}

		game.BindToClose(() => {
			if (RunService.IsStudio()) {
				task.wait(3);
				return;
			}

			for (const player of Players.GetPlayers()) {
				task.spawn(() => onPlayerRemoving(player));
			}
		});
	}

	onStart(): void {
		this.setupListenerEvents();

		this.setupEvents();
	}
}

export interface OnPlayerJoined {
	onPlayerJoined(player: Player): void;
}

export interface OnPlayerLeaving {
	onPlayerLeaving(player: Player): void;
}

export interface OnCharacterAdded {
	onCharacterAdded(player: Player, character: Model): void;
}

export interface OnPlayerDied {
	onPlayerDied(player: Player): void;
}
