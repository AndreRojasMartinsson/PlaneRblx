import { BaseComponent, Component } from "@flamework/components";
import { OnPhysics, OnStart } from "@flamework/core";
import { Keyboard } from "@rbxts/clack";
import { Bin } from "@rbxts/bin";
import { PlaneComponent } from "./Base";
import { PlanePrefab } from "shared/types/Plane";
import { EngineSimulator, EngineState } from "./modules/EngineSimulator";

@Component({
	tag: "EngineSystem",
	defaults: {
		ThrottleRateChange: 0.1,
		StartupScale: 0.2,
		PerEngineThrust: 590_000,
	},
})
export class EngineComponent extends BaseComponent<Attributes, PlanePrefab> implements OnPhysics, OnStart {
	private keyboard = new Keyboard();
	private _bin = new Bin();

	public engines = {
		Left: new EngineSimulator({ startupScale: 0.2 }),
		Right: new EngineSimulator({ startupScale: 0.2 }),
	};

	public throttleLever = 0;

	constructor() {
		super();
	}

	onStart(): void {
		this._bin.add(
			this.keyboard.keyDown.Connect((key, processed) => {
				if (processed) return;

				if (key === Enum.KeyCode.One) {
					if (this.engines.Left.isStarted()) {
						this.engines.Left.shutdown();
					} else {
						this.engines.Left.start();
					}
				} else if (key === Enum.KeyCode.Two) {
					if (this.engines.Right.isStarted()) {
						this.engines.Right.shutdown();
					} else {
						this.engines.Right.start();
					}
				}
			}),
		);
	}

	onPhysics(dt: number): void {
		this.updateLeftEngine(dt);
		this.updateRightEngine(dt);

		const rKeyDown = this.keyboard.isKeyDown(Enum.KeyCode.R);
		const fKeyDown = this.keyboard.isKeyDown(Enum.KeyCode.F);
		const factor = rKeyDown && fKeyDown ? 0 : rKeyDown ? 1 : fKeyDown ? -1 : 0;

		this.throttleLever = math.clamp(this.throttleLever + this.attributes.ThrottleRateChange * factor, 0, 1);
	}

	updateLeftEngine(dt: number) {
		const { thrust: thrustFactor } = this.engines.Left.update(dt, this.throttleLever);

		const thrusts = this.instance.Root.Thrust;
		const blades = this.instance.OtherParts.Engines.Blades;
		const effectiveThrust = thrustFactor * this.attributes.PerEngineThrust;

		const angularVelocity = this.getFanAngularVelocity(this.engines.Left);

		thrusts.Left.Force = new Vector3(-effectiveThrust, 0, 0);
		blades.Left.Root.HingeConstraint.AngularVelocity = angularVelocity;
	}

	updateRightEngine(dt: number) {
		const { N1, N2, thrust: thrustFactor } = this.engines.Right.update(dt, this.throttleLever);

		const thrusts = this.instance.Root.Thrust;
		const blades = this.instance.OtherParts.Engines.Blades;
		const effectiveThrust = thrustFactor * this.attributes.PerEngineThrust;

		const angularVelocity = this.getFanAngularVelocity(this.engines.Right);

		thrusts.Right.Force = new Vector3(-effectiveThrust, 0, 0);
		blades.Right.Root.HingeConstraint.AngularVelocity = angularVelocity;
	}

	private getFanAngularVelocity(simulator: EngineSimulator): number {
		const rpm = (simulator.getN1() / 100) * 800;
		return rpm * ((2 * math.pi) / 60);
	}

	public clean() {
		this._bin.destroy();
	}
}

export interface Attributes {
	ThrottleRateChange: number;
	StartupScale: number;
	PerEngineThrust: number;
}
