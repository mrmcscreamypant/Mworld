/// <reference types="@types/google.analytics" />

const dummy = new THREE.Object3D();

namespace Renderer {
	export enum Mode {
		Play,
		Map,
		Entities,
	}

	export namespace Three {
		export function instance() {
			return Renderer.instance();
		}

		export function reset(rendererOptions) {
			return Renderer.reset(rendererOptions);
		}

		export function getPointer() {
			return Renderer.getPointer();
		}

		export function getVoxels() {
			return Renderer.getVoxels();
		}

		export function getEntitiesLayer() {
			return Renderer.getEntitiesLayer();
		}

		export function getTileSize() {
			return taro.game.data.defaultData.dontResize
				? { x: taro.game.data.map.tilewidth, y: taro.game.data.map.tileheight }
				: { x: 64, y: 64 };
		}

		class Renderer {
			private static _instance: Renderer;

			renderer: THREE.WebGLRenderer;
			effectComposer: any;
			camera: Camera;
			outlinePass: any;
			scene: THREE.Scene;
			mode = Mode.Play;
			selectionBox: SelectionBox;
			selectionHelper: SelectionHelper;
			frustum = new THREE.Frustum();
			cameraViewProjectionMatrix = new THREE.Matrix4();
			entitiesNeedsUpdate: (Unit | Item)[] = [];
			touchActive: boolean;

			tryFindMesh(object: THREE.Object3D) {
				const meshes: THREE.Mesh[] = [];
				object.children.forEach((child: any) => {
					if (child.isMesh) {
						meshes.push(child);
					}
					if (child.children) {
						meshes.push(...this.tryFindMesh(child));
					}
				});
				return meshes;
			}

			updateFrustumCulling() {
				const zeroVec3 = new THREE.Vector3(0, 0, 0);
				this.entitiesNeedsUpdate = [];
				[this.entityManager.units, this.entityManager.items, this.entityManager.projectiles].forEach((entities) => {
					entities.forEach((object: Unit | Item) => {
						const entity: TaroEntityPhysics = object.taroEntity;
						if (!object.body) {
							return;
						}
						if (!(object.body as Sprite).sprite) {
							const meshes = this.tryFindMesh(object);
							let posNotInViewport = !this.frustum.containsPoint(object.position);
							let noChildrenInViewport = true;
							if (posNotInViewport) {
								meshes.forEach((mesh) => {
									if (this.frustum.intersectsObject(mesh)) {
										noChildrenInViewport = false;
									}
								});
							}
							entity.culled = posNotInViewport && noChildrenInViewport;
							if (!entity.culled && !entity._stats.instancedMesh) {
								this.entitiesNeedsUpdate.push(object);
							} else {
								object.matrixWorldAutoUpdate = false;
							}
						} else {
							if (entity && object.body && (object.body as Sprite).sprite?.isMesh) {
								const pos = object.position.clone();
								pos.setY(this.initEntityLayer.position.y + 1 + object.position.y);
								if (
									!this.frustum.containsPoint(pos) &&
									!this.frustum.intersectsObject((object.body as Sprite)?.sprite) &&
									(object as THREE.Object3D).position.distanceTo(zeroVec3) !== 0
								) {
									entity.culled = true;
									object.matrixWorldAutoUpdate = false;
								} else {
									if (!entity._stats.instancedMesh) {
										this.entitiesNeedsUpdate.push(object);
									}
									entity.culled = false;
								}
							}
						}
						(object as Unit).showHud?.(!entity.culled);
					});
				});
			}

			voxels: Voxels;
			projectilPool: InstancedMeshPool;
			private clock = new THREE.Clock();
			private pointer = new THREE.Vector2();
			private secondaryPointer = new THREE.Vector2();
			private initLoadingManager = new THREE.LoadingManager();

			public entityManager = new EntityManager();
			private entitiesLayer = new THREE.Group();
			private regionsLayer = new THREE.Group();
			public initEntityLayer = new THREE.Group();

			private particleSystem: ParticleSystem;
			private environment: Environment;

			private raycastIntervalSeconds = 0.1;
			private timeSinceLastRaycast = 0;

			// TODO: decouple this to the voxelEditor
			public tmp_tileId = 7;
			public voxelEditor: VoxelEditor;
			public entityEditor: EntityEditor;
			private showRepublishWarning: boolean;

			private regionDrawStart: { x: number; y: number } = { x: 0, y: 0 };

			// Debug
			private raycastHelpers = new Map<string, THREE.ArrowHelper>();

			private constructor(rendererOptions?: { canvas: HTMLCanvasElement }) {
				// For JS interop; in case someone uses new Renderer.ThreeRenderer()
				if (!Renderer._instance) {
					Renderer._instance = this;
				} else {
					return Renderer._instance;
				}
				const { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } = window.MeshBVHLib;

				//@ts-ignore
				THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
				//@ts-ignore
				THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
				THREE.Mesh.prototype.raycast = acceleratedRaycast;
				const renderer = new THREE.WebGLRenderer(rendererOptions);
				renderer.setSize(window.innerWidth, window.innerHeight);
				document.querySelector('#game-div')?.appendChild(renderer.domElement);
				this.renderer = renderer;
				const composer = new EffectComposer(renderer);
				this.effectComposer = composer;
				this.scene = new THREE.Scene();
				this.scene.background = new THREE.Color(taro.game.data.defaultData.mapBackgroundColor);

				this.camera = new Camera(window.innerWidth, window.innerHeight, this.renderer.domElement);
				this.camera.setElevationAngle(taro.game.data.settings.camera.defaultPitch);
				if (taro.game.data.settings.camera.projectionMode !== 'orthographic') {
					this.camera.setProjection(taro.game.data.settings.camera.projectionMode);
				}

				this.selectionBox = new SelectionBox(this.camera.instance, this.scene);
				this.selectionHelper = new SelectionHelper(this.renderer, 'selectBox');
				window.addEventListener('resize', () => {
					this.camera.resize(window.innerWidth, window.innerHeight);
					renderer.setSize(window.innerWidth, window.innerHeight);
					this.effectComposer.setSize(window.innerWidth, window.innerHeight);
					renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
					renderer.render(this.scene, this.camera.instance);
					this.effectComposer.render();
					taro.client.emit('scale', { ratio: this.camera.zoom });
					taro.client.emit('update-abilities-position');
					this.entityManager.scaleGui(1 / this.camera.zoom);
				});

				this.forceLoadUnusedCSSFonts();

				this.initLoadingManager.onLoad = () => {
					this.init();
					taro.input.setupListeners(this.renderer.domElement);
					taro.client.rendererLoaded.resolve();

					window.lastRequestAnimationFrameId = requestAnimationFrame(this.render.bind(this));
				};

				const isPixelArt = taro.game.data.defaultData.renderingFilter === 'pixelArt';
				gAssetManager.setFilter(isPixelArt ? THREE.NearestFilter : THREE.LinearFilter);

				this.loadAssets();

				taro.client.on('enterPlayTab', () => {
					this.mode = Mode.Play;
					this.onEnterPlayMode();
				});

				taro.client.on('leavePlayTab', () => {
					this.onExitPlayMode();
				});

				taro.client.on('enterMapTab', () => {
					this.mode = Mode.Map;
					this.onEnterMapMode();
				});

				taro.client.on('leaveMapTab', () => {
					this.onExitMapMode();
				});

				taro.client.on('enterEntitiesTab', () => {
					this.mode = Mode.Entities;
					this.onEnterEntitiesMode();
				});

				taro.client.on('leaveEntitiesTab', () => {
					this.onExitEntitiesMode();
				});

				taro.client.on('update-region-name', (data: { name: string; newName: string }) => {
					const region = this.entityManager.entities.find((e) => e instanceof Region && e.name === data.name) as Region;
					if (region) {
						region.name = data.newName;
						region.updateLabel(data.newName);
					}
				});

				composer.addPass(new RenderPass(this.scene, this.camera.instance));
				composer.addPass(new ShaderPass(GammaCorrectionShader));
				const outlinePass = new OutlinePass(
					new THREE.Vector2(window.innerWidth, window.innerHeight),
					this.scene,
					this.camera.instance
				);
				this.outlinePass = outlinePass;
				composer.addPass(outlinePass);
			}

			private addEventListener() {
				let line: THREE.LineSegments;
				let width: number;
				let height: number;
				let rightClickPos: { x: number; y: number } = undefined;

				let lastTime = 0;
				const renderer = this.renderer;
				renderer.domElement.addEventListener('mousemove', (event: MouseEvent) => {
					if (event.button === 1) {
						return;
					}
					if (this.mode === Mode.Map) {
						if (this.entityEditor.gizmo.control.dragging) {
							this.selectionBox.enabled = false;
							return;
						}
						switch (taro.developerMode.activeButton) {
							case 'cursor': {
								if (this.selectionHelper.isDown) {
									this.selectionHelper.onPointerMove(event);
									this.selectionBox.endPoint.set(
										(event.clientX / window.innerWidth) * 2 - 1,
										-(event.clientY / window.innerHeight) * 2 + 1,
										0.5
									);
									const allSelected = this.selectionBox.select();

									if (allSelected) {
										const filteredSelected: (THREE.Object3D & { entity?: InitEntity })[] = [];
										allSelected.forEach((e: THREE.Object3D & { entity?: InitEntity }) => {
											if (e.entity) {
												filteredSelected.push(e);
											} else if (e.parent) {
												const findObj = Utils.tryFindInitEntity(e.parent);
												if (findObj) {
													filteredSelected.push(findObj);
												}
											}
										});

										if (filteredSelected.length > 0) {
											if (filteredSelected.length > 1) {
												for (let e of filteredSelected) {
													if (e.entity instanceof InitEntity) {
														if (!this.entityEditor.selectedEntities.includes(e.entity)) {
															this.entityEditor.selectEntity(e.entity, 'add');
														}
													} else if (e instanceof InitEntity) {
														{
															if (!this.entityEditor.selectedEntities.includes(e)) {
																this.entityEditor.selectEntity(e, 'add');
															}
														}
													}
												}
											} else {
												this.entityEditor.selectEntity(filteredSelected[0].entity, 'select');
											}
										} else {
											this.entityEditor.selectEntity(null);
										}
									}
								}
								break;
							}
							case 'fill': {
							}
							case 'eraser': {
							}
							case 'brush': {
								this.voxelEditor.handleMapToolEdit();
							}
						}
					}
					this.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
					if (!Utils.isLeftButton(event.buttons)) return;
					if (taro.developerMode.regionTool) {
						const worldPoint = this.camera.getWorldPoint(this.pointer);
						width = worldPoint.x - this.regionDrawStart.x;
						height = worldPoint.z - this.regionDrawStart.y;
						line?.position.set(this.regionDrawStart.x + width / 2, 2, this.regionDrawStart.y + height / 2);
						line?.scale.set(width, 1, height);
					}
				});

				renderer.domElement.addEventListener('mousedown', (event: MouseEvent) => {
					if (event.button === 1) {
						return;
					}
					if (this.mode === Mode.Map) {
						const developerMode = taro.developerMode;
						if (developerMode.activeButton !== 'cursor') {
							this.selectionBox.enabled = false;
						} else {
							this.selectionBox.enabled = true;
							this.selectionHelper.onPointerDown(event);
						}
						if (developerMode.regionTool) {
							const worldPoint = this.camera.getWorldPoint(this.pointer);
							this.regionDrawStart = {
								x: worldPoint.x,
								y: worldPoint.z,
							};

							const geometry = new THREE.BoxGeometry(1, 3, 1);
							const edges = new THREE.EdgesGeometry(geometry);
							line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x036ffc }));
							line.position.set(this.regionDrawStart.x + width / 2, 2, this.regionDrawStart.y + height / 2);
							line.scale.set(width, 1, height);
							line.visible = true;
							this.scene.add(line);
						} else if (developerMode.active && developerMode.activeTab === 'map') {
							if (Utils.isLeftButton(event.buttons)) {
								this.voxelEditor.leftButtonDown = true;
								//double click
								let clickDelay = taro._currentTime - lastTime;
								lastTime = taro._currentTime;
								switch (developerMode.activeButton) {
									case 'cursor': {
										if (this.entityEditor.gizmo.control.dragging) {
											return;
										}

										this.selectionBox.enabled = true;
										this.selectionBox.startPoint.set(
											(event.clientX / window.innerWidth) * 2 - 1,
											-(event.clientY / window.innerHeight) * 2 + 1,
											0.5
										);
										const raycaster = new THREE.Raycaster();
										raycaster.setFromCamera(this.pointer, this.camera.instance);

										let intersects = raycaster.intersectObjects(this.entityManager.initEntities);
										if (intersects?.length > 0) {
											const closest = intersects[0].object as THREE.Mesh;
											let initEntity = this.entityManager.initEntities.find(
												(initEntity) => (initEntity.body as AnimatedSprite).sprite === closest
											);
											if (!initEntity) {
												let parent = intersects[0].object.parent as any;
												while (!parent.entity) {
													parent = parent.parent;
												}
												initEntity = (parent as Renderer.Three.Model & { entity: InitEntity }).entity;
											}
											if (initEntity) {
												this.entityEditor.selectEntity(initEntity, event.ctrlKey ? 'addOrRemove' : 'select');
												taro.client.emit(
													'block-scale',
													!(initEntity.action.scale || initEntity.action.height || initEntity.action.width)
												);

												taro.client.emit('block-rotation', !!initEntity.isBillboard);
											} else if (clickDelay < 350) {
												if (inGameEditor && inGameEditor.showScriptForEntity) {
													inGameEditor.showScriptForEntity(initEntity.action.actionId);
												}
											}
										} else {
											if (!this.entityEditor.gizmo.control.dragging) {
												this.entityEditor.selectEntity(null);
												intersects = raycaster.intersectObjects(this.entityManager.entities);
												if (intersects?.length > 0) {
													let closest: THREE.Mesh;
													let clickedList: THREE.Mesh[] = [];
													for (const intersect of intersects) {
														if ((intersect.object as THREE.Mesh).isMesh) {
															closest = intersect.object as THREE.Mesh;
															clickedList.push(closest);
														}
													}
													let regionList: RegionData[] = [];
													clickedList.forEach((clicked) => {
														const region = this.entityManager.regions.find((e) => e.mesh === clicked);
														if (region) {
															regionList.push({
																name: region.taroEntity._stats.id,
																x: region.stats.x,
																y: region.stats.y,
																z: region.stats.z,
																width: region.stats.width,
																height: region.stats.height,
																depth: region.stats.depth,
																alpha: region.stats.alpha,
																inside: region.stats.inside,
															});
														}
													});
													if (regionList.length === 1) {
														if (clickDelay < 350) {
															inGameEditor.addNewRegion && inGameEditor.addNewRegion(regionList[0]);
														}
														const clickedRegionMesh = clickedList[0] as THREE.Mesh & { region: Region };
														this.entityEditor.selectEntity(clickedRegionMesh.region);
														taro.client.emit('block-rotation', true);
													} else if (regionList.length > 1) {
														if (clickDelay < 350) {
															inGameEditor.showRegionList && inGameEditor.showRegionList(regionList);
														}
													}
												}
											} else if (clickDelay < 350) {
												const region = this.entityEditor.getLastSelectedEntity() as Region;
												const regionData = {
													name: region.taroEntity._stats.id,
													x: region.stats.x,
													y: region.stats.y,
													z: region.stats.z,
													width: region.stats.width,
													height: region.stats.height,
													depth: region.stats.depth,
													alpha: region.stats.alpha,
													inside: region.stats.inside,
												} as RegionData;

												inGameEditor.addNewRegion && inGameEditor.addNewRegion(regionData);
											}
										}

										break;
									}
									case 'eraser': {
									}
									case 'fill': {
									}
									case 'brush': {
										this.voxelEditor.handleMapToolEdit();
										break;
									}
									case 'add-entities': {
										let uuid = taro.newIdHex();
										this.entityEditor.activeEntity.forEach((entityData) => {
											if (entityData) {
												const worldPoint = this.raycastFloor(0);
												const entity =
													taro.game.data[entityData.entityType] && taro.game.data[entityData.entityType][entityData.id];
												let actionType: string;
												let height: number;
												let width: number;
												if (entityData.entityType === 'unitTypes') {
													actionType = 'createEntityForPlayerAtPositionWithDimensions';
													if (entity.bodies?.default) {
														height = entity.bodies.default.height;
														width = entity.bodies.default.width;
													} else {
														console.log('no default body for unit', entityData.id);
														return;
													}
												} else if (entityData.entityType === 'itemTypes') {
													actionType = 'createEntityAtPositionWithDimensions';
													if (entity.bodies?.dropped) {
														height = entity.bodies.dropped.height;
														width = entity.bodies.dropped.width;
													} else {
														console.log('no dropped body for item', entityData.id);
														return;
													}
												} else if (entityData.entityType === 'projectileTypes') {
													actionType = 'createEntityAtPositionWithDimensions';
													if (entity.bodies?.default) {
														height = entity.bodies.default.height;
														width = entity.bodies.default.width;
													} else {
														console.log('no default body for projectile', entityData.id);
														return;
													}
												}

												const action: ActionData = {
													type: actionType,
													entity: entityData.id,
													entityType: entityData.entityType,
													position: {
														function: 'xyCoordinate',
														x: Math.floor(Utils.worldToPixel(worldPoint.x)),
														y: Math.floor(Utils.worldToPixel(worldPoint.z)),
													},
													width: width,
													height: height,
													angle: 0,
													actionId: taro.newIdHex(),
													wasCreated: true,
												};
												if (entityData.offset) {
													action.position.x += Utils.worldToPixel(entityData.offset.x);
													action.position.z += Utils.worldToPixel(entityData.offset.y);
													action.position.y += Utils.worldToPixel(entityData.offset.z);
												}
												if (entityData.action) {
													if (entityData.action.rotation) {
														action.rotation = entityData.action.rotation;
													}
													if (entityData.action.scale) {
														action.scale = entityData.action.scale;
													}
												}
												if (entityData.entityType === 'unitTypes') {
													action.player = {
														variableName: entityData.player,
														function: 'getVariable',
													};
												}
												const nowAction = JSON.stringify(action);
												const nowActionId = action.actionId;
												this.voxelEditor.commandController.addCommand(
													{
														func: () => {
															const nowActionObj = JSON.parse(nowAction);
															taro.network.send<any>('editInitEntity', nowActionObj);
														},
														undo: () => {
															this.entityManager.initEntities
																.find((v) => v.action.actionId === nowActionId)
																?.delete(false);
														},
														mergedUuid: uuid,
													},
													true
												);
											}
										});
									}
								}
							} else if (
								Utils.isRightButton(event.buttons) &&
								(developerMode.activeButton === 'brush' || developerMode.activeButton === 'fill')
							) {
								const intersect = this.raycastFloor();
								if (!intersect) {
									return;
								}
								rightClickPos = { x: intersect.x, y: intersect.z };
							}
						}
					}

					if (
						Utils.isRightButton(event.buttons) &&
						taro.game.data.defaultData.contextMenuEnabled &&
						(!taro.developerMode.active || (taro.developerMode.active && taro.developerMode.activeTab === 'play'))
					) {
						const raycaster = new THREE.Raycaster();
						raycaster.setFromCamera(this.pointer, this.camera.instance);

						const intersects = raycaster.intersectObjects(this.entityManager.entities);
						for (const intersect of intersects) {
							const closest = intersect.object as THREE.Mesh;
							const unit = this.entityManager.units.find((unit) => {
								if (!(unit.body instanceof AnimatedSprite)) return false;
								return unit.body.sprite === closest;
							});
							if (unit) {
								const clientUnit = taro.client.selectedUnit;
								const otherUnit = taro.$(unit.taroId);

								if (clientUnit === otherUnit) {
									break;
								}

								const otherOwnerUnit = taro.$(unit.ownerId);
								if (otherOwnerUnit?._stats?.controlledBy === 'human') {
									if (typeof showUserDropdown !== 'undefined') {
										showUserDropdown({ ownerId: unit.ownerId, unitId: unit.taroId, pointer: { event } });
									}
								}

								break;
							}
						}
					}
				});

				renderer.domElement.addEventListener('mouseup', (event: MouseEvent) => {
					if (event.button === 1) {
						return;
					}
					const developerMode = taro.developerMode;
					this.voxelEditor.leftButtonDown = false;
					if (
						developerMode.active &&
						developerMode.activeTab === 'map' &&
						event.button === 0 &&
						developerMode.activeButton === 'cursor' &&
						!this.entityEditor.gizmo.control.dragging
					) {
						this.selectionBox.endPoint.set(
							(event.clientX / window.innerWidth) * 2 - 1,
							-(event.clientY / window.innerHeight) * 2 + 1,
							0.5
						);
						this.selectionHelper.onPointerUp(event);
						this.selectionBox.enabled = false;
					}
					if (developerMode.regionTool) {
						developerMode.regionTool = false;
						this.camera.controls.enablePan = true;
						this.camera.controls.enableRotate = true;
						this.camera.controls.enableZoom = true;
						line?.geometry.dispose();
						this.scene.remove(line);
						line = null;

						taro.mapEditorUI.highlightToolsButton('cursor');
						let x = this.regionDrawStart.x;
						let y = this.regionDrawStart.y;
						if (width < 0) {
							x = this.regionDrawStart.x + width;
							width *= -1;
						}
						if (height < 0) {
							y = this.regionDrawStart.y + height;
							height *= -1;
						}

						inGameEditor.addNewRegion &&
							inGameEditor.addNewRegion({
								name: '',
								x: Math.trunc(Utils.worldToPixel(x)),
								y: Math.trunc(Utils.worldToPixel(y)),
								width: Math.trunc(Utils.worldToPixel(width)),
								height: Math.trunc(Utils.worldToPixel(height)),
							});

						this.regionDrawStart = null;
					} else if (
						developerMode.active &&
						developerMode.activeTab === 'map' &&
						Utils.isRightButton(event.button) &&
						(developerMode.activeButton === 'brush' || developerMode.activeButton === 'fill')
					) {
						const intersect = this.raycastFloor();
						if (!intersect) {
							return;
						}
						const newRightClickPos = { x: intersect.x, y: intersect.z };
						if (
							rightClickPos &&
							Math.abs(newRightClickPos.x - rightClickPos.x) < 0.01 &&
							Math.abs(newRightClickPos.y - rightClickPos.y) < 0.01
						) {
							this.voxelEditor.handleMapToolCopy();
						}
						rightClickPos = undefined;
					}
				});

				renderer.domElement.addEventListener('touchstart', (event: TouchEvent) => {
					if (event.touches.length > 0) {
						this.touchActive = true;
						this.pointer.set(
							(event.touches[0].clientX / window.innerWidth) * 2 - 1,
							-(event.touches[0].clientY / window.innerHeight) * 2 + 1
						);
						this.emitPointerPosition();
					}
					if (event.touches.length > 1) {
						const secondaryTouch = event.touches[1];
						this.secondaryPointer.set(
							(secondaryTouch.clientX / window.innerWidth) * 2 - 1,
							-(secondaryTouch.clientY / window.innerHeight) * 2 + 1
						);
					}
				});

				renderer.domElement.addEventListener('touchend', (event: TouchEvent) => {
					if (event.touches.length === 0) {
						this.touchActive = false;
					} else if (!event.touches[1]) {
						this.secondaryPointer = null;
					}
				});

				renderer.domElement.addEventListener('touchmove', (event: TouchEvent) => {
					if (event.touches.length > 0) {
						this.pointer.set(
							(event.touches[0].clientX / window.innerWidth) * 2 - 1,
							-(event.touches[0].clientY / window.innerHeight) * 2 + 1
						);
					}
					if (event.touches.length > 1) {
						const secondaryTouch = event.touches[1];
						this.secondaryPointer.set(
							(secondaryTouch.clientX / window.innerWidth) * 2 - 1,
							-(secondaryTouch.clientY / window.innerHeight) * 2 + 1
						);
					}
				});
			}

			static instance() {
				if (!this._instance) {
					this._instance = new Renderer();
				}

				return this._instance;
			}

			static reset(rendererOptions) {
				// event listeners are being removed in be-next while switching the game
				// https://github.com/moddio/be-next/blob/master/src/pages/index.static-export.jsx#L173-L179

				cancelAnimationFrame(window.lastRequestAnimationFrameId);
				window.lastRequestAnimationFrameId = null;

				this._instance = null; // renderer only reinitialize if instance not available.
				this._instance = new Renderer(rendererOptions);

				return this._instance;
			}

			static getPointer() {
				return this._instance.pointer.clone();
			}

			static getVoxels() {
				return this._instance.voxels;
			}

			static getEntitiesLayer() {
				return this._instance.entitiesLayer;
			}

			tmpSetTIleId(tileId: number) {
				this.tmp_tileId = tileId;
				this.voxelEditor.voxelMarker.updatePreview(false);
			}

			raycastFloor(layer?: number): THREE.Vector3 | null {
				const raycaster = new THREE.Raycaster();
				raycaster.setFromCamera(this.pointer, this.camera.instance);
				let intersectionPoint = new THREE.Vector3();
				if (!this.voxels.layerPlanes[layer ?? this.voxelEditor.currentLayerIndex]) {
					return;
				}
				const intersect = raycaster.ray.intersectPlane(
					this.voxels.layerPlanes[layer ?? this.voxelEditor.currentLayerIndex],
					intersectionPoint
				);
				return intersect;
			}

			createInitEntity(action: ActionData): void {
				if (
					!action.disabled &&
					((action.position?.function === 'xyCoordinate' && !isNaN(action.position?.x) && !isNaN(action.position?.y)) ||
						(action.position?.function === 'vector3' &&
							!isNaN(action.position?.x) &&
							!isNaN(action.position?.y) &&
							!isNaN(action.position?.z)))
				) {
					if (
						action.type === 'createEntityForPlayerAtPositionWithDimensions' ||
						action.type === 'createEntityAtPositionWithDimensions' /*&&
							!isNaN(action.width) &&
							!isNaN(action.height) &&
							!isNaN(action.angle)*/
					) {
						if (action.actionId && !action.wasDeleted) new InitEntity(action);
						else {
							this.showRepublishWarning = true;
						}
					} else if (action.type === 'createUnitAtPosition' && !isNaN(action.angle)) {
						if (action.actionId && !action.wasDeleted) new InitEntity(action, 'unit');
						else {
							this.showRepublishWarning = true;
						}
					} else if (
						action.type === 'createUnitForPlayerAtPosition' /* &&
						!isNaN(action.angle) &&
						!isNaN(action.width) &&
						!isNaN(action.height)*/
					) {
						if (action.actionId && !action.wasDeleted) new InitEntity(action, 'unit');
						else {
							this.showRepublishWarning = true;
						}
					} else if (action.type === 'spawnItem' || action.type === 'createItemWithMaxQuantityAtPosition') {
						if (action.actionId && !action.wasDeleted) new InitEntity(action, 'item');
						else {
							this.showRepublishWarning = true;
						}
					} else if (action.type === 'createProjectileAtPosition' && !isNaN(action.angle)) {
						if (action.actionId && !action.wasDeleted) new InitEntity(action, 'projectile');
						else {
							this.showRepublishWarning = true;
						}
					}
					if (inGameEditor && inGameEditor.updateAction && !window.isStandalone) {
						this.entityEditor.debounceUpdateAction({ data: [action] });
					}
				}
			}

			getViewportBounds() {
				const halfWidth = (window.innerWidth * 0.5) / this.camera.zoom;
				const halfHeight = (window.innerHeight * 0.5) / this.camera.zoom;
				const p = this.camera.getPosition2D();
				return {
					x: Utils.worldToPixel(p.x) - halfWidth,
					y: Utils.worldToPixel(p.y) - halfHeight,
					width: halfWidth * 2,
					height: halfHeight * 2,
				};
			}

			getCameraPosition() {
				const pos = this.camera.getPosition2D();
				return {
					x: Utils.worldToPixel(pos.x),
					y: Utils.worldToPixel(pos.y),
				};
			}

			getCameraWidth(): number {
				return window.innerWidth;
			}

			getCameraHeight(): number {
				return window.innerHeight;
			}

			private onEnterPlayMode() {
				this.camera.setEditorMode(false);
				this.environment.show();
			}

			private onExitPlayMode() {
				this.camera.setEditorMode(true);
				this.environment.hide();
			}

			private onEnterMapMode() {
				this.hideEntities();
				this.entityManager.regions.forEach((r) => r.setMode(RegionMode.Development));
				if (this.showRepublishWarning) {
					inGameEditor.showRepublishToInitEntitiesWarning();
				}
				if (this.entityManager.initEntities.length === 0) {
					// create images for entities created in initialize script
					Object.values(taro?.game?.data?.scripts ?? {}).forEach((script) => {
						if (script.triggers?.[0]?.type === 'gameStart') {
							Object.values(script?.actions ?? {}).forEach((action) => {
								this.createInitEntity(action);
							});
						}
					});

					if (this.showRepublishWarning) {
						inGameEditor.showRepublishToInitEntitiesWarning();
					}
				}

				taro.network.send<any>('updateClientInitEntities', true);
				this.selectionBox.enabled = true;
				this.entityManager.initEntities.forEach((initEntity) => {
					initEntity.body.visible = true;
				});
			}

			private onExitMapMode() {
				this.showEntities();
				this.selectionBox.enabled = false;
				this.selectionHelper.onPointerUp(null, true);
				this.entityManager.regions.forEach((r) => r.setMode(RegionMode.Normal));
				this.voxelEditor.voxels.updateLayer(new Map(), this.voxelEditor.currentLayerIndex, false, true);
				this.voxelEditor.showAllLayers();

				if (this.entityEditor.selectedEntities) {
					this.entityEditor.selectEntity(null);
				}

				this.entityManager.initEntities.forEach((initEntity) => {
					initEntity.body.visible = false;
				});
			}

			private onEnterEntitiesMode() {}

			private onExitEntitiesMode() {}

			private showEntities() {
				this.setEntitiesVisible(true);
			}

			private hideEntities() {
				this.setEntitiesVisible(false);
			}

			private setEntitiesVisible(visible: boolean) {
				this.particleSystem.visible = visible;
				this.entitiesLayer.visible = visible;
			}

			private loadAssets() {
				const sources = [];

				const data = taro.game.data;

				data.map.tilesets.forEach((tileset) => {
					const key = tileset.image;
					sources.push({ name: key, type: 'texture', src: Utils.patchAssetUrl(key) });
				});

				const taroEntities = [
					...Object.values(data?.unitTypes ?? {}),
					...Object.values(data?.projectileTypes ?? {}),
					...Object.values(data?.itemTypes ?? {}),
				];

				for (const taroEntity of taroEntities) {
					const url = taroEntity?.cellSheet?.url;
					if (!url) continue;

					sources.push({ name: url, type: taroEntity.is3DObject ? 'gltf' : 'texture', src: Utils.patchAssetUrl(url) });

					AnimationManager.instance().createAnimationsFromTaroData(url, taroEntity);
				}

				for (const taroEntity of Object.values(data?.particleTypes ?? {})) {
					const key = taroEntity.url;
					sources.push({ name: `particle/${key}`, type: 'texture', src: Utils.patchAssetUrl(key) });
				}

				const skyboxFacesUrls = taro.game.data.settings.skybox;
				for (const key in skyboxFacesUrls) {
					if (!skyboxFacesUrls[key]) continue;
					sources.push({ name: key, type: 'texture', src: skyboxFacesUrls[key] });
				}

				gAssetManager.load(sources, this.initLoadingManager);
			}

			private forceLoadUnusedCSSFonts() {
				let canvas = document.createElement('canvas');
				let ctx = canvas.getContext('2d');
				ctx.font = 'normal 4px Verdana';
				ctx.fillText('text', 0, 8);

				canvas = document.createElement('canvas');
				ctx = canvas.getContext('2d');
				ctx.font = 'bold 4px Verdana';
				ctx.fillText('text', 0, 8);

				canvas = document.createElement('canvas');
				ctx = canvas.getContext('2d');
				ctx.font = 'italic bold 4px Verdana';
				ctx.fillText('text', 0, 8);
			}

			private init() {
				this.voxels = Voxels.create(taro.game.data.map.layers);
				this.voxelEditor = new VoxelEditor(this.voxels);
				this.scene.add(this.voxels);
				this.scene.add(this.voxelEditor.voxelMarker);

				this.environment = new Environment(this);

				this.entityEditor = new EntityEditor();

				this.particleSystem = new ParticleSystem();
				this.scene.add(this.particleSystem);
				this.entitiesLayer.position.y = 0.51;
				this.scene.add(this.entitiesLayer);
				this.projectilPool = InstancedMeshPool.create();
				this.regionsLayer.position.y = 0.51;
				this.scene.add(this.regionsLayer);

				this.initEntityLayer.position.y = 0.51;
				this.scene.add(this.initEntityLayer);

				const createEntity = (taroEntity: TaroEntityPhysics, type: 'unit' | 'item' | 'projectile' | 'region') => {
					const entity = this.entityManager.create(taroEntity, type);

					switch (type) {
						case 'region':
							this.regionsLayer.add(entity);
							break;
						case 'projectile':
							if (!taroEntity._stats.instancedMesh) {
								this.entitiesLayer.add(entity);
							}
							break;
						default:
							this.entitiesLayer.add(entity);
					}

					taroEntity.on('destroy', () => {
						this.entityManager.destroy(entity);
						this.particleSystem.destroyEmittersWithTarget(entity);
					});

					taroEntity.on('follow', () => {
						this.camera.follow(entity);

						const offset = entity.cameraConfig.offset;
						this.camera.setOffset(offset.x, offset.y, offset.z);

						if (entity.cameraConfig.pointerLock) {
							const { min, max } = entity.cameraConfig.pitchRange;
							this.camera.setElevationRange(min, max);
						}

						this.camera.setPointerLock(entity.cameraConfig.pointerLock);
					});
				};

				taro.client.on('create-unit', (u: TaroEntityPhysics) => createEntity(u, 'unit'), this);
				taro.client.on('create-item', (i: TaroEntityPhysics) => createEntity(i, 'item'), this);
				taro.client.on('create-projectile', (p: TaroEntityPhysics) => createEntity(p, 'projectile'), this);
				taro.client.on('create-region', (r: TaroEntityPhysics) => createEntity(r, 'region'), this);

				taro.client.on('zoom', (height: number) => {
					if (this.camera.zoomHeight === height * 2.15) return;
					this.camera.setZoomByHeight(height * 2.15);
					taro.client.emit('scale', { ratio: this.camera.zoom });
					this.entityManager.scaleGui(1 / this.camera.zoom);
				});

				taro.client.on('stop-follow', () => this.camera.unfollow());
				taro.client.on('camera-pitch', (deg: number) => this.camera.setElevationAngle(deg));
				taro.client.on('camera-yaw', (deg: number) => this.camera.setAzimuthAngle(deg));

				taro.client.on('camera-position', (x: number, y: number) => {
					if (!taro.developerMode.active || taro.developerMode.activeTab === 'play') {
						this.camera.setPosition2D(Utils.pixelToWorld(x), Utils.pixelToWorld(y), true);
					}
				});

				taro.client.on('camera-instant-move', (x: number, y: number) => {
					if (!taro.developerMode.active || taro.developerMode.activeTab === 'play') {
						this.camera.setPosition2D(Utils.pixelToWorld(x), Utils.pixelToWorld(y));
					}
				});

				taro.client.on('create-particle-emitter', (particle: Particle) => {
					const emitter = this.particleSystem.createEmitter(particle);
					if (emitter == null) return;

					emitter.position.y += this.entitiesLayer.position.y;

					if (particle.entityId) {
						const entity = this.entityManager.entities.find((entity) => entity.taroId == particle.entityId);
						if (entity) {
							emitter.target = entity;
						}
					}

					this.particleSystem.emit(emitter);
				});

				taro.client.on('start-emitting-particles', (data: { particleTypeId: string; entityId: string }) => {
					const emitter = this.particleSystem.emitters.find(({ particleTypeId, target }) => {
						return particleTypeId === data.particleTypeId && target.taroId === data.entityId;
					});

					this.particleSystem.startEmitter(emitter);
				});

				taro.client.on('stop-emitting-particles', (data: { particleTypeId: string; entityId: string }) => {
					const emitter = this.particleSystem.emitters.find(({ particleTypeId, target }) => {
						return particleTypeId === data.particleTypeId && target.taroId === data.entityId;
					});

					this.particleSystem.stopEmitter(emitter);
				});

				taro.client.on('floating-text', (config: FloatingTextConfig) => {
					const zOffset = this.camera.target ? this.camera.target.position.y : 0;
					this.entitiesLayer.add(FloatingText.create(config, zOffset));
				});

				taro.client.on('dynamic-floating-text', (config: DynamicFloatingTextConfig) => {
					const zOffset = this.camera.target ? this.camera.target.position.y : 0;
					const dynamicText = DynamicFloatingText.create(config, zOffset);
					this.entitiesLayer.add(dynamicText);
				});

				if (taro?.game?.data?.settings?.camera?.useBounds) {
					const resize = !taro.game.data.defaultData.dontResize;
					const tileWidth = resize ? 64 : taro.game.data.map.tilewidth;
					const tileHeight = resize ? 64 : taro.game.data.map.tileheight;
					const width = Utils.pixelToWorld(taro.game.data.map.width * tileWidth);
					const height = Utils.pixelToWorld(taro.game.data.map.height * tileHeight);
					this.camera.setBounds(0, 0, width, height);
					this.camera.useBounds = true;
				}
				this.addEventListener();
			}

			private updateAllEntitiesMatirx() {
				this.entitiesNeedsUpdate.forEach((e) => {
					e.matrixWorldAutoUpdate = true;
				});
			}

			private emitPointerPosition() {
				const worldPos = this.camera.getWorldPoint(this.pointer);
				const x = Utils.worldToPixel(worldPos.x);
				const y = Utils.worldToPixel(worldPos.z);
				const yaw = this.camera.getAzimuthAngle();
				const pitch = this.camera.getElevationAngle();
				taro.input.emit('pointermove', [{ x, y, yaw, pitch }]);
			}

			private render() {
				window.lastRequestAnimationFrameId = requestAnimationFrame(this.render.bind(this));
				taro.client.emit('tick');
				// Call this function before rendering
				if (this.camera) {
					if (taro.isMobile) {
						if (this.touchActive) {
							this.emitPointerPosition();
						}
						if (this.secondaryPointer) {
							const worldPosSecondary = this.camera.getWorldPoint(this.pointer);
							const x = Utils.worldToPixel(worldPosSecondary.x);
							const y = Utils.worldToPixel(worldPosSecondary.z);
							taro.input.emit('secondarytouchpointermove', [
								{
									x: x,
									y: y,
								},
							]);
						}
					} else {
						this.emitPointerPosition();
					}
				}

				this.camera.instance.updateMatrixWorld(); // Ensure the camera matrix is updated
				this.cameraViewProjectionMatrix.multiplyMatrices(
					this.camera.instance.projectionMatrix,
					this.camera.instance.matrixWorldInverse
				);
				this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);
				this.updateFrustumCulling();
				this.updateAllEntitiesMatirx();
				if (this.entityEditor) this.entityEditor.update();
				// TODO: Is this the proper way to get deltaTime or should I get it from the
				// engine somewhere? Also it feels a little weird that the renderer triggers
				// the engine update. It should be the other way around.
				let dt = this.clock.getDelta();
				const time = this.clock.elapsedTime;
				if (dt <= 0) dt = 1 / 60;
				else if (dt >= 0.25) dt = 0.25;

				this.entityManager.update(dt);
				this.particleSystem.update(dt, time, this.camera.instance);
				this.camera.update(dt);
				this.voxelEditor.update();
				this.initEntityLayer.children.forEach((child) => {
					if (child instanceof InitEntity && child) {
						child.update();
					}
				});

				this.environment.update();

				TWEEN.update();
				this.renderer.render(this.scene, this.camera.instance);
				this.effectComposer.render();
				this.timeSinceLastRaycast += dt;
				if (this.timeSinceLastRaycast > this.raycastIntervalSeconds) {
					this.timeSinceLastRaycast = 0;
					// this.checkForHiddenEntities();
				}
			}

			private checkForHiddenEntities() {
				if (Utils.isDebug()) {
					for (const taroIds of this.raycastHelpers.keys()) {
						if (!this.entityManager.units.find((unit) => unit.taroId === taroIds)) {
							const helper = this.raycastHelpers.get(taroIds);
							this.scene.remove(helper);
							this.raycastHelpers.delete(taroIds);
						}
					}
				}

				for (const unit of this.entityManager.units) {
					const tempVec3 = new THREE.Vector3();
					const tempVec2 = new THREE.Vector2();

					unit.getWorldPosition(tempVec3);

					const entityScreenPosition = tempVec3.clone().project(this.camera.instance);
					tempVec2.x = entityScreenPosition.x;
					tempVec2.y = entityScreenPosition.y;

					let dist = 0;
					if (this.camera.isPerspective) {
						dist = tempVec3.distanceTo(this.camera.instance.position);
					} else {
						const direction = this.camera.instance.getWorldDirection(new THREE.Vector3());
						const constant = -direction.dot(this.camera.instance.position);
						const plane = new THREE.Plane(direction, constant);
						dist = plane.distanceToPoint(tempVec3);
					}

					const raycaster = new THREE.Raycaster();
					raycaster.setFromCamera(tempVec2, this.camera.instance);
					raycaster.far = dist;
					raycaster.near = this.camera.instance.near * 2; // double to improve results when using camera collisions

					const intersects = raycaster.intersectObject(this.voxels);

					if (Utils.isDebug()) {
						if (!this.raycastHelpers.has(unit.taroId)) {
							const helper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, dist, 0xff0000);
							this.raycastHelpers.set(unit.taroId, helper);
							this.scene.add(helper);
						}

						const helper = this.raycastHelpers.get(unit.taroId);
						helper.setColor(intersects.length > 0 ? 0xff0000 : 0x00ff00);
						helper.position.copy(raycaster.ray.origin);
						helper.setDirection(raycaster.ray.direction);
						helper.setLength(dist);
					}

					unit.showHud(intersects.length === 0);
				}
			}
		}
	}
}
