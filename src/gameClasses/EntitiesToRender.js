var EntitiesToRender = /** @class */ (function () {
    function EntitiesToRender() {
        this.trackEntityById = {};
        taro.client.on('tick', this.frameTick, this);
    }
    EntitiesToRender.prototype.updateAllEntities = function ( /*timeStamp*/) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        for (var entityId in this.trackEntityById) {
            // var timeStart = performance.now();
            // var entity = taro.$(entityId);	
            var entity = this.trackEntityById[entityId];
            // taro.profiler.logTimeElapsed('findEntity', timeStart);
            if (entity) {
                // handle entity behaviour and transformation offsets
                // var timeStart = performance.now();
                var phaserEntity = (_a = entity.phaserEntity) === null || _a === void 0 ? void 0 : _a.gameObject;
                if (taro.gameLoopTickHasExecuted) {
                    if (entity._deathTime !== undefined && entity._deathTime <= taro._tickStart) {
                        // Check if the deathCallBack was set
                        if (entity._deathCallBack) {
                            entity._deathCallBack.apply(entity);
                            delete entity._deathCallBack;
                        }
                        entity.destroy();
                    }
                    entity._behaviour();
                }
                var ownerUnit = undefined;
                if (entity._category == 'item') {
                    ownerUnit = entity.getOwnerUnit();
                }
                if (entity.isTransforming()) {
                    // update transformation using incoming network stream
                    // var timeStart = performance.now();
                    entity._processTransform();
                }
                if (entity._translate) {
                    var x = entity._translate.x;
                    var y = entity._translate.y;
                    var rotate = entity._rotate.z;
                }
                // transform unit-owned item
                if ((_c = (_b = ownerUnit === null || ownerUnit === void 0 ? void 0 : ownerUnit.phaserEntity) === null || _b === void 0 ? void 0 : _b.gameObject) === null || _c === void 0 ? void 0 : _c.visible) {
                    // var timeStart = performance.now();
                    // rotate weldjoint items to the owner unit's rotation
                    if (entity._stats.currentBody && entity._stats.currentBody.jointType == 'weldJoint') {
                        rotate = ownerUnit._rotate.z;
                        // immediately rotate my unit's items to the angleToTarget
                    }
                    else if (ownerUnit == taro.client.selectedUnit && ((_e = (_d = entity._stats.controls) === null || _d === void 0 ? void 0 : _d.mouseBehaviour) === null || _e === void 0 ? void 0 : _e.rotateToFaceMouseCursor)) {
                        rotate = ownerUnit.angleToTarget; // angleToTarget is updated at 60fps								
                    }
                    entity._rotate.z = rotate; // update the item's rotation immediately for more accurate aiming (instead of 20fps)
                    entity.anchoredOffset = entity.getAnchoredOffset(rotate);
                    if (entity.anchoredOffset) {
                        x = ownerUnit._translate.x + entity.anchoredOffset.x;
                        y = ownerUnit._translate.y + entity.anchoredOffset.y;
                        rotate = entity.anchoredOffset.rotate;
                    }
                    // taro.profiler.logTimeElapsed('second _processTransform', timeStart);
                }
                if (((_f = entity.tween) === null || _f === void 0 ? void 0 : _f.isTweening) && (phaserEntity === null || phaserEntity === void 0 ? void 0 : phaserEntity.visible)) {
                    entity.tween.update();
                    x += entity.tween.offset.x;
                    y += entity.tween.offset.y;
                    rotate += entity.tween.offset.rotate;
                }
                if (((_g = entity.tween) === null || _g === void 0 ? void 0 : _g.isTweening) ||
                    entity.isTransforming() ||
                    entity == taro.client.selectedUnit ||
                    ((_j = (_h = ownerUnit === null || ownerUnit === void 0 ? void 0 : ownerUnit.phaserEntity) === null || _h === void 0 ? void 0 : _h.gameObject) === null || _j === void 0 ? void 0 : _j.visible)) {
                    // var timeStart = performance.now();
                    entity.transformTexture(x, y, rotate);
                    // taro.profiler.logTimeElapsed('transformTexture', timeStart);
                }
            }
        }
        // taro.triggersQueued = [];
        if (taro.gameLoopTickHasExecuted) {
            taro.gameLoopTickHasExecuted = false;
        }
    };
    EntitiesToRender.prototype.frameTick = function () {
        taro.engineStep(Date.now(), 1000 / 60);
        taro.input.processInputOnEveryFps();
        taro._renderFrames++;
        this.updateAllEntities();
    };
    return EntitiesToRender;
}());
//# sourceMappingURL=EntitiesToRender.js.map