import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Bin } from "@rbxts/bin";
import { Cleanable } from "shared/modules/Cleanable";

@Component({
	tag: "PlaneClient",
})
export class PlaneClientComponent extends BaseComponent implements Cleanable, OnStart {
	private _bin = new Bin();

	onStart(): void {
		print("HI");
	}

	onClean(): void {
		this._bin.destroy();
	}
}
