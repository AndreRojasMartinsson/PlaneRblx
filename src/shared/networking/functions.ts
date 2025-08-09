import { Networking } from "@flamework/networking";

interface ClientToServerFuncs {}

interface ServerToClientFuncs {
	destroyPlaneClient(): void;
}

export const GlobalFuncs = Networking.createFunction<ClientToServerFuncs, ServerToClientFuncs>();
