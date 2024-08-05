namespace Renderer {
	export namespace Three {
		export class Camera {
			instance: THREE.PerspectiveCamera | THREE.OrthographicCamera;
			target: THREE.Object3D | null = null;
			controls: OrbitControls;
			zoom = 1;
			lastAuthoritativeZoom = 1;
			zoomHeight = 700;
			isPerspective = false;
			useBounds = false;

			orthographicState: { target: THREE.Vector3; position: THREE.Vector3 };
			perspectiveState: { target: THREE.Vector3; position: THREE.Vector3; zoom: number };

			isEditorMode = false;

			private debugMode = false;
			// private rayHelpers = [];
			// private rayHitHelpers = [];

			private orthographicCamera: THREE.OrthographicCamera;
			private perspectiveCamera: THREE.PerspectiveCamera;
			private fovInitial: number;
			private viewportHeightInitial: number;

			private debugInfo: HTMLDivElement;
			private onChangeCbs = [];

			private offset = new THREE.Vector3();
			private originalDistance = 1;
			private originalHalfWidth;

			private elevationAngle = 0;
			private azimuthAngle = 0;
			private pointerlockSpeed = 0.35;

			private minElevationAngle = -Math.PI * 0.5;
			private maxElevationAngle = Math.PI * 0.5;

			private tempVec3 = new THREE.Vector3();
			private tempVec2 = new THREE.Vector2();
			private raycaster = new THREE.Raycaster();
			private euler = new THREE.Euler(0, 0, 0, 'YXZ');

			private isLocked = false;

			private bounds = { x: 0, y: 0, width: 0, height: 0 };

			private cameraO: THREE.OrthographicCamera;
			private cameraP: THREE.PerspectiveCamera;
			private dt = 1 / 60;

			private trackingDelay = Math.min(Math.max(0.01, taro?.game?.data?.settings?.camera?.trackingDelay || 3), 60);

			lastTouch: { x: number; y: number };
			touchStart: { x: number; y: number };
			dragValue: { x: number; y: number };

			constructor(
				private viewportWidth: number,
				private viewportHeight: number,
				private canvas: HTMLCanvasElement
			) {
				const persCamera = new THREE.PerspectiveCamera(75, viewportWidth / viewportHeight, 0.1, 15000);
				this.perspectiveCamera = persCamera;
				this.fovInitial = Math.tan(((Math.PI / 180) * this.perspectiveCamera.fov) / 2);
				this.viewportHeightInitial = viewportHeight;

				const halfWidth = Utils.pixelToWorld(viewportWidth / 2);
				const halfHeight = Utils.pixelToWorld(viewportHeight / 2);
				this.originalHalfWidth = halfWidth;
				const orthoCamera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, -2000, 15000);
				this.orthographicCamera = orthoCamera;

				const yFovDeg = this.perspectiveCamera.fov * (Math.PI / 180);
				const distance = this.orthographicCamera.top / Math.tan(yFovDeg * 0.5) / this.orthographicCamera.zoom;
				this.perspectiveCamera.position.y = distance;
				this.orthographicCamera.position.y = distance;
				this.originalDistance = distance;

				this.lastTouch = { x: 0, y: 0 };

				this.touchStart = { x: 0, y: 0 };
				this.dragValue = { x: 0, y: 0 };

				// Used by the scene, copies position from the cameras above.
				// This is so that we can change the position of the camera
				// without affecting the original position directed by
				// OrbitControls. Ideally we want to rewrite this class and no
				// longer use OrbitControls but move much of that logic here.
				// For now we use this solution.
				this.cameraO = orthoCamera.clone();
				this.cameraP = persCamera.clone();

				this.instance = this.cameraO;

				this.controls = new OrbitControls(this.orthographicCamera, canvas);
				this.controls.enableRotate = false;
				this.controls.enableZoom = false;
				this.controls.mouseButtons = { LEFT: '', MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
				this.controls.minDistance = 0.01;
				this.controls.maxDistance = 1000;
				this.controls.minZoom = 1 / (1000 / distance);
				this.controls.maxZoom = 1 / (0.01 / distance);
				this.controls.enablePan = false;
				this.controls.screenSpacePanning = false;
				this.controls.update();

				this.controls.mouseButtons = {
					LEFT: undefined,
					MIDDLE: THREE.MOUSE.ROTATE,
					RIGHT: THREE.MOUSE.PAN,
				};

				this.controls.addEventListener('change', () => {
					for (const cb of this.onChangeCbs) {
						cb();
					}
				});

				this.orthographicState = {
					target: new THREE.Vector3(),
					position: new THREE.Vector3(),
				};
				this.perspectiveState = {
					target: new THREE.Vector3(),
					position: new THREE.Vector3(),
					zoom: this.controls.zoom,
				};

				window.addEventListener('keypress', (evt) => {
					if (evt.key === '~') {
						this.debugMode = !this.debugMode;
						this.setEditorMode(this.debugMode);
					}

					if (!this.debugMode) return;

					if (evt.key === 'l') {
						this.isLocked ? this.unlock() : this.lock();
					} else if (evt.key === ',') {
						this.isPerspective = false;
						this.instance = this.cameraO;
						this.controls.object = this.orthographicCamera;
						this.zoom = this.lastAuthoritativeZoom;

						this.setElevationAngle(90);
						this.setAzimuthAngle(0);

						const yFovDeg = this.perspectiveCamera.fov * (Math.PI / 180);
						const distance = this.orthographicCamera.top / Math.tan(yFovDeg * 0.5);
						this.setDistance(distance);
					} else if (evt.key === '.') {
						this.isPerspective = !this.isPerspective;

						if (this.isPerspective) {
							this.switchToPerspectiveCamera();
						} else {
							this.switchToOrthographicCamera();
						}
					}
				});

				const info = document.createElement('div');
				canvas.parentElement.appendChild(info);
				info.style.position = 'absolute';
				info.style.zIndex = '999';
				info.style.left = '0';
				info.style.top = '0';
				info.style.padding = '10px';
				info.style.margin = '5px';
				info.style.color = 'white';
				info.style.background = 'black';
				info.style.opacity = '0.75';
				info.style.marginTop = '40px';
				this.debugInfo = info;

				//@ts-ignore
				this.raycaster.firstHitOnly = true;

				// Pointerlock
				// but only on desktop
				if (!taro.isMobile) {
					canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
					canvas.ownerDocument.addEventListener('mousemove', this.onMouseMove.bind(this));
					canvas.ownerDocument.addEventListener('pointerlockchange', this.onPointerlockChange.bind(this));
					canvas.ownerDocument.addEventListener('pointerlockerror', this.onPointerlockError.bind(this));
				}

				if (taro.isMobile) {
					canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
					canvas.ownerDocument.addEventListener('touchmove', this.onTouchMove.bind(this));
					canvas.ownerDocument.addEventListener('touchend', this.onTouchEnd.bind(this));
				}

				// this.rayHelpers.push(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0xff0000));
				// this.rayHelpers.push(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0x00ff00));
				// this.rayHelpers.push(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, 0x0000ff));
				// this.rayHelpers.push(new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, 0xff0000));
				// this.rayHelpers.forEach((helper) => Three.instance().scene.add(helper));

				// this.rayHitHelpers.push(new THREE.AxesHelper(0.1));
				// this.rayHitHelpers.push(new THREE.AxesHelper(0.1));
				// this.rayHitHelpers.push(new THREE.AxesHelper(0.1));
				// this.rayHitHelpers.push(new THREE.AxesHelper(0.1));
				// this.rayHitHelpers.forEach((helper) => Three.instance().scene.add(helper));
			}

			setBounds(x: number, y: number, width: number, height: number) {
				this.bounds.x = x;
				this.bounds.y = y;
				this.bounds.width = width;
				this.bounds.height = height;
			}

			setPointerLock(lock: boolean) {
				lock ? this.lock() : this.unlock();
			}

			lock() {
				if (!taro.isMobile) {
					this.canvas.requestPointerLock();
				}
			}

			unlock() {
				if (!taro.isMobile) {
					this.canvas.ownerDocument.exitPointerLock();
				}
			}

			setProjection(projection: typeof taro.game.data.settings.camera.projectionMode) {
				if (projection === 'orthographic') this.switchToOrthographicCamera();
				else if (projection === 'perspective') this.switchToPerspectiveCamera();
			}

			setElevationAngle(deg: number) {
				const min = Math.PI * 0.5 - this.controls.maxPolarAngle;
				const max = Math.PI * 0.5 - this.controls.minPolarAngle;

				let rad = Utils.deg2rad(deg);
				if (rad < min) rad = min;
				else if (rad > max) rad = max;

				this.elevationAngle = Utils.rad2deg(rad);

				if (rad === min || rad === max) return;

				const spherical = new THREE.Spherical(
					this.controls.getDistance(),
					Math.PI / 2 - Utils.deg2rad(deg),
					this.controls.getAzimuthalAngle()
				).makeSafe();
				this.perspectiveCamera.position.setFromSpherical(spherical).add(this.controls.target);
				this.orthographicCamera.position.setFromSpherical(spherical).add(this.controls.target);

				this.controls.update();

				this.cameraP.copy(this.perspectiveCamera);
				this.cameraO.copy(this.orthographicCamera);
			}

			getElevationAngle() {
				return Math.PI / 2 - this.controls.getPolarAngle();
			}

			getAzimuthAngle() {
				return this.controls.getAzimuthalAngle();
			}

			setAzimuthAngle(deg: number) {
				this.azimuthAngle = deg;

				const spherical = new THREE.Spherical(
					this.controls.getDistance(),
					Math.PI / 2 - Utils.deg2rad(this.elevationAngle),
					Utils.deg2rad(deg)
				).makeSafe();
				this.perspectiveCamera.position.setFromSpherical(spherical).add(this.controls.target);
				this.orthographicCamera.position.setFromSpherical(spherical).add(this.controls.target);

				this.controls.update();

				this.cameraP.copy(this.perspectiveCamera);
				this.cameraO.copy(this.orthographicCamera);
			}

			setDistance(distance: number) {
				// Make sure the target is up to date
				this.controls.update();

				if (distance === 0) distance = Number.EPSILON;

				const newPos = new THREE.Vector3()
					.subVectors(this.controls.object.position, this.controls.target)
					.normalize()
					.multiplyScalar(distance)
					.add(this.controls.target);

				this.perspectiveCamera.position.copy(newPos);
				this.orthographicCamera.position.copy(newPos);

				if (this.instance instanceof THREE.OrthographicCamera) {
					this.orthographicCamera.zoom = this.zoom;
					this.orthographicCamera.lookAt(this.controls.target);
					this.orthographicCamera.updateProjectionMatrix();
				}

				this.cameraP.copy(this.perspectiveCamera);
				this.cameraO.copy(this.orthographicCamera);

				this.controls.update();
			}

			setOffset(x: number, y: number, z: number) {
				this.offset.set(x, y, z);
			}

			setElevationRange(min: number, max: number) {
				const minRad = min * (Math.PI / 180);
				const maxRad = max * (Math.PI / 180);
				this.minElevationAngle = minRad;
				this.maxElevationAngle = maxRad;
				this.controls.maxPolarAngle = Math.PI * 0.5 - minRad;
				this.controls.minPolarAngle = Math.PI * 0.5 - maxRad;
				this.controls.update();
			}

			update(dt: number) {
				this.dt = dt;

				this.cameraP.copy(this.perspectiveCamera);
				this.cameraO.copy(this.orthographicCamera);

				if (this.isEditorMode) {
					const azimuthAngle = this.controls.getAzimuthalAngle() * (180 / Math.PI);
					const elevationAngle = this.getElevationAngle() * (180 / Math.PI);
					this.debugInfo.style.display = 'block';
					this.debugInfo.innerHTML = `lookYaw: ${Utils.round(azimuthAngle, 2)} </br>lookPitch: ${Utils.round(elevationAngle, 2)}</br>`;
				} else if (this.debugInfo.style.display !== 'none') {
					this.debugInfo.style.display = 'none';
				}

				if (this.controls.enableZoom) {
					const distance = this.controls.getDistance();
					this.zoom = this.isPerspective
						? this.originalDistance / distance
						: Math.abs(this.originalHalfWidth / this.orthographicCamera.left) * this.orthographicCamera.zoom;
					const editorZoom = Utils.round(Math.max(window.innerWidth, window.innerHeight) / this.zoom / 2.15, 2);
					this.debugInfo.innerHTML += `zoom: ${editorZoom}</br>`;
				}

				if (this.target && !this.isEditorMode) {
					const targetWorldPos = new THREE.Vector3();
					this.target.getWorldPosition(targetWorldPos);
					const angle = this.controls.getAzimuthalAngle();
					targetWorldPos.add(this.offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle));
					this.setPosition(targetWorldPos.x, targetWorldPos.y, targetWorldPos.z, true);
				}

				if (!this.isLocked) {
					this.controls.update();
				}

				if (this.useBounds && !this.isEditorMode) {
					const viewHalfWidth = this.orthographicCamera.right / this.lastAuthoritativeZoom;
					const viewHalfHeight = this.orthographicCamera.top / this.lastAuthoritativeZoom;

					const left = this.bounds.x + viewHalfWidth;
					const right = this.bounds.x + this.bounds.width - viewHalfWidth;
					const top = this.bounds.y + viewHalfHeight;
					const bottom = this.bounds.y + this.bounds.height - viewHalfHeight;

					const boundsHalfWidth = this.bounds.width / 2;
					const boundsHalfHeight = this.bounds.height / 2;

					let x = this.controls.target.x;
					if (viewHalfWidth < boundsHalfWidth) {
						if (x < left) x = left;
						else if (x > right) x = right;
					}

					let z = this.controls.target.z;
					if (viewHalfHeight < boundsHalfHeight) {
						if (z < top) z = top;
						else if (z > bottom) z = bottom;
					}

					this.setPosition(x, this.controls.target.y, z);
				}

				if (taro?.game?.data?.settings?.camera?.collisions && this.isPerspective && !this.isEditorMode) {
					const halfExtends = new THREE.Vector3();
					halfExtends.y = this.cameraP.near * Math.tan(0.5 * (Math.PI / 180) * this.cameraP.fov);
					halfExtends.x = halfExtends.y * this.cameraP.aspect;

					const target = this.controls.target;

					// For debugging
					// window.addEventListener('keydown', (evt) => {
					// 	if (evt.key === '5') {
					// 		const castRay = (idx: number, x: number, y: number) => {
					// 			const helper = this.rayHelpers[idx];
					// 			Three.instance().scene.remove(helper);
					// 			const whalfExtends = this.cameraP.localToWorld(new THREE.Vector3(x, y, 0));
					// 			const dir = new THREE.Vector3()
					// 				.subVectors(whalfExtends, this.cameraP.localToWorld(new THREE.Vector3(x, y, -1)))
					// 				.normalize();
					// 			const origin = this.cameraP.localToWorld(
					// 				this.cameraP
					// 					.worldToLocal(new THREE.Vector3(target.x, target.y, target.z))
					// 					.add(new THREE.Vector3(x, y, 0))
					// 			);

					// 			const length = this.controls.getDistance() - this.controls.object.near;
					// 			this.rayHelpers[idx] = new THREE.ArrowHelper(dir, origin, length, 0xff0000);
					// 			Three.instance().scene.add(this.rayHelpers[idx]);

					// 			const ray = new THREE.Raycaster(origin, dir, 0, length);
					// 			//@ts-ignore
					// 			ray.firstHitOnly = true;
					// 			const intersects = ray.intersectObjects(Three.instance().voxels.children, false);
					// 			if (intersects.length > 0) {
					// 				this.rayHitHelpers[idx].position.copy(intersects[0].point);
					// 			}

					// 		};

					// 		castRay(0, -halfExtends.x, -halfExtends.y);
					// 		castRay(1, halfExtends.x, -halfExtends.y);
					// 		castRay(2, halfExtends.x, halfExtends.y);
					// 		castRay(3, -halfExtends.x, halfExtends.y);
					// 	}
					// });

					const castRay = (x: number, y: number) => {
						const whalfExtends = this.cameraP.localToWorld(new THREE.Vector3(x, y, 0));
						const dir = new THREE.Vector3()
							.subVectors(whalfExtends, this.cameraP.localToWorld(new THREE.Vector3(x, y, -1)))
							.normalize();
						const origin = this.cameraP.localToWorld(
							this.cameraP.worldToLocal(new THREE.Vector3(target.x, target.y, target.z)).add(new THREE.Vector3(x, y, 0))
						);
						const length = this.controls.getDistance() - this.controls.object.near;
						const ray = new THREE.Raycaster(origin, dir, 0, length);
						//@ts-ignore
						ray.firstHitOnly = true;
						const intersects = ray.intersectObjects(Three.instance().voxels.children, false);
						return intersects.length > 0 ? intersects[0] : undefined;
					};

					const intersects = [];
					for (const dir of [
						{ x: -1, y: -1 },
						{ x: 1, y: -1 },
						{ x: 1, y: 1 },
						{ x: -1, y: 1 },
						{ x: 0, y: 0 },
					]) {
						const intersect = castRay(dir.x * halfExtends.x, dir.y * halfExtends.y);
						if (intersect) intersects.push(intersect);
					}
					if (intersects.length > 0) {
						const closest = intersects.reduce((prev, curr) => (prev.distance < curr.distance ? prev : curr));
						const newPos = new THREE.Vector3()
							.subVectors(this.controls.object.position, target)
							.normalize()
							.multiplyScalar(closest.distance + this.controls.object.near)
							.add(target);
						this.cameraP.position.set(newPos.x, newPos.y, newPos.z);
						this.cameraO.position.set(newPos.x, newPos.y, newPos.z);
					}
				}
			}

			resize(width: number, height: number) {
				this.viewportWidth = width;
				this.viewportHeight = height;

				this.perspectiveCamera.aspect = width / height;
				this.perspectiveCamera.fov =
					(360 / Math.PI) * Math.atan(this.fovInitial * (height / this.viewportHeightInitial));
				this.perspectiveCamera.updateProjectionMatrix();

				const halfWidth = Utils.pixelToWorld(width / 2);
				const halfHeight = Utils.pixelToWorld(height / 2);
				this.originalHalfWidth = halfWidth;
				this.orthographicCamera.left = -halfWidth;
				this.orthographicCamera.right = halfWidth;
				this.orthographicCamera.top = halfHeight;
				this.orthographicCamera.bottom = -halfHeight;
				this.orthographicCamera.updateProjectionMatrix();

				this.setZoom(Math.max(this.viewportWidth, this.viewportHeight) / this.zoomHeight);

				this.cameraP.copy(this.perspectiveCamera);
				this.cameraO.copy(this.orthographicCamera);
			}

			setZoom(ratio: number) {
				this.zoom = ratio;
				this.lastAuthoritativeZoom = ratio;
				this.setDistance(this.originalDistance / ratio);
			}

			setZoomByHeight(height: number) {
				this.zoomHeight = height;
				this.setZoom(Math.max(this.viewportWidth, this.viewportHeight) / height);
			}

			follow(target: THREE.Object3D, moveInstant = true) {
				this.target = target;

				if (moveInstant) {
					const targetWorldPos = new THREE.Vector3();
					target.getWorldPosition(targetWorldPos);
					this.setPosition(targetWorldPos.x, targetWorldPos.y, targetWorldPos.z);
				}
			}

			unfollow() {
				this.target = null;
			}

			getWorldPoint(p: THREE.Vector2) {
				let target = this.controls.target;
				if (this.target) {
					const targetWorldPos = new THREE.Vector3();
					this.target.getWorldPosition(targetWorldPos);
					target = targetWorldPos;
				}

				// Mouse to world pos code from:
				// https://github.com/WestLangley/three.js/blob/e3cd05d80baf7b1594352a1d7e464c6d188b0080/examples/jsm/controls/OrbitControls.js
				if (this.isPerspective) {
					const pointer = new THREE.Vector3(p.x, p.y, 0.5);
					pointer.unproject(this.instance);
					pointer.sub(this.instance.position).normalize();
					const dist = target.clone().sub(this.cameraP.position).dot(this.cameraP.up) / pointer.dot(this.cameraP.up);
					return this.instance.position.clone().add(pointer.multiplyScalar(dist));
				} else {
					const pointer = new THREE.Vector3(
						p.x,
						p.y,
						(this.cameraO.near + this.cameraO.far) / (this.cameraO.near - this.cameraO.far)
					);
					pointer.unproject(this.cameraO);
					pointer.y -= target.y;
					const v = new THREE.Vector3(0, 0, -1).applyQuaternion(this.cameraO.quaternion);
					const dist = -pointer.dot(this.cameraO.up) / v.dot(this.cameraO.up);
					const result = pointer.clone().add(v.multiplyScalar(dist));
					return result;
				}
			}

			setPosition(x: number, y: number, z: number, lerp = false) {
				// https://www.gamedeveloper.com/programming/improved-lerp-smoothing-
				const rate = 2 ** Math.log2(this.trackingDelay * 3); // 3 is magic number to kind of match the old behavior in Phaser
				const t = lerp ? 1 - 2 ** (-rate * this.dt) : 1;
				const oldTarget = this.controls.target.clone();
				const diff = new THREE.Vector3(x, y, z).sub(oldTarget);
				this.controls.target.lerp(this.controls.target.clone().add(diff), t);
				this.orthographicCamera.position.lerp(this.orthographicCamera.position.clone().add(diff), t);
				this.perspectiveCamera.position.lerp(this.perspectiveCamera.position.clone().add(diff), t);
				this.cameraP.copy(this.perspectiveCamera);
				this.cameraO.copy(this.orthographicCamera);
			}

			setPosition2D(x: number, z: number, lerp = false) {
				this.setPosition(x, this.controls.target.y, z, lerp);
			}

			onChange(cb: () => void) {
				this.onChangeCbs.push(cb);
			}

			setEditorMode(state: boolean) {
				this.isEditorMode = state;

				if (this.isEditorMode) {
					this.controls.enablePan = true;
					this.controls.enableRotate = true;
					this.controls.enableZoom = true;

					this.controls.minPolarAngle = 0;
					this.controls.maxPolarAngle = Math.PI;
				} else {
					this.controls.enablePan = false;
					this.controls.enableRotate = false;
					this.controls.enableZoom = false;

					this.controls.maxPolarAngle = Math.PI * 0.5 - this.minElevationAngle;
					this.controls.minPolarAngle = Math.PI * 0.5 - this.maxElevationAngle;

					this.setElevationAngle(this.elevationAngle);
					this.setAzimuthAngle(this.azimuthAngle);
					this.setZoom(this.lastAuthoritativeZoom);

					if (this.target) {
						const targetWorldPos = new THREE.Vector3();
						this.target.getWorldPosition(targetWorldPos);
						this.setPosition(targetWorldPos.x, targetWorldPos.y, targetWorldPos.z);
					}
				}
			}

			private switchToOrthographicCamera() {
				this.isPerspective = false;
				this.orthographicCamera.position.copy(this.perspectiveCamera.position);
				this.orthographicCamera.quaternion.copy(this.perspectiveCamera.quaternion);

				this.orthographicCamera.zoom = this.zoom;
				this.orthographicCamera.lookAt(this.controls.target);
				this.orthographicCamera.updateProjectionMatrix();
				this.controls.object = this.orthographicCamera;

				this.cameraO.copy(this.orthographicCamera);
				this.instance = this.cameraO;

				this.controls.update();
			}

			private switchToPerspectiveCamera() {
				this.isPerspective = true;
				this.perspectiveCamera.position.copy(this.orthographicCamera.position);
				this.perspectiveCamera.quaternion.copy(this.orthographicCamera.quaternion);

				const yFovDeg = this.perspectiveCamera.fov * (Math.PI / 180);
				const distance = this.orthographicCamera.top / Math.tan(yFovDeg * 0.5) / this.orthographicCamera.zoom;
				const newPos = new THREE.Vector3()
					.subVectors(this.perspectiveCamera.position, this.controls.target)
					.normalize()
					.multiplyScalar(distance)
					.add(this.controls.target);

				this.perspectiveCamera.position.copy(newPos);
				this.perspectiveCamera.lookAt(this.controls.target);
				this.perspectiveCamera.updateProjectionMatrix();
				this.controls.object = this.perspectiveCamera;

				this.cameraP.copy(this.perspectiveCamera);
				this.instance = this.cameraP;

				this.controls.update();
			}

			private onMouseDown(event: MouseEvent) {
				//A camera should not have knowledge of "tools", but rather outside code
				if (taro.developerMode.regionTool) {
					this.controls.enablePan = false;
					this.controls.enableRotate = false;
					this.controls.enableZoom = false;
				} else if (!this.isEditorMode && !this.isLocked && (this.target as Unit)?.cameraConfig?.pointerLock) {
					this.lock();
				}
			}

			private onMouseMove(event: MouseEvent) {
				if (this.isLocked === false) return;

				const movementX = event.movementX || 0;
				const movementY = event.movementY || 0;

				this.euler.y = -movementX * 0.2 * this.pointerlockSpeed;
				this.euler.x = movementY * 0.2 * this.pointerlockSpeed;

				this.setElevationAngle(this.elevationAngle + this.euler.x);
				this.setAzimuthAngle(this.azimuthAngle + this.euler.y);
			}

			onTouchStart(event) {
				const touch = event.touches[0];
				this.touchStart.x = touch.clientX;
				this.touchStart.y = touch.clientY;
			}

			onTouchMove(event) {
				if (event.target.tagName.toLowerCase() !== 'canvas' || !taro.client?.selectedUnit?._stats?.cameraPointerLock) {
					return;
				}

				const touch = event.touches[0];
				const deltaX = touch.clientX - this.touchStart.x;
				const deltaY = touch.clientY - this.touchStart.y;

				// Normalize the values to range between -1 and 1
				let normalizedX = deltaX / window.innerWidth;
				let normalizedY = deltaY / window.innerHeight;

				// Clamp the values between -1 and 1
				normalizedX = Math.max(Math.min(normalizedX, 1), -1);
				normalizedY = Math.max(Math.min(normalizedY, 1), -1);

				// Calculate the drag value based on the direction and magnitude
				this.dragValue.x = normalizedX * 30; // Adjust strength as needed
				this.dragValue.y = normalizedY * 30; // Adjust strength as needed

				this.euler.y = -this.dragValue.x * 1 * this.pointerlockSpeed;
				this.euler.x = this.dragValue.y * 1 * this.pointerlockSpeed;

				this.setElevationAngle(this.elevationAngle + this.euler.x);
				this.setAzimuthAngle(this.azimuthAngle + this.euler.y);
			}
			onTouchEnd(event) {
				// Reset the drag value when the touch ends
				this.dragValue.x = 0;
				this.dragValue.y = 0;
			}

			private onPointerlockChange() {
				this.isLocked = this.canvas.ownerDocument.pointerLockElement === this.canvas;
			}

			private onPointerlockError() {
				console.error('PointerLockControls: Unable to use Pointer Lock API');
			}
		}
	}
}
