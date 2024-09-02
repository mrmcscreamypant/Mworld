namespace Renderer {
	export namespace Three {
		export class InstancedMeshPool extends Node {
			pool: Record<
				string,
				{
					currentData: {
						position: [number, number, number];
						rotation: [number, number, number];
						scale: [number, number, number];
					}[];
					locks: number[];
					mostlyStatic: boolean;
					mesh: InstancedMesh.InstancedMesh2;
				}
			> = {};
			debounceComputeBVH: (
				mesh: InstancedMesh.InstancedMesh2<
					{},
					THREE.BufferGeometry<THREE.NormalBufferAttributes>,
					THREE.Material,
					THREE.Object3DEventMap
				>
			) => void;
			constructor() {
				super();
				this.debounceComputeBVH = debounce((mesh: InstancedMesh.InstancedMesh2) => {
					mesh.computeBVH();
				}, 20);
			}

			static MaxInstancedCount = 6000;
			static create(): InstancedMeshPool {
				const instancedMeshPool = new InstancedMeshPool();
				Three.getEntitiesLayer().add(instancedMeshPool);
				return instancedMeshPool;
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
					if (this.pool[textureId].mostlyStatic) {
						this.debounceComputeBVH(mesh);
					}
				}
			}

			createOrMergeProjectile(textureId: string, mostlyStatic = false): number {
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
							InstancedMeshPool.MaxInstancedCount,
							geometry,
							material
						),
						mostlyStatic,
					};
					const mesh = this.pool[textureId].mesh;
					mesh.createInstances((obj, index) => {
						obj.visible = false;
					});
					if (mostlyStatic) {
						this.debounceComputeBVH(mesh);
					} else {
						mesh.raycastOnlyFrustum = true;
					}
					this.add(mesh);
					return 0;
				}
				for (let i = 0; i < InstancedMeshPool.MaxInstancedCount; i++) {
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
