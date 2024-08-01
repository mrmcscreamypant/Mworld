interface TierFeatures {
	customUi?: boolean;
	keepServerAlive?: boolean; // todo: keep at least 1 server alive
	chooseServerRegion?: boolean;
	skinShop?: boolean;
	coinItemPurchase?: boolean;
	ads?: boolean;
	coverImage?: boolean;
	editPlayerData?: boolean;
	postRequests?: boolean;
	lobby?: boolean;
	gameSubscription?: boolean;
	removeModdioBranding?: boolean; // todo
	customLoadingScreen?: boolean; // todo
	idleMode?: boolean;
}

const advancedTierPerms: TierFeatures = {
	customUi: true,
	keepServerAlive: true,
	chooseServerRegion: true,
	skinShop: true,
	coinItemPurchase: true,
	ads: true,
	coverImage: true,
	editPlayerData: true,
	postRequests: true,
	lobby: true,
};

const tier6Perms: TierFeatures = {
	...advancedTierPerms,
	gameSubscription: true,
	idleMode: true,
};

interface TierFeatureConfig {
	[key: string]: TierFeatures;
}

const tierFeaturesToggle: TierFeatureConfig = {
	'0': {
		// shouldn't allow anything.
	},
	// tier 1
	'1': {
		customUi: true,
	},
	'2': advancedTierPerms,
	'3': advancedTierPerms,
	'4': advancedTierPerms,
	'5': advancedTierPerms,
	'5p': advancedTierPerms,
	'6': tier6Perms,
	'6p': tier6Perms,
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = tierFeaturesToggle;
}
