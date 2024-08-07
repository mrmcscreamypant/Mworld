namespace Renderer {
	export namespace Three {
		export class ProjectilePool extends Node {
			pool: Record<
				string,
				{
					locks: number[];
					mesh: THREE.InstancedMesh;
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

			editInstancedMeshAllIdx(
				editData: {
					position?: [number, number, number];
					rotation?: [number, number, number];
					scale?: [number, number, number];
				},
				textureId: string
			) {
				const dummy = new THREE.Object3D();
				Object.keys(editData).forEach((k) => {
					dummy[k].set(editData[k][0], editData[k][1], editData[k][2]);
				});
				dummy.updateMatrix();
				const mesh = this.pool[textureId].mesh;
				for (let i = 0; i < ProjectilePool.MaxInstancedCount; i++) {
					mesh.setMatrixAt(i, dummy.matrix);
				}
				mesh.instanceMatrix.needsUpdate = true;
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
				const dummy = new THREE.Object3D();
				dummy.position.set(-Infinity, -Infinity, -Infinity);
				Object.keys(editData).forEach((k) => {
					dummy[k].set(editData[k][0], editData[k][1], editData[k][2]);
				});
				dummy.updateMatrix();
				const mesh = this.pool[textureId].mesh;
				mesh.setMatrixAt(idx, dummy.matrix);
				mesh.instanceMatrix.needsUpdate = true;
				// seems we do not need to computeBoundingBox for now
				// mesh.computeBoundingBox();
				if (remove) {
					this.pool[textureId].locks = this.pool[textureId].locks.filter((n) => n !== idx);
				}
			}

			createOrMergeProjectile(textureId: string): number {
				if (this.pool[textureId] === undefined) {
					const geometry = new THREE.PlaneGeometry(0.5, 0.5);
					geometry.rotateX(-Math.PI / 2);
					const tex = gAssetManager.getTexture(textureId).clone();
					const material = new THREE.MeshBasicMaterial({
						map: tex,
						transparent: true,
						alphaTest: 0.3,
					});
					this.pool[textureId] = {
						locks: [0],
						mesh: new THREE.InstancedMesh(geometry, material, ProjectilePool.MaxInstancedCount),
					};
					this.editInstancedMeshAllIdx({ position: [-Infinity, -Infinity, -Infinity] }, textureId);
					this.add(this.pool[textureId].mesh);
					this.pool[textureId].mesh.frustumCulled = false;
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
