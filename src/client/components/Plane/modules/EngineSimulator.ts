import Object from "@rbxts/object-utils";

export enum EngineState {
	OFF,
	STARTING,
	LIGHT_OFF,
	IDLE_STABILIZE,
	RUN,
}

function exponentialApproach(current: number, target: number, tau: number, deltaTime: number) {
	// Exact discrete-time solution to 1st-order lag
	if (tau <= 0) return target;

	const alpha = 1 - math.exp(-deltaTime / tau);
	return current + (target - current) * alpha;
}

function smoothStep(x: number): number {
	x = math.clamp(x, 0, 1);

	return x * x * (3 - 2 * x);
}

export class EngineSimulator {
	private _useFlightIdle: boolean = false;
	private _state: EngineState = EngineState.OFF;
	private _N1 = 0.0;
	private _N2 = 0.0;
	private _timeInState = 0.0;
	private _lightOffDelay = 0.9;

	private _parameters: Parameters;

	constructor(parameters?: Partial<Parameters>) {
		const params = {
			groundIdleN1: 22,
			flightIdleN1: 30,
			idleN2: 60,
			idleThrust: 0.07,
			maxN1: 100,
			maxN2: 100,
			starterCutoutN2: 50.0,
			fuelOnN2: 22,
			relayLightOffDelayMin: 0.6,
			relayLightOffDelayMax: 1.2,
			startupScale: 2.8,
		};

		if (parameters === undefined) {
			this._parameters = params;
			return;
		}

		for (const [key, value] of Object.entries(parameters)) {
			params[key] = value;
		}

		this._parameters = params;
	}

	getN1() {
		return this._N1;
	}

	isStarted() {
		return this._state !== EngineState.OFF;
	}

	getIdleN1() {
		return this._useFlightIdle ? this._parameters.flightIdleN1 : this._parameters.groundIdleN1;
	}

	start() {
		if (this._state === EngineState.OFF) {
			this._state = EngineState.STARTING;
			this._timeInState = 0;

			const base =
				math.random() * (this._parameters.relayLightOffDelayMax - this._parameters.relayLightOffDelayMin) +
				this._parameters.relayLightOffDelayMin;

			this._lightOffDelay = base * (0.9 + 0.2 * math.random()) * this._parameters.startupScale;
		}
	}

	shutdown() {
		this._state = EngineState.OFF;

		task.spawn(() => {
			while (this._state === EngineState.OFF || (this._N1 > 0 && this._N2 > 0)) {
				this._N1 = math.max(this._N1 - 5, 0);
				this._N2 = math.max(this._N2 - 5, 0);
				task.wait();
			}

			this._N1 = 0;
			this._N2 = 0;
			this._timeInState = 0;
		});
	}

	update(deltaTime: number, thrustLever: number): SimulationOut {
		thrustLever = math.clamp(thrustLever, 0, 1);
		this._timeInState += deltaTime;

		const idleN1 = this.getIdleN1();

		if (this._state === EngineState.OFF) {
			this._N1 = exponentialApproach(this._N1, 0.0, 0.6, deltaTime);
			this._N2 = exponentialApproach(this._N2, 0.0, 0.6, deltaTime);
		} else if (this._state === EngineState.STARTING) {
			const targetN2 = this._parameters.fuelOnN2;
			this._N2 = exponentialApproach(this._N2, targetN2, 0.9 * this._parameters.startupScale * 2.0, deltaTime);
			this._N1 = exponentialApproach(this._N1, 1.0, 2.5 * this._parameters.startupScale, deltaTime);

			if (
				this._N2 >= this._parameters.fuelOnN2 - 0.5 &&
				this._timeInState >= this._lightOffDelay * this._parameters.startupScale
			) {
				this._state = EngineState.LIGHT_OFF;
				this._timeInState = 0;
			}
		} else if (this._state === EngineState.LIGHT_OFF) {
			const targetN2 = this._parameters.idleN2 * 0.85; // Transient undershoot
			const targetN1 = idleN1 * 0.8;

			this._N2 = exponentialApproach(this._N2, targetN2, 1.8 * this._parameters.startupScale * 1.4, deltaTime);
			this._N1 = exponentialApproach(this._N1, targetN1, 2.2 * this._parameters.startupScale * 1.3, deltaTime);

			if (this._timeInState > 1.0 * this._parameters.startupScale && this._N2 > this._parameters.idleN2 * 0.75) {
				this._state = EngineState.IDLE_STABILIZE;
				this._timeInState = 0;
			}
		} else if (this._state === EngineState.IDLE_STABILIZE) {
			const targetN2 = this._parameters.idleN2;
			const targetN1 = idleN1;

			this._N2 = exponentialApproach(this._N2, targetN2, 1.6 * this._parameters.startupScale * 1.6, deltaTime);
			this._N1 = exponentialApproach(this._N1, targetN1, 2.0 * this._parameters.startupScale * 1.5, deltaTime);

			if (this._N2 >= this._parameters.starterCutoutN2 || this._timeInState > 4.0 * this._parameters.startupScale) {
				this._state = EngineState.RUN;
				this._timeInState = 0;
			}
		} else if (this._state === EngineState.RUN) {
			const targetN1 = this.leverToTargetN1(thrustLever);
			const targetN2 = this.n1ToN2Target(targetN1);

			this._N1 = exponentialApproach(this._N1, targetN1, this.tauN1(targetN1), deltaTime);
			this._N2 = exponentialApproach(this._N2, targetN2, this.tauN2(targetN2), deltaTime);
		}

		const thrustFactor = this.n1ToThrustFactor();

		return {
			N1: this._N1,
			N2: this._N2,
			state: this._state,
			thrust: thrustFactor,
		};
	}

	private leverToTargetN1(lever: number): number {
		const step = smoothStep(lever);
		const bump = 0.06 * step * (1 - step);
		const t = math.clamp(step + bump, 0, 1);

		const idleN1 = this.getIdleN1();

		return idleN1 + (this._parameters.maxN1 - idleN1) * t;
	}

	private n1ToN2Target(n1: number): number {
		const idleN1 = this.getIdleN1();
		const value = (n1 - idleN1) / (100 - idleN1);
		const n1n = math.clamp(value, 0, 1);

		const idleN2 = this._parameters.idleN2;
		return (idleN2 + (99.0 - idleN2) * n1n) ^ 0.85;
	}

	private n1ToThrustFactor(): number {
		const n1 = this._N1;
		const idleN1 = this.getIdleN1();
		const value = (n1 - idleN1) / (100 - idleN1);
		const n1n = math.clamp(value, 0, 1);

		const shape = n1n ^ 1.6; // Convex growth

		const idleThrust = this._parameters.idleThrust;

		return math.clamp(idleThrust + (1 - idleThrust) * shape, 0, 1);
	}

	private tauN1(targetN1: number): number {
		const currentN1 = this._N1;
		const n = math.clamp(currentN1 / 100.0, 0, 1);
		if (targetN1 > currentN1) {
			return 0.5 + 4.8 * (0.35 + (n ^ 1.8));
		} else {
			return 0.7 + 5.0 * (n ^ 1.5);
		}
	}

	private tauN2(targetN2: number): number {
		const currentN2 = this._N2;
		const n = math.clamp(currentN2 / 100.0, 0, 1);
		if (targetN2 > currentN2) {
			return 0.4 + 3.2 * (0.25 + (n ^ 1.6));
		} else {
			return 0.6 + 3.8 * (n ^ 1.4);
		}
	}
}

interface SimulationOut {
	N1: number;
	N2: number;
	thrust: number;
	state: EngineState;
}

interface Parameters {
	groundIdleN1: number;
	flightIdleN1: number;

	idleN2: number;
	idleThrust: number;

	maxN1: number;
	maxN2: number;

	// Scale the time it takes to startup engine
	startupScale: number;

	starterCutoutN2: number;
	fuelOnN2: number;
	relayLightOffDelayMin: number;
	relayLightOffDelayMax: number;
}
