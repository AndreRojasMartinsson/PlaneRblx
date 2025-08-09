import { Components } from "@flamework/components";
import { Controller, Dependency, OnStart } from "@flamework/core";
import { PlaneClientComponent } from "client/components/Plane/Main";
import { Events, Funcs } from "client/networking";
import { isCleanable } from "shared/modules/Cleanable";

@Controller()
export class PlaneController implements OnStart {
	private _currentPlane: Model | undefined = undefined;

	onStart(): void {
		const components = Dependency<Components>();

		const cleanup = (obj: object) => {
			if (!isCleanable(obj)) {
				return;
			}

			obj.onClean();
		};

		components.onComponentRemoved<PlaneClientComponent>(cleanup);

		Events.onPlaneSpawn.connect(plane => {
			this._currentPlane = plane;
			plane.AddTag("PlaneClient");
		});

		Funcs.destroyPlaneClient.setCallback(() => {
			if (this._currentPlane === undefined) return;
			this._currentPlane.RemoveTag("PlaneClient");
			this._currentPlane = undefined;
		});
	}
}
