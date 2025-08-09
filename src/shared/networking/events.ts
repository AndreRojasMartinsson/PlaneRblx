import { Networking } from "@flamework/networking";

interface ClientToServerEvents {
	event(param1: string): void;
}

interface ServerToClientEvents {
	event(param1: string): void;
}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
