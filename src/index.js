var Game = IgeClass.extend({
	classId: 'Game',
	init: function (App, options) {
		// Create the engine
		ige = new IgeEngine(options);
<<<<<<< HEAD

		console.log('ige initialized', 'Client: ', ige.isClient, '  Server: ', ige.isServer);
=======
		console.log('ige initialized', ige.isClient, ige.isServer);
>>>>>>> e7053f08f5f9fc1e08b26cee230323dbeaa21371
		if (ige.isClient) {
			ige.client = new App();
		}
		if (ige.isServer) {
			ige.server = new App(options);
		}
	}
});
if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
	module.exports = Game;
} else {
	var game = new Game(Client);
}
//# sourceMappingURL=index.js.map
