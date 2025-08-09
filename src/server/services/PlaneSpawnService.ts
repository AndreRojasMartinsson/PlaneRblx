import { Dependency, OnStart, Service } from "@flamework/core";
import { OnCharacterAdded, OnPlayerDied, OnPlayerLeaving } from "./LifecycleService";
import { HashMap } from "@rbxts/rust-classes";
import { CollectionService, PhysicsService, ServerStorage, Workspace } from "@rbxts/services";
import find from "@rbxutil/find";
import { Events, Funcs } from "server/networking";
import { Components } from "@flamework/components";
import { isCleanable } from "shared/modules/Cleanable";
import { PlaneServerComponent } from "server/components/Plane/Main";
import { PlanePrefab } from "shared/types/Plane";

export enum CollisionGroup {
	Wings = "WINGS",
	Legs = "LEGS",
	Plane = "PLANE",
	PlayerPlane = "PLAYER_PLANE",
}

@Service()
export class PlaneSpawnService implements OnCharacterAdded, OnPlayerDied, OnPlayerLeaving, OnStart {
	private _playerPlanes = HashMap.empty<Player, Model>();

	onStart(): void {
		const components = Dependency<Components>();

		this.setupCollisionGroups();

		const cleanup = (obj: object) => {
			if (!isCleanable(obj)) {
				return;
			}

			obj.onClean();
		};

		components.onComponentRemoved<PlaneServerComponent>(cleanup);
	}

	onCharacterAdded(player: Player, _: Model): void {
		const planeObject = find<Model>(ServerStorage, "Prefabs", "PlanePrefab").Clone();
		assert(planeObject.IsA("Model"), "Plane object is not a model");

		this.setupCollisions(planeObject as PlanePrefab);

		planeObject.Name = `Plane_${player.Name}`;
		planeObject.SetAttribute("Owner", player.Name);
		planeObject.AddTag("PlaneServer");
		planeObject.Parent = Workspace;

		this._playerPlanes.insert(player, planeObject);
	}

	onPlayerLeaving(player: Player): void {
		this.destroyPlane(player).await();
	}

	onPlayerDied(player: Player): void {
		this.destroyPlane(player).await();
	}

	private setupCollisionGroups() {
		PhysicsService.RegisterCollisionGroup(CollisionGroup.Wings);
		PhysicsService.RegisterCollisionGroup(CollisionGroup.Legs);
		PhysicsService.RegisterCollisionGroup(CollisionGroup.Plane);
		PhysicsService.RegisterCollisionGroup(CollisionGroup.PlayerPlane);

		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Wings, "Default", true);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Legs, "Default", true);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.PlayerPlane, "Default", true);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Plane, "Default", true);

		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Wings, CollisionGroup.Wings, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Wings, CollisionGroup.Legs, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Wings, CollisionGroup.Plane, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Wings, CollisionGroup.PlayerPlane, false);

		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Legs, CollisionGroup.Legs, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Legs, CollisionGroup.Plane, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Legs, CollisionGroup.PlayerPlane, false);

		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Plane, CollisionGroup.Plane, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Plane, CollisionGroup.PlayerPlane, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.Plane, CollisionGroup.Legs, false);

		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.PlayerPlane, CollisionGroup.PlayerPlane, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.PlayerPlane, CollisionGroup.Plane, false);
		PhysicsService.CollisionGroupSetCollidable(CollisionGroup.PlayerPlane, CollisionGroup.Legs, false);
	}

	private setupCollisions(plane: PlanePrefab) {
		for (const part of plane.GetDescendants()) {
			if (!part.IsA("BasePart")) continue;

			part.Anchored = false;

			if (part.IsDescendantOf(plane.OtherParts.Wings) || part.IsDescendantOf(plane.MainParts.ControlSurfaces)) {
				part.CollisionGroup = CollisionGroup.Wings;
			} else if (part.IsDescendantOf(plane.MainParts.LandingGear)) {
				part.CollisionGroup = CollisionGroup.Legs;
			} else {
				part.CollisionGroup = CollisionGroup.Plane;
			}
		}
	}

	async destroyPlane(player: Player) {
		const plane = this._playerPlanes.get(player);
		if (plane.isNone()) {
			return;
		}

		this._playerPlanes.remove(player);

		const component = plane.expect("Expected plane object to exist after checking that it is not None.");

		await Funcs.destroyPlaneClient.invokeWithTimeout(player, 1);

		component.RemoveTag("PlaneServer");
		component.RemoveTag("PlaneClient");
	}
}
