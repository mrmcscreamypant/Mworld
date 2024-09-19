class MapComponent extends TaroEntity {
	classId = 'MapComponent';
	componentId = 'map';
	constructor() {
		super();

		/**
		 * @type {Array<boolean>}
		 */
		this.AStarPathfindingMap;

		/**
		 * @type {Array<boolean>}
		 */
		this.wallMap;
	}

	load(data) {
		var self = this;

		self.data = data;

		if (taro.isServer) {
			taro.addComponent(TaroTiledComponent).tiled.loadJson(data, function (layerArray, layersById) {
				if (layersById.walls) taro.physics.staticsFromMap(layersById.walls);

				self.createRegions();
			});
		} else if (taro.isClient) {
			let mapLoadStartTime = performance.now();
			$.when(taro.client.taroEngineStarted).done(function () {
				taro.addComponent(TaroTiledComponent).tiled.loadJson(data, function (TaroLayerArray, TaroLayersById) {
					if (taro.physics && TaroLayersById.walls) {
						taro.physics.staticsFromMap(TaroLayersById.walls);
					}

					taro.client.mapLoaded.resolve();
					taro.client.setLoadingTime('mapLoaded', performance.now() - mapLoadStartTime);
				});
			});
		}
		self.updateWallMapData();
		this.updateAStarPathfindingData();
	}

	createRegions() {
		var regions = {};
		for (var i in taro.game.data.variables) {
			var variable = taro.game.data.variables[i];
			if (variable?.dataType == 'region') regions[i] = variable;
		}
		taro.$$('region').forEach((region) => {
			region.deleteRegion();
		});
		for (var regionName in regions) {
			if (!taro.regionManager.getRegionById(regionName)) {
				var data = regions[regionName];
				if (data) {
					data.id = regionName;
					new Region(data);
				}
			}
		}
	}

	updateWallMapData() {
		// call this after in-game map tile editing
		var self = this;

		let wallLayer = self.data.layers?.find((layerObject) => {
			return layerObject.name === 'walls';
		});

		this.wallMap = rfdc()(wallLayer?.data); // cache a copy of wall layer's data
		this.wallMap = this.wallMap?.map((value) => value != 0);
	}

	/**
	 * Must create wallMap before this
	 * Execute everytime before an A star path is generate
	 * Avoid execute within a short time < 250ms to avoid duplicate update
	 */
	updateAStarPathfindingData() {
		const entityType = ['unit', 'item', 'projectile'];
		const vertexPosShift = [
			{ x: -1, y: -1 },
			{ x: 1, y: -1 },
			{ x: -1, y: 1 },
			{ x: 1, y: 1 },
		];
		const tileWidth = taro.scaleMapDetails.tileWidth;
		const mapData = taro.map.data;
		if (this.wallMap) {
			this.AStarPathfindingMap = Array(this.wallMap.length).fill(false);
		}

		entityType.forEach((type) => {
			taro.$$(type).forEach((entity) => {
				const currentBody = entity._stats.currentBody;
				// only continue if the body is static / kinematic and it is not sensor
				if (currentBody.type == 'static' || currentBody.type == 'kinematic') {
					if (currentBody.fixtures[0].isSensor === false) {
						const entityVertices = [];

						// get bounding box
						vertexPosShift.forEach((shift) => {
							entityVertices.push({
								x:
									entity._translate.x +
									((currentBody.width / 2) * Math.cos(entity._rotate.z) * shift.x -
										(currentBody.height / 2) * Math.sin(entity._rotate.z) * shift.y),
								y:
									entity._translate.y +
									((currentBody.width / 2) * Math.sin(entity._rotate.z) * shift.x +
										(currentBody.height / 2) * Math.cos(entity._rotate.z) * shift.y),
							});
						});
						const topLeftVertex = {
							x: Math.min(...entityVertices.map((vertex) => vertex.x)),
							y: Math.min(...entityVertices.map((vertex) => vertex.y)),
						};
						const bottomRightVertex = {
							x: Math.max(...entityVertices.map((vertex) => vertex.x)),
							y: Math.max(...entityVertices.map((vertex) => vertex.y)),
						};

						// fill occupying tiles
						for (
							let j = Math.clamp(Math.floor(topLeftVertex.y / tileWidth), 0, mapData.height - 1);
							j <= Math.clamp(Math.floor(bottomRightVertex.y / tileWidth), 0, mapData.height - 1);
							j++
						) {
							for (
								let i = Math.clamp(Math.floor(topLeftVertex.x / tileWidth), 0, mapData.width - 1);
								i <= Math.clamp(Math.floor(bottomRightVertex.x / tileWidth), 0, mapData.width - 1);
								i++
							) {
								this.AStarPathfindingMap[j * mapData.width + i] = true;
							}
						}
					}
				}
			});
		});

		// combine with wallMap
		for (const tile in this.AStarPathfindingMap) {
			this.AStarPathfindingMap[tile] = this.AStarPathfindingMap[tile] || this.wallMap[tile];
		}
	}

	tileIsWall(x, y) {
		return this.wallMap[y * this.data.width + x];
	}

	tileIsBlocked(x, y) {
		return this.AStarPathfindingMap[y * this.data.width + x];
	}

	getDimensions() {
		return {};
	}
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = MapComponent;
}
