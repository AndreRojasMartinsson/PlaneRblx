import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Bin } from "@rbxts/bin";
import { Cleanable } from "shared/modules/Cleanable";
import { PlanePrefab } from "shared/types/Plane";

const REQUIRED_COMPONENTS = ["HydraulicBrakes"];

@Component({
	tag: "PlaneClient",
})
export class PlaneComponent extends BaseComponent<{}, PlanePrefab> implements Cleanable, OnStart {
	private _bin = new Bin();

	constructor() {
		super();
	}

	getSpeed(): number {
		return this.instance.Root.AssemblyLinearVelocity.Magnitude;
	}

	async onStart() {
		// Setup brakes
		for (const component of REQUIRED_COMPONENTS) this.instance.AddTag(component);
	}

	onClean(): void {
		for (const component of REQUIRED_COMPONENTS) this.instance.RemoveTag(component);

		this._bin.destroy();
	}
}
