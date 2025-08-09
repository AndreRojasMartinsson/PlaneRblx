import { Networking } from "@flamework/networking";

interface ClientToServerFuncs {
	event(param1: string): void;
}

interface ServerToClientFuncs {
	event(param1: string): void;
}

export const GlobalFuncs = Networking.createEvent<ClientToServerFuncs, ServerToClientFuncs>();
