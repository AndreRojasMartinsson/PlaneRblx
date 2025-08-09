import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { CollectionService } from "@rbxts/services";
import { PlanePrefab } from "shared/types/Plane";
import { t } from "@rbxts/t";
import { Bin } from "@rbxts/bin";
import { Cleanable } from "shared/modules/Cleanable";
import { awaitHumanoidFromPlayer } from "shared/utilities/character";

@Component({
	tag: "PlaneServer",
	instanceGuard: t.any,
})
export class PlaneSeaterComponent extends BaseComponent<{}, PlanePrefab> implements OnStart, Cleanable {
	private _bin = new Bin();

	onStart(): void {
		this.instance.WaitForChild("Root");

		const captainSeat = CollectionService.GetTagged("Plane_Seat_CPT").filter(instance => {
			return instance.IsDescendantOf(this.instance);
		});

		const seat = captainSeat.remove(0);
		if (seat === undefined || !seat.IsA("Seat")) {
			return;
		}

		const prompt = new Instance("ProximityPrompt");
		prompt.MaxActivationDistance = 100;
		prompt.HoldDuration = 0.5;
		prompt.RequiresLineOfSight = false;
		prompt.Parent = seat;

		this._bin.add(
			seat.GetPropertyChangedSignal("Occupant").Connect(() => {
				prompt.Enabled = seat.Occupant === undefined;
			}),
		);

		this._bin.add(
			prompt.Triggered.Connect(async player => {
				const _humanoid = await awaitHumanoidFromPlayer(player);

				if (_humanoid.isNone()) {
					return;
				}

				const humanoid = _humanoid.expect("Expected humanoid to exist");
				const character = player.Character || player.CharacterAdded.Wait()[0];

				for (const part of character.GetDescendants()) {
					if (!part.IsA("BasePart")) continue;

					part.Massless = true;
				}

				seat.Sit(humanoid);
			}),
		);
	}

	onClean() {
		this._bin.destroy();
	}
}
