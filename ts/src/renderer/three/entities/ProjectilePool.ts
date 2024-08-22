namespace Renderer {
	export namespace Three {
		export class ProjectilePool extends Node {
			pool: Record<
				string,
				{
					currentData: {
						position: [number, number, number];
						rotation: [number, number, number];
						scale: [number, number, number];
					}[];
					locks: number[];
					mesh: InstancedMesh.InstancedMesh2;
				}
			> = {};
			constructor() {
				super();
			}

			static MaxInstancedCount = 6000;
			static create(): ProjectilePool {
				const projectilePool = new ProjectilePool();
				Three.getEntitiesLayer().add(projectilePool);
				return projectilePool;
			}

			editInstanceMesh(
				editData: {
					position?: [number, number, number];
					rotation?: [number, number, number];
					scale?: [number, number, number];
				},
				textureId: string,
				idx: number,
				remove = false
			) {
				const mesh = this.pool[textureId].mesh;
				if (remove) {
					mesh.instances[idx].visible = false;
					this.pool[textureId].locks = this.pool[textureId].locks.filter((n) => n !== idx);
				} else {
					Object.keys(editData).forEach((k) => {
						if (mesh.instances[idx][k]) {
							mesh.instances[idx][k].x = editData[k][0];
							mesh.instances[idx][k].y = editData[k][1];
							mesh.instances[idx][k].z = editData[k][2];
						} else {
							if (k === 'rotation') {
								mesh.instances[idx].quaternion.setFromEuler(
									new THREE.Euler(editData[k][0], editData[k][1], editData[k][2])
								);
							}
						}
					});
					mesh.instances[idx].visible = true;
					mesh.instances[idx].updateMatrix();
				}
			}

			createOrMergeProjectile(textureId: string): number {
				if (this.pool[textureId] === undefined) {
					const renderer = Renderer.Three.instance();
					const geometry = new THREE.PlaneGeometry(1.0, 1.0);
					geometry.rotateX(-Math.PI / 2);
					const tex = gAssetManager.getTexture(textureId).clone();
					const material = new THREE.MeshBasicMaterial({
						map: tex,
						transparent: true,
						alphaTest: 0.3,
					});
					this.pool[textureId] = {
						locks: [0],
						currentData: [],
						mesh: new InstancedMesh.InstancedMesh2(
							renderer.renderer,
							ProjectilePool.MaxInstancedCount,
							geometry,
							material
						),
					};
					const mesh = this.pool[textureId].mesh;
					mesh.createInstances((obj, index) => {
						obj.visible = false;
					});
					mesh.raycastOnlyFrustum = true;
					this.add(mesh);
					return 0;
				}
				for (let i = 0; i < ProjectilePool.MaxInstancedCount; i++) {
					if (!this.pool[textureId].locks.includes(i)) {
						this.pool[textureId].locks.push(i);
						return i;
					}
				}
				return null;
			}
		}
	}
}
