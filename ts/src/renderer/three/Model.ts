namespace Renderer {
	export namespace Three {
		export class Model extends Node {
			root = new THREE.Object3D();
			mesh: THREE.Group;
			size = new THREE.Vector3();
			originalSize = new THREE.Vector3();
			originalScale = new THREE.Vector3();
			firstTime = true;

			private aabb = new THREE.Box3();
			// OBB is something just like Box3 but with rotation
			private obb = new OBB();

			private mixer: THREE.AnimationMixer;
			private clips: THREE.AnimationClip[];
			private center = new THREE.Vector3();
			private meshSize = new THREE.Vector3(1, 1, 1);

			constructor(name: string) {
				super();

				this.add(this.root);

				const model = gAssetManager.getModel(name);
				this.mesh = SkeletonUtils.clone(model.scene);

				this.originalSize.copy(this.getSize());
				this.originalScale.copy(this.mesh.scale);
				this.aabb.setFromObject(this.mesh);

				this.mixer = new THREE.AnimationMixer(this.mesh);
				this.clips = model.animations;

				this.root.add(this.mesh); // Important to add the mesh after above setup
			}

			setModel(model: GLTF) {
				this.root.remove(this.mesh);
				this.mesh = SkeletonUtils.clone(model.scene);

				this.firstTime = true;
				this.originalSize.copy(this.getSize());
				this.originalScale.copy(this.mesh.scale);
				this.aabb.setFromObject(this.mesh);
				this.setSize(this.meshSize.x, this.meshSize.y, this.meshSize.z);

				this.mixer = new THREE.AnimationMixer(this.mesh);
				this.clips = model.animations;

				this.root.add(this.mesh); // Important to add the mesh after above setup
			}

			getSize() {
				if (this.firstTime) {
					this.aabb.setFromObject(this.mesh, true);
					this.firstTime = false;
				}
				this.mesh.updateMatrix();
				this.mesh.updateMatrixWorld();
				// get its original aabb which means its original geometry
				this.obb.fromBox3(this.aabb);
				// apply the additional translation, rotation, scale
				this.obb.applyMatrix4(this.mesh.matrixWorld);
				return this.obb.getSize(this.size);
			}

			setSize(x: number, y: number, z: number) {
				this.meshSize.set(x, y, z);
				this.mesh.scale.x = this.originalScale.x * (x / this.originalSize.x);
				this.mesh.scale.y = this.originalScale.y * (y / this.originalSize.y);
				this.mesh.scale.z = this.originalScale.z * (z / this.originalSize.z);
			}

			setOpacity(opacity: number, time = undefined) {
				this.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						// Convert to basic material to avoid lighting
						const material = new THREE.MeshStandardMaterial();
						THREE.MeshStandardMaterial.prototype.copy.call(material, child.material);
						child.material = material;
						child.material.transparent = true;
						child.material.opacity = opacity;
						if (time !== undefined) {
							setTimeout(() => {
								child.material.opacity = 1;
							}, time);
						}
					}
				});
			}

			setColor(color: number, time = 0) {
				this.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						// Convert to basic material to avoid lighting
						const material = new THREE.MeshStandardMaterial();
						THREE.MeshStandardMaterial.prototype.copy.call(material, child.material);
						child.material = material;
						const originalColor = child.material.color.getHex();
						child.material.color.setHex(color);
						if (time > 0) {
							setTimeout(() => {
								child.material.color.setHex(originalColor);
							}, time);
						}
					}
				});
			}

			getCenter() {
				return this.aabb.getCenter(this.center).multiply(this.mesh.scale);
			}

			update(dt) {
				this.mixer.update(dt);
			}

			play(name: string, loopCount = 0) {
				const clip = THREE.AnimationClip.findByName(this.clips, name);
				if (!clip) return;

				this.mixer.stopAllAction();

				const action = this.mixer.clipAction(clip);
				action.setLoop(THREE.LoopRepeat, loopCount === 0 ? Infinity : loopCount);
				action.clampWhenFinished = true;
				action.play();
			}
		}
	}
}
