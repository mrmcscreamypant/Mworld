declare class Client extends TaroEventingClass {
	getCachedElementById: any;

	myPlayer: TaroEntity;
	selectedUnit: TaroEntity;
	entityUpdateQueue: Record<string, UpdateData[]>;

	rendererLoaded: JQueryDeferred<void>;

	isZooming: boolean;
	developerClientIds: any;
	zoom: number;
	isPressingPhaserButton: boolean;
	joystickExists: boolean;

	constructor(options?: object);

	tempLoadingTime: Record<string, number>;
	setLoadingTime: (name: string, time: number) => void;
}
