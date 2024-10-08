const box2dwasmWrapper: PhysicsDistProps = {
	init: async function (component) {
		const box2D = (await box2dwasm()) as typeof Box2D & EmscriptenModule;
		const { freeLeaked, recordLeak } = new box2D.LeakMitigator();
		this.component = component;
		component.box2D = box2D;
		component.freeLeaked = freeLeaked;
		component.recordLeak = recordLeak;
		component.tryRecordLeak = (p: Box2D.b2Vec2) => recordLeak(p);
		component.freeFromCache = box2D.LeakMitigator.freeFromCache;
		component.wrapPointer = box2D.wrapPointer;
		component.getPointer = box2D.getPointer;
		component.destroyB2dObj = box2D.destroy;
		component.nullPtr = box2D.NULL;
		component.b2AABB = box2D.b2AABB; // added by Jaeyun for world collision detection for raycast bullets
		component.JSQueryCallback = box2D.JSQueryCallback;
		component.b2Color = box2D.b2Color;
		component.b2Vec2 = box2D.b2Vec2;
		component.b2Math = {};
		component.b2Shape = box2D.b2Shape;
		component.b2BodyDef = box2D.b2BodyDef;
		component.b2_dynamicBody = box2D.b2_dynamicBody;
		component.b2Body = box2D.b2Body;
		component.b2Joint = box2D.b2Joint;
		component.b2FixtureDef = box2D.b2FixtureDef;
		component.b2Fixture = box2D.b2Fixture;
		component.b2World = box2D.b2World;
		component.b2MassData = box2D.b2MassData;
		component.b2PolygonShape = box2D.b2PolygonShape;
		component.b2CircleShape = box2D.b2CircleShape;
		component.b2DebugDraw = box2D.b2Draw;
		component.b2ContactListener = box2D.JSContactListener;
		component.b2ContactFilter = box2D.JSContactFilter;
		component.b2RevoluteJointDef = box2D.b2RevoluteJointDef;
		component.b2WeldJointDef = box2D.b2WeldJointDef;
		component.b2Contact = box2D.b2Contact;
		component.b2Distance = box2D.b2DistanceJoint;
		component.b2FilterData = box2D.b2Filter;
		component.b2DistanceJointDef = box2D.b2DistanceJointDef;
		// aliases for camelcase
		component.b2World.prototype.isLocked = component.b2World.prototype.IsLocked;
		component.b2World.prototype.createBody = component.b2World.prototype.CreateBody;
		component.b2World.prototype.destroyBody = component.b2World.prototype.DestroyBody;
		component.b2World.prototype.clearForces = component.b2World.prototype.ClearForces;
		component.b2World.prototype.getBodyList = component.b2World.prototype.GetBodyList;
		component.b2World.prototype.getJointList = component.b2World.prototype.GetJointList;
		component.b2World.prototype.getFixtureList = component.b2World.prototype.GetFixtureList;
		component.b2World.prototype.step = component.b2World.prototype.Step;
		component.b2World.prototype.rayCast = (
			start: Box2D.b2Vec2,
			end: Box2D.b2Vec2,
			callback: Box2D.b2RayCastCallback | number
		) => {
			component._world.RayCast(callback, start, end);
		};
		component.b2Transform = box2D.b2Transform;
		component.b2Body.prototype.getNext = component.b2Body.prototype.GetNext;
		component.b2Body.prototype.getAngle = component.b2Body.prototype.GetAngle;
		component.b2Body.prototype.setPosition = function (position) {
			let angle = component.recordLeak(this.GetAngle());
			if ((!position.x && position.x !== 0) || (!position.y && position.y !== 0)) {
				return;
			}
			let pos = new box2D.b2Vec2(position.x, position.y);
			this.SetTransform(pos, isNaN(angle) ? 0 : angle);
			component.destroyB2dObj(pos);
		};
		component.b2Body.prototype.getPosition = component.b2Body.prototype.GetPosition;
		component.b2Body.prototype.setGravityScale = component.b2Body.prototype.SetGravityScale;
		component.b2Body.prototype.setAngle = function (angle) {
			if (!angle && angle !== 0) {
				return;
			}
			let pos = component.recordLeak(this.GetPosition());
			this.SetTransform(pos, isNaN(angle) ? 0 : angle);
		};
		component.b2Body.prototype.setTransform = component.b2Body.prototype.SetTransform;
		component.b2Body.prototype.isAwake = component.b2Body.prototype.IsAwake;
		component.b2Body.prototype.setAwake = component.b2Body.prototype.SetAwake;
		component.b2Body.prototype.setLinearVelocity = component.b2Body.prototype.SetLinearVelocity;
		component.b2Body.prototype.getLinearVelocity = component.b2Body.prototype.GetLinearVelocity;
		component.b2Body.prototype.applyLinearImpulse = component.b2Body.prototype.ApplyLinearImpulse;
		component.b2Body.prototype.applyTorque = component.b2Body.prototype.ApplyTorque;
		component.b2Body.prototype.setActive = component.b2Body.prototype.SetEnabled;
		component.b2Body.prototype.isActive = component.b2Body.prototype.IsEnabled;
		component.b2Body.prototype.getWorldCenter = component.b2Body.prototype.GetWorldCenter;
		component.b2Body.prototype.applyForce = component.b2Body.prototype.ApplyForce;
		component.b2Vec2.prototype.set = component.b2Vec2.prototype.Set;
		// component.b2Vec2.prototype.setV = component.b2Vec2.prototype.SetV;

		component.b2Joint.prototype.getNext = component.b2Joint.prototype.GetNext;

		let ctx: Phaser.GameObjects.Graphics;
		if (taro.isClient) {
			component.enableDebug = (flags = 1) => {
				console.log('please make sure clientPhyscisEngine is not "", and enabled csp');
				if (!component.renderer) {
					const scale = component._scaleRatio;
					let debugDrawer;
					if (taro.game.data.defaultData.defaultRenderer !== '3d') {
						const canvas = taro.renderer.scene.getScene('Game');
						ctx = canvas.add.graphics().setDepth(9999);
						ctx.setScale(scale);
						component.ctx = ctx;
						debugDrawer = new Box2dDebugDrawerPhaser(box2D, new Box2dHelpers(box2D), ctx, scale).constructJSDraw();
						debugDrawer.SetFlags(flags);
						component._world.SetDebugDraw(debugDrawer);
					} else {
						debugDrawer = new Box2dDebugDrawerThree(taro.renderer.scene as any, 0.47, box2D);
						component._world.SetDebugDraw(debugDrawer.instance);
					}
					component.debugDrawer = debugDrawer;
				}
			};
			component.disableDebug = () => {
				component.ctx?.destroy();
				component.debugDrawer?.destroy?.();
				component.debugDrawer = undefined;
			};
		}

		component.createWorld = function (id, options) {
			component._world = new component.b2World(this._gravity);
			component._world.SetContinuousPhysics(this._continuousPhysics);
		};

		/**
		 * Gets / sets the gravity vector.
		 * @param x
		 * @param y
		 * @return {*}
		 */
		component.gravity = function (x, y) {
			if (x !== undefined && y !== undefined) {
				if (this._gravity) {
					this.destroyB2dObj(this._gravity);
				}
				this._gravity = new this.b2Vec2(x, y);
				return this._entity;
			}

			return this._gravity;
		};

		component.setContinuousPhysics = function (continuousPhysics) {
			this._continuousPhysics = continuousPhysics;
		};
		component._continuousPhysics = false;
		component._sleep = true;
		component._gravity = component.recordLeak(new component.b2Vec2(0, 0));
	},

	contactListener: function (self, beginContactCallback, endContactCallback, preSolve, postSolve) {
		var contactListener = new self.b2ContactListener();
		if (beginContactCallback !== undefined) {
			contactListener.BeginContact = beginContactCallback;
		}

		if (endContactCallback !== undefined) {
			contactListener.EndContact = endContactCallback;
		}

		if (preSolve !== undefined) {
			contactListener.PreSolve = preSolve;
		} else {
			contactListener.PreSolve = () => {};
		}

		if (postSolve !== undefined) {
			contactListener.PostSolve = postSolve;
		} else {
			contactListener.PostSolve = () => {};
		}
		self._world.SetContactListener(contactListener);

		let contactFilter: any = new self.b2ContactFilter();
		contactFilter.ShouldCollide = (fixtureA: Box2D.b2Fixture | number, fixtureB: Box2D.b2Fixture | number) => {
			let fA: Box2D.b2Fixture = fixtureA as Box2D.b2Fixture;
			let fB: Box2D.b2Fixture = fixtureB as Box2D.b2Fixture;
			if (typeof fixtureA === 'number') {
				fA = taro.physics.wrapPointer(fixtureA, taro.physics.b2Fixture) as Box2D.b2Fixture;
			}
			if (typeof fixtureB === 'number') {
				fB = taro.physics.wrapPointer(fixtureB, taro.physics.b2Fixture) as Box2D.b2Fixture;
			}
			const bodyA = taro.physics.recordLeak(fA.GetBody());
			const bodyB = taro.physics.recordLeak(fB.GetBody());
			var entityA = taro.physics.metaData[taro.physics.getPointer(bodyA)]._entity;
			var entityB = taro.physics.metaData[taro.physics.getPointer(bodyB)]._entity;
			if (!entityA || !entityB) {
				return;
			}

			return entityA._category !== 'sensor' && entityB._category !== 'sensor';
		};
		// self._world.SetContactFilter(contactFilter);
	},

	getBodyPosition: function (body: Box2D.b2Body, self: any) {
		return self.recordLeak(body.GetPosition());
	},

	createBody: function (self, entity, body, isLossTolerant) {
		const box2D = self.box2D as typeof Box2D & EmscriptenModule;
		PhysicsComponent.prototype.log(`createBody of ${entity._stats.name}`);

		if (!entity) {
			PhysicsComponent.prototype.log('warning: creating body for non-existent entity');
			return;
		}

		let ownerEntity = undefined;
		if (body.fixtures[0].isSensor) {
			ownerEntity = taro.$(entity.ownerUnitId);
			if (ownerEntity && ownerEntity.sensor && ownerEntity.sensor.getRadius() <= 0) {
				return;
			}
		}

		if (self.hasBody(entity)) {
			self.destroyBody(entity);
			delete self.metaData[box2D.getPointer(self.bodies.get(entity.id()))];
		}

		var tempDef: Box2D.b2BodyDef = self.recordLeak(new self.b2BodyDef());
		var param;
		let tempBod: Box2D.b2Body;
		var fixtureDef;
		var tempFixture: Box2D.b2FixtureDef;
		var finalFixture: Box2D.b2Fixture;
		var tempShape: Box2D.b2Shape;
		var tempFilterData;
		var i;
		var finalX;
		var finalY;
		var finalHWidth;
		var finalHHeight;
		// Process body definition and create a box2d body for it
		switch (body.type) {
			case 'static':
				tempDef.set_type(box2D.b2_staticBody);
				break;

			case 'dynamic':
				tempDef.set_type(box2D.b2_dynamicBody);
				break;

			case 'kinematic':
				tempDef.set_type(box2D.b2_kinematicBody);
				break;
		}
		// Add the parameters of the body to the new body instance
		for (param in body) {
			if (body.hasOwnProperty(param)) {
				switch (param) {
					case 'type':
					case 'gravitic':
					case 'fixedRotation':
					case 'fixtures':
						// Ignore these for now, we process them
						// below as post-creation attributes
						break;

					default:
						const funcName = `set_${param}`;
						if (typeof tempDef[funcName] === 'function') {
							tempDef[funcName](body[param]);
						} else {
							// tempDef[param] = body[param];
						}
						break;
				}
			}
		}

		// set rotation
		tempDef.set_angle(entity._rotate.z);
		// Set the position
		let nowPoint = self.recordLeak(
			new self.b2Vec2(entity._translate.x / self._scaleRatio, entity._translate.y / self._scaleRatio)
		);
		tempDef.set_position(nowPoint);
		self.destroyB2dObj(nowPoint);
		// Create the new body
		tempBod = self._world.CreateBody(tempDef);
		let bodyId = box2D.getPointer(tempBod);
		self.metaData[bodyId] = {};
		// Now apply any post-creation attributes we need to
		for (param in body) {
			if (body.hasOwnProperty(param)) {
				switch (param) {
					case 'gravitic':
						if (!body.gravitic) {
							tempBod.SetGravityScale(0);
						}
						break;

					case 'fixedRotation':
						if (body.fixedRotation || (entity && entity._category === 'region')) {
							tempBod.SetFixedRotation(true);
						}
						break;

					case 'fixtures':
						if (body.fixtures && body.fixtures.length) {
							for (i = 0; i < body.fixtures.length; i++) {
								// Grab the fixture definition
								fixtureDef = body.fixtures[i];
								// Create the fixture
								tempFixture = new self.b2FixtureDef();
								for (const param in fixtureDef) {
									if (fixtureDef.hasOwnProperty(param)) {
										if (param !== 'shape' && param !== 'filter') {
											if (tempFixture[`set_${param}`]) {
												tempFixture[`set_${param}`](fixtureDef[param]);
											}
										}
									}
								}

								// Check for a shape definition for the fixture
								if (fixtureDef.shape) {
									// Create based on the shape type
									switch (fixtureDef.shape.type) {
										case 'circle':
											tempShape = self.recordLeak(new self.b2CircleShape());
											if (fixtureDef.shape.data && typeof fixtureDef.shape.data.radius !== 'undefined') {
												tempShape.set_m_radius(fixtureDef.shape.data.radius / self._scaleRatio);
											} else {
												tempShape.set_m_radius(entity._bounds2d.x / self._scaleRatio / 2);
											}

											if (fixtureDef.shape.data) {
												finalX = fixtureDef.shape.data.x ?? 0;
												finalY = fixtureDef.shape.data.y ?? 0;
												const pos = self.recordLeak(
													new self.b2Vec2(finalX / self._scaleRatio, finalY / self._scaleRatio)
												);
												(tempShape as Box2D.b2CircleShape).set_m_p(pos);
												self.destroyB2dObj(pos);
											}
											break;

										case 'rectangle':
											tempShape = self.recordLeak(new self.b2PolygonShape());

											if (fixtureDef.shape.data) {
												finalX = fixtureDef.shape.data.x ?? 0;
												finalY = fixtureDef.shape.data.y ?? 0;
												finalHWidth = fixtureDef.shape.data.halfWidth ?? entity._bounds2d.x / 2;
												finalHHeight = fixtureDef.shape.data.halfHeight ?? entity._bounds2d.y / 2;
											} else {
												finalX = 0;
												finalY = 0;
												finalHWidth = entity._bounds2d.x / 2;
												finalHHeight = entity._bounds2d.y / 2;
											}

											const pos = self.recordLeak(
												new self.b2Vec2(finalX / self._scaleRatio, finalY / self._scaleRatio)
											);
											// Set the polygon as a box
											(tempShape as Box2D.b2PolygonShape).SetAsBox(
												finalHWidth / self._scaleRatio,
												finalHHeight / self._scaleRatio,
												pos,
												0
											);
											self.destroyB2dObj(pos);
											break;
									}
									if (tempShape && fixtureDef.filter) {
										tempFixture.set_shape(tempShape);
										finalFixture = tempBod.CreateFixture(tempFixture);
										self.destroyB2dObj(tempShape);
										self.destroyB2dObj(tempFixture);
										self.metaData[bodyId].taroId = fixtureDef.taroId;
									}
								}

								if (fixtureDef.filter && finalFixture) {
									tempFilterData = self.recordLeak(new self._entity.physics.b2FilterData());

									if (fixtureDef.filter.filterCategoryBits !== undefined) {
										tempFilterData.categoryBits = fixtureDef.filter.filterCategoryBits;
									}
									if (fixtureDef.filter.filterMaskBits !== undefined) {
										tempFilterData.maskBits = fixtureDef.filter.filterMaskBits;
									}
									if (fixtureDef.filter.categoryIndex !== undefined) {
										tempFilterData.categoryIndex = fixtureDef.filter.categoryIndex;
									}

									finalFixture.SetFilterData(tempFilterData);
									self.destroyB2dObj(tempFilterData);
								}

								if (fixtureDef.friction !== undefined && finalFixture) {
									finalFixture.SetFriction(fixtureDef.friction);
								}
								if (fixtureDef.restitution !== undefined && finalFixture) {
									finalFixture.SetRestitutionThreshold(fixtureDef.restitution);
								}
								if (fixtureDef.density !== undefined && finalFixture) {
									finalFixture.SetDensity(fixtureDef.density);
								}
								if (fixtureDef.isSensor !== undefined && finalFixture) {
									finalFixture.SetSensor(fixtureDef.isSensor);
								}
							}
						} else {
							self.log(
								'Box2D body has no fixtures, have you specified fixtures correctly? They are supposed to be an array of fixture anys.',
								'warning'
							);
						}
						break;
				}
			}
		}

		self.metaData[bodyId]._entity = entity;
		tempBod.SetEnabled(true);

		self.bodies.set(entity.id(), tempBod);

		entity.gravitic(!!body.affectedByGravity);
		entity.rotateTo(0, 0, entity._rotate.z);

		self.destroyB2dObj(tempDef);
		self.freeLeaked();

		return tempBod;
	},

	destroyBody: function (self, entity) {
		if (!entity?.hasPhysicsBody()) {
			self.log("failed to destroy body - body doesn't exist.");
			return;
		}

		const body = self.bodies.get(entity.id());
		let fixture = self.recordLeak(body.GetFixtureList());
		while (fixture !== undefined && self.getPointer(fixture) !== self.getPointer(self.nullPtr)) {
			body.DestroyFixture(fixture);
			fixture = self.recordLeak(fixture.GetNext());
		}

		self._world.destroyBody.apply(self._world, [body]);
		delete self.metaData[self.getPointer(body)];
		self.freeFromCache(body);

		self.bodies.delete(entity.id());

		entity._box2dOurContactFixture = null;
		entity._box2dTheirContactFixture = null;
	},

	getEntitiesInRegion: function (self, region) {
		const aabb = new self.b2AABB();
		aabb.lowerBound.set(region.x / self._scaleRatio, region.y / self._scaleRatio);
		aabb.upperBound.set((region.x + region.width) / self._scaleRatio, (region.y + region.height) / self._scaleRatio);

		const entities = [];
		const callback = Object.assign(new self.JSQueryCallback(), {
			ReportFixture: (fixture_p) => {
				const fixture = self.recordLeak(self.wrapPointer(fixture_p, self.b2Fixture));
				const body = self.recordLeak(fixture.GetBody());
				const entityId = self.metaData[self.getPointer(body)].taroId;
				var entity = taro.$(entityId);
				if (entity) {
					entities.push(entity);
				}
				return true;
			},
		});

		this.queryAABB(self, aabb, callback);

		return entities;
	},

	queryAABB: function (self, aabb, callback) {
		self.world().QueryAABB(callback, aabb);
		taro.physics.destroyB2dObj?.(callback);
		taro.physics.destroyB2dObj?.(aabb);
	},
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = box2dwasmWrapper;
}
