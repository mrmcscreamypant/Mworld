// @ts-nocheck
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var CollisionGroups;
(function (CollisionGroups) {
    CollisionGroups[CollisionGroups["Wall"] = 1] = "Wall";
    CollisionGroups[CollisionGroups["Unit"] = 2] = "Unit";
    CollisionGroups[CollisionGroups["Debris"] = 4] = "Debris";
    CollisionGroups[CollisionGroups["Item"] = 8] = "Item";
    CollisionGroups[CollisionGroups["Projectile"] = 16] = "Projectile";
    CollisionGroups[CollisionGroups["Region"] = 32] = "Region";
    CollisionGroups[CollisionGroups["Sensor"] = 64] = "Sensor";
})(CollisionGroups || (CollisionGroups = {}));
var Rapier2dComponent = TaroEventingClass.extend({
    classId: 'Rapier2dComponent',
    componentId: 'physics',
    init: function (entity, options, callback, physicsComponent) {
        return __awaiter(this, void 0, void 0, function* () {
            this._entity = entity;
            this._options = options;
            this._actionQueue = [];
            this._tilesizeRatio = 1;
            this._scaleRatio = 30;
            this._sleep = true;
            this._collisionEventListeners = [];
            this.bodies = new Map();
            this.sensorColliders = new Map();
            this._gravity = { x: 0, y: 0 };
            try {
                yield RAPIER2D.init();
                callback();
            }
            catch (err) {
                console.log(err, 'error: ');
            }
            this.eventQueue = new RAPIER2D.EventQueue(true);
        });
    },
    addCollisionEventListener: function (callback) {
        this._collisionEventListeners.push(callback);
    },
    gravity: function (x, y) {
        if (x !== undefined && y !== undefined) {
            this._gravity.x = x;
            this._gravity.y = y;
            return this._entity;
        }
        return { x: this._gravity.x, y: this._gravity.y };
    },
    sleep: function (val) {
        if (val !== undefined) {
            this._sleep = val;
            return this._entity;
        }
        return this._sleep;
    },
    tilesizeRatio: function (val) {
        if (val !== undefined) {
            this._tilesizeRatio = val;
            return this._entity;
        }
        return this._tilesizeRatio;
    },
    world: function () {
        return this._world;
    },
    createBody: function (entity, body, isLossTolerant) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        PhysicsComponent.prototype.log(`createBody of ${entity._stats.name}`);
        if (!entity) {
            PhysicsComponent.prototype.log('warning: creating body for non-existent entity');
            return;
        }
        if (entity.hasPhysicsBody()) {
            this.destroyBody(entity);
        }
        const position = { x: entity._translate.x / this._scaleRatio, y: entity._translate.y / this._scaleRatio };
        const linearVelocity = { x: 0, y: 0 };
        const angle = entity._rotate.z;
        const angularVelocity = 0;
        const linearDamping = (_a = body.linearDamping) !== null && _a !== void 0 ? _a : 0;
        const angularDamping = (_b = body.angularDamping) !== null && _b !== void 0 ? _b : 0;
        const allowSleep = true;
        const awake = true;
        const fixedRotation = false;
        const bullet = false;
        const type = 0;
        const active = true;
        const inertiaScale = 1;
        const bodyType = body.type === 'static'
            ? RAPIER2D.RigidBodyType.Fixed
            : body.type === 'dynamic'
                ? RAPIER2D.RigidBodyType.Dynamic
                : RAPIER2D.RigidBodyType.KinematicPositionBased;
        const rigidBodyDesc = new RAPIER2D.RigidBodyDesc(bodyType).setTranslation(position.x, position.y);
        rigidBodyDesc.setUserData({ entity });
        rigidBodyDesc.setLinearDamping(linearDamping);
        rigidBodyDesc.setAngularDamping(angularDamping);
        let rigidBody;
        if (entity._category === 'sensor') {
            if (entity.getOwnerUnit()) {
                // sensor gets attached to owner unit rigid body
                rigidBody = this.bodies.get(entity.ownerUnitId);
            }
            else {
                // sensor with no taro-registered owner unit
                return;
            }
        }
        else {
            rigidBody = this._world.createRigidBody(rigidBodyDesc);
        }
        rigidBody.setRotation(angle);
        if (body.fixtures && body.fixtures.length) {
            for (i = 0; i < body.fixtures.length; i++) {
                const fixtureDef = body.fixtures[i];
                if (fixtureDef.shape) {
                    let colliderDesc;
                    const x = ((_d = (_c = fixtureDef.shape.data) === null || _c === void 0 ? void 0 : _c.x) !== null && _d !== void 0 ? _d : 0) / this._scaleRatio;
                    const y = ((_f = (_e = fixtureDef.shape.data) === null || _e === void 0 ? void 0 : _e.y) !== null && _f !== void 0 ? _f : 0) / this._scaleRatio;
                    switch (fixtureDef.shape.type) {
                        case 'rectangle': {
                            const width = ((_h = (_g = fixtureDef.shape.data) === null || _g === void 0 ? void 0 : _g.halfWidth) !== null && _h !== void 0 ? _h : entity._bounds2d.x / 2) / this._scaleRatio;
                            const height = ((_k = (_j = fixtureDef.shape.data) === null || _j === void 0 ? void 0 : _j.halfHeight) !== null && _k !== void 0 ? _k : entity._bounds2d.y / 2) / this._scaleRatio;
                            colliderDesc = RAPIER2D.ColliderDesc.cuboid(width, height).setTranslation(x, y);
                            break;
                        }
                        case 'circle': {
                            const radius = ((_m = (_l = fixtureDef.shape.data) === null || _l === void 0 ? void 0 : _l.radius) !== null && _m !== void 0 ? _m : entity._bounds2d.x / 2) / this._scaleRatio;
                            colliderDesc = RAPIER2D.ColliderDesc.ball(radius).setTranslation(x, y);
                            break;
                        }
                    }
                    colliderDesc.setActiveEvents(RAPIER2D.ActiveEvents.COLLISION_EVENTS);
                    colliderDesc.setFriction((_o = fixtureDef.friction) !== null && _o !== void 0 ? _o : 0);
                    colliderDesc.setRestitution((_p = fixtureDef.restitution) !== null && _p !== void 0 ? _p : 0);
                    colliderDesc.setDensity((_q = fixtureDef.density) !== null && _q !== void 0 ? _q : 0);
                    colliderDesc.setSensor(!!fixtureDef.isSensor);
                    /**
                     * collision grouping
                     * left 16: group
                     * right 16: mask
                     * ------------------
                     * wall: 1
                     * unit: 2
                     * debris: 4
                     * item: 8
                     * projectile: 16
                     * region: 32
                     * sensor: 64
                     */
                    colliderDesc.setCollisionGroups((fixtureDef.filter.filterCategoryBits << 16) + fixtureDef.filter.filterMaskBits);
                    if (colliderDesc) {
                        const collider = this._world.createCollider(colliderDesc, rigidBody);
                        if (entity._category === 'sensor') {
                            this.sensorColliders.set(entity.id(), collider);
                        }
                    }
                }
            }
        }
        if (entity._category !== 'sensor') {
            this.bodies.set(entity.id(), rigidBody);
        }
        // -----------------------------------------
        return rigidBody;
    },
    destroyBody: function (entity) {
        if (!(entity === null || entity === void 0 ? void 0 : entity.hasPhysicsBody())) {
            this.log("failed to destroy body - body doesn't exist.");
            return;
        }
        if (entity._category === 'sensor') {
            const collider = this.sensorColliders.get(entity.id());
            if (collider) {
                this._world.removeCollider(collider);
                this.sensorColliders.delete(entity.id());
            }
            return;
        }
        this._world.removeRigidBody(this.bodies.get(entity.id()));
        this.bodies.delete(entity.id());
    },
    hasBody(entity) {
        return this.bodies.has(entity === null || entity === void 0 ? void 0 : entity.id());
    },
    getEntitiesInRegion: function (region) {
        let entities = [];
        let shape = new RAPIER2D.Cuboid(region.width / this._scaleRatio / 2, region.height / this._scaleRatio / 2);
        let shapePos = { x: region.x / this._scaleRatio, y: region.y / this._scaleRatio };
        let shapeRot = 0;
        this._world.intersectionsWithShape(shapePos, shapeRot, shape, (handle) => {
            var _a, _b;
            const entity = (_b = (_a = handle === null || handle === void 0 ? void 0 : handle.parent()) === null || _a === void 0 ? void 0 : _a.userData) === null || _b === void 0 ? void 0 : _b.entity;
            if (!entity)
                return true;
            entities.push(entity);
            return true; // Return `false` instead if we want to stop searching for other colliders that contain this point.
        });
        return entities;
    },
    enableDebug: function (mountScene) {
        if (mountScene) {
            // Define the debug drawing instance
            var debugDraw = new this.b2DebugDraw();
            this._box2dDebug = true;
            debugDraw.SetSprite(taro._ctx);
            debugDraw.SetDrawScale(this._scaleRatio);
            debugDraw.SetFillAlpha(0.3);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(this.b2DebugDraw.e_controllerBit |
                this.b2DebugDraw.e_jointBit |
                this.b2DebugDraw.e_pairBit |
                this.b2DebugDraw.e_shapeBit
            // | this.b2DebugDraw.e_aabbBit
            // | this.b2DebugDraw.e_centerOfMassBit
            );
            // Set the debug draw for the world
            this._world.SetDebugDraw(debugDraw);
        }
        else {
            PhysicsComponent.prototype.log('Cannot enable box2d debug drawing because the passed argument is not an object on the scenegraph.', 'error');
        }
    },
    start: function (continuousPhysics) {
        this._world = new RAPIER2D.World(this._gravity);
    },
    queueAction: function (action) {
        this._actionQueue.push(action);
    },
    update: function (timeElapsedSinceLastStep, now) {
        var self = this;
        var body;
        var entity;
        var queueSize = 0;
        if (!self.isLocked()) {
            while (self._actionQueue.length > 0) {
                var action = self._actionQueue.shift();
                queueSize++;
                if (queueSize > 1000) {
                    taro.devLog(`Rapier3dComponent.js _behaviour queue looped over 1000 times. Currently processing action: ${action.type}`);
                }
                switch (action.type) {
                    case 'createBody':
                        self.createBody(action.entity, action.def);
                        // emit events for updating visibility mask
                        if (taro.isClient && action.entity._category === 'unit' && action.def.type === 'static') {
                            taro.client.emit('update-static-units');
                        }
                        break;
                    case 'destroyBody':
                        self.destroyBody(action.entity);
                        break;
                }
            }
        }
        // iterate through every physics body
        this._world.bodies.forEach((body) => {
            var _a, _b, _c, _d, _e, _f;
            const entity = (_a = body.userData) === null || _a === void 0 ? void 0 : _a.entity;
            //FIXME: when the 3d physics is ready, remove this
            if (entity && entity.tmpDefaultDepth) {
                entity.queueStreamData({ temp_translation_y: entity.tmpDefaultDepth });
            }
            if (!body.isFixed() && !body.isSleeping()) {
                if (entity && !entity._stats.isHidden) {
                    // apply movement if it's either human-controlled unit, or ai unit that's currently moving
                    if (entity.hasPhysicsBody() && entity.vector && (entity.vector.x != 0 || entity.vector.y != 0)) {
                        if (entity._stats.controls) {
                            switch (entity._stats.controls.movementMethod // velocity-based movement
                            ) {
                                case 'velocity':
                                    entity.setLinearVelocity(entity.vector.x, entity.vector.y);
                                    break;
                                case 'force':
                                    entity.applyForce(entity.vector.x, entity.vector.y);
                                    break;
                                case 'impulse':
                                    entity.applyImpulse(entity.vector.x, entity.vector.y);
                                    break;
                            }
                        }
                    }
                    const position = entity.getPosition();
                    var x = position.x * this._scaleRatio;
                    var y = position.y * this._scaleRatio;
                    var angle = body.rotation();
                    var tileWidth = taro.scaleMapDetails.tileWidth;
                    var tileHeight = taro.scaleMapDetails.tileHeight;
                    var skipBoundaryCheck = entity._stats && entity._stats.confinedWithinMapBoundaries === false;
                    var padding = tileWidth / 2;
                    // keep entities within the boundaries
                    if ((entity._category === 'unit' || entity._category === 'item' || entity._category === 'projectile') &&
                        !skipBoundaryCheck &&
                        (x < padding ||
                            x > taro.map.data.width * tileWidth - padding ||
                            y < padding ||
                            y > taro.map.data.height * tileHeight - padding)) {
                        // fire 'touchesWall' trigger when unit goes out of bounds for the first time
                        if (!entity.isOutOfBounds) {
                            if (entity._category === 'unit' || entity._category === 'item' || entity._category === 'projectile') {
                                entity.script.trigger('entityTouchesWall');
                            }
                            if (entity._category === 'unit') {
                                taro.script.trigger('unitTouchesWall', { unitId: entity.id() });
                            }
                            else if (entity._category === 'item') {
                                taro.script.trigger('itemTouchesWall', { itemId: entity.id() });
                            }
                            else if (entity._category === 'projectile') {
                                taro.script.trigger('projectileTouchesWall', { projectileId: entity.id() });
                            }
                            entity.isOutOfBounds = true;
                        }
                        x = Math.max(Math.min(x, taro.map.data.width * tileWidth - padding), padding);
                        y = Math.max(Math.min(y, taro.map.data.height * tileHeight - padding), padding);
                    }
                    else {
                        if (entity.isOutOfBounds) {
                            entity.isOutOfBounds = false;
                        }
                    }
                    // entity just has teleported
                    if (entity.teleportDestination != undefined) {
                        entity.nextKeyFrame[1] = entity.teleportDestination;
                        x = entity.teleportDestination[0];
                        y = entity.teleportDestination[1];
                        angle = entity.teleportDestination[2];
                        entity.teleportDestination = undefined;
                    }
                    else {
                        if (taro.isServer) {
                            entity.translateTo(x, y, 0);
                            entity.rotateTo(0, 0, angle);
                            // if client-authoritative csp mode is enabled, and the client msg was received within 100ms,
                            // then use the client's msg to update this unit's position
                            if (taro.game.data.defaultData.clientPhysicsEngine && ((_b = entity._stats.controls) === null || _b === void 0 ? void 0 : _b.cspMode) == 2) {
                                let clientStreamReceivedAt = entity.clientStreamedKeyFrame[0];
                                let player = entity.getOwner();
                                // player stopped sending msg. probably browsing something else. set as inactive.
                                if (player && now - clientStreamReceivedAt > 1000 && player.isTabActive) {
                                    player.isTabActive = false;
                                }
                                // client msg was received within 200ms,
                                // also ignore client msg if client just recently became active again (<2s)
                                // as the client's position isn't as reliable. for the next 3s, the client's position will be dictated by the server stream
                                if (now - clientStreamReceivedAt < 200 && now - player.tabBecameActiveAt > 1000) {
                                    let clientStreamedPosition = entity.clientStreamedKeyFrame[1];
                                    x += clientStreamedPosition[0] - x;
                                    y += clientStreamedPosition[1] - y;
                                    angle = clientStreamedPosition[2];
                                    if (!isNaN(clientStreamedPosition[3]) && !isNaN(clientStreamedPosition[4])) {
                                        entity.setLinearVelocity(clientStreamedPosition[3], clientStreamedPosition[4]);
                                    }
                                }
                            }
                        }
                        else if (taro.isClient) {
                            // client-side prediction is enabled (cspMode either 1 or 2)
                            // my unit's position and projectiles that are NOT server-streamed.
                            // this does NOT run for items
                            if ((entity == taro.client.selectedUnit && ((_c = entity._stats.controls) === null || _c === void 0 ? void 0 : _c.cspMode)) ||
                                (entity._category == 'projectile' && !entity._stats.streamMode) ||
                                (entity._category == 'unit' && entity._stats.streamMode !== 1)) {
                                // if client-authoritative mode is enabled, and tab became active within the last 3 seconds let server dictate my unit's position
                                let myUnit = taro.client.selectedUnit;
                                // If cspMode is client-authoritative and the client had inactive tab, then the unit's position should be dictated by the server
                                if (entity == myUnit) {
                                    if (((_d = entity._stats.controls) === null || _d === void 0 ? void 0 : _d.cspMode) == 2 &&
                                        now - taro.client.tabBecameActiveAt < 1000 // it hasn't passed 2 sec since the tab became active
                                    ) {
                                        x = myUnit.serverStreamedPosition.x;
                                        y = myUnit.serverStreamedPosition.y;
                                    }
                                    else if (
                                    // Server-authoritative CSP reconciliation
                                    ((_e = entity._stats.controls) === null || _e === void 0 ? void 0 : _e.cspMode) == 1 &&
                                        !entity.isTeleporting &&
                                        entity.reconRemaining &&
                                        !isNaN(entity.reconRemaining.x) &&
                                        !isNaN(entity.reconRemaining.y)) {
                                        // if the current reconcilie distance is greater than my unit's body dimention,
                                        // instantly move unit (teleport) to the last streamed position. Otherwise, gradually reconcile
                                        if (Math.abs(entity.reconRemaining.x) > entity._stats.currentBody.width * 1.5 ||
                                            Math.abs(entity.reconRemaining.y) > entity._stats.currentBody.height * 1.5) {
                                            x = myUnit.serverStreamedPosition.x;
                                            y = myUnit.serverStreamedPosition.y;
                                            entity.reconRemaining = undefined;
                                        }
                                        else {
                                            entity.reconRemaining.x /= 5;
                                            entity.reconRemaining.y /= 5;
                                            x += entity.reconRemaining.x;
                                            y += entity.reconRemaining.y;
                                        }
                                    }
                                }
                                entity.prevKeyFrame = entity.nextKeyFrame;
                                entity.nextKeyFrame = [taro._currentTime + taro.client.renderBuffer, [x, y, angle]];
                            }
                            else {
                                // update server-streamed entities' body position
                                // for items, client-side physics body is updated by setting entity.nextKeyFrame in item._behaviour()
                                x = entity.nextKeyFrame[1][0];
                                y = entity.nextKeyFrame[1][1];
                                angle = entity.nextKeyFrame[1][2];
                            }
                            if (entity.prevKeyFrame &&
                                entity.nextKeyFrame &&
                                entity.prevKeyFrame[1] &&
                                entity.nextKeyFrame[1] &&
                                (parseFloat(entity.prevKeyFrame[1][0]).toFixed(1) != parseFloat(entity.nextKeyFrame[1][0]).toFixed(1) ||
                                    parseFloat(entity.prevKeyFrame[1][1]).toFixed(1) !=
                                        parseFloat(entity.nextKeyFrame[1][1]).toFixed(1) ||
                                    parseFloat(entity.prevKeyFrame[1][2]).toFixed(2) != parseFloat(entity.nextKeyFrame[1][2]).toFixed(2))) {
                                entity.isTransforming(true);
                            }
                        }
                        // keep track of units' position history for CSP reconciliation
                        if (entity._category == 'unit' &&
                            ((taro.isClient && entity == taro.client.selectedUnit) ||
                                (taro.isServer && ((_f = entity._stats.controls) === null || _f === void 0 ? void 0 : _f.cspMode) == 2))) {
                            entity.posHistory.push([taro._currentTime, [x, y, angle]]);
                            if (entity.posHistory.length > taro._physicsTickRate) {
                                entity.posHistory.shift();
                            }
                        }
                    }
                    if (!isNaN(x) && !isNaN(y)) {
                        entity.translateToLT(x, y);
                        entity.rotateToLT(angle);
                    }
                }
            }
        });
        this._world.timestep = timeElapsedSinceLastStep / 1000;
        this._world.step(this.eventQueue);
        this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            var _a, _b, _c, _d, _e, _f;
            const entityA = (_c = (_b = (_a = this._world.getCollider(handle1)) === null || _a === void 0 ? void 0 : _a.parent()) === null || _b === void 0 ? void 0 : _b.userData) === null || _c === void 0 ? void 0 : _c.entity;
            const entityB = (_f = (_e = (_d = this._world.getCollider(handle2)) === null || _d === void 0 ? void 0 : _d.parent()) === null || _e === void 0 ? void 0 : _e.userData) === null || _f === void 0 ? void 0 : _f.entity;
            if (!entityA || !entityB)
                return;
            for (const callback of this._collisionEventListeners) {
                callback(entityA, entityB, started);
            }
        });
        for (let [_, body] of this.bodies) {
            body.resetForces(true);
            body.resetTorques(true);
        }
    },
    gravitic: function (entity, toggle) {
        if (entity._category === 'sensor') {
            return;
        }
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return;
        body.setGravityScale(!toggle ? 0 : 1, true);
    },
    applyForce: function (entity, x, y) {
        if (entity._category === 'sensor') {
            return;
        }
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return;
        body.addForce({ x, y }, true);
    },
    applyImpulse: function (entity, x, y) {
        if (entity._category === 'sensor') {
            return;
        }
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return;
        body.applyImpulse({ x, y }, true);
    },
    applyTorque: function (entity, torque) {
        if (entity._category === 'sensor') {
            return;
        }
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return;
        body.addTorque(torque, true);
    },
    translateTo: function (entity, x, y) {
        if (entity._category === 'sensor') {
            return;
        }
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return;
        body.setTranslation({ x, y }, true);
    },
    rotateTo: function (entity, angle) {
        if (entity._category === 'sensor') {
            return;
        }
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return;
        body.setRotation(angle, true);
    },
    setLinearVelocity: function (entity, x, y) {
        if (entity._category === 'sensor') {
            return;
        }
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return;
        body.setLinvel({ x, y });
    },
    getLinearVelocity: function (entity) {
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return { x: 0, y: 0 };
        const velocity = body.linvel();
        return {
            x: velocity.x,
            y: velocity.y,
        };
    },
    getPosition: function (entity) {
        const body = this.bodies.get(entity === null || entity === void 0 ? void 0 : entity.id());
        if (!body)
            return { x: 0, y: 0 };
        const position = body.translation();
        return {
            x: position.x,
            y: position.y,
        };
    },
    isLocked: function () {
        return false;
    },
    getBodyCount: function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this === null || this === void 0 ? void 0 : this._world) === null || _a === void 0 ? void 0 : _a.bodies) === null || _b === void 0 ? void 0 : _b.len()) !== null && _c !== void 0 ? _c : 0;
    },
    getContactCount: function () {
        return 0;
    },
    getScaleRatio: function () {
        return this._scaleRatio;
    },
    raycastLine(start, end) {
        let intersectingEntities = [];
        let dir = { x: end.x - start.x, y: end.y - start.y };
        let length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        dir.x /= length;
        dir.y /= length;
        let ray = new RAPIER2D.Ray({ x: start.x, y: start.y }, { x: dir.x, y: dir.y });
        let solid = true;
        this._world.intersectionsWithRay(ray, length, solid, (intersect) => {
            var _a, _b;
            const entity = (_b = (_a = intersect.collider.parent()) === null || _a === void 0 ? void 0 : _a.userData) === null || _b === void 0 ? void 0 : _b.entity;
            if (!entity)
                return true;
            intersectingEntities.push(entity);
            return true; // Return `false` instead if we want to stop searching for other hits.
        }, null, (0b1111111111111111 << 16) + (CollisionGroups.Wall | CollisionGroups.Unit));
        taro.game.entitiesCollidingWithLastRaycast = intersectingEntities;
    },
    raycastBullet(start, end, ignoredEntity) {
        let dir = { x: end.x - start.x, y: end.y - start.y };
        let length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        dir.x /= length;
        dir.y /= length;
        let ray = new RAPIER2D.Ray({ x: start.x, y: start.y }, { x: dir.x, y: dir.y });
        let solid = true;
        let intersections = [];
        this._world.intersectionsWithRay(ray, length, solid, (intersect) => {
            var _a, _b;
            const entity = (_b = (_a = intersect.collider.parent()) === null || _a === void 0 ? void 0 : _a.userData) === null || _b === void 0 ? void 0 : _b.entity;
            if (!entity || (ignoredEntity && entity.id() === ignoredEntity.id()))
                return true;
            intersections.push({ entity, intersect });
            return false; // Return `false` instead if we want to stop searching for other hits.
        }, null, (0b1111111111111111 << 16) + (CollisionGroups.Wall | CollisionGroups.Unit));
        taro.game.entitiesCollidingWithLastRaycast = intersections.map((x) => x.entity);
        return {
            start,
            point: intersections.length ? intersections[0].intersect.point : end,
            fraction: intersections.length ? intersections[0].intersect.toi / length : 1,
            obstructed: (intersections.length ? intersections[0].intersect.toi / length : false) < 0.01,
        };
    },
    getDebugRenderData: function () {
        return this._world.debugRender();
    },
});
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Rapier2dComponent;
}
//# sourceMappingURL=Rapier2dComponent.js.map