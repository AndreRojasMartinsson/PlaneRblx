import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Bin } from "@rbxts/bin";
import { Cleanable } from "shared/modules/Cleanable";
import { PlanePrefab } from "shared/types/Plane";
import { t } from "@rbxts/t";
import { Players } from "@rbxts/services";
import { Events } from "server/networking";
import { Funcs } from "server/networking";

@Component({
	tag: "PlaneServer",
	instanceGuard: t.any,
})
export class PlaneServerComponent extends BaseComponent<{}, PlanePrefab> implements Cleanable, OnStart {
	private _bin = new Bin();

	private _currentPlayer: Player | undefined;

	private setNetworkOwner(player?: Player) {
		for (const part of this.instance.GetDescendants()) {
			if (!part.IsA("BasePart")) continue;

			part.SetNetworkOwner(player);
		}
	}

	onStart(): void {
		this._bin.add(this.instance);

		const seat = this.instance.MainParts.Captain;

		this._bin.add(
			seat.GetPropertyChangedSignal("Occupant").Connect(async () => {
				const occupant = seat.Occupant;

				if (occupant) {
					const player = Players.GetPlayerFromCharacter(occupant?.Parent);
					if (player === undefined) return;

					this.setNetworkOwner(player);
					this._currentPlayer = player;

					Events.onPlaneSpawn.fire(player, this.instance);
				} else {
					assert(this._currentPlayer !== undefined);

					const character = this._currentPlayer.Character || this._currentPlayer.CharacterAdded.Wait()[0];
					assert(character !== undefined);

					for (const part of character.GetDescendants()) {
						if (!part.IsA("BasePart")) continue;

						part.Massless = false;
					}

					Funcs.destroyPlaneClient.invokeWithTimeout(this._currentPlayer, 1);
					this.setNetworkOwner(undefined);
					this._currentPlayer = undefined;
				}
			}),
		);
	}

	onClean(): void {
		this._bin.destroy();
	}
}
