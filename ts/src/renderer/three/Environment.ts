namespace Renderer {
	export namespace Three {
		export class Environment {
			private skybox: Skybox;
			private ambientLight: THREE.AmbientLight;
			private directionalLight: THREE.DirectionalLight;
			private shadowMesh: THREE.InstancedMesh;

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
			}

			update() {
				// Skybox
				if (this.renderer.camera.target) {
					this.skybox.position.copy(this.renderer.camera.target.position);
				}

				// Shadows
				let i = 0;
				for (const entity of this.renderer.entityManager.entities) {
					if (!(entity instanceof Unit || entity instanceof Item) || !entity.taroEntity._stats.shadow) {
						continue;
					}

					dummy.position.copy(entity.position);
					dummy.position.y = 0.501; // should be on floor layer
					dummy.rotation.y = entity.body.rotation.y;
					dummy.scale.set(entity.size.x, 1, entity.size.y);
					dummy.updateMatrix();
					this.shadowMesh.setMatrixAt(i++, dummy.matrix);
				}
				this.shadowMesh.instanceMatrix.needsUpdate = true;
				this.shadowMesh.computeBoundingSphere();
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
