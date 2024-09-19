class AStarPathfindingComponent extends TaroEntity {
	classId = 'AStarPathfindingComponent';
	componentId = 'aStar';
	constructor(unit) {
		super();
		this._entity = unit._entity;

		// A* algorithm variables

		/**
		 * AI unit will keep going to highest index until there is no more node to go
		 * everytime when path generate failure, path should set to empty array (this.path = aStarResult.path automatically done for it)
		 * @type {Array<{x: number, y: number}>}
		 */
		this.path = [];

		/**
		 * @type {{x: number, y: number}}
		 */
		this.previousTargetPosition = undefined;

		/**
		 * @type {number}
		 */
		this.lastAStarPathfindingVersion = 0;

		/**
		 * @type {{x: number, y: number}}
		 */
		this.lastAStarPathfindingPosition;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {{path: [], ok: boolean}}
	 * Use .path to get return array with tiled x and y coordinates of the path (Start node exclusive)
	 * if target position is not reachable (no road to go / inside obstacle [wall / static entity / kinematic entity]) path will include tiled x and y passed only
	 * if the unit already at the target location, .path return empty array
	 *
	 * Use .ok to check if path correctly generated
	 * .ok return true if .path is found or the unit already at the target location
	 * .ok return false if the target location is inside an obstacle, not reachable
	 * if there is no obstacle between the start position and the end position, it will return the end position in .path, and return true in .ok
	 */
	getAStarPath(x, y) {
		const unit = this._entity;

		const map = taro.map; // cache the map data for rapid use
		const mapData = map.data;
		const tileWidth = taro.scaleMapDetails.tileWidth;

		const unitTilePosition = {
			x: Math.floor(unit._translate.x / tileWidth),
			y: Math.floor(unit._translate.y / tileWidth),
		};
		unitTilePosition.x = Math.clamp(unitTilePosition.x, 0, mapData.width - 1); // confine with map boundary
		unitTilePosition.y = Math.clamp(unitTilePosition.y, 0, mapData.height - 1);
		const targetTilePosition = { x: Math.floor(x / tileWidth), y: Math.floor(y / tileWidth) };
		targetTilePosition.x = Math.clamp(targetTilePosition.x, 0, mapData.width - 1); // confine with map boundary
		targetTilePosition.y = Math.clamp(targetTilePosition.y, 0, mapData.height - 1);

		let returnValue = { path: [{ ...targetTilePosition }], ok: false };

		// store target node tile position for checking later
		this.lastAStarPathfindingPosition = {
			x: (targetTilePosition.x + 0.5) * tileWidth,
			y: (targetTilePosition.y + 0.5) * tileWidth
		};

		// teminate if the target position is obstacle
		if (map.tileIsBlocked(targetTilePosition.x, targetTilePosition.y)) {
			return returnValue;
		}

		// if there is no obstacle in between, directly set the target to the end position
		if (!this.aStarIsSegmentBlocked(x, y, unit._translate.x, unit._translate.y)) {
			returnValue.ok = true;
			return returnValue;
		}

		/**
		 * @type {Array<{current: {x: number, y: number}, parent: {x: number, y: number}, totalHeuristic: number}>}
		 */
		let openList = []; // store grid nodes that is under evaluation

		/**
		 * @type {Array<{current: {x: number, y: number}, parent: {x: number, y: number}, totalHeuristic: number}>}
		 */
		let closeList = []; // store grid nodes that finished evaluation
		/**
		 * @type {Array<{x: number, y: number}>}
		 */
		let tempPath = []; // store path to return (smaller index: closer to target, larger index: closer to start)
		openList.push({ current: { ...unitTilePosition }, parent: { x: -1, y: -1 }, totalHeuristic: 0 }); // push start node to open List

		while (openList.length > 0) {
			let minNode = { ...openList[0] }; // initialize for iteration
			let minNodeIndex = 0;
			for (let i = 1; i < openList.length; i++) {
				if (openList[i].totalHeuristic < minNode.totalHeuristic) {
					// only update the minNode if the totalHeuristic is smaller
					minNodeIndex = i;
					minNode = { ...openList[i] };
				}
			}
			openList.splice(minNodeIndex, 1); // remove node with smallest distance from openList and add it to close list
			closeList.push({ ...minNode });
			if (minNode.current.x == targetTilePosition.x && minNode.current.y == targetTilePosition.y) {
				// break when the goal is found, push it to tempPath for return
				tempPath.push({ ...targetTilePosition });
				break;
			}
			for (let i = 0; i < 4; i++) {
				let newPosition = { ...minNode.current };
				switch (i) {
					case 0: // right
						newPosition.x += 1;
						if (newPosition.x >= mapData.width) {
							continue;
						}
						break;
					case 1: // left
						newPosition.x -= 1;
						if (newPosition.x < 0) {
							continue;
						}
						break;
					case 2: // top
						newPosition.y -= 1;
						if (newPosition.y < 0) {
							continue;
						}
						break;
					case 3: // bottom
						newPosition.y += 1;
						if (newPosition.y >= mapData.height) {
							continue;
						}
						break;
				}

				if (map.tileIsBlocked(newPosition.x, newPosition.y)) continue; // node is blocked, discard
				// prune if obstacle between old and new position
				const shouldPrune = this.aStarIsSegmentBlocked(
					(newPosition.x + 0.5) * tileWidth,
					(newPosition.y + 0.5) * tileWidth,
					(minNode.current.x + 0.5) * tileWidth,
					(minNode.current.y + 0.5) * tileWidth
				);
				if (shouldPrune) continue;

				if (!isNaN(parseInt(this.maxTravelDistance))) {
					// new Position is way too far from current position (> maxTravelDistance * 5 of unit, total diameter: 10 maxTravelDistance), hence A Star skip this possible node
					let distanceFromUnitToTarget = Math.distance(
						unit._translate.x,
						unit._translate.y,
						newPosition.x,
						newPosition.y
					);
					if (distanceFromUnitToTarget > this.maxTravelDistance * 5) {
						continue;
					}
				}

				// valid node, continue operation!!!

				// 10 to 1 A* heuristic for node with distance that closer to the goal
				const distToTargetFromNewPosition = Math.distance(
					newPosition.x,
					newPosition.y,
					targetTilePosition.x,
					targetTilePosition.y
				);
				const distToTargetFromCurrentPosition = Math.distance(
					minNode.current.x,
					minNode.current.y,
					targetTilePosition.x,
					targetTilePosition.y
				);
				const heuristic =
					distToTargetFromNewPosition < distToTargetFromCurrentPosition
						? 1 // euclidean distance to targetTilePosition from the newPosition is smaller than the minNodePosition, reduce the heuristic value (so it tend to choose this node)
						: 10; // euclidean distance to targetTilePosition from the newPosition is larger than the minNodePosition, increase the heuristic value (so it tend not to choose this node)
				let nodeFound = false; // initialize nodeFound for looping (checking the existance of a node)

				for (let k = 0; k < 3; k++) {
					if (!nodeFound) {
						// Idea: In open list already ? Update it : In close list already ? Neglect, already reviewed : put it inside openList for evaluation
						switch (k) {
							case 0: // first check if the node exist in open list (if true, update it)
								for (let j = 0; j < openList.length; j++) {
									if (newPosition.x == openList[j].current.x && newPosition.y == openList[j].current.y) {
										if (minNode.totalHeuristic + heuristic < openList[j].totalHeuristic) {
											openList[j] = {
												current: { ...newPosition },
												parent: { ...minNode.current },
												totalHeuristic: minNode.totalHeuristic + heuristic,
											};
										}
										nodeFound = true;
										break;
									}
								}
								break;
							case 1: // then check if the node exist in the close list (if true, neglect)
								for (let j = 0; j < closeList.length; j++) {
									if (newPosition.x == closeList[j].current.x && newPosition.y == closeList[j].current.y) {
										nodeFound = true;
										break;
									}
								}
								break;
							case 2: // finally push it to open list if it does not exist
								openList.push({
									current: { ...newPosition },
									parent: { ...minNode.current },
									totalHeuristic: minNode.totalHeuristic + heuristic,
								});
								break;
						}
					} else break;
				}
			}
		}
		if (tempPath.length == 0) {
			// goal is unreachable
			return returnValue;
		} else {
			while (
				tempPath[tempPath.length - 1].x != unitTilePosition.x ||
				tempPath[tempPath.length - 1].y != unitTilePosition.y
			) {
				// retrieve the path
				for (let i = 0; i < closeList.length; i++) {
					if (
						tempPath[tempPath.length - 1].x == closeList[i].current.x &&
						tempPath[tempPath.length - 1].y == closeList[i].current.y
					) {
						tempPath.push({ ...closeList[i].parent }); // keep pushing the parent node of the node, until it reach the start node from goal node
						break;
					}
				}
			}
			tempPath = this.prettifyAStarPath(tempPath);
			tempPath.pop(); // omit start tile, no need to step on it again as we are on it already
			returnValue.path = tempPath;
			returnValue.ok = true;
			return returnValue;
		}
	}

	onAStarFailedTrigger() {
		const triggerParam = { unitId: this._entity.id() };
		taro.script.trigger('unitAStarPathFindingFailed', triggerParam);
		this._entity.script.trigger('entityAStarPathFindingFailed', triggerParam);
	}

	/** 
	 * @param {number} targetX 
	 * @param {number} targetY 
	 * @param {number} fromX
	 * @param {number} fromY
	 * @returns 
	 * Values are world space coordinate instead of tiled coordinate
	 */
	aStarIsSegmentBlocked(targetX, targetY, fromX, fromY) {
		// Update pathfindable tile data to latest before check if segment is block
		taro.map.updateAStarPathfindingData();

		const unit = this._entity;
		const unitWidth = unit._stats.currentBody.width;
		const unitHeight = unit._stats.currentBody.height;
		const tileWidth = taro.scaleMapDetails.tileWidth;
		const map = taro.map;
		const mapData = map.data;
		const maxBodySizeShift = Math.max(unitWidth, unitHeight) / 2;
		// get occupied size of unit with small step (for precise detection)
		const maxQuarterTileShift = Math.floor(maxBodySizeShift / (tileWidth / 4));

		// set target and from as center of tile
		targetX = (Math.floor(targetX / tileWidth) + 0.5) * tileWidth;
		targetY = (Math.floor(targetY / tileWidth) + 0.5) * tileWidth;
		fromX = (Math.floor(fromX / tileWidth) + 0.5) * tileWidth;
		fromY = (Math.floor(fromY / tileWidth) + 0.5) * tileWidth;

		// convert position to grid position
		const diff = {
			x: targetX - fromX,
			y: targetY - fromY
		};
		/** slope */
		const m = (diff.x == 0 ? undefined : diff.y / diff.x);
		/** y-intercept */
		const c = (diff.x == 0 ? undefined : fromY - m * fromX);
		/** for determine if x or y is the main axis */
		const smallSlope = Math.abs(m) <= 1;

		// compute with x if slope is small, y if slope is large
		let startPos = {
			x: fromX,
			y: fromY
		};
		let endPos = {
			x: targetX,
			y: targetY
		};

		const primaryDirection = (smallSlope ? "x" : "y");
		const secondaryDirection = (smallSlope ? "y" : "x");

		if (Math.sign(diff[primaryDirection]) != 0) {
			while (
				startPos[primaryDirection] * Math.sign(diff[primaryDirection]) <=
				endPos[primaryDirection] * Math.sign(diff[primaryDirection])
			) {
				// check tiles within unit size to see if they are occupied by obstacle
				for (let j = -maxQuarterTileShift; j <= maxQuarterTileShift; j++) {
					for (let i = -maxQuarterTileShift; i <= maxQuarterTileShift; i++) {
						let x = Math.floor((startPos.x + i * tileWidth / 4) / tileWidth);
						let y = Math.floor((startPos.y + j * tileWidth / 4) / tileWidth);
						if (x < 0 || x >= mapData.width || y < 0 || y >= mapData.height || map.tileIsBlocked(x, y)) {
							return true;
						}
					}
				}

				// update primary axis with small step (for precise detection)
				const nextPrimary = startPos[primaryDirection] + (tileWidth / 4) * Math.sign(diff[primaryDirection]);
				let nextSecondary;
				// avoid changing secondary axis for pure vertical and horizontal
				if (m != 0 && m !== undefined) {
					if (secondaryDirection == "y") {
						nextSecondary = m * nextPrimary + c;
					} else {
						nextSecondary = (nextPrimary - c) / m;
					}
					startPos[secondaryDirection] = nextSecondary;
				}
				startPos[primaryDirection] = nextPrimary;
			}
		}
		return false;
	}

	/**
	 * Check if there is any segment in the path is blocked
	 * @returns
	 */
	aStarPathIsBlocked() {
		const unit = this._entity;
		const tileWidth = taro.scaleMapDetails.tileWidth;
		const closestNode = this.getClosestAStarNode();

		// current position to closest node of path
		const nextPathIsBlocked = this.path.length > 0 && this.aStarIsSegmentBlocked(
			unit._translate.x,
			unit._translate.y,
			(closestNode.x + 0.5) * tileWidth,
			(closestNode.y + 0.5) * tileWidth
		);
		if (nextPathIsBlocked) return true;

		// other segments in the path
		for (let i = 0; i < this.path.length - 1; i++) {
			if (this.aStarIsSegmentBlocked(
				(this.path[i].x + 0.5) * tileWidth,
				(this.path[i].y + 0.5) * tileWidth,
				(this.path[i + 1].x + 0.5) * tileWidth,
				(this.path[i + 1].y + 0.5) * tileWidth
			)) {
				return true;
			}
		}

		return false;
	}

	getClosestAStarNode() {
		return this.path[this.path.length - 1];
	}

	getDistanceToClosestAStarNode() {
		let distance = 0;
		const tileWidth = taro.scaleMapDetails.tileWidth;
		const unit = this._entity;
		const closestNode = this.getClosestAStarNode();
		if (closestNode) {
			// closestAStarNode exist
			distance = Math.distance(
				(closestNode.x + 0.5) * tileWidth,
				(closestNode.y + 0.5) * tileWidth,
				unit._translate.x,
				unit._translate.y
			);
		}
		return distance;
	}

	aStarTargetUnitMoved() {
		const targetUnit = this._entity.ai.getTargetUnit();
		const tileWidth = taro.scaleMapDetails.tileWidth;
		const targetMovedDistance = Math.distance(
			targetUnit._translate.x,
			targetUnit._translate.y,
			this.previousTargetPosition.x,
			this.previousTargetPosition.y
		);
		if (targetMovedDistance > tileWidth / 2) {
			// update previous target position after unit is treated as moved
			this.previousTargetPosition = { x: targetUnit._translate.x, y: targetUnit._translate.y };
			return true;
		}
		return false;
	}

	setTargetPosition(x, y) {
		// Update pathfindable tile data to latest before pathfinding to avoid outdated path generation
		taro.map.updateAStarPathfindingData();

		const tileWidth = taro.scaleMapDetails.tileWidth;
		const closestNode = this.getClosestAStarNode();

		// avoid compute again if the target position is same as previous but the a star map is not updated
		// since the result is very likely to be the same again.
		if (this.aStarTargetPositionIsDuplicate(x, y) && this.aStarResultIsLatest()) {
			if (closestNode) {
				this._entity.ai.setTargetPosition((closestNode.x + 0.5) * tileWidth, (closestNode.y + 0.5) * tileWidth);
			} else {
				this._entity.ai.setTargetPosition(x, y);
			}
			return;
		}

		const aStarResult = this.getAStarPath(x, y);
		this.path = aStarResult.path;
		this.lastAStarPathfindingVersion = taro.map.lastAStarMapUpdateTime;

		if (closestNode) {
			// assign target position to ai no matter aStar failed or not as long as something inside path
			this._entity.ai.setTargetPosition((closestNode.x + 0.5) * tileWidth, (closestNode.y + 0.5) * tileWidth);
		}
		if (!aStarResult.ok) {
			this.onAStarFailedTrigger();
		}
	}

	/**
	 * @param {Array<{x: number, y: number}>} path
	 * Optimise straight A Star path segment with diagonal path segment
	 */
	prettifyAStarPath(path) {
		if (path.length < 3) { // don't need to prettify if node count < 3
			return path;
		}

		const tileWidth = taro.scaleMapDetails.tileWidth;
		/**
		 * @type {Array<{from: number, to: number, heuristic: number, largestCompatibleIndex: number, maxTotalHeuristic: number, shouldBackTracking: boolean}>}
		 */
		const possibleSegment = [];
		/**
		 * @type {Array<{x: number, y: number}>}
		 */
		const result = [];

		// dummy segment
		possibleSegment.push({
			maxTotalHeuristic: 0
		});

		for (const [j, pathJ] of path.entries()) {
			for (let i = path.length - 1; i > j; i--) { // at least 1 node in between is required to further process
				const segmentIsBlocked = this.aStarIsSegmentBlocked(
					(path[i].x + 0.5) * tileWidth,
					(path[i].y + 0.5) * tileWidth,
					(pathJ.x + 0.5) * tileWidth,
					(pathJ.y + 0.5) * tileWidth
				);
				if (segmentIsBlocked) {
					continue;
				} else {
					const isDiagonal = (pathJ.x != path[i].x) && (pathJ.y != path[i].y);
					possibleSegment.push({
						from: j,
						to: i,
						// a cubic heuristic for diagonal 
						// a square heuristic for long horizontal and vertical,
						// a normal heuristic for short horizontal and vertical to encourage diagonal movement
						heuristic: isDiagonal ? Math.pow(i - j, 3) : (i - j > 1 ? Math.pow(i - j, 2) : 1),
						largestCompatibleIndex: 0, // init only, to be evaluated soon
						maxTotalHeuristic: 0, // init only, to be evaluated soon
						shouldBackTracking: false // init only, to be evaluated soon
					});
				}
			}
		}

		// sort by end of segment (segment.to)
		possibleSegment.sort((a, b) => {
			if (a.to <= b.to) {
				return -1;
			} else {
				return 1;
			}
		});

		for (let i = 1; i < possibleSegment.length; i++) { // index 0 is dummy, start from 1
			const segment = possibleSegment[i];
			for (let j = 1; j < i; j++) {
				if (possibleSegment[j].to <= segment.from) {
					segment.largestCompatibleIndex = j;
				} else {
					break;
				}
			}
			// compare to see using this segment + latest compatible segment of this segment, or previous segment do a better performance
			segment.maxTotalHeuristic = Math.max(
				possibleSegment[i - 1].maxTotalHeuristic,
				segment.heuristic + possibleSegment[segment.largestCompatibleIndex].maxTotalHeuristic
			);
		}

		// prepare for backtracking
		let previousMaxTotalHeuristic = 0;
		for (let i = 0; i < possibleSegment.length; i++) {
			const segment = possibleSegment[i];
			if (segment.maxTotalHeuristic > previousMaxTotalHeuristic) {
				previousMaxTotalHeuristic = segment.maxTotalHeuristic;
				segment.shouldBackTracking = true;
			}
		}

		// backtracking
		let previousLargestCompatibleIndex = 0;
		for (let i = possibleSegment.length - 1; i > 0;) { // index 0 is dummy, stop before that
			const segment = possibleSegment[i];
			if (segment.shouldBackTracking) {
				previousLargestCompatibleIndex = i;
				i = segment.largestCompatibleIndex;
				result.push(path[segment.to]);
			} else {
				i--;
			}
		}
		result.push(path[possibleSegment[previousLargestCompatibleIndex].from]);
		result.reverse(); // flip back the result
		return result;
	}

	aStarResultIsLatest() {
		return this.lastAStarPathfindingVersion == taro.map.lastAStarMapUpdateTime;
	}

	aStarTargetPositionIsDuplicate(x, y) {
		return this.lastAStarPathfindingPosition?.x == x && this.lastAStarPathfindingPosition?.y == y;
	}
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = AStarPathfindingComponent;
}
