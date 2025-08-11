export interface PlanePrefab extends Model {
	Root: Part & {
		ControlSurfaces: Folder & {
			Elevators: Folder & {
				RElevator: HingeConstraint;
				LElevator: HingeConstraint;
			};
			Rudder: HingeConstraint;
			Ailerons: Folder & {
				RAileron: HingeConstraint;
				LAileron: HingeConstraint;
			};
			Spoilers: Folder & {
				LSpoiler: HingeConstraint;
				RSpoiler: HingeConstraint;
			};
			Flaps: Folder & {
				RFlap: CylindricalConstraint;
				RFlapOuter: CylindricalConstraint;
				LFlapOuter: CylindricalConstraint;
				LFlap: CylindricalConstraint;
			};
		};
		Thrust: Folder & {
			Left: VectorForce;
			Right: VectorForce;
		};
		Steer: Folder & {
			CylindricalConstraint: CylindricalConstraint;
		};
		Hinges: Folder & {
			HingeConstraintF: HingeConstraint;
			Rear: Folder & {
				HingeConstraintRR: HingeConstraint;
				HingeConstraintRL: HingeConstraint;
			};
		};
		Welds: Folder;
	};
	CenterOfMass: Part & {
		AttachmentL: Attachment;
		SphereHandleAdornment: SphereHandleAdornment;
		AttachmentR: Attachment;
		WeldConstraint: WeldConstraint;
	};
	MainParts: Model & {
		FirstOfficer: Seat;
		LandingGear: Model & {
			Front: Model & {
				Root: MeshPart & {
					FluidForceSensor: FluidForceSensor & {
						ForceVisualization: Script;
					};
					Attachment: Attachment;
					SteerAttachment: Attachment;
					WeldConstraint: WeldConstraint;
				};
				MeshPart: MeshPart & {
					FluidForceSensor: FluidForceSensor & {
						ForceVisualization: Script;
					};
					WeldConstraint: WeldConstraint;
				};
				RealWheel: Part & {
					Highlight: Highlight;
					HingeAttachment: Attachment;
				};
				Steer: Part & {
					Highlight: Highlight;
					HingeAttachment: Attachment;
				};
			};
			Rear: Model & {
				Root: MeshPart & {
					AttachmentR: Attachment;
					AttachmentL: Attachment;
				};
				MeshPart: MeshPart & {
					FluidForceSensor: FluidForceSensor & {
						ForceVisualization: Script;
					};
					Attachment: Attachment;
				};
				RealWheelR: Part & {
					AttachmentWR: Attachment;
					Highlight: Highlight;
				};
				RealWheelL: Part & {
					AttachmentWL: Attachment;
					Highlight: Highlight;
				};
			};
		};
		ControlSurfaces: Model & {
			RFlap: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			LAileron: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			RFlapOuter: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			RAileron: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			RElevator: Part & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			Rudder: UnionOperation & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			LElevator: Part & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			LFlap: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			LFlapOuter: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
		};
		Captain: Seat & {
			Seater: Script;
			Main: Script;
		};
	};
	OtherParts: Model & {
		Engines: Model & {
			Blades: Model & {
				Left: Model & {
					Blades: MeshPart & {
						Attachment: Attachment;
					};
					Root: MeshPart & {
						HingeConstraint: HingeConstraint;
						Attachment: Attachment;
					};
				};
				Right: Model & {
					Blades: MeshPart & {
						Attachment: Attachment;
					};
					Root: MeshPart & {
						HingeConstraint: HingeConstraint;
						Attachment: Attachment;
					};
				};
			};
		};
		Accessories: Model & {
			MeshPart: MeshPart;
		};
		Wings: Model & {
			HorizontalStabilizerLeft: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
				Script: Script;
			};
			HorizontalStabilizerRight: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			FrontRightMain: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				AileronAttac: Attachment;
				RFlapOuterAttachment: Attachment;
				SpoilerAttach: Attachment;
				RFlapAttachment: Attachment;
			};
			VerticalStabilizer: UnionOperation & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
				WeldConstraint: WeldConstraint;
			};
			FrontLeftMain: MeshPart & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				AileronAttac: Attachment;
				SpoilerAttach: Attachment;
				LFlapOuterAttachment: Attachment;
				LFlapAttachment: Attachment;
			};
			RSpoiler: Part & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
			LSpoiler: Part & {
				FluidForceSensor: FluidForceSensor & {
					ForceVisualization: Script;
				};
				Attachment: Attachment;
			};
		};
		Cockpit: Model;
		Body: Model & {
			RearWings: MeshPart;
			["Cargo doors"]: Model;
		};
	};
}
