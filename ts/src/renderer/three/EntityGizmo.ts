namespace Renderer {
	export namespace Three {
		export class EntityGizmo {
			currentCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
			control: TransformControls;
			dimension: '2d' | '3d' = '3d';
			prevRotation: number;
			undoAction: Record<string, any> = {};
			constructor() {
				this.init();
			}

			generateEditedAction(e: any) {
				const renderer = Three.instance();
				const centerPos = renderer.entityEditor.selectedEntitiesMinMaxCenterPos.center;
				const control = this.control;
				const editedEntity = e;
				let editedAction = {};
				if (editedEntity instanceof Region) {
					editedAction = { name: editedEntity.taroEntity._stats.id };
				} else if (editedEntity instanceof InitEntity) {
					editedAction = { actionId: editedEntity.action.actionId };
				}
				switch (control.mode) {
					case 'translate':
						if (taro.is3D()) {
							editedAction['position'] = {
								x: Renderer.Three.Utils.worldToPixel(control.object.position.x + (e.parent.tag === Three.EntityEditor.TAG ? e.position.x : 0)),
								y: Renderer.Three.Utils.worldToPixel(control.object.position.z + (e.parent.tag === Three.EntityEditor.TAG ? e.position.z : 0)),
								z: Renderer.Three.Utils.worldToPixel(control.object.position.y + (e.parent.tag === Three.EntityEditor.TAG ? e.position.y : 0)),
								function: 'vector3',
							};
						} else {
							editedAction['position'] = {
								x: Renderer.Three.Utils.worldToPixel(control.object.position.x),
								y: Renderer.Three.Utils.worldToPixel(control.object.position.z),
								function: 'xyCoordinate',
							};
						}
						break;
					case 'rotate':
						control.object.rotation.order = 'YXZ';
						if (taro.is3D()) {
							const headingX = control.object.rotation.x + (e.parent.tag === Three.EntityEditor.TAG ? e.rotation.x : 0);
							const headingY = control.object.rotation.y + (e.parent.tag === Three.EntityEditor.TAG ? e.rotation.y : 0);
							const headingZ = control.object.rotation.z + (e.parent.tag === Three.EntityEditor.TAG ? e.rotation.z : 0);
							const radiansX = headingX > 0 ? headingX : 2 * Math.PI + headingX;
							const radiansY = headingY > 0 ? headingY : 2 * Math.PI + headingY;
							const radiansZ = headingZ > 0 ? headingZ : 2 * Math.PI + headingZ;
							const degreesX = THREE.MathUtils.radToDeg(radiansX);
							const degreesY = THREE.MathUtils.radToDeg(radiansY);
							const degreesZ = THREE.MathUtils.radToDeg(radiansZ);
							editedAction['rotation'] = {
								x: degreesX,
								y: degreesY,
								z: degreesZ,
								function: 'vector3',
							};
						} else {
							const heading = control.object.rotation.y;
							const radians = heading > 0 ? heading : 2 * Math.PI + heading;
							const degrees = THREE.MathUtils.radToDeg(radians);
							editedAction['angle'] = degrees;
						}
						break;
					case 'scale':
						if (taro.is3D()) {
							if (control.object.body instanceof AnimatedSprite) {
								editedAction['scale'] = {
									x: control.object.scale.x * (e.parent.tag === Three.EntityEditor.TAG ? e.scale.x : 1),
									y: control.object.scale.z * (e.parent.tag === Three.EntityEditor.TAG ? e.scale.z : 1),
									z: 0,
									function: 'vector3',
								};
							} else if (control.object.body instanceof Model) {
								editedAction['scale'] = {
									x: Utils.worldToPixel(control.object.body.getSize().x / control.object.defaultWidth),
									y: Utils.worldToPixel(control.object.body.getSize().z / control.object.defaultHeight),
									z: Utils.worldToPixel(control.object.body.getSize().y / control.object.defaultDepth),
									function: 'vector3',
								};
							}
						} else {
							editedAction['width'] = Utils.worldToPixel(control.object.scale.x);
							editedAction['height'] = Utils.worldToPixel(control.object.scale.z);
						}
						break;
				}
				if (editedAction && e instanceof Region) {
					editedAction['position'] = {
						x: Renderer.Three.Utils.worldToPixel(control.object.position.x),
						y: Renderer.Three.Utils.worldToPixel(control.object.position.z),
						function: 'xyCoordinate',
					};
					editedAction['width'] = Utils.worldToPixel(control.object.scale.x);
					editedAction['height'] = Utils.worldToPixel(control.object.scale.z);
					if (editedAction['position']) {
						editedAction['position'].x -= Utils.worldToPixel(control.object.scale.x) / 2;
						editedAction['position'].y -= Utils.worldToPixel(control.object.scale.z) / 2;
						editedAction['position'].z -= Utils.worldToPixel(control.object.scale.y) / 2;
					}
				}
				return editedAction;
			}

			init() {
				const renderer = Three.instance();
				const currentCamera = (this.currentCamera = renderer.camera.instance);
				const orbit = renderer.camera.controls;
				const control = (this.control = new TransformControls(currentCamera, renderer.renderer.domElement));
				control.matrixAutoUpdate = false;
				this.undoAction = {};
				control.addEventListener(
					'nonePosition-changed',
					function (event) {
						if ((control.object as any)?.tag === Three.EntityEditor.TAG) {
							control.object.children.forEach((e: THREE.Object3D) => {
								// FIXME: handle the rotation and scale
								// e.rotation.z += control.object.rotation.z
							})
							control.object.rotation.set(0, 0, 0);
							control.object.scale.set(1, 1, 1);
							control.reset();
						}
					}
				)
				control.addEventListener(
					'dragging-changed',
					function (event) {
						if (event.value) {
							this.prevRotation = control.object.rotation.y;
							this.prevSelectedGroupPosition = renderer.entityEditor.selectedGroup.position.clone();
						}
						orbit.enabled = !event.value;
						if (!event.value) {
							// drag ended
							const uuid = taro.newIdHex();
							renderer.entityEditor.selectedEntities.forEach((e, idx) => {
								const editedAction = this.generateEditedAction(e);
								if (editedAction && e instanceof InitEntity) {
									const nowUndoAction = JSON.parse(JSON.stringify(this.undoAction[idx]));
									const nowEntity = e;
									const nowSelectedGroupPosition = renderer.entityEditor.selectedGroup.position.clone();
									const prevSelectedGroupPosition = this.prevSelectedGroupPosition.clone();
									renderer.voxelEditor.commandController.addCommand(
										{
											func: () => {
												renderer.entityEditor.selectedGroup.position.copy(nowSelectedGroupPosition);
												(nowEntity as InitEntity).edit(editedAction, (e.parent as any)?.tag === Three.EntityEditor.TAG ? e.parent.position.clone().multiplyScalar(-1) : undefined);
											},
											undo: () => {
												renderer.entityEditor.selectedGroup.position.copy(prevSelectedGroupPosition);
												(nowEntity as InitEntity).edit(nowUndoAction, (e.parent as any)?.tag === Three.EntityEditor.TAG ? e.parent.position.clone().multiplyScalar(-1) : undefined);
											},
											mergedUuid: uuid,
										},
										true,
										true
									);


									this.undoAction[idx] = undefined;
								} else if (editedAction && e instanceof Region) {
									const nowUndoAction = JSON.parse(JSON.stringify(this.undoAction[idx]));

									renderer.voxelEditor.commandController.addCommand(
										{
											func: () => {
												inGameEditor.updateRegionInReact && !window.isStandalone;
												inGameEditor.updateRegionInReact(editedAction as RegionData, 'threejs');
											},
											undo: () => {
												inGameEditor.updateRegionInReact && !window.isStandalone;
												inGameEditor.updateRegionInReact(nowUndoAction as RegionData, 'threejs');
											},
											mergedUuid: uuid,
										},
										true,
										true
									);

									this.undoAction = [];
								}
							})

						} else {
							if (this.undoAction === undefined) {
								this.undoAction = [];
							}
							renderer.entityEditor.selectedEntities.forEach((e, idx) => {
								if (this.undoAction[idx] === undefined) {
									this.undoAction[idx] = this.generateEditedAction(e);
								}
							})

						}
					}.bind(this)
				);

				renderer.scene.add(control);

				taro.client.on('gizmo-mode', (mode: 'translate' | 'rotate' | 'scale') => {
					const initEntity: InitEntity = control.object;
					if (initEntity?.isBillboard && mode === 'rotate') {
						return;
					}
					control.setMode(mode);
					this.updateForDimension();
				});

				window.addEventListener('keyup', function (event) {
					switch (event.key) {
						case 'Shift':
							control.setTranslationSnap(null);
							control.setRotationSnap(null);
							control.setScaleSnap(null);
							break;
					}
				});
			}

			attach(entity: THREE.Object3D) {
				if (entity instanceof AnimatedSprite) {
					this.dimension = '2d';
					this.updateForDimension();
				} else {
					this.dimension = '3d';
					this.updateForDimension();
				}
				this.control.attach(entity);
			}

			updateForDimension() {
				const control = this.control;
				if (this.dimension === '2d') {
					switch (control.mode) {
						case 'translate':
							control.showX = true;
							control.showY = false;
							control.showZ = true;
							break;
						case 'rotate':
							control.showX = false;
							control.showY = true;
							control.showZ = false;
							break;
						case 'scale':
							control.showX = true;
							control.showY = false;
							control.showZ = true;
							break;
					}
				} else {
					control.showX = true;
					control.showY = true;
					control.showZ = true;
				}
			}
		}
	}
}
