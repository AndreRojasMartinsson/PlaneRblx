import { BaseComponent, Component } from "@flamework/components";
import { OnPhysics, OnStart } from "@flamework/core";
import { Keyboard } from "@rbxts/clack";
import { Bin } from "@rbxts/bin";
import { PlaneComponent } from "./Base";
import { PlanePrefab } from "shared/types/Plane";

@Component({
	tag: "HydraulicBrakes",
	defaults: {
		HydraulicPressure: 3000,
		FluidCompressibility: 0.008,
		FluidViscosity: 1.0,
		SkidThreshold: 0.2,
		BrakeReleaseDelay: 0.8,
		MaxTorque: 70_000,
	},
})
export class HydraulicBrakesComponent extends BaseComponent<Attributes, PlanePrefab> implements OnPhysics, OnStart {
	private keyboard = new Keyboard();
	private _bin = new Bin();

	public temperature = 20.0;
	public antiSkidEnabled = true;
	public parkBrakeEngaged = true;
	public brakeCommand = 0.0;
	public effectivePressure = 0.0;

	constructor(private planeComponent: PlaneComponent) {
		super();
	}

	onStart(): void {
		this._bin.add(
			this.keyboard.keyDown.Connect((key, processed) => {
				if (processed) return;

				if (key === Enum.KeyCode.LeftShift) {
					this.brakeCommand = 1;
				} else if (key === Enum.KeyCode.P) {
					this.parkBrakeEngaged = !this.parkBrakeEngaged;
					this.brakeCommand = this.parkBrakeEngaged ? 1 : 0;
				}
			}),
		);

		this._bin.add(
			this.keyboard.keyUp.Connect(key => {
				if (key === Enum.KeyCode.LeftShift) {
					this.brakeCommand = 0;
				}
			}),
		);
	}

	onPhysics(dt: number): void {
		if (this.parkBrakeEngaged) {
			this.brakeCommand = 1;
		}

		this.updateEffectivePressure(dt);

		const isBraking = this.brakeCommand > 0.0 || this.parkBrakeEngaged;
		const hinges = this.instance.Root.Hinges.Rear.GetChildren();

		for (const hinge of hinges) {
			if (!hinge.IsA("HingeConstraint")) continue;

			hinge.ActuatorType = isBraking ? Enum.ActuatorType.Motor : Enum.ActuatorType.None;

			if (!isBraking) continue;

			const torque = this.pressureToTorque(this.effectivePressure);

			hinge.MotorMaxAcceleration = 10;
			hinge.MotorMaxTorque = this.computeAntiskidTorque(hinge, torque);
			hinge.AngularSpeed = 0;
		}
	}

	private updateEffectivePressure(dt: number) {
		const viscosityFactor = this.attributes.FluidViscosity * (1 + (25 - this.temperature) / 100);
		const desiredPressure = this.brakeCommand * this.attributes.HydraulicPressure;
		const pressureChangeRate =
			1 / (this.attributes.BrakeReleaseDelay + this.attributes.FluidCompressibility + viscosityFactor);

		this.effectivePressure += (desiredPressure - this.effectivePressure) * pressureChangeRate * dt;
	}

	private pressureToTorque(pressure: number): number {
		return (pressure / 3000) * this.attributes.MaxTorque;
	}

	private computeAntiskidTorque(hinge: HingeConstraint, commandedTorque: number): number {
		const wheelObject = hinge.Attachment1?.Parent;
		assert(wheelObject !== undefined);
		assert(wheelObject.IsA("Part"));

		const wheelVelocity = wheelObject.AssemblyAngularVelocity.Magnitude;
		const aircraftSpeed = this.planeComponent?.getSpeed();
		assert(aircraftSpeed !== undefined);

		const expectedWheelSpeed = aircraftSpeed / (wheelObject.Size.X / 2);
		const slipRatio = (expectedWheelSpeed - math.abs(wheelVelocity)) / expectedWheelSpeed;

		if (this.antiSkidEnabled && slipRatio > this.attributes.SkidThreshold) {
			return commandedTorque * 0.1;
		}

		return commandedTorque;
	}

	public clean() {
		this._bin.destroy();
	}
}

export interface Attributes {
	HydraulicPressure: number; // psi
	FluidCompressibility: number; // arbitrary scale factor, since real life fluids are compressible
	FluidViscosity: number; // scale (1.0 = nominal)
	SkidThreshold: number;
	BrakeReleaseDelay: number; // seconds
	MaxTorque: number;
}
