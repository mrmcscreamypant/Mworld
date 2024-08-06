const rapierWrapper = {
	init: function (component) {},
	getmxfp: (body, self) => {
		console.log('getmxfp not implemented');
	},
	queryAABB: (self, aabb, callback) => {
		console.log('queryAABB not implemented');
	},
	createBody: (self, entity, body, isLossTolerant) => {
		console.log('createBody not implemented');
	},
	createJoint: (self, entityA, entityB, anchorA, anchorB) => {
		console.log('createJoint not implemented');
	},
	contactListener: (self, beginContactCallback, endContactCallback, preSolve, postSolve) => {
		console.log('contactListener not implemented');
	},
};
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = rapierWrapper;
}
//# sourceMappingURL=rapierWrapper.js.map
