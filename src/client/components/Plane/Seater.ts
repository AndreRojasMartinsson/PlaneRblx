import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Bin } from "@rbxts/bin";
import { Cleanable } from "shared/modules/Cleanable";
import { awaitHumanoidFromPlayer } from "shared/utilities/character";

@Component({
	tag: "PlaneSeater",
})
export class PlaneSeaterComponent extends BaseComponent<{}, Seat> implements OnStart, Cleanable {
	private _bin = new Bin();

	onStart(): void {
		const prompt = new Instance("ProximityPrompt");

		prompt.MaxActivationDistance = 100;
		prompt.HoldDuration = 0.5;
		prompt.RequiresLineOfSight = false;
		prompt.Parent = this.instance;

		this._bin.add(
			this.instance.GetPropertyChangedSignal("Occupant").Connect(() => {
				prompt.Enabled = this.instance.Occupant === undefined;
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

				this.instance.Sit(humanoid);
			}),
		);
	}

	onClean() {
		this._bin.destroy();
	}
}
