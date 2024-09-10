const dummy = new THREE.Object3D();
const tempVec = new THREE.Vector3();

enum ShadowQuality {
	Simple,
	Low,
	Medium,
	High,
}

namespace Renderer {
	export namespace Three {
		export class Environment {
			private skybox: Skybox;
			private ambientLight: THREE.AmbientLight;
			private directionalLight: THREE.DirectionalLight;
			private shadowMesh: THREE.InstancedMesh;
			private shadowQuality = ShadowQuality.Simple;

			constructor(private renderer) {
				const scene = renderer.scene;

				// Skybox
				this.skybox = new Skybox();
				scene.add(this.skybox);

				// Lighting
				if (taro?.game?.data?.settings?.fog?.enabled) {
					const fog = taro.game.data.settings.fog;
					if (taro.game.data.settings.fog.type === 'exp2') {
						scene.fog = new THREE.FogExp2(fog.color, fog.density);
					} else {
						scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
					}
				}

				const ambientLightSettings = taro?.game?.data?.settings?.light?.ambient;
				this.ambientLight = new THREE.AmbientLight(
					ambientLightSettings?.color ?? 0xffffff,
					ambientLightSettings?.intensity ?? 3
				);
				scene.add(this.ambientLight);

				const directionalLightSettings = taro?.game?.data?.settings?.light?.directional;
				this.directionalLight = new THREE.DirectionalLight(
					directionalLightSettings?.color ?? 0xffffff,
					directionalLightSettings?.intensity ?? 0
				);
				this.directionalLight.position.set(
					directionalLightSettings?.position.x ?? 0,
					directionalLightSettings?.position.z ?? 1,
					directionalLightSettings?.position.y ?? 0
				);
				scene.add(this.directionalLight);

				// Shadows
				if (taro?.game?.data?.settings?.shadowQuality) {
					switch (taro.game.data.settings.shadowQuality) {
						case 'simple':
							this.shadowQuality = ShadowQuality.Simple;
							break;
						case 'low':
							this.shadowQuality = ShadowQuality.Low;
							break;
						case 'medium':
							this.shadowQuality = ShadowQuality.Medium;
							break;
						case 'high':
							this.shadowQuality = ShadowQuality.High;
							break;
					}
				}

				if (this.shadowQuality === ShadowQuality.Simple) {
					const canvas = document.createElement('canvas');
					canvas.width = 128;
					canvas.height = 128;
					const ctx = canvas.getContext('2d');
					const blur = 6;
					const scale = 1.25;
					const opacity = 0.25;
					if (ctx) {
						ctx.filter = `blur(${blur}px)`;
						ctx.fillStyle = `rgba(0,0,0,${opacity})`;
						ctx.beginPath();
						ctx.arc(64, 64, 64 - blur * 2, 0, Math.PI * 2);
						ctx.fill();
					}
					const shadowTexture = new THREE.CanvasTexture(canvas);

					const maxShadows = 2000;
					const shadowGeometry = new THREE.PlaneGeometry(scale, scale);
					shadowGeometry.rotateX(-Math.PI * 0.5);
					const shadowMaterial = new THREE.MeshBasicMaterial({
						map: shadowTexture,
						transparent: true,
						depthWrite: false,
						blending: THREE.CustomBlending,
						blendEquation: THREE.AddEquation,
						blendSrc: THREE.OneFactor,
						blendDst: THREE.OneMinusSrcAlphaFactor,
					});
					this.shadowMesh = new THREE.InstancedMesh(shadowGeometry, shadowMaterial, maxShadows);
					this.shadowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
					scene.add(this.shadowMesh);
				} else {
					this.renderer.renderer.shadowMap.enabled = true;
					this.renderer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

					const shadowMapSize =
						this.shadowQuality === ShadowQuality.Low ? 512 : this.shadowQuality === ShadowQuality.Medium ? 1024 : 2048;

					this.directionalLight.castShadow = true;
					this.directionalLight.shadow.mapSize.width = shadowMapSize;
					this.directionalLight.shadow.mapSize.height = shadowMapSize;
					this.directionalLight.shadow.camera.near = -500;
					this.directionalLight.shadow.camera.far = 500;
					this.directionalLight.shadow.camera.left = -30;
					this.directionalLight.shadow.camera.right = 30;
					this.directionalLight.shadow.camera.top = 30;
					this.directionalLight.shadow.camera.bottom = -30;
					this.directionalLight.shadow.bias = 0.000001;
					scene.add(this.directionalLight.target);

					this.renderer.voxels.children.forEach((voxel) => {
						if (voxel instanceof THREE.Mesh) {
							voxel.castShadow = true;
							voxel.receiveShadow = true;
						}
					});
				}
			}

			update() {
				if (this.renderer.camera.target) {
					this.skybox.position.copy(this.renderer.camera.instance.position);

					if (!ShadowQuality.Simple) {
						const shadowMapWidth = this.directionalLight.shadow.camera.right - this.directionalLight.shadow.camera.left;
						const shadowTexelWidth = shadowMapWidth / this.directionalLight.shadow.mapSize.width;
						const minMoveDistanceBeforeMoveShadowmap = 5; // world units

						if (
							this.directionalLight.target.position.distanceTo(this.renderer.camera.instance.position) >
							minMoveDistanceBeforeMoveShadowmap
						) {
							this.directionalLight.target.position.set(
								Math.floor(this.renderer.camera.instance.position.x / shadowTexelWidth) * shadowTexelWidth,
								Math.floor(this.renderer.camera.instance.position.y / shadowTexelWidth) * shadowTexelWidth,
								Math.floor(this.renderer.camera.instance.position.z / shadowTexelWidth) * shadowTexelWidth
							);
							this.directionalLight.position.copy(this.directionalLight.target.position);
							const directionalLightSettings = taro?.game?.data?.settings?.light?.directional;
							this.directionalLight.position.x += directionalLightSettings?.position.x ?? 0;
							this.directionalLight.position.y += directionalLightSettings?.position.z ?? 1;
							this.directionalLight.position.z += directionalLightSettings?.position.y ?? 0;
						}
					}
				}

				// Shadows
				switch (this.shadowQuality) {
					case ShadowQuality.Simple: {
						let i = 0;

						const setInstancesToEntitiesTransform = (entities: Unit[] | Item[]) => {
							for (const entity of entities) {
								if (!entity.taroEntity._stats.shadow || !entity.visible) {
									continue;
								}

								const scaleX = entity.size.x;
								let scaleZ = entity.size.y;
								let posX = entity.position.x;
								let posY = entity.position.y;
								let posZ = entity.position.z;

								if (entity.body instanceof Sprite) {
									if (entity.body.billboard) {
										scaleZ = scaleX;

										if (entity instanceof Unit) {
											const bottomHudPos = entity.bottomHud.getWorldPosition(tempVec);
											posX = bottomHudPos.x;
											posY = bottomHudPos.y;
											posZ = bottomHudPos.z;
										}
									}
								}

								dummy.position.set(posX, posY, posZ);
								dummy.position.y = 0.501; // TODO: move floor layer to be at 0, not 0.5
								dummy.rotation.y = entity.body.rotation.y;
								dummy.scale.set(scaleX, 1, scaleZ);
								dummy.updateMatrix();
								this.shadowMesh.setMatrixAt(i++, dummy.matrix);
							}
						};

						setInstancesToEntitiesTransform(this.renderer.entityManager.units);
						setInstancesToEntitiesTransform(this.renderer.entityManager.items);
						setInstancesToEntitiesTransform(this.renderer.entityManager.projectiles);

						this.shadowMesh.count = i;
						this.shadowMesh.instanceMatrix.needsUpdate = true;
						this.shadowMesh.computeBoundingSphere();

						break;
					}
					case ShadowQuality.Low:
					case ShadowQuality.Medium:
					case ShadowQuality.High: {
						const setCastShadowSettingOnEntities = (entities: Unit[] | Item[]) => {
							for (const entity of entities) {
								const shadowsEnabled = !!entity.taroEntity._stats.shadow && entity.visible;

								entity.body.traverse((child) => {
									if (child instanceof THREE.Mesh) {
										child.castShadow = shadowsEnabled;
									}
								});
							}
						};

						setCastShadowSettingOnEntities(this.renderer.entityManager.units);
						setCastShadowSettingOnEntities(this.renderer.entityManager.items);
						setCastShadowSettingOnEntities(this.renderer.entityManager.projectiles);

						break;
					}
				}
			}

			show() {
				const scene = this.renderer.scene;

				// Lighting
				const ambientLightSettings = taro?.game?.data?.settings?.light?.ambient;
				this.ambientLight.intensity = ambientLightSettings?.intensity ?? 3;
				const directionalLightSettings = taro?.game?.data?.settings?.light?.directional;
				this.directionalLight.intensity = directionalLightSettings?.intensity ?? 0;

				// Fog
				if (taro?.game?.data?.settings?.fog?.enabled) {
					const fog = taro.game.data.settings.fog;
					if (scene.fog instanceof THREE.Fog) {
						scene.fog.near = fog.near;
						scene.fog.far = fog.far;
					} else if (scene.fog instanceof THREE.FogExp2) {
						scene.fog.density = fog.density;
					}
				}
			}

			hide() {
				const scene = this.renderer.scene;

				// Lighting
				this.ambientLight.intensity = 3;
				this.directionalLight.intensity = 0;

				// Fog
				if (taro?.game?.data?.settings?.fog?.enabled) {
					if (scene.fog instanceof THREE.Fog) {
						scene.fog.near = 100000;
						scene.fog.far = 100000;
					} else if (scene.fog instanceof THREE.FogExp2) {
						scene.fog.density = 0;
					}
				}
			}
		}
	}
}
