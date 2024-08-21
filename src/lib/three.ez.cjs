(function (c, o) {
	typeof exports == 'object' && typeof module < 'u'
		? o(exports, require('three'))
		: typeof define == 'function' && define.amd
			? define(['exports', 'three'], o)
			: ((c = typeof globalThis < 'u' ? globalThis : c || self), o((c.Main = {}), c.three));
})(this, function (c, o) {
	'use strict';
	if (o === undefined) {
		o = THREE;
	}
	class M {
		static detectChanges(t, e) {
			if ((this.executeAllCallbacks(t), e)) for (const i of t.children) this.detectChanges(i, !0);
		}
		static bindProperty(t, e, i, s) {
			if (this.getIndexByKey(e, t) > -1) {
				console.error('Cannot override property already bound.');
				return;
			}
			this.addToBoundCallbacks(t, e, i.bind(e), s), e.scene && this.bindToScene(e);
		}
		static addToBoundCallbacks(t, e, i, s) {
			const r = this.createSetValue(t, e, s),
				a = { key: t, getValue: i, setValue: r };
			e.__boundCallbacks.push(a), this.executeCallback(a);
		}
		static createSetValue(t, e, i) {
			return i
				? (s) => {
						s !== e[t] && ((e[t] = s), (e.needsRender = !0));
					}
				: (s) => {
						s !== e[t] && (e[t] = s);
					};
		}
		static getIndexByKey(t, e) {
			const i = t.__boundCallbacks;
			for (let s = 0; s < i.length; s++) if (i[s].key === e) return s;
			return -1;
		}
		static setManualDetectionMode(t) {
			t.__manualDetection ||
				(t.__boundCallbacks.length > 0
					? console.error('Cannot change detectChangesMode if a binding is already created.')
					: (t.__manualDetection = !0));
		}
		static bindToScene(t) {
			t.__boundCallbacks.length > 0 && t.scene.__boundObjects.add(t);
		}
		static unbindFromScene(t) {
			t.scene.__boundObjects.delete(t);
		}
		static unbindProperty(t, e) {
			const i = this.getIndexByKey(t, e);
			i > -1 && (t.__boundCallbacks.splice(i, 1), t.scene && this.unbindFromScene(t));
		}
		static executeCallback(t) {
			t.setValue(t.getValue());
		}
		static executeAllCallbacks(t) {
			const e = t.__boundCallbacks;
			for (const i of e) this.executeCallback(i);
		}
		static compute(t) {
			const e = t.__boundObjects;
			for (const i of e) this.executeAllCallbacks(i);
		}
	}
	class ee extends o.OrthographicCamera {
		constructor(t = 2, e = !0, i, s) {
			super(-1, 1, 1, -1, i, s),
				(this._width = -1),
				(this._height = -1),
				(this._size = t),
				(this._fixedWidth = e),
				this.on('viewportresize', (r) => {
					(this._width = r.width), (this._height = r.height), this.update();
				});
		}
		get size() {
			return this._size;
		}
		set size(t) {
			(this._size = t), this.update();
		}
		get fixedWidth() {
			return this._fixedWidth;
		}
		set fixedWidth(t) {
			(this._fixedWidth = t), this.update();
		}
		update() {
			const t = 0.5 * this._size;
			if (this._fixedWidth) {
				const e = this._height / this._width;
				(this.left = -t), (this.right = t), (this.top = t * e), (this.bottom = -t * e);
			} else {
				const e = this._width / this._height;
				(this.left = -t * e), (this.right = t * e), (this.top = t), (this.bottom = -t);
			}
			this.updateProjectionMatrix();
		}
	}
	class ie extends o.PerspectiveCamera {
		constructor(t, e, i) {
			super(t, void 0, e, i),
				this.on('viewportresize', (s) => {
					(this.aspect = s.width / s.height), this.updateProjectionMatrix();
				});
		}
	}
	const se = new Set([
		'auto',
		'default',
		'none',
		'context-menu',
		'help',
		'pointer',
		'progress',
		'wait',
		'cell',
		'crosshair',
		'text',
		'vertical-text',
		'alias',
		'copy',
		'move',
		'no-drop',
		'not-allowed',
		'grab',
		'grabbing',
		'all-scroll',
		'col-resize',
		'row-resize',
		'n-resize',
		'e-resize',
		's-resize',
		'w-resize',
		'ne-resize',
		'nw-resize',
		'se-resize',
		'sw-resize',
		'ew-resize',
		'ns-resize',
		'nesw-resize',
		'nwse-resize',
		'zoom-in',
		'zoom-out',
	]);
	class Mt {
		constructor(t) {
			(this.enabled = !0), (this._domElement = t);
		}
		update(t, e, i) {
			if (!this.enabled || !e) return;
			const s = this.getCursor(t, e, i);
			s !== this._cursor &&
				((this._cursor = s),
				se.has(s) ? (this._domElement.style.cursor = s) : (this._domElement.style.cursor = `url(${s}), default`));
		}
		getCursor(t, e, i) {
			if (i) return i.cursorDrop ?? 'alias';
			if (t) return t.cursorDrag ?? 'grabbing';
			if (e.cursor) return e.cursor;
			if (e.isInstancedMesh2) {
				if (!e.__enabledStateHovered) return 'default';
			} else if (!e.enabledState) return 'default';
			return e.draggable ? 'grab' : 'pointer';
		}
	}
	class I {
		constructor(t = !1) {
			(this.timeStamp = performance.now()), (this.cancelable = t);
		}
		get bubbles() {
			return this._bubbles;
		}
		get defaultPrevented() {
			return this._defaultPrevented;
		}
		get target() {
			return this._target;
		}
		get type() {
			return this._type;
		}
		preventDefault() {
			this._defaultPrevented = !0;
		}
		stopImmediatePropagation() {
			this._stoppedImmediatePropagation = !0;
		}
		stopPropagation() {
			this._bubbles = !1;
		}
	}
	class $ extends I {
		get altKey() {
			return this.domEvent.altKey;
		}
		get button() {
			return this.domEvent.button;
		}
		get buttons() {
			return this.domEvent.buttons;
		}
		get clientX() {
			return this.domEvent.clientX;
		}
		get clientY() {
			return this.domEvent.clientY;
		}
		get ctrlKey() {
			return this.domEvent.ctrlKey;
		}
		get metaKey() {
			return this.domEvent.metaKey;
		}
		get movementX() {
			return this.domEvent.movementX;
		}
		get movementY() {
			return this.domEvent.movementY;
		}
		get offsetX() {
			return this.domEvent.offsetX;
		}
		get offsetY() {
			return this.domEvent.offsetY;
		}
		get pageX() {
			return this.domEvent.pageX;
		}
		get pageY() {
			return this.domEvent.pageY;
		}
		get screenX() {
			return this.domEvent.screenX;
		}
		get screenY() {
			return this.domEvent.screenY;
		}
		get shiftKey() {
			return this.domEvent.shiftKey;
		}
		constructor(t, e, i, s) {
			super(s), (this.domEvent = t), (this.intersection = e), (this.relatedTarget = i);
		}
		getModifierState(t) {
			return this.domEvent.getModifierState(t);
		}
	}
	class y extends $ {
		get pointerId() {
			return this.domEvent.pointerId;
		}
		get width() {
			return this.domEvent.width;
		}
		get height() {
			return this.domEvent.height;
		}
		get pressure() {
			return this.domEvent.pressure;
		}
		get tangentialPressure() {
			return this.domEvent.tangentialPressure;
		}
		get tiltX() {
			return this.domEvent.tiltX;
		}
		get tiltY() {
			return this.domEvent.tiltY;
		}
		get twist() {
			return this.domEvent.twist;
		}
		get pointerType() {
			return this.domEvent.pointerType;
		}
		get isPrimary() {
			return this.domEvent.isPrimary;
		}
	}
	class P extends y {
		constructor(t, e, i = {}, s, r, a) {
			super(t, a, r, e), (this.position = s), (this.dataTransfer = i);
		}
	}
	class J extends $ {
		get deltaMode() {
			return this.domEvent.deltaMode;
		}
		get deltaX() {
			return this.domEvent.deltaX;
		}
		get deltaY() {
			return this.domEvent.deltaY;
		}
		get deltaZ() {
			return this.domEvent.deltaZ;
		}
	}
	class tt extends I {
		constructor(t) {
			super(), (this.intersection = t);
		}
	}
	class j extends I {
		get altKey() {
			return this.domEvent.altKey;
		}
		get code() {
			return this.domEvent.code;
		}
		get ctrlKey() {
			return this.domEvent.ctrlKey;
		}
		get key() {
			return this.domEvent.key;
		}
		get location() {
			return this.domEvent.location;
		}
		get metaKey() {
			return this.domEvent.metaKey;
		}
		get repeat() {
			return this.domEvent.repeat;
		}
		get shiftKey() {
			return this.domEvent.shiftKey;
		}
		constructor(t, e) {
			super(e), (this.domEvent = t);
		}
		getModifierState(t) {
			return this.domEvent.getModifierState(t);
		}
	}
	class D extends I {
		constructor(t) {
			super(), (this.relatedTarget = t);
		}
	}
	class Ct {
		constructor(t) {
			(this.isDragging = !1),
				(this.dragButtons = [0]),
				(this._plane = new o.Plane()),
				(this._offset = new o.Vector3()),
				(this._intersection = new o.Vector3()),
				(this._worldPosition = new o.Vector3()),
				(this._inverseMatrix = new o.Matrix4()),
				(this._startPosition = new o.Vector3()),
				(this._originalIntersection = new o.Vector3()),
				(this._targetMatrixWorld = new o.Matrix4()),
				(this._raycaster = t);
		}
		get target() {
			return this._target;
		}
		get findDropTarget() {
			return this._target.findDropTarget;
		}
		needsDrag(t, e) {
			return this.isDragging ? !0 : this._target ? (this.startDragging(t, e), !0) : !1;
		}
		performDrag(t, e, i) {
			if (!t.isPrimary) return;
			this._plane.setFromNormalAndCoplanarPoint(
				e.getWorldDirection(this._plane.normal),
				this._worldPosition.setFromMatrixPosition(this._targetMatrixWorld)
			),
				this._raycaster.ray.intersectPlane(this._plane, this._intersection),
				this._intersection.sub(this._offset).applyMatrix4(this._inverseMatrix),
				this._originalIntersection.copy(this._intersection);
			const s = this.trigger('drag', t, this._target, !0, this._intersection, i == null ? void 0 : i.object, i);
			this._targetInstanced
				? !s._defaultPrevented &&
					!this._targetInstanced.position.equals(this._intersection) &&
					(this._targetInstanced.position.copy(this._intersection),
					this._targetInstanced.updateMatrix(),
					this._offset.add(this._originalIntersection.sub(this._targetInstanced.position)))
				: !s._defaultPrevented &&
					!this._target.position.equals(this._intersection) &&
					(this._target.position.copy(this._intersection),
					this._offset.add(this._originalIntersection.sub(this._target.position))),
				this.dropTargetEvent(t, i);
		}
		initDrag(t, e, i, s) {
			this.isDragButton(t) &&
				e != null &&
				e.draggable &&
				(i >= 0
					? e.isInstancedMesh2 &&
						e.__enabledStateHovered &&
						((this._targetInstanced = e.instances[i]), (this._target = e), (this._startIntersection = s))
					: e.enabledState && ((this._target = e.dragTarget ?? e), (this._startIntersection = s)));
		}
		startDragging(t, e) {
			const i = this._targetInstanced ?? this._target;
			(this._target.__dragging = !0),
				(this.isDragging = !0),
				this._startPosition.copy(i.position),
				this.trigger('dragstart', t, this._target, !1, void 0, void 0, this._startIntersection);
			const s = i.matrixWorld;
			this._plane.setFromNormalAndCoplanarPoint(
				e.getWorldDirection(this._plane.normal),
				this._worldPosition.setFromMatrixPosition(s)
			),
				this._raycaster.ray.intersectPlane(this._plane, this._intersection),
				this._targetMatrixWorld.copy(s),
				this._inverseMatrix.copy(i.parent.matrixWorld).invert(),
				this._offset.copy(this._intersection).sub(this._worldPosition.setFromMatrixPosition(s)),
				i.findDropTarget && (this._dataTransfer = {});
		}
		cancelDragging(t) {
			if (this._target) {
				if (this.trigger('dragcancel', t, this._target, !0, void 0, this._lastDropTarget)._defaultPrevented) return !1;
				this._targetInstanced
					? this._targetInstanced.position.equals(this._startPosition) ||
						(this._targetInstanced.position.copy(this._startPosition), this._targetInstanced.updateMatrix())
					: this._target.position.equals(this._startPosition) || this._target.position.copy(this._startPosition),
					this.trigger('dragcancel', t, this._lastDropTarget, !1, void 0, this._target),
					this.dragEnd(t),
					this.clear();
			}
			return !0;
		}
		stopDragging(t) {
			return t.isPrimary
				? this.isDragging
					? (this.trigger('drop', t, this._lastDropTarget, !1, void 0, this._target), this.dragEnd(t), this.clear(), !0)
					: ((this._target = void 0), (this._targetInstanced = void 0), !1)
				: !1;
		}
		dragEnd(t) {
			this.trigger('dragend', t, this._target, !1, void 0, this._lastDropTarget);
		}
		clear() {
			(this.isDragging = !1),
				(this._target.__dragging = !1),
				(this._target = void 0),
				(this._targetInstanced = void 0),
				(this._dataTransfer = void 0),
				(this._lastDropTarget = void 0);
		}
		trigger(t, e, i, s, r, a, h) {
			if (i) {
				const l = new P(e, s, this._dataTransfer, r, a, h);
				return i.__eventsDispatcher.dispatchDOMAncestor(t, l), l;
			}
		}
		dropTargetEvent(t, e) {
			if (this.findDropTarget) {
				const i = e == null ? void 0 : e.object,
					s = this._lastDropTarget,
					r = e == null ? void 0 : e.point;
				(this._lastDropTarget = i),
					i !== s &&
						(this.trigger('dragleave', t, s, !1, r, this._target, e),
						this.trigger('dragenter', t, i, !1, r, this._target, e)),
					this.trigger('dragover', t, i, !1, r, this._target, e);
			}
		}
		isDragButton(t) {
			return (
				t.isPrimary &&
				((t.pointerType === 'mouse' && this.dragButtons.some((e) => e === t.button)) || t.pointerType !== 'mouse')
			);
		}
	}
	class Dt {
		constructor() {
			this._items = [];
		}
		enqueue(t) {
			(!this.multitouch && t.isPrimary === !1) || (this.isValidEvent(t) && this._items.push(t));
		}
		isValidEvent(t) {
			if (t.type === 'pointermove')
				for (let e = this._items.length - 1; e >= 0; e--) {
					const i = this._items[e];
					if (i.pointerId === t.pointerId) {
						const s = i.type;
						if (s === 'pointermove') return (this._items[e] = t), !1;
						if (s === 'pointerdown' || s === 'pointerout' || s === 'pointerover' || s === 'pointerup') break;
					}
				}
			return !0;
		}
		dequeue() {
			const t = this._items;
			return (this._items = []), t;
		}
	}
	class xt {
		constructor(t) {
			(this.raycaster = new o.Raycaster()),
				(this.raycasterSortComparer = (e, i) => e.distance - i.distance),
				(this.pointer = new o.Vector2()),
				(this.pointerOnCanvas = !1),
				(this._computedPointer = new o.Vector2()),
				(this._renderManager = t);
		}
		getIntersections(t, e, i) {
			const s = [];
			if (
				(this.pointer.set(t.offsetX, t.offsetY),
				this.getComputedMousePosition(this.pointer, this._computedPointer, e, t.isPrimary))
			) {
				const r = this._renderManager.activeScene,
					a = this._renderManager.activeView.camera;
				this.raycaster.setFromCamera(this._computedPointer, a),
					(this.raycaster.far = a.far ?? 1 / 0),
					(!e || i) && this.raycastObjects(r, s, i),
					s.sort(this.raycasterSortComparer);
			}
			return s;
		}
		getComputedMousePosition(t, e, i, s) {
			!i && s && this._renderManager.updateActiveView(t, this.pointerOnCanvas);
			const r = this._renderManager.activeView;
			if (!(r != null && r.enabled) || r !== this._renderManager.hoveredView) return !1;
			const a = r.computedViewport;
			return e.set(((t.x - a.left) / a.width) * 2 - 1, ((t.y - a.top) / a.height) * -2 + 1), !0;
		}
		raycastObjects(t, e, i) {
			if (t !== i) {
				if (t.interceptByRaycaster && t.visible) {
					for (const r of t.children) this.raycastObjects(r, e, i);
					let s = e.length;
					if (t.hitboxes)
						for (const r of t.hitboxes)
							r.updateMatrix(),
								r.matrixWorld.multiplyMatrices(t.matrixWorld, r.matrix),
								this.raycaster.intersectObject(r, !1, e);
					else this.raycaster.intersectObject(t, !1, e);
					for (; e.length > s; ) {
						const r = e[s];
						(r.hitbox = r.object), (r.object = t), s++;
					}
				}
				return e;
			}
		}
	}
	class Pt {
		constructor(t) {
			(this.queue = new Dt()),
				(this._intersection = {}),
				(this._pointerDownTarget = {}),
				(this._lastPointerDown = {}),
				(this._lastPointerMove = {}),
				(this._lastHoveredTarget = {}),
				(this._mouseDetected = !1),
				(this._isTapping = !1),
				(this._renderManager = t);
			const e = t.renderer;
			this.registerRenderer(e),
				(this.cursorManager = new Mt(e.domElement)),
				(this.raycasterManager = new xt(t)),
				(this.dragManager = new Ct(this.raycasterManager.raycaster));
		}
		registerRenderer(t) {
			t.domElement.addEventListener('pointermove', (e) => (this._mouseDetected = e.pointerType === 'mouse')),
				t.domElement.addEventListener(
					'pointerdown',
					(e) => (this._isTapping = e.pointerType !== 'mouse' && e.isPrimary)
				),
				t.domElement.addEventListener('pointerup', (e) => this._isTapping && (this._isTapping = !e.isPrimary)),
				t.domElement.addEventListener('pointercancel', (e) => this._isTapping && (this._isTapping = !e.isPrimary)),
				this.bindEvents(t);
		}
		bindEvents(t) {
			const e = t.domElement;
			e.addEventListener('pointerenter', this.enqueue.bind(this)),
				e.addEventListener('pointerleave', this.enqueue.bind(this)),
				e.addEventListener('pointerdown', this.enqueue.bind(this)),
				e.addEventListener('pointermove', this.enqueue.bind(this)),
				document.addEventListener('pointerup', this.enqueue.bind(this)),
				document.addEventListener('pointercancel', this.enqueue.bind(this)),
				e.addEventListener('wheel', this.enqueue.bind(this), { passive: !0 }),
				(e.tabIndex = -1),
				e.addEventListener('keydown', this.enqueue.bind(this)),
				e.addEventListener('keyup', this.enqueue.bind(this));
		}
		enqueue(t) {
			this.queue.enqueue(t);
		}
		update() {
			var e, i;
			this._primaryRaycasted = !1;
			for (const s of this.queue.dequeue()) this.computeQueuedEvent(s);
			this.pointerIntersection();
			const t =
				((e = this._intersection[this._primaryIdentifier]) == null ? void 0 : e.object) ??
				this._renderManager.activeScene;
			this.cursorManager.update(
				this.dragManager.target,
				t,
				(i = this._intersectionDropTarget) == null ? void 0 : i.object
			);
		}
		raycastScene(t) {
			if ((this.handlePrimaryIdentifier(t), this.dragManager.isDragging)) {
				if (!t.isPrimary) return;
				const e = this.raycasterManager.getIntersections(
					t,
					!0,
					this.dragManager.findDropTarget ? this.dragManager.target : void 0
				);
				this.setDropTarget(e);
			} else {
				const e = this.raycasterManager.getIntersections(t, !1);
				this._intersection[t.pointerId] = e[0];
				const i = this._renderManager.activeScene;
				i && t.isPrimary && (i.intersections = e);
			}
		}
		handlePrimaryIdentifier(t) {
			t.isPrimary &&
				((this._primaryRaycasted = !0),
				this._primaryIdentifier !== t.pointerId &&
					(this.clearPointerId(this._primaryIdentifier), (this._primaryIdentifier = t.pointerId)));
		}
		triggerPointer(t, e, i, s) {
			if (i != null && i.enabledState) {
				const r = new y(e, this._intersection[e.pointerId], s);
				i.__eventsDispatcher.dispatchDOM(t, r);
			}
		}
		triggerAncestorPointer(t, e, i, s, r) {
			if (i != null && i.enabledState) {
				const a = new y(e, this._intersection[e.pointerId], s, r);
				return i.__eventsDispatcher.dispatchDOMAncestor(t, a), a;
			}
		}
		triggerAncestorWheel(t, e) {
			const i = (e == null ? void 0 : e.object) ?? this._renderManager.activeScene;
			if (i != null && i.enabledState) {
				const s = new J(t, e);
				i.__eventsDispatcher.dispatchDOMAncestor('wheel', s);
			}
		}
		triggerAncestorKeyboard(t, e, i) {
			const s = this._renderManager.activeScene,
				r = s.focusedObject ?? s;
			if (r.enabledState) {
				const a = new j(e, i);
				return r.__eventsDispatcher.dispatchDOMAncestor(t, a), a;
			}
		}
		computeQueuedEvent(t) {
			switch (t.type) {
				case 'pointerenter':
					return this.pointerEnter(t);
				case 'pointerleave':
					return this.pointerLeave(t);
				case 'pointermove':
					return this.pointerMove(t);
				case 'pointerdown':
					return this.pointerDown(t);
				case 'pointerup':
				case 'pointercancel':
					return this.pointerUp(t);
				case 'wheel':
					return this.wheel(t);
				case 'keydown':
					return this.keyDown(t);
				case 'keyup':
					return this.keyUp(t);
				default:
					console.error('Error: computeEvent failed.');
			}
		}
		isMainClick(t) {
			return t.isPrimary && ((t.pointerType === 'mouse' && t.button === 0) || t.pointerType !== 'mouse');
		}
		pointerDown(t) {
			t.pointerType !== 'mouse' && this.pointerMove(t);
			const e = this._intersection[t.pointerId],
				i = (e == null ? void 0 : e.object) ?? this._renderManager.activeScene;
			if (i === void 0) return;
			const s = this.triggerAncestorPointer('pointerdown', t, i, void 0, !0);
			if (
				((this._lastPointerDown[t.pointerId] = t),
				(this._pointerDownTarget[t.pointerId] = i),
				this.isMainClick(t) && (i.__clicking = !0),
				!(s != null && s._defaultPrevented) && t.isPrimary)
			) {
				const r = this._renderManager.activeScene,
					a = i == null ? void 0 : i.firstFocusable;
				(a || (r != null && r.blurOnClickOut)) && r.focus(a);
			}
			this.dragManager.initDrag(t, i, e == null ? void 0 : e.instanceId, e);
		}
		pointerEnter(t) {
			this.raycasterManager.pointerOnCanvas = !0;
		}
		pointerLeave(t) {
			(this.raycasterManager.pointerOnCanvas = !1), (this._lastPointerMove[t.pointerId] = t);
		}
		pointerMove(t) {
			var i, s;
			(this._lastPointerMove[t.pointerId] = t), this.raycastScene(t);
			const e = (i = this._renderManager.activeView) == null ? void 0 : i.camera;
			if (this.dragManager.needsDrag(t, e)) this.dragManager.performDrag(t, e, this._intersectionDropTarget);
			else {
				this.pointerOutOver(t);
				const r =
					((s = this._intersection[t.pointerId]) == null ? void 0 : s.object) ?? this._renderManager.activeScene;
				this.triggerAncestorPointer('pointermove', t, r);
			}
		}
		pointerIntersection() {
			var t, e;
			if (this.dragManager.isDragging) {
				if (
					!this._primaryRaycasted &&
					this.dragManager.findDropTarget &&
					(t = this._renderManager.activeScene) != null &&
					t.continuousRaycastingDropTarget
				) {
					const i = this._lastPointerMove[this._primaryIdentifier] || this._lastPointerDown[this._primaryIdentifier];
					this.raycastScene(i), this.dragManager.dropTargetEvent(i, this._intersectionDropTarget);
				}
			} else if (
				(e = this._renderManager.hoveredScene) != null &&
				e.continuousRaycasting &&
				(this._mouseDetected || this._isTapping)
			) {
				if (!this._primaryRaycasted) {
					const r = this._lastPointerMove[this._primaryIdentifier] || this._lastPointerDown[this._primaryIdentifier];
					this.raycastScene(r), this.pointerOutOver(r);
				}
				const i = this._intersection[this._primaryIdentifier],
					s = (i == null ? void 0 : i.object) ?? this._renderManager.hoveredScene;
				s != null && s.enabledState && s.__eventsDispatcher.dispatchDOMAncestor('pointerintersection', new tt(i));
			}
		}
		wheel(t) {
			this.triggerAncestorWheel(t, this._intersection[this._primaryIdentifier]);
		}
		pointerOutOver(t) {
			var s;
			const e = ((s = this._intersection[t.pointerId]) == null ? void 0 : s.object) ?? this._renderManager.activeScene,
				i = this._lastHoveredTarget[t.pointerId];
			e !== i &&
				(t.isPrimary && (i && (i.__hovered = !1), (e.__hovered = !0)),
				(this._lastHoveredTarget[t.pointerId] = e),
				this.triggerAncestorPointer('pointerout', t, i, e),
				this.triggerPointer('pointerleave', t, i, e),
				this.triggerAncestorPointer('pointerover', t, e, i),
				this.triggerPointer('pointerenter', t, e, i));
		}
		pointerUp(t) {
			var s;
			const e = this._pointerDownTarget[t.pointerId];
			if (!e && !this.raycasterManager.pointerOnCanvas) return;
			const i = ((s = this._intersection[t.pointerId]) == null ? void 0 : s.object) ?? this._renderManager.activeScene;
			t.pointerType !== 'mouse' &&
				((i.__hovered = !1),
				this.triggerAncestorPointer('pointerout', t, i),
				this.triggerPointer('pointerleave', t, i)),
				this.dragManager.stopDragging(t)
					? this.setDropTarget([])
					: (this.triggerAncestorPointer('pointerup', t, i, e), i === e && this.triggerAncestorPointer('click', t, i)),
				t.type === 'pointerup' && this.dblClick(t, i),
				e && this.isMainClick(t) && (e.__clicking = !1),
				t.pointerId !== this._primaryIdentifier && this.clearPointerId(t.pointerId);
		}
		clearPointerId(t) {
			delete this._intersection[t],
				delete this._pointerDownTarget[t],
				delete this._lastPointerDown[t],
				delete this._lastPointerMove[t],
				delete this._lastHoveredTarget[t];
		}
		dblClick(t, e) {
			this.isMainClick(t) &&
				(e === this._lastClickTarget && t.timeStamp - this._lastClickTimeStamp <= 300
					? (this.triggerAncestorPointer('dblclick', t, e), (this._lastClickTimeStamp = void 0))
					: ((this._lastClickTarget = e), (this._lastClickTimeStamp = t.timeStamp)));
		}
		keyDown(t) {
			const e = this.triggerAncestorKeyboard('keydown', t, !0);
			(e != null && e._defaultPrevented) ||
				((t.key === 'Escape' || t.key === 'Esc') &&
					this.dragManager.cancelDragging(this._lastPointerMove[this._primaryIdentifier]) &&
					this.setDropTarget([]));
		}
		keyUp(t) {
			this.triggerAncestorKeyboard('keyup', t, !1);
		}
		setDropTarget(t) {
			const e = t[0];
			this._intersectionDropTarget = e != null && e.object.__isDropTarget && e.object.enabledState ? e : void 0;
			const i = this._renderManager.activeScene;
			i && (i.intersectionsDropTarget = t);
		}
	}
	const X = class X {
		static push(t, e) {
			const i = e.scene;
			i && this._allowedEventsSet.has(t) && this.pushScene(i, t, e);
		}
		static update(t) {
			this.updateEvent(t, 'viewportresize'),
				this.updateEvent(t, 'beforeanimate'),
				this.updateEvent(t, 'animate'),
				this.updateEvent(t, 'afteranimate');
		}
		static updateEvent(t, e) {
			var i;
			((i = t.__eventsDispatcher.listeners[e]) == null ? void 0 : i.length) > 0 && this.pushScene(t.scene, e, t);
		}
		static pushScene(t, e, i) {
			const s = this._events[t.id] ?? (this._events[t.id] = {});
			(s[e] ?? (s[e] = new Set())).add(i);
		}
		static removeAll(t) {
			var i;
			const e = this._events[(i = t.scene) == null ? void 0 : i.id];
			if (e) for (const s in e) e[s].delete(t);
		}
		static remove(t, e) {
			var s, r;
			const i = this._events[(s = e.scene) == null ? void 0 : s.id];
			i && ((r = i[t]) == null || r.delete(e));
		}
		static dispatchEvent(t, e, i) {
			const s = this._events[t == null ? void 0 : t.id];
			if (s != null && s[e]) for (const r of s[e]) r.__eventsDispatcher.dispatch(e, i);
		}
		static dispatchEventExcludeCameras(t, e, i) {
			const s = this._events[t == null ? void 0 : t.id];
			if (s != null && s[e]) for (const r of s[e]) r.isCamera || r.__eventsDispatcher.dispatch(e, i);
		}
	};
	(X._allowedEventsSet = new Set(['viewportresize', 'beforeanimate', 'animate', 'afteranimate'])), (X._events = {});
	let b = X;
	const w = new o.Vector4(),
		S = {};
	function St(n) {
		const t = n.render.bind(n);
		n.render = function (e, i) {
			this.getViewport(w), ne(this, e, i), t(e, i);
		};
	}
	function ne(n, t, e) {
		var a;
		let i;
		S[t.id] || (S[t.id] = new o.Vector4(-1));
		const s = S[t.id];
		(s.z !== w.z || s.w !== w.w) &&
			(s.copy(w),
			(i = { renderer: n, camera: e, width: w.z, height: w.w }),
			b.dispatchEventExcludeCameras(t, 'viewportresize', i)),
			S[e.id] || (S[e.id] = new o.Vector4(-1));
		const r = S[e.id];
		(r.z !== w.z || r.w !== w.w) &&
			(r.copy(w),
			(a = e.__eventsDispatcher) == null ||
				a.dispatch('viewportresize', i ?? { renderer: n, camera: e, width: w.z, height: w.w }));
	}
	class kt {
		constructor(t, e) {
			(this.computedViewport = { left: 0, bottom: 0, width: 0, height: 0, top: 0 }),
				(this._rendererSize = e),
				(this.scene = t.scene),
				(this.camera = t.camera),
				(this.viewport = t.viewport),
				(this.tags = t.tags),
				(this._visible = t.visible ?? !0),
				(this.enabled = t.enabled ?? !0),
				(this.backgroundAlpha = t.backgroundAlpha),
				(this.backgroundColor = t.backgroundColor !== void 0 ? new o.Color(t.backgroundColor) : void 0),
				(this.composer = t.composer),
				(this._onBeforeRender = t.onBeforeRender),
				(this._onAfterRender = t.onAfterRender),
				this.scene.add(this.camera),
				this.update();
		}
		get visible() {
			return this._visible;
		}
		set visible(t) {
			this._visible !== t && ((this._visible = t), (this.scene.needsRender = !0));
		}
		update() {
			var t;
			this.viewport
				? ((this.computedViewport.left = Math.floor(this._rendererSize.x * this.viewport.left)),
					(this.computedViewport.bottom = Math.floor(this._rendererSize.y * this.viewport.bottom)),
					(this.computedViewport.width = Math.floor(this._rendererSize.x * this.viewport.width)),
					(this.computedViewport.height = Math.floor(this._rendererSize.y * this.viewport.height)),
					(this.computedViewport.top = Math.floor(
						this._rendererSize.y - this.computedViewport.bottom - this.computedViewport.height
					)))
				: ((this.computedViewport.width = this._rendererSize.x), (this.computedViewport.height = this._rendererSize.y)),
				(t = this.composer) == null || t.setSize(this.computedViewport.width, this.computedViewport.height),
				(this.scene.needsRender = !0);
		}
		onBeforeRender() {
			var t;
			(t = this._onBeforeRender) == null || t.apply(this);
		}
		onAfterRender() {
			var t;
			(t = this._onAfterRender) == null || t.apply(this);
		}
	}
	class zt {
		constructor(t = {}, e = !0, i = 0, s = 1) {
			(this.views = []),
				(this._visibleScenes = new Set()),
				(this._rendererSize = new o.Vector2()),
				(this.renderer = new o.WebGLRenderer(t)),
				this.renderer.setPixelRatio(window.devicePixelRatio),
				St(this.renderer),
				this.appendCanvas(t),
				(this._fullscreen = e),
				(this._backgroundAlpha = s),
				(this._backgroundColor = new o.Color(i)),
				window.addEventListener('resize', this.onResize.bind(this)),
				this.updateRenderSize(),
				this.renderer.setClearColor(this._backgroundColor, this._backgroundAlpha);
		}
		get activeScene() {
			var t;
			return (t = this.activeView) == null ? void 0 : t.scene;
		}
		get hoveredScene() {
			var t;
			return (t = this.hoveredView) == null ? void 0 : t.scene;
		}
		get fullscreen() {
			return this._fullscreen;
		}
		set fullscreen(t) {
			(this._fullscreen = t), this.updateRenderSize();
		}
		get backgroundColor() {
			return this._backgroundColor;
		}
		set backgroundColor(t) {
			(this._backgroundColor = new o.Color(t)),
				this.renderer.setClearColor(this._backgroundColor, this._backgroundAlpha);
		}
		get backgroundAlpha() {
			return this._backgroundAlpha;
		}
		set backgroundAlpha(t) {
			(this._backgroundAlpha = t), this.renderer.setClearColor(this._backgroundColor, this._backgroundAlpha);
		}
		appendCanvas(t) {
			t.canvas || document.body.appendChild(this.renderer.domElement);
		}
		create(t) {
			const e = new kt(t, this._rendererSize);
			return this.views.push(e), e;
		}
		add(t) {
			this.views.indexOf(t) > -1 || this.views.push(t);
		}
		getByTag(t) {
			for (const e of this.views) if (e.tags.indexOf(t) > -1) return e;
		}
		remove(t) {
			const e = this.views.indexOf(t);
			e > -1 && (this.views.splice(e, 1), this.views.length === 0 && this.setDefaultRendererParameters());
		}
		removeByTag(t) {
			if (this.views.length !== 0) {
				for (let e = this.views.length - 1; e >= 0; e--) this.views[e].tags.indexOf(t) > -1 && this.views.splice(e, 1);
				this.views.length === 0 && this.setDefaultRendererParameters();
			}
		}
		clear() {
			(this.views = []), this.setDefaultRendererParameters();
		}
		setDefaultRendererParameters() {
			this.renderer.setScissorTest(!1),
				this.renderer.setViewport(0, 0, this._rendererSize.width, this._rendererSize.height),
				this.renderer.setScissor(0, 0, this._rendererSize.width, this._rendererSize.height),
				this.renderer.setClearColor(this._backgroundColor, this._backgroundAlpha);
		}
		getVisibleScenes() {
			if (this.views.length !== 0) {
				this._visibleScenes.clear();
				for (const t of this.views) t.visible && this._visibleScenes.add(t.scene);
				return this._visibleScenes;
			}
		}
		updateActiveView(t, e) {
			(this.hoveredView = e ? this.getViewByMouse(t) : void 0),
				this.hoveredView && (this.activeView = this.hoveredView);
		}
		getViewByMouse(t) {
			for (let e = this.views.length - 1; e >= 0; e--) {
				const i = this.views[e],
					s = i.computedViewport;
				if (i.visible && s.left <= t.x && s.left + s.width >= t.x && s.top <= t.y && s.top + s.height >= t.y) return i;
			}
		}
		isRenderNecessary() {
			for (const t of this.views) if (t.visible && t.scene.needsRender) return !0;
			return !1;
		}
		render() {
			if (!this.isRenderNecessary()) return !1;
			for (const t of this.views)
				if (t.visible) {
					const e = t.computedViewport;
					this.renderer.setScissorTest(t.viewport !== void 0),
						this.renderer.setViewport(e.left, e.bottom, e.width, e.height),
						this.renderer.setScissor(e.left, e.bottom, e.width, e.height),
						this.renderer.setClearColor(
							t.backgroundColor ?? this._backgroundColor,
							t.backgroundAlpha ?? this._backgroundAlpha
						),
						t.onBeforeRender(),
						this.executeRender(t.scene, t.camera, t.composer),
						t.onAfterRender();
				}
			return !0;
		}
		executeRender(t, e, i) {
			i ? i.render() : this.renderer.render(t, e);
		}
		onResize() {
			this.updateRenderSize();
			for (const t of this.views) t.update();
		}
		updateRenderSize() {
			if (this._fullscreen) this.renderer.setSize(window.innerWidth, window.innerHeight);
			else {
				const { width: t, height: e } = this.renderer.domElement.getBoundingClientRect();
				this.renderer.setSize(t, e, !1);
			}
			this.renderer.getSize(this._rendererSize);
		}
		setActiveViewsByTag(t) {
			for (const e of this.views) e.visible = e.tags.indexOf(t) > -1;
		}
	}
	class O {
		constructor(t, e) {
			(this.actionIndex = -1),
				(this.history = []),
				(this.repetitions = {}),
				(this._finished = !1),
				(this.paused = !1),
				(this.timeScale = 1),
				(this.target = t),
				(this.tween = e);
		}
		get finished() {
			return this._finished;
		}
		setTimeScale(t) {
			return (this.timeScale = t), this;
		}
		pause() {
			this.paused = !0;
		}
		resume() {
			this.paused = !1;
		}
		stop() {
			v.stop(this);
		}
		complete() {
			v.complete(this);
		}
		revert() {
			console.error('Revert method not implemented yet.');
		}
		getBlock() {
			var e, i, s, r, a;
			(s = (i = (e = this.currentBlock) == null ? void 0 : e.config) == null ? void 0 : i.onComplete) == null ||
				s.call(this.target, this.target);
			const t = this.getCurrentBlock();
			return (
				(a = (r = t == null ? void 0 : t.config) == null ? void 0 : r.onStart) == null ||
					a.call(this.target, this.target),
				!this.tween.blockHistory && !this.reversed && !this.repeat && t && this.history.push(t),
				(this.currentBlock = t),
				t
			);
		}
		getCurrentBlock() {
			return this.reversed ? this.getPrevBlock() : this.repeat ? this.getRepeatBlock() : this.getNextBlock();
		}
		getPrevBlock() {
			if (this.actionIndex > 0) {
				const t = this.history[--this.actionIndex];
				return (t.reversed = !t.originallyReversed), (t.elapsedTime = 0), (t.tweensStarted = !1), t;
			}
		}
		getRepeatBlock() {
			if (this.actionIndex < this.history.length - 1) {
				const t = this.history[++this.actionIndex];
				return (t.reversed = t.originallyReversed), (t.elapsedTime = 0), (t.tweensStarted = !1), t;
			}
		}
		getNextBlock() {
			for (; ++this.actionIndex < this.tween.actions.length; ) {
				const t = this.tween.actions[this.actionIndex];
				if (t.isRepeat) this.handleRepetition(t.times);
				else if (t.isYoyo) {
					const e = this.handleYoyo(t.times);
					if (e) return e;
				} else return t.isTween ? this.handleTween(t) : this.handleMotion();
			}
		}
		cloneBlock(t) {
			return {
				elapsedTime: 0,
				totalTime: t.totalTime,
				reversed: !t.reversed,
				originallyReversed: !t.reversed,
				actions: t.actions,
				tweens: t.tweens,
				config: t.config,
				runningTweens: this.cloneRunningTweens(t.runningTweens),
			};
		}
		cloneRunningTweens(t) {
			if (!t) return;
			const e = [];
			for (const i of t) {
				const s = new O(i.target, i.tween);
				(s.timeScale = i.timeScale),
					(s.root = i.root),
					(s.history = i.history),
					(s.actionIndex = i.reversed ? -1 : i.history.length),
					(s.originallyReversed = !i.reversed),
					(s.repeat = i.reversed),
					e.push(s);
			}
			return e;
		}
		handleMotion() {
			const t = this.tween.actions[this.actionIndex].init(this.target);
			return {
				config: t.config,
				actions: t.actions,
				elapsedTime: 0,
				totalTime: Math.max(...t.actions.map((e) => e.time)),
			};
		}
		handleTween(t) {
			return { tweens: t.tweens, elapsedTime: 0, totalTime: 0 };
		}
		handleRepetition(t) {
			var i;
			const e = this.repetitions;
			if ((e[(i = this.actionIndex)] ?? (e[i] = 0), e[this.actionIndex] < t)) {
				e[this.actionIndex]++;
				do this.actionIndex--;
				while (this.actionIndex > -1 && !this.tween.actions[this.actionIndex].hasActions);
				this.actionIndex--;
			}
		}
		handleYoyo(t) {
			var i;
			const e = this.repetitions;
			if ((e[(i = this.actionIndex)] ?? (e[i] = 0), e[this.actionIndex] < t)) {
				if ((e[this.actionIndex]++, e[this.actionIndex--] < 3))
					return this.cloneBlock(this.history[this.history.length - 1]);
				const s = this.history[this.history.length - 2];
				return (s.elapsedTime = 0), (s.tweensStarted = !1), s;
			}
		}
		execute(t) {
			if (this.paused) return !0;
			t *= this.timeScale;
			do t = Math.min(this.executeBlock(t), this.getTweensDelta(this.currentBlock));
			while (t >= 0 && this.getBlock());
			return t < 0;
		}
		executeBlock(t) {
			const e = this.currentBlock;
			return (e.elapsedTime += t), this.executeActions(e), this.executeTweens(e, t), e.elapsedTime - e.totalTime;
		}
		executeActions(t) {
			var e, i, s, r, a;
			if (t.actions) {
				for (const h of t.actions) {
					const l = Math.min(1, t.elapsedTime / (h.time + 1e-12)),
						d = t.reversed ? 1 - l : l,
						u = ((e = h.easing) == null ? void 0 : e.call(this, d)) ?? d;
					((s = (i = t.config) == null ? void 0 : i.onProgress) == null
						? void 0
						: s.call(this.target, this.target, h.key, h.start, h.end, u)) !== !1 && h.callback(h.start, h.end, u);
				}
				(a = (r = t.config) == null ? void 0 : r.onUpdate) == null || a.call(this.target, this.target);
			}
		}
		executeTweens(t, e) {
			if (t.tweens && !t.tweensStarted) {
				if (t.runningTweens) for (const i of t.runningTweens) i.executeExistingTween(e, this.reversed);
				else {
					t.runningTweens = [];
					for (const i of t.tweens) this.executeTween(t, e, i);
				}
				t.tweensStarted = !0;
			}
		}
		executeTween(t, e, i) {
			const s = v.createChildren(this.target, i, this.root ?? this);
			t.runningTweens.push(s), s.execute(e) && v.addChildren(s);
		}
		executeExistingTween(t, e) {
			(this.reversed = e ? !this.originallyReversed : this.originallyReversed),
				(this.repeat = !this.reversed),
				(this.actionIndex = this.reversed ? this.history.length : -1),
				this.getBlock(),
				this.execute(t) && v.addChildren(this);
		}
		getTweensDelta(t) {
			let e = Number.MAX_SAFE_INTEGER;
			if (t.runningTweens)
				for (const i of t.runningTweens) {
					const s = i.repeat || i.reversed ? i.actionIndex : i.history.length - 1,
						r = i.history[s];
					e = Math.min(e, r.elapsedTime - r.totalTime, i.getTweensDelta(r));
				}
			return e;
		}
	}
	const N = class N {
		static create(t, e) {
			const i = new O(t, e);
			return i.getBlock(), this._running.push(i), i;
		}
		static createChildren(t, e, i) {
			const s = new O(t, e);
			return (s.root = i), s.getBlock(), s;
		}
		static addChildren(t) {
			this._runningChildren.push(t);
		}
		static update(t) {
			const e = this._runningChildren;
			for (let s = e.length - 1; s >= 0; s--) {
				const r = e[s];
				r.execute(t * r.root.timeScale) || e.splice(s, 1);
			}
			const i = this._running;
			for (let s = i.length - 1; s >= 0; s--) i[s].execute(t) || ((i[s]._finished = !0), i.splice(s, 1));
		}
		static stop(t) {
			const e = this._running.indexOf(t);
			if (e < 0) return;
			this._running.splice(e, 1), (t._finished = !0), (t.paused = !1);
			const i = this._runningChildren;
			for (let s = i.length - 1; s >= 0; s--) i[s].root === t && i.splice(s, 1);
		}
		static complete(t) {
			const e = this._running.indexOf(t);
			if (e < 0) return;
			t.paused = !1;
			const i = this._runningChildren;
			for (let s = i.length - 1; s >= 0; s--) i[s].root === t && !i[s].execute(1 / 0) && i.splice(s, 1);
			(t.tween.infiniteLoop || !t.execute(1 / 0)) && (this._running.splice(e, 1), (t._finished = !0));
		}
		static stopById(t) {
			for (let e = this._running.length - 1; e >= 0; e--)
				if (this._running[e].tween.id === t) {
					this._running[e].stop();
					return;
				}
		}
		static stopAll() {
			for (let t = this._running.length - 1; t >= 0; t--) this._running[t].stop();
		}
		static stopAllByTag(t) {
			for (let e = this._running.length - 1; e >= 0; e--)
				this._running[e].tween.tags.indexOf(t) > -1 && this._running[e].stop();
		}
		static completeAll() {
			for (let t = this._running.length - 1; t >= 0; t--) this._running[t].complete();
		}
		static completeAllByTag(t) {
			for (let e = this._running.length - 1; e >= 0; e--)
				this._running[e].tween.tags.indexOf(t) > -1 && this._running[e].complete();
		}
	};
	(N._running = []), (N._runningChildren = []);
	let v = N;
	class Et {
		constructor() {
			(this.dom = document.createElement('div')),
				(this.mode = 0),
				(this.frames = 0),
				(this.beginTime = (performance || Date).now()),
				(this.prevTime = this.beginTime),
				(this.fpsPanel = this.addPanel(new L('FPS', '#0ff', '#002'))),
				(this.msPanel = this.addPanel(new L('MS', '#0f0', '#020'))),
				(this.dom.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000'),
				this.dom.addEventListener(
					'click',
					(t) => {
						t.preventDefault(), this.showPanel(++this.mode % this.dom.children.length);
					},
					!1
				),
				self.performance && self.performance.memory && (this.memPanel = this.addPanel(new L('MB', '#f08', '#201'))),
				this.showPanel(0);
		}
		addPanel(t) {
			return this.dom.appendChild(t.dom), t;
		}
		showPanel(t) {
			for (let e = 0; e < this.dom.children.length; e++)
				this.dom.children[e].style.display = e === t ? 'block' : 'none';
			this.mode = t;
		}
		begin() {
			this.beginTime = (performance || Date).now();
		}
		end(t) {
			t !== !1 && this.frames++;
			const e = (performance || Date).now();
			if (
				(this.msPanel.update(e - this.beginTime, 200),
				e >= this.prevTime + 1e3 &&
					(this.fpsPanel.update((this.frames * 1e3) / (e - this.prevTime), 100),
					(this.prevTime = e),
					(this.frames = 0),
					this.memPanel))
			) {
				const i = performance.memory;
				this.memPanel.update(i.usedJSHeapSize / 1048576, i.jsHeapSizeLimit / 1048576);
			}
			return e;
		}
		update(t) {
			this.beginTime = this.end(t);
		}
	}
	class L {
		constructor(t, e, i) {
			(this.name = t),
				(this.fg = e),
				(this.bg = i),
				(this.min = 1 / 0),
				(this.max = 0),
				(this.PR = Math.round(window.devicePixelRatio || 1)),
				(this.WIDTH = 80 * this.PR),
				(this.HEIGHT = 48 * this.PR),
				(this.TEXT_X = 3 * this.PR),
				(this.TEXT_Y = 2 * this.PR),
				(this.GRAPH_X = 3 * this.PR),
				(this.GRAPH_Y = 15 * this.PR),
				(this.GRAPH_WIDTH = 74 * this.PR),
				(this.GRAPH_HEIGHT = 30 * this.PR),
				(this.dom = document.createElement('canvas')),
				(this.dom.width = this.WIDTH),
				(this.dom.height = this.HEIGHT),
				(this.dom.style.cssText = 'width:80px;height:48px'),
				(this.context = this.dom.getContext('2d')),
				(this.context.font = 'bold ' + 9 * this.PR + 'px Helvetica,Arial,sans-serif'),
				(this.context.textBaseline = 'top'),
				(this.context.fillStyle = i),
				this.context.fillRect(0, 0, this.WIDTH, this.HEIGHT),
				(this.context.fillStyle = e),
				this.context.fillText(t, this.TEXT_X, this.TEXT_Y),
				this.context.fillRect(this.GRAPH_X, this.GRAPH_Y, this.GRAPH_WIDTH, this.GRAPH_HEIGHT),
				(this.context.fillStyle = i),
				(this.context.globalAlpha = 0.9),
				this.context.fillRect(this.GRAPH_X, this.GRAPH_Y, this.GRAPH_WIDTH, this.GRAPH_HEIGHT);
		}
		update(t, e) {
			(this.min = Math.min(this.min, t)),
				(this.max = Math.max(this.max, t)),
				(this.context.fillStyle = this.bg),
				(this.context.globalAlpha = 1),
				this.context.fillRect(0, 0, this.WIDTH, this.GRAPH_Y),
				(this.context.fillStyle = this.fg),
				this.context.fillText(
					Math.round(t) + ' ' + this.name + ' (' + Math.round(this.min) + '-' + Math.round(this.max) + ')',
					this.TEXT_X,
					this.TEXT_Y
				),
				this.context.drawImage(
					this.dom,
					this.GRAPH_X + this.PR,
					this.GRAPH_Y,
					this.GRAPH_WIDTH - this.PR,
					this.GRAPH_HEIGHT,
					this.GRAPH_X,
					this.GRAPH_Y,
					this.GRAPH_WIDTH - this.PR,
					this.GRAPH_HEIGHT
				),
				this.context.fillRect(this.GRAPH_X + this.GRAPH_WIDTH - this.PR, this.GRAPH_Y, this.PR, this.GRAPH_HEIGHT),
				(this.context.fillStyle = this.bg),
				(this.context.globalAlpha = 0.9),
				this.context.fillRect(
					this.GRAPH_X + this.GRAPH_WIDTH - this.PR,
					this.GRAPH_Y,
					this.PR,
					Math.round((1 - t / e) * this.GRAPH_HEIGHT)
				);
		}
	}
	function re() {}
	const Q = class Q {
		constructor(t = {}) {
			(this._clock = new o.Clock()),
				this.setDefaultRendererParameters(t),
				(this._renderManager = new zt(t.rendererParameters, t.fullscreen, t.backgroundColor, t.backgroundAlpha)),
				(this._interactionManager = new Pt(this._renderManager)),
				(this.multitouch = t.multitouch ?? !1),
				this.handleContextMenu(t.disableContextMenu),
				(this.showStats = t.showStats ?? !0),
				this.setAnimationLoop(),
				(this.enableCursor = t.enableCursor ?? !0),
				(this._animate = t.animate);
		}
		get renderer() {
			return this._renderManager.renderer;
		}
		get views() {
			return this._renderManager.views;
		}
		get activeView() {
			return this._renderManager.activeView;
		}
		get activeScene() {
			var t;
			return (t = this._renderManager.activeView) == null ? void 0 : t.scene;
		}
		get activeCamera() {
			var t;
			return (t = this._renderManager.activeView) == null ? void 0 : t.camera;
		}
		get activeComposer() {
			var t;
			return (t = this._renderManager.activeView) == null ? void 0 : t.composer;
		}
		get showStats() {
			return this._showStats;
		}
		set showStats(t) {
			t
				? (this._stats || (this._stats = new Et()), document.body.appendChild(this._stats.dom))
				: this._stats && document.body.removeChild(this._stats.dom),
				(this._showStats = t);
		}
		get multitouch() {
			return this._interactionManager.queue.multitouch;
		}
		set multitouch(t) {
			this._interactionManager.queue.multitouch = t;
		}
		get dragButtons() {
			return this._interactionManager.dragManager.dragButtons;
		}
		set dragButtons(t) {
			this._interactionManager.dragManager.dragButtons = t;
		}
		get enableCursor() {
			return this._interactionManager.cursorManager.enabled;
		}
		set enableCursor(t) {
			this._interactionManager.cursorManager.enabled = t;
		}
		get raycasterSortComparer() {
			return this._interactionManager.raycasterManager.raycasterSortComparer;
		}
		set raycasterSortComparer(t) {
			this._interactionManager.raycasterManager.raycasterSortComparer = t;
		}
		get raycaster() {
			return this._interactionManager.raycasterManager.raycaster;
		}
		get backgroundColor() {
			return this._renderManager.backgroundColor;
		}
		set backgroundColor(t) {
			this._renderManager.backgroundColor = t;
		}
		get backgroundAlpha() {
			return this._renderManager.backgroundAlpha;
		}
		set backgroundAlpha(t) {
			this._renderManager.backgroundAlpha = t;
		}
		get mousePosition() {
			return this._interactionManager.raycasterManager.pointer;
		}
		get pointerOnCanvas() {
			return this._interactionManager.raycasterManager.pointerOnCanvas;
		}
		setDefaultRendererParameters(t) {
			var e;
			t.rendererParameters || (t.rendererParameters = {}), (e = t.rendererParameters).antialias ?? (e.antialias = !0);
		}
		handleContextMenu(t = !0) {
			t && this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
		}
		setAnimationLoop() {
			this.renderer.setAnimationLoop((t, e) => {
				Q.ticks++;
				const i = this._clock.getDelta();
				this._interactionManager.update(), v.update(i * 1e3), this.animate(i, this._clock.elapsedTime);
				let s = !1;
				const r = this._renderManager.getVisibleScenes();
				if (r) {
					for (const a of r) {
						const h = i * a.timeScale,
							l = (a.totalTime += h);
						b.dispatchEvent(a, 'beforeanimate', { delta: h, total: l }),
							b.dispatchEvent(a, 'animate', { delta: h, total: l }),
							b.dispatchEvent(a, 'afteranimate', { delta: h, total: l }),
							M.compute(a);
					}
					s = this._renderManager.render();
					for (const a of r) a.needsRender = !a.__smartRendering;
				}
				this._showStats && this._stats.update(s);
			});
		}
		animate(t, e) {
			this._animate && this._animate(t, e);
		}
		createView(t) {
			return this._renderManager.create(t);
		}
		addView(t) {
			this._renderManager.add(t);
		}
		getViewByTag(t) {
			return this._renderManager.getByTag(t);
		}
		removeView(t) {
			this._renderManager.remove(t);
		}
		removeViewByTag(t) {
			this._renderManager.removeByTag(t);
		}
		clearViews() {
			this._renderManager.clear();
		}
		getViewByMouse(t) {
			this._renderManager.getViewByMouse(t);
		}
		setActiveViewsByTag(t) {
			this._renderManager.setActiveViewsByTag(t);
		}
	};
	Q.ticks = 0;
	let et = Q;
	const R = class R {};
	(R.focusable = !0), (R.draggable = !1), (R.interceptByRaycaster = !0);
	let C = R;
	const mt = class mt {
		linear(t) {
			return t;
		}
		easeInSine(t) {
			return 1 - Math.cos((t * Math.PI) / 2);
		}
		easeOutSine(t) {
			return Math.sin((t * Math.PI) / 2);
		}
		easeInOutSine(t) {
			return -(Math.cos(Math.PI * t) - 1) / 2;
		}
		easeInQuad(t) {
			return t * t;
		}
		easeOutQuad(t) {
			return 1 - (1 - t) * (1 - t);
		}
		easeInOutQuad(t) {
			return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
		}
		easeInCubic(t) {
			return t * t * t;
		}
		easeOutCubic(t) {
			return 1 - Math.pow(1 - t, 3);
		}
		easeInOutCubic(t) {
			return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
		}
		easeInQuart(t) {
			return t * t * t * t;
		}
		easeOutQuart(t) {
			return 1 - Math.pow(1 - t, 4);
		}
		easeInOutQuart(t) {
			return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
		}
		easeInQuint(t) {
			return t * t * t * t * t;
		}
		easeOutQuint(t) {
			return 1 - Math.pow(1 - t, 5);
		}
		easeInOutQuint(t) {
			return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
		}
		easeInExpo(t) {
			return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
		}
		easeOutExpo(t) {
			return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
		}
		easeInOutExpo(t) {
			return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
		}
		easeInCirc(t) {
			return 1 - Math.sqrt(1 - Math.pow(t, 2));
		}
		easeOutCirc(t) {
			return Math.sqrt(1 - Math.pow(t - 1, 2));
		}
		easeInOutCirc(t) {
			return t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
		}
		easeInBack(t) {
			return 2.70158 * t * t * t - 1.70158 * t * t;
		}
		easeOutBack(t) {
			return 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
		}
		easeInOutBack(t) {
			const e = 2.5949095;
			return t < 0.5
				? (Math.pow(2 * t, 2) * ((e + 1) * 2 * t - e)) / 2
				: (Math.pow(2 * t - 2, 2) * ((e + 1) * (t * 2 - 2) + e) + 2) / 2;
		}
		easeInElastic(t) {
			return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin(((t * 10 - 10.75) * (2 * Math.PI)) / 3);
		}
		easeOutElastic(t) {
			return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1;
		}
		easeInOutElastic(t) {
			const e = (2 * Math.PI) / 4.5;
			return t === 0
				? 0
				: t === 1
					? 1
					: t < 0.5
						? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * e)) / 2
						: (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * e)) / 2 + 1;
		}
		easeInBounce(t) {
			return 1 - this.easeOutBounce(1 - t);
		}
		easeOutBounce(t) {
			return t < 1 / 2.75
				? 7.5625 * t * t
				: t < 2 / 2.75
					? 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
					: t < 2.5 / 2.75
						? 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
						: 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
		}
		easeInOutBounce(t) {
			return t < 0.5 ? (1 - this.easeOutBounce(1 - 2 * t)) / 2 : (1 + this.easeOutBounce(2 * t - 1)) / 2;
		}
	};
	mt.DEFAULT_EASING = 'easeInOutExpo';
	let T = mt;
	const it = new T();
	class It {
		constructor(t) {
			(this.times = t), (this.hasActions = !1), (this.isRepeat = !0);
		}
	}
	class Ot {
		constructor(t) {
			(this.times = t), (this.hasActions = !1), (this.isYoyo = !0);
		}
	}
	class H {
		constructor(...t) {
			(this.hasActions = !0), (this.isTween = !0), (this.tweens = []);
			for (const e of t) this.tweens.push(e.clone());
		}
	}
	class Tt {
		constructor(t) {
			(this.callback = t), (this.hasActions = !0);
		}
		init() {
			return { actions: [{ callback: this.callback, time: 0 }] };
		}
	}
	class Rt {
		constructor(t) {
			(this.time = t), (this.hasActions = !0);
		}
		init() {
			return { actions: [{ callback: () => {}, time: this.time }] };
		}
	}
	class F {
		constructor(t, e, i, s) {
			(this.time = t), (this.motion = e), (this.config = i), (this.isBy = s), (this.hasActions = !0);
		}
		init(t) {
			const e = [];
			for (const i in this.motion) {
				if (i === 'easing') continue;
				const s = this.motion[i],
					r = t[i],
					a =
						this.vector(i, s, r) ??
						this.quaternion(i, s, r) ??
						this.euler(i, s, r) ??
						this.color(i, s, r) ??
						this.number(t, i, s);
				a && e.push(a);
			}
			return { actions: e, config: this.config };
		}
		getEasing() {
			var e;
			const t = ((e = this.config) == null ? void 0 : e.easing) ?? T.DEFAULT_EASING;
			return typeof t == 'string' ? it[t].bind(it) ?? it.linear : t;
		}
		vector(t, e, i) {
			if (i && (i.isVector2 || i.isVector3 || i.isVector4)) {
				const s = typeof e == 'number' ? i.clone().setScalar(e) : e;
				return {
					key: t,
					time: this.time,
					easing: this.getEasing(),
					start: i.clone(),
					end: this.isBy ? s.clone().add(i) : s,
					callback: (r, a, h) => {
						i.lerpVectors(r, a, h);
					},
				};
			}
		}
		quaternion(t, e, i) {
			if (i != null && i.isQuaternion)
				return {
					key: t,
					time: this.time,
					easing: this.getEasing(),
					start: i.clone(),
					end: this.isBy ? e.clone().premultiply(i) : e,
					callback: (s, r, a) => {
						i.slerpQuaternions(s, r, a);
					},
				};
		}
		euler(t, e, i) {
			if (i != null && i.isEuler)
				return {
					key: t,
					time: this.time,
					easing: this.getEasing(),
					start: i.clone(),
					end: this.isBy ? new o.Euler(e.x + i.x, e.y + i.y, e.z + i.z) : e,
					callback: (s, r, a) => {
						i.set(o.MathUtils.lerp(s.x, r.x, a), o.MathUtils.lerp(s.y, r.y, a), o.MathUtils.lerp(s.z, r.z, a));
					},
				};
		}
		color(t, e, i) {
			if (i != null && i.isColor)
				return {
					key: t,
					time: this.time,
					easing: this.getEasing(),
					start: i.clone(),
					end: this.isBy ? new o.Color(e).add(i) : new o.Color(e),
					callback: (s, r, a) => {
						i.lerpColors(s, r, a);
					},
				};
		}
		number(t, e, i) {
			if (typeof i == 'number')
				return {
					key: e,
					time: this.time,
					easing: this.getEasing(),
					start: t[e],
					end: this.isBy ? i + t[e] : i,
					callback: (s, r, a) => {
						t[e] = o.MathUtils.lerp(s, r, a);
					},
				};
		}
	}
	class k {
		constructor(t) {
			(this.actions = []), (this.blockHistory = !1), (this.infiniteLoop = !1), (this.tags = []), (this.target = t);
		}
		setId(t) {
			return (this.id = t), this;
		}
		setTags(...t) {
			return (this.tags = t), this;
		}
		setTarget(t) {
			return (this.target = t), this;
		}
		to(t, e, i) {
			return this.actions.push(new F(t, e, i, !1)), this;
		}
		by(t, e, i) {
			return this.actions.push(new F(t, e, i, !0)), this;
		}
		set(t) {
			return this.actions.push(new F(0, t, {}, !1)), this;
		}
		call(t) {
			return this.actions.push(new Tt(t)), this;
		}
		delay(t) {
			return this.actions.push(new Rt(t)), this;
		}
		repeat(t = 1) {
			return (
				t === 1 / 0 && ((this.blockHistory = !0), (this.infiniteLoop = !0)),
				this.actions[this.actions.length - 1].isRepeat
					? (this.actions[this.actions.length - 1].times += t)
					: this.actions.push(new It(t)),
				this
			);
		}
		repeatForever() {
			return this.repeat(1 / 0);
		}
		yoyo(t = 1) {
			return (
				t === 1 / 0 && (this.infiniteLoop = !0),
				this.actions[this.actions.length - 1].isYoyo
					? (this.actions[this.actions.length - 1].times += t)
					: this.actions.push(new Ot(t)),
				this
			);
		}
		yoyoForever() {
			return this.yoyo(1 / 0);
		}
		then(t) {
			return this.actions.push(new H(t)), this.infiniteLoop || (this.infiniteLoop = t.infiniteLoop), this;
		}
		parallel(...t) {
			return (
				this.actions.push(new H(...t)), this.infiniteLoop || (this.infiniteLoop = t.some((e) => e.infiniteLoop)), this
			);
		}
		sequence(...t) {
			for (const e of t) this.actions.push(new H(e)), this.infiniteLoop || (this.infiniteLoop = e.infiniteLoop);
			return this;
		}
		chain(t) {
			return this.actions.push(...t.actions), this.infiniteLoop || (this.infiniteLoop = t.infiniteLoop), this;
		}
		clone() {
			const t = new k(this.target);
			return (t.actions = [...this.actions]), (t.tags = [...this.tags]), (t.infiniteLoop = this.infiniteLoop), t;
		}
		start() {
			return this.id !== void 0 && v.stopById(this.id), v.create(this.target, this);
		}
	}
	function At(n, t) {
		const e = Ht(t),
			i = [];
		for (let s = 0; s < e.length; s++) i[s] = [e[s]];
		return Vt(n, i);
	}
	function Bt(n, t) {
		const e = [],
			i = Ht(t),
			s = [];
		for (let r = 0; r < i.length; r++) s[r] = [i[r]];
		return jt(n, s, e), e;
	}
	function Vt(n, t) {
		const e = [];
		for (const i of t) {
			const s = [];
			e.push(s);
			for (const a of i) if (Lt(n, a, s)) return n;
			const r = s[s.length - 1];
			(r === void 0 || r.prev !== r) && s.push(i[i.length - 1]);
		}
		for (const i of n.children) {
			const s = Vt(i, e);
			if (s) return s;
		}
	}
	function jt(n, t, e) {
		const i = [];
		let s = !1;
		for (const r of t) {
			const a = [];
			i.push(a);
			for (const l of r)
				if (Lt(n, l, a) && !s) {
					if ((e.push(n), n.children.length === 0)) return;
					s = !0;
				}
			const h = a[a.length - 1];
			(h === void 0 || h.prev !== h) && a.push(r[r.length - 1]);
		}
		for (const r of n.children) jt(r, i, e);
	}
	function Lt(n, t, e) {
		if (ae(n, t))
			if (t.next) e.push(t.next);
			else return !0;
		return !1;
	}
	function ae(n, t) {
		return oe(n, t.type) && he(n, t.tags) && ce(n, t.attributes);
	}
	function oe(n, t) {
		return !t || n.type === t;
	}
	function he(n, t) {
		for (const e of t) if (!n.tags.has(e)) return !1;
		return !0;
	}
	function ce(n, t) {
		for (const e of t)
			switch (e.operator) {
				case void 0:
					if (q(n, e.key) !== e.value) return !1;
					break;
				case '*':
					if (!q(n, e.key).includes(e.value)) return !1;
					break;
				case '$':
					if (!q(n, e.key).endsWith(e.value)) return !1;
					break;
				case '^':
					if (!q(n, e.key).startsWith(e.value)) return !1;
					break;
			}
		return !0;
	}
	function q(n, t) {
		const e = n[t];
		return typeof e == 'string' ? e : e == null ? void 0 : e.toString();
	}
	function Ht(n) {
		const t = [];
		let e = { attributes: [], tags: [] },
			i = 0,
			s = 0;
		for (t.push(e), e.prev = e, n = n.trim(); (s = i) < n.length; ) {
			let r = n[s];
			const a = le(n, s);
			if (a) {
				if (a.char === ',') (e = { attributes: [], tags: [] }), t.push(e), (e.prev = e);
				else {
					const h = { attributes: [], tags: [], recursive: a.char === ' ' };
					(e.next = h), (h.prev = de(h, e)), (e = h);
				}
				(s = a.end), (r = n[s]);
			}
			(i = ue(n, s + 1)), r === '.' ? pe(n, s, i, e) : r === '[' ? fe(n, s, i, e) : _e(n, s, i, e);
		}
		return t;
	}
	function le(n, t) {
		let e;
		for (; t < n.length; t++) {
			const i = n[t];
			if (i !== ' ' && i !== '>' && i !== ',') break;
			e ? i !== ' ' && (e.char = i) : (e = { char: i });
		}
		return e && (e.end = t), e;
	}
	function de(n, t) {
		if (n.recursive) return n;
		for (; t !== t.prev; ) t = t.prev;
		return t;
	}
	function ue(n, t) {
		for (; t < n.length; t++) {
			const e = n[t];
			if (e === '.' || e === ' ' || e === '>' || e === '[' || e === ',') break;
		}
		return t;
	}
	function pe(n, t, e, i) {
		i.tags.push(n.substring(t + 1, e));
	}
	function _e(n, t, e, i) {
		i.type = n.substring(t, e);
	}
	function fe(n, t, e, i) {
		const r = n.substring(t + 1, e - 1).split('='),
			a = r[0][r[0].length - 1];
		a === '*' || a === '$' || a === '^'
			? i.attributes.push({ key: r[0].slice(0, -1), value: r[1], operator: a })
			: i.attributes.push({ key: r[0], value: r[1] });
	}
	function Ft(n) {
		var t;
		(n.__onChangeBaseEuler = n.rotation._onChangeCallback), (t = n.scene) != null && t.__smartRendering ? st(n) : nt(n);
	}
	function st(n) {
		n.rotation._onChangeCallback = () => {
			n.__onChangeBaseEuler(), (n.needsRender = !0), n.__eventsDispatcher.dispatch('rotationchange');
		};
	}
	function nt(n) {
		n.rotation._onChangeCallback = () => {
			n.__onChangeBaseEuler(), n.__eventsDispatcher.dispatch('rotationchange');
		};
	}
	function qt(n) {
		n.matrix.compose = function (t, e, i) {
			const s = this.elements,
				r = e._x,
				a = e._y,
				h = e._z,
				l = e._w,
				d = r + r,
				u = a + a,
				p = h + h,
				_ = r * d,
				f = r * u,
				m = r * p,
				E = a * u,
				K = a * p,
				B = h * p,
				bt = l * d,
				V = l * u,
				wt = l * p,
				x = i._x,
				Z = i._y,
				vt = i._z;
			return (
				(s[0] = (1 - (E + B)) * x),
				(s[1] = (f + wt) * x),
				(s[2] = (m - V) * x),
				(s[3] = 0),
				(s[4] = (f - wt) * Z),
				(s[5] = (1 - (_ + B)) * Z),
				(s[6] = (K + bt) * Z),
				(s[7] = 0),
				(s[8] = (m + V) * vt),
				(s[9] = (K - bt) * vt),
				(s[10] = (1 - (_ + E)) * vt),
				(s[11] = 0),
				(s[12] = t._x),
				(s[13] = t._y),
				(s[14] = t._z),
				(s[15] = 1),
				this
			);
		};
	}
	function Gt(n) {
		var t;
		(n.__onChangeBaseQuat = n.quaternion._onChangeCallback),
			(t = n.scene) != null && t.__smartRendering ? at(n) : rt(n);
	}
	function rt(n) {
		n.quaternion._onChangeCallback = () => {
			n.__onChangeBaseQuat(), n.__eventsDispatcher.dispatch('rotationchange');
		};
	}
	function at(n) {
		n.quaternion._onChangeCallback = () => {
			n.__onChangeBaseQuat(), (n.needsRender = !0), n.__eventsDispatcher.dispatch('rotationchange');
		};
	}
	function Wt(n) {
		var t;
		Yt(n.position), Yt(n.scale), (t = n.scene) != null && t.__smartRendering ? ht(n) : ot(n);
	}
	function ot(n) {
		(n.position._onChangeCallback = () => n.__eventsDispatcher.dispatch('positionchange')),
			(n.scale._onChangeCallback = () => n.__eventsDispatcher.dispatch('scalechange'));
	}
	function ht(n) {
		(n.position._onChangeCallback = () => {
			(n.needsRender = !0), n.__eventsDispatcher.dispatch('positionchange');
		}),
			(n.scale._onChangeCallback = () => {
				(n.needsRender = !0), n.__eventsDispatcher.dispatch('scalechange');
			});
	}
	function Yt(n) {
		(n._x = n.x),
			(n._y = n.y),
			(n._z = n.z),
			delete n.x,
			delete n.y,
			delete n.z,
			Object.setPrototypeOf(n, Xt.prototype);
	}
	class Xt {
		get x() {
			return this._x;
		}
		set x(t) {
			(this._x = t), this._onChangeCallback();
		}
		get y() {
			return this._y;
		}
		set y(t) {
			(this._y = t), this._onChangeCallback();
		}
		get z() {
			return this._z;
		}
		set z(t) {
			(this._z = t), this._onChangeCallback();
		}
		set(t, e, i) {
			return i === void 0 && (i = this._z), (this._x = t), (this._y = e), (this._z = i), this._onChangeCallback(), this;
		}
		setScalar(t) {
			return (this._x = t), (this._y = t), (this._z = t), this._onChangeCallback(), this;
		}
		setX(t) {
			return (this._x = t), this._onChangeCallback(), this;
		}
		setY(t) {
			return (this._y = t), this._onChangeCallback(), this;
		}
		setZ(t) {
			return (this._z = t), this._onChangeCallback(), this;
		}
		setComponent(t, e) {
			switch (t) {
				case 0:
					this._x = e;
					break;
				case 1:
					this._y = e;
					break;
				case 2:
					this._z = e;
					break;
				default:
					throw new Error('index is out of range: ' + t);
			}
			return this._onChangeCallback(), this;
		}
		getComponent(t) {
			switch (t) {
				case 0:
					return this._x;
				case 1:
					return this._y;
				case 2:
					return this._z;
				default:
					throw new Error('index is out of range: ' + t);
			}
		}
		clone() {
			return new o.Vector3.prototype.constructor(this._x, this._y, this._z);
		}
		copy(t, e) {
			return (this._x = t.x), (this._y = t.y), (this._z = t.z), e !== !1 && this._onChangeCallback(), this;
		}
		add(t) {
			return (this._x += t.x), (this._y += t.y), (this._z += t.z), this._onChangeCallback(), this;
		}
		addScalar(t) {
			return (this._x += t), (this._y += t), (this._z += t), this._onChangeCallback(), this;
		}
		addVectors(t, e) {
			return (this._x = t.x + e.x), (this._y = t.y + e.y), (this._z = t.z + e.z), this._onChangeCallback(), this;
		}
		addScaledVector(t, e) {
			return (this._x += t.x * e), (this._y += t.y * e), (this._z += t.z * e), this._onChangeCallback(), this;
		}
		sub(t) {
			return (this._x -= t.x), (this._y -= t.y), (this._z -= t.z), this._onChangeCallback(), this;
		}
		subScalar(t) {
			return (this._x -= t), (this._y -= t), (this._z -= t), this._onChangeCallback(), this;
		}
		subVectors(t, e) {
			return (this._x = t.x - e.x), (this._y = t.y - e.y), (this._z = t.z - e.z), this._onChangeCallback(), this;
		}
		multiply(t) {
			return (this._x *= t.x), (this._y *= t.y), (this._z *= t.z), this._onChangeCallback(), this;
		}
		multiplyScalar(t, e) {
			return (this._x *= t), (this._y *= t), (this._z *= t), e !== !1 && this._onChangeCallback(), this;
		}
		multiplyVectors(t, e) {
			return (this._x = t.x * e.x), (this._y = t.y * e.y), (this._z = t.z * e.z), this._onChangeCallback(), this;
		}
		applyEuler(t) {
			return this.applyQuaternion(Nt.setFromEuler(t));
		}
		applyAxisAngle(t, e) {
			return this.applyQuaternion(Nt.setFromAxisAngle(t, e));
		}
		applyMatrix3(t, e) {
			const i = this._x,
				s = this._y,
				r = this._z,
				a = t.elements;
			return (
				(this._x = a[0] * i + a[3] * s + a[6] * r),
				(this._y = a[1] * i + a[4] * s + a[7] * r),
				(this._z = a[2] * i + a[5] * s + a[8] * r),
				e !== !1 && this._onChangeCallback(),
				this
			);
		}
		applyNormalMatrix(t) {
			return this.applyMatrix3(t, !1).normalize();
		}
		applyMatrix4(t, e) {
			const i = this._x,
				s = this._y,
				r = this._z,
				a = t.elements,
				h = 1 / (a[3] * i + a[7] * s + a[11] * r + a[15]);
			return (
				(this._x = (a[0] * i + a[4] * s + a[8] * r + a[12]) * h),
				(this._y = (a[1] * i + a[5] * s + a[9] * r + a[13]) * h),
				(this._z = (a[2] * i + a[6] * s + a[10] * r + a[14]) * h),
				e !== !1 && this._onChangeCallback(),
				this
			);
		}
		applyQuaternion(t) {
			const e = this._x,
				i = this._y,
				s = this._z,
				r = t.x,
				a = t.y,
				h = t.z,
				l = t.w,
				d = 2 * (a * s - h * i),
				u = 2 * (h * e - r * s),
				p = 2 * (r * i - a * e);
			return (
				(this._x = e + l * d + a * p - h * u),
				(this._y = i + l * u + h * d - r * p),
				(this._z = s + l * p + r * u - a * d),
				this._onChangeCallback(),
				this
			);
		}
		project(t) {
			return this.applyMatrix4(t.matrixWorldInverse, !1).applyMatrix4(t.projectionMatrix);
		}
		unproject(t) {
			return this.applyMatrix4(t.projectionMatrixInverse, !1).applyMatrix4(t.matrixWorld);
		}
		transformDirection(t) {
			const e = this._x,
				i = this._y,
				s = this._z,
				r = t.elements;
			return (
				(this._x = r[0] * e + r[4] * i + r[8] * s),
				(this._y = r[1] * e + r[5] * i + r[9] * s),
				(this._z = r[2] * e + r[6] * i + r[10] * s),
				this.normalize()
			);
		}
		divide(t) {
			return (this._x /= t.x), (this._y /= t.y), (this._z /= t.z), this._onChangeCallback(), this;
		}
		divideScalar(t, e) {
			return this.multiplyScalar(1 / t, e);
		}
		min(t) {
			return (
				(this._x = Math.min(this._x, t.x)),
				(this._y = Math.min(this._y, t.y)),
				(this._z = Math.min(this._z, t.z)),
				this._onChangeCallback(),
				this
			);
		}
		max(t) {
			return (
				(this._x = Math.max(this._x, t.x)),
				(this._y = Math.max(this._y, t.y)),
				(this._z = Math.max(this._z, t.z)),
				this._onChangeCallback(),
				this
			);
		}
		clamp(t, e) {
			return (
				(this._x = Math.max(t.x, Math.min(e.x, this._x))),
				(this._y = Math.max(t.y, Math.min(e.y, this._y))),
				(this._z = Math.max(t.z, Math.min(e.z, this._z))),
				this._onChangeCallback(),
				this
			);
		}
		clampScalar(t, e) {
			return (
				(this._x = Math.max(t, Math.min(e, this._x))),
				(this._y = Math.max(t, Math.min(e, this._y))),
				(this._z = Math.max(t, Math.min(e, this._z))),
				this._onChangeCallback(),
				this
			);
		}
		clampLength(t, e) {
			const i = this.length();
			return this.divideScalar(i || 1, !1).multiplyScalar(Math.max(t, Math.min(e, i)));
		}
		floor() {
			return (
				(this._x = Math.floor(this._x)),
				(this._y = Math.floor(this._y)),
				(this._z = Math.floor(this._z)),
				this._onChangeCallback(),
				this
			);
		}
		ceil() {
			return (
				(this._x = Math.ceil(this._x)),
				(this._y = Math.ceil(this._y)),
				(this._z = Math.ceil(this._z)),
				this._onChangeCallback(),
				this
			);
		}
		round() {
			return (
				(this._x = Math.round(this._x)),
				(this._y = Math.round(this._y)),
				(this._z = Math.round(this._z)),
				this._onChangeCallback(),
				this
			);
		}
		roundToZero() {
			return (
				(this._x = Math.trunc(this._x)),
				(this._y = Math.trunc(this._y)),
				(this._z = Math.trunc(this._z)),
				this._onChangeCallback(),
				this
			);
		}
		negate() {
			return (this._x = -this._x), (this._y = -this._y), (this._z = -this._z), this._onChangeCallback(), this;
		}
		dot(t) {
			return this._x * t.x + this._y * t.y + this._z * t.z;
		}
		lengthSq() {
			return this._x * this._x + this._y * this._y + this._z * this._z;
		}
		length() {
			return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
		}
		manhattanLength() {
			return Math.abs(this._x) + Math.abs(this._y) + Math.abs(this._z);
		}
		normalize(t) {
			return this.divideScalar(this.length() || 1, t);
		}
		setLength(t) {
			return this.normalize(!1).multiplyScalar(t);
		}
		lerp(t, e) {
			return (
				(this._x += (t.x - this._x) * e),
				(this._y += (t.y - this._y) * e),
				(this._z += (t.z - this._z) * e),
				this._onChangeCallback(),
				this
			);
		}
		lerpVectors(t, e, i) {
			return (
				(this._x = t.x + (e.x - t.x) * i),
				(this._y = t.y + (e.y - t.y) * i),
				(this._z = t.z + (e.z - t.z) * i),
				this._onChangeCallback(),
				this
			);
		}
		cross(t) {
			return this.crossVectors(this, t);
		}
		crossVectors(t, e) {
			const i = t.x,
				s = t.y,
				r = t.z,
				a = e.x,
				h = e.y,
				l = e.z;
			return (
				(this._x = s * l - r * h), (this._y = r * a - i * l), (this._z = i * h - s * a), this._onChangeCallback(), this
			);
		}
		projectOnVector(t) {
			const e = t.lengthSq();
			if (e === 0) return this.set(0, 0, 0);
			const i = t.dot(this) / e;
			return this.copy(t, !1).multiplyScalar(i);
		}
		projectOnPlane(t) {
			return ct.copy(this).projectOnVector(t), this.sub(ct);
		}
		reflect(t) {
			return this.sub(ct.copy(t).multiplyScalar(2 * this.dot(t)));
		}
		angleTo(t) {
			const e = Math.sqrt(this.lengthSq() * t.lengthSq());
			if (e === 0) return Math.PI / 2;
			const i = this.dot(t) / e;
			return Math.acos(o.MathUtils.clamp(i, -1, 1));
		}
		distanceTo(t) {
			return Math.sqrt(this.distanceToSquared(t));
		}
		distanceToSquared(t) {
			const e = this._x - t.x,
				i = this._y - t.y,
				s = this._z - t.z;
			return e * e + i * i + s * s;
		}
		manhattanDistanceTo(t) {
			return Math.abs(this._x - t.x) + Math.abs(this._y - t.y) + Math.abs(this._z - t.z);
		}
		setFromSpherical(t) {
			return this.setFromSphericalCoords(t.radius, t.phi, t.theta);
		}
		setFromSphericalCoords(t, e, i) {
			const s = Math.sin(e) * t;
			return (
				(this._x = s * Math.sin(i)),
				(this._y = Math.cos(e) * t),
				(this._z = s * Math.cos(i)),
				this._onChangeCallback(),
				this
			);
		}
		setFromCylindrical(t) {
			return this.setFromCylindricalCoords(t.radius, t.theta, t.y);
		}
		setFromCylindricalCoords(t, e, i) {
			return (this._x = t * Math.sin(e)), (this._y = i), (this._z = t * Math.cos(e)), this._onChangeCallback(), this;
		}
		setFromMatrixPosition(t) {
			const e = t.elements;
			return (this._x = e[12]), (this._y = e[13]), (this._z = e[14]), this._onChangeCallback(), this;
		}
		setFromMatrixScale(t) {
			const e = this.setFromMatrixColumn(t, 0).length(),
				i = this.setFromMatrixColumn(t, 1).length(),
				s = this.setFromMatrixColumn(t, 2).length();
			return (this._x = e), (this._y = i), (this._z = s), this._onChangeCallback(), this;
		}
		setFromMatrixColumn(t, e) {
			return this.fromArray(t.elements, e * 4);
		}
		setFromMatrix3Column(t, e) {
			return this.fromArray(t.elements, e * 3);
		}
		setFromEuler(t) {
			return (this._x = t._x), (this._y = t._y), (this._z = t._z), this._onChangeCallback(), this;
		}
		setFromColor(t) {
			return (this._x = t.r), (this._y = t.g), (this._z = t.b), this._onChangeCallback(), this;
		}
		equals(t) {
			return t.x === this._x && t.y === this._y && t.z === this._z;
		}
		fromArray(t, e = 0) {
			return (this._x = t[e]), (this._y = t[e + 1]), (this._z = t[e + 2]), this._onChangeCallback(), this;
		}
		toArray(t = [], e = 0) {
			return (t[e] = this._x), (t[e + 1] = this._y), (t[e + 2] = this._z), t;
		}
		fromBufferAttribute(t, e) {
			return (this._x = t.getX(e)), (this._y = t.getY(e)), (this._z = t.getZ(e)), this._onChangeCallback(), this;
		}
		random() {
			return (
				(this._x = Math.random()), (this._y = Math.random()), (this._z = Math.random()), this._onChangeCallback(), this
			);
		}
		randomDirection() {
			const t = Math.random() * Math.PI * 2,
				e = Math.random() * 2 - 1,
				i = Math.sqrt(1 - e * e);
			return (this.x = i * Math.cos(t)), (this.y = e), (this.z = i * Math.sin(t)), this._onChangeCallback(), this;
		}
		*[Symbol.iterator]() {
			yield this._x, yield this._y, yield this._z;
		}
	}
	Xt.prototype.isVector3 = !0;
	const ct = new o.Vector3(),
		Nt = new o.Quaternion();
	function Qt(n) {
		n.scene.__smartRendering && !n.__smartRenderingPatched && $t(n);
	}
	function Ut(n) {
		n.__smartRenderingPatched && (ot(n), rt(n), nt(n), me(n), (n.__smartRenderingPatched = !1));
	}
	function Kt(n) {
		(n.__smartRendering = !0), Zt(n);
	}
	function ge(n) {
		(n.__baseVisibleDescriptor = Object.getOwnPropertyDescriptor(n, 'visible')),
			Object.defineProperty(n, 'visible', {
				get: function () {
					return this.__visible;
				},
				set: function (t) {
					this.__visible !== t &&
						(t || this.applyBlur(),
						(this.__visible = t),
						(this.needsRender = !0),
						this.__eventsDispatcher.dispatchDescendant('visiblechange', { value: t, target: this }));
				},
				configurable: !0,
			});
	}
	function me(n) {
		const t = n.__baseVisibleDescriptor;
		t ? Object.defineProperty(n, 'visible', t) : delete n.visible;
	}
	function Zt(n) {
		n.__smartRenderingPatched || $t(n);
		for (const t of n.children) Zt(t);
	}
	function $t(n) {
		ut(n), pt(n), ht(n), at(n), st(n), ge(n), (n.__smartRenderingPatched = !0);
	}
	(o.Scene.prototype.continuousRaycasting = !1),
		(o.Scene.prototype.continuousRaycastingDropTarget = !1),
		(o.Scene.prototype.needsRender = !0),
		(o.Scene.prototype.blurOnClickOut = !1),
		(o.Scene.prototype.timeScale = 1),
		(o.Scene.prototype.totalTime = 0),
		(o.Scene.prototype.__smartRendering = !1),
		(o.Scene.prototype.cursor = 'default'),
		(o.Scene.prototype.activeSmartRendering = function () {
			return Kt(this), this;
		}),
		(o.Scene.prototype.focus = function (n) {
			const t = n == null ? void 0 : n.firstFocusable;
			if ((!n || (t != null && t.enabledState)) && this.focusedObject !== t) {
				const e = this.focusedObject;
				(this.focusedObject = t),
					e != null &&
						e.enabledState &&
						((e.__focused = !1),
						e.__eventsDispatcher.dispatchDOMAncestor('blur', new D(t)),
						e.__eventsDispatcher.dispatchDOM('focusout', new D(t))),
					t &&
						((t.__focused = !0),
						t.__eventsDispatcher.dispatchDOMAncestor('focus', new D(e)),
						t.__eventsDispatcher.dispatchDOM('focusin', new D(e))),
					(this.needsRender = !0);
			}
		}),
		(o.Scene.prototype.add = function (n) {
			return (
				lt.call(this, ...arguments),
				arguments.length === 1 && n != null && n.isObject3D && n !== this && (G(n, this), (this.needsRender = !0)),
				this
			);
		}),
		(o.Scene.prototype.remove = function (n) {
			return (
				arguments.length === 1 && this.children.indexOf(n) > -1 && (W(n), (this.needsRender = !0)),
				dt.call(this, ...arguments),
				this
			);
		}),
		Object.defineProperty(o.Scene.prototype, 'userData', {
			set: function (n) {
				(this.focusable = !1),
					(this.draggable = C.draggable),
					(this.interceptByRaycaster = C.interceptByRaycaster),
					(this.tags = new Set()),
					(this.__boundCallbacks = []),
					(this.__eventsDispatcher = new _t(this)),
					(this.intersections = []),
					(this.intersectionsDropTarget = []),
					(this.scene = this),
					(this.__boundObjects = new Set()),
					Object.defineProperty(this, 'userData', { value: n, writable: !0, configurable: !0 });
			},
			configurable: !0,
		});
	function G(n, t) {
		(n.scene = t), b.update(n), Qt(n), M.bindToScene(n);
		for (const e of n.children) G(e, t);
	}
	function W(n) {
		b.removeAll(n), Ut(n), M.unbindFromScene(n), (n.scene = void 0);
		for (const t of n.children) W(t);
	}
	(o.Object3D.prototype.findDropTarget = !1),
		(o.Object3D.prototype.__manualDetection = !1),
		(o.Object3D.prototype.__focused = !1),
		(o.Object3D.prototype.__clicking = !1),
		(o.Object3D.prototype.__dragging = !1),
		(o.Object3D.prototype.__hovered = !1),
		(o.Object3D.prototype.__visible = !0),
		Object.defineProperty(o.Object3D.prototype, 'visible', {
			get: function () {
				return this.__visible;
			},
			set: function (n) {
				this.__visible !== n &&
					((this.__visible = n),
					this.__eventsDispatcher.dispatchDescendant('visiblechange', { value: n, target: this }));
			},
			configurable: !0,
		}),
		(o.Object3D.prototype.__enabled = !0),
		Object.defineProperty(o.Object3D.prototype, 'enabled', {
			get: function () {
				return this.__enabled;
			},
			set: function (n) {
				this.__enabled !== n &&
					(n || this.applyBlur(),
					(this.__enabled = n),
					this.__eventsDispatcher.dispatchDescendant('enabledchange', { value: n, target: this }));
			},
			configurable: !0,
		}),
		Object.defineProperty(o.Object3D.prototype, 'firstFocusable', {
			get: function () {
				let n = this;
				for (; (n == null ? void 0 : n.focusable) === !1; ) n = n.parent;
				return n;
			},
		}),
		Object.defineProperty(o.Object3D.prototype, 'enabledState', {
			get: function () {
				let n = this;
				do if (!n.enabled) return !1;
				while ((n = n.parent));
				return !0;
			},
		}),
		Object.defineProperty(o.Object3D.prototype, 'visibilityState', {
			get: function () {
				let n = this;
				do if (!n.visible) return !1;
				while ((n = n.parent));
				return !0;
			},
		}),
		Object.defineProperty(o.Object3D.prototype, 'needsRender', {
			get: function () {
				var n;
				return (n = this.scene) == null ? void 0 : n.needsRender;
			},
			set: function (n) {
				this.scene && (this.scene.needsRender = n);
			},
		}),
		Object.defineProperty(o.Object3D.prototype, 'hovered', {
			get: function () {
				return this.__hovered;
			},
		}),
		Object.defineProperty(o.Object3D.prototype, 'focused', {
			get: function () {
				return this.__focused;
			},
		}),
		Object.defineProperty(o.Object3D.prototype, 'clicking', {
			get: function () {
				return this.__clicking;
			},
		}),
		Object.defineProperty(o.Object3D.prototype, 'isDragging', {
			get: function () {
				return this.__dragging;
			},
		}),
		(o.Object3D.prototype.on = function (n, t) {
			if (typeof n == 'string') return this.__eventsDispatcher.add(n, t);
			for (const e of n) this.__eventsDispatcher.add(e, t);
			return t;
		}),
		(o.Object3D.prototype.hasEvent = function (n, t) {
			return this.__eventsDispatcher.has(n, t);
		}),
		(o.Object3D.prototype.off = function (n, t) {
			this.__eventsDispatcher.remove(n, t);
		}),
		(o.Object3D.prototype.trigger = function (n, t) {
			this.__eventsDispatcher.dispatchManual(n, t);
		}),
		(o.Object3D.prototype.triggerAncestor = function (n, t) {
			this.__eventsDispatcher.dispatchAncestorManual(n, t);
		}),
		Object.defineProperty(o.Object3D.prototype, 'userData', {
			set: function (n) {
				(this.focusable = C.focusable),
					(this.draggable = C.draggable),
					(this.interceptByRaycaster = C.interceptByRaycaster),
					(this.tags = new Set()),
					(this.__boundCallbacks = []),
					(this.__eventsDispatcher = new _t(this)),
					Object.defineProperty(this, 'userData', { value: n, writable: !0, configurable: !0 });
			},
			configurable: !0,
		}),
		(o.Object3D.prototype.applyFocus = function () {
			var n;
			(n = this.scene) == null || n.focus(this);
		}),
		(o.Object3D.prototype.applyBlur = function () {
			var n;
			this === ((n = this.scene) == null ? void 0 : n.focusedObject) && this.scene.focus();
		}),
		(o.Object3D.prototype.setManualDetectionMode = function () {
			M.setManualDetectionMode(this);
		}),
		(o.Object3D.prototype.detectChanges = function (n = !1) {
			M.detectChanges(this, n);
		}),
		(o.Object3D.prototype.bindProperty = function (n, t, e) {
			return M.bindProperty(n, this, t, e), this;
		}),
		(o.Object3D.prototype.unbindProperty = function (n) {
			return M.unbindProperty(this, n), this;
		}),
		(o.Object3D.prototype.tween = function (n) {
			return new k(this).setId(n);
		}),
		(o.Object3D.prototype.querySelector = function (n) {
			return At(this, n);
		}),
		(o.Object3D.prototype.querySelectorAll = function (n) {
			return Bt(this, n);
		});
	const lt = o.Object3D.prototype.add;
	o.Object3D.prototype.add = function (n) {
		return (
			lt.call(this, ...arguments),
			arguments.length === 1 &&
				n != null &&
				n.isObject3D &&
				n !== this &&
				this.scene &&
				(G(n, this.scene), (this.scene.needsRender = !0)),
			this
		);
	};
	const dt = o.Object3D.prototype.remove;
	o.Object3D.prototype.remove = function (n) {
		return (
			arguments.length === 1 && this.children.indexOf(n) > -1 && this.scene && (W(n), (this.scene.needsRender = !0)),
			dt.call(this, ...arguments),
			this
		);
	};
	function ut(n) {
		n.__vec3Patched || (Wt(n), qt(n), (n.__vec3Patched = !0));
	}
	function pt(n) {
		n.__rotationPatched || (Gt(n), Ft(n), (n.__rotationPatched = !0));
	}
	class _t {
		constructor(t) {
			(this.listeners = {}), (this.parent = t);
		}
		add(t, e) {
			return (
				this.listeners[t] ||
					((this.listeners[t] = []),
					t === 'positionchange' || t === 'scalechange'
						? ut(this.parent)
						: t === 'rotationchange'
							? pt(this.parent)
							: (t === 'drop' || t === 'dragenter' || t === 'dragleave' || t === 'dragover') &&
								(this.parent.__isDropTarget = !0)),
				this.listeners[t].indexOf(e) < 0 && this.listeners[t].push(e),
				b.push(t, this.parent),
				e
			);
		}
		has(t, e) {
			var i;
			return ((i = this.listeners[t]) == null ? void 0 : i.indexOf(e)) > -1;
		}
		remove(t, e) {
			var s;
			const i = ((s = this.listeners[t]) == null ? void 0 : s.indexOf(e)) ?? -1;
			i > -1 &&
				(this.listeners[t].splice(i, 1),
				this.listeners[t].length === 0 &&
					(b.remove(t, this.parent), (this.parent.__isDropTarget = this.isDropTarget())));
		}
		isDropTarget() {
			var e, i, s, r;
			const t = this.listeners;
			return (
				!this.parent.isInstancedMesh &&
				(((e = t.drop) == null ? void 0 : e.length) > 0 ||
					((i = t.dragenter) == null ? void 0 : i.length) > 0 ||
					((s = t.dragleave) == null ? void 0 : s.length) > 0 ||
					((r = t.dragover) == null ? void 0 : r.length) > 0)
			);
		}
		dispatchDOM(t, e) {
			(e._bubbles = !1),
				(e._stoppedImmediatePropagation = !1),
				(e._defaultPrevented = !1),
				(e._type = t),
				(e._target = this.parent),
				this.executeDOM(t, e);
		}
		dispatchDOMAncestor(t, e) {
			let i = this.parent;
			for (
				e._bubbles = !0, e._stoppedImmediatePropagation = !1, e._defaultPrevented = !1, e._type = t, e._target = i;
				i && e._bubbles;

			)
				i.__eventsDispatcher.executeDOM(t, e), (i = i.parent);
		}
		executeDOM(t, e) {
			if (!this.listeners[t]) return;
			const i = (e.currentTarget = this.parent);
			for (const s of this.listeners[t]) {
				if (e._stoppedImmediatePropagation) break;
				s.call(i, e);
			}
		}
		dispatch(t, e) {
			if (this.listeners[t]) for (const i of this.listeners[t]) i.call(this.parent, e);
		}
		dispatchDescendant(t, e) {
			const i = this.parent;
			if ((i.__eventsDispatcher.dispatch(t, e), !!i.children))
				for (const s of i.children) s.__eventsDispatcher.dispatchDescendant(t, e);
		}
		dispatchManual(t, e) {
			if ((e == null ? void 0 : e.cancelable) !== void 0) return this.dispatchDOM(t, e);
			this.dispatch(t, e);
		}
		dispatchAncestorManual(t, e) {
			(e == null ? void 0 : e.cancelable) !== void 0 && this.dispatchDOMAncestor(t, e);
		}
	}
	const ye = new o.MeshBasicMaterial();
	class be extends o.Mesh {
		constructor(t) {
			super(t, ye);
		}
	}
	class Jt {
		constructor(t) {
			(this.listeners = {}), (this.parent = t);
		}
		add(t, e) {
			return (
				this.listeners[t] || (this.listeners[t] = []), this.listeners[t].indexOf(e) < 0 && this.listeners[t].push(e), e
			);
		}
		has(t, e) {
			var i;
			return ((i = this.listeners[t]) == null ? void 0 : i.indexOf(e)) > -1;
		}
		remove(t, e) {
			var s;
			const i = ((s = this.listeners[t]) == null ? void 0 : s.indexOf(e)) ?? -1;
			i > -1 && this.listeners[t].splice(i, 1);
		}
		dispatchDOM(t, e) {
			(e._bubbles = !1),
				(e._stoppedImmediatePropagation = !1),
				(e._defaultPrevented = !1),
				(e._type = t),
				(e._target = this.parent),
				this.executeDOM(t, e);
		}
		executeDOM(t, e) {
			if (!this.listeners[t]) return;
			const i = (e.currentTarget = this.parent);
			for (const s of this.listeners[t]) {
				if (e._stoppedImmediatePropagation) break;
				s.call(i, e);
			}
		}
		dispatch(t, e) {
			if (this.listeners[t]) for (const i of this.listeners[t]) i.call(this.parent, e);
		}
		dispatchManual(t, e) {
			if ((e == null ? void 0 : e.cancelable) !== void 0) return this.dispatchDOM(t, e);
			this.dispatch(t, e);
		}
	}
	function we(...n) {
		for (const t of n)
			Object.defineProperty(te.prototype, t, {
				get: function () {
					return this._hoveredInstance[t];
				},
				set: function () {},
				configurable: !0,
			});
	}
	class te extends o.InstancedMesh {
		constructor(t, e, i, s, r = !1, a) {
			super(t, e, i),
				(this.isInstancedMesh2 = !0),
				(this.instances = []),
				(this._tempMatrix = new o.Matrix4()),
				(this._tempColor = new o.Color()),
				(a = this._tempColor.set(a)),
				(this._animate = r),
				r && this.instanceMatrix.setUsage(o.DynamicDrawUsage);
			for (let h = 0; h < i; h++) this.instances.push(new s(this, h, a));
			this.on('animate', this.animate.bind(this)),
				this.on('pointerintersection', this.pointerIntersection.bind(this)),
				this.on('pointermove', this.pointerMove.bind(this)),
				this.on('pointerleave', this.pointerLeave.bind(this)),
				this.on('focusin', this.focusIn.bind(this)),
				this.on('focusout', this.focusOut.bind(this)),
				this.on('click', this.click.bind(this)),
				this.on('pointerdown', this.pointerDown.bind(this)),
				this.on('pointerup', this.pointerUp.bind(this)),
				this.on('keydown', this.keyDown.bind(this)),
				this.on('keyup', this.keyUp.bind(this)),
				this.on('wheel', this.wheel.bind(this)),
				this.on('drag', this.drag.bind(this)),
				this.on('dragstart', this.dragStart.bind(this)),
				this.on('dragend', this.dragEnd.bind(this)),
				this.on('dragcancel', this.dragCancel.bind(this));
		}
		get __enabledStateHovered() {
			return this._hoveredInstance.enabled && super.enabledState;
		}
		get hoveredInstance() {
			return this._hoveredInstance;
		}
		get focusedInstance() {
			return this._focusedInstance;
		}
		get clickingInstance() {
			return this._clickingInstance;
		}
		get draggingInstance() {
			return this._draggingInstance;
		}
		focus(t) {
			if (!this.__focused) return;
			const e = t != null && t.focusable ? t : void 0;
			if ((!t || (e != null && e.enabled)) && this._focusedInstance !== e) {
				const i = this._focusedInstance;
				(this._focusedInstance = e),
					i != null && i.enabled && ((i.__focused = !1), i.__eventsDispatcher.dispatchDOM('blur', new D(e))),
					e && ((e.__focused = !0), e.__eventsDispatcher.dispatchDOM('focus', new D(i))),
					(this.needsRender = !0);
			}
		}
		pointerOverOut(t, e) {
			const i = this.instances[t.instanceId];
			if (this._hoveredInstance !== i) {
				const s = this._hoveredInstance;
				if (((this._hoveredInstance = i), i.enabled && (i.__hovered = !0), s && ((s.__hovered = !1), s.enabled))) {
					const r = new y(e, t, i);
					s.__eventsDispatcher.dispatchDOM('pointerout', r);
				}
				if (i.enabled) {
					const r = new y(e, t, s);
					i.__eventsDispatcher.dispatchDOM('pointerover', r);
				}
			}
		}
		animate(t) {
			if (this._animate)
				for (let e = 0; e < this.count; e++) this.instances[e].__eventsDispatcher.dispatch('animate', t);
		}
		pointerIntersection(t) {
			var e;
			if (
				(this.pointerOverOut(t.intersection, (e = this._lastPointerMove) == null ? void 0 : e.domEvent),
				this._hoveredInstance.enabled)
			) {
				const i = new tt(t.intersection);
				this._hoveredInstance.__eventsDispatcher.dispatchDOM('pointerintersection', i);
			}
		}
		pointerMove(t) {
			if (
				((this._lastPointerMove = t), this.pointerOverOut(t.intersection, t.domEvent), this._hoveredInstance.enabled)
			) {
				const e = new y(t.domEvent, t.intersection);
				this._hoveredInstance.__eventsDispatcher.dispatchDOM('pointermove', e);
			}
		}
		pointerLeave(t) {
			const e = this._hoveredInstance;
			if (((e.__hovered = !1), (this._hoveredInstance = void 0), e.enabled)) {
				const i = new y(t.domEvent, t.intersection);
				e.__eventsDispatcher.dispatchDOM('pointerout', i);
			}
		}
		focusIn() {
			this.focus(this._hoveredInstance);
		}
		focusOut() {
			this.focus();
		}
		click(t) {
			var i;
			const e = this.instances[t.intersection.instanceId];
			if (e.enabled) {
				const s = new y(t.domEvent, t.intersection);
				if (
					(e.__eventsDispatcher.dispatchDOM('click', s),
					t.intersection.instanceId === ((i = this._lastClick) == null ? void 0 : i.intersection.instanceId) &&
						t.timeStamp - this._lastClick.timeStamp <= 300)
				) {
					const r = new y(t.domEvent, t.intersection);
					e.__eventsDispatcher.dispatchDOM('dblclick', r), (this._lastClick = void 0);
				} else this._lastClick = t;
			}
		}
		pointerDown(t) {
			const e = this.instances[t.intersection.instanceId];
			if (e.enabled) {
				(this._clickingInstance = e), (e.__clicking = !0);
				const i = new y(t.domEvent, t.intersection, void 0, !0);
				e.__eventsDispatcher.dispatchDOM('pointerdown', i), i._defaultPrevented ? t.preventDefault() : this.focus(e);
			}
		}
		pointerUp(t) {
			const e = this._clickingInstance;
			if (e) {
				if (((e.__clicking = !1), this._clickingInstance.enabled)) {
					const i = new y(t.domEvent, t.intersection);
					e.__eventsDispatcher.dispatchDOM('pointerup', i);
				}
				this._clickingInstance = void 0;
			}
		}
		keyDown(t) {
			if (this._focusedInstance.enabled) {
				const e = new j(t.domEvent, !0);
				this._focusedInstance.__eventsDispatcher.dispatchDOM('keydown', e), e._defaultPrevented && t.preventDefault();
			}
		}
		keyUp(t) {
			if (this._focusedInstance.enabled) {
				const e = new j(t.domEvent, !1);
				this._focusedInstance.__eventsDispatcher.dispatchDOM('keyup', e);
			}
		}
		wheel(t) {
			if (this._hoveredInstance.enabled) {
				const e = new J(t.domEvent, t.intersection);
				this._hoveredInstance.__eventsDispatcher.dispatchDOM('wheel', e);
			}
		}
		drag(t) {
			const e = new P(t.domEvent, !0, t.dataTransfer, t.position, t.relatedTarget, t.intersection);
			this._draggingInstance.__eventsDispatcher.dispatchDOM('drag', e), e._defaultPrevented && t.preventDefault();
		}
		dragStart(t) {
			(this._draggingInstance = this.instances[t.intersection.instanceId]), (this._draggingInstance.__dragging = !0);
			const e = new P(t.domEvent, !1, t.dataTransfer, t.position, t.relatedTarget, t.intersection);
			this._draggingInstance.__eventsDispatcher.dispatchDOM('dragstart', e);
		}
		dragEnd(t) {
			const e = this._draggingInstance;
			(e.__dragging = !1), (this._draggingInstance = void 0);
			const i = new P(t.domEvent, !1, t.dataTransfer, t.position, t.relatedTarget, t.intersection);
			e.__eventsDispatcher.dispatchDOM('dragend', i), this.computeBoundingSphere();
		}
		dragCancel(t) {
			const e = new P(t.domEvent, t.cancelable, t.dataTransfer, t.position, t.relatedTarget, t.intersection);
			this._draggingInstance.__eventsDispatcher.dispatchDOM('dragcancel', e), e._defaultPrevented && t.preventDefault();
		}
	}
	we('cursor', 'cursorDrag', 'cursorDrop', 'draggable', 'findDropTarget');
	const Y = new o.Quaternion();
	class ve extends o.EventDispatcher {
		constructor(t, e, i) {
			super(),
				(this.isInstancedMeshEntity = !0),
				(this.position = new o.Vector3()),
				(this.scale = new o.Vector3(1, 1, 1)),
				(this.quaternion = new o.Quaternion()),
				(this.enabled = !0),
				(this.focusable = !0),
				(this.draggable = !1),
				(this.findDropTarget = !1),
				(this.__hovered = !1),
				(this.__focused = !1),
				(this.__clicking = !1),
				(this.__dragging = !1),
				(this.parent = t),
				(this.instanceId = e),
				(this.__eventsDispatcher = new Jt(this)),
				i !== void 0 && this.setColor(i);
		}
		get hovered() {
			return this.__hovered;
		}
		get focused() {
			return this.__focused;
		}
		get clicking() {
			return this.__clicking;
		}
		get dragging() {
			return this.__dragging;
		}
		get enabledState() {
			return this.enabled && this.parent.enabledState;
		}
		get matrixWorld() {
			const t = this.parent._tempMatrix;
			return (
				t.compose(this.position, this.quaternion, this.scale),
				this.parent.updateWorldMatrix(!0, !1),
				t.premultiply(this.parent.matrixWorld)
			);
		}
		setColor(t) {
			const e = this.parent;
			e.setColorAt(this.instanceId, e._tempColor.set(t)), (e.instanceColor.needsUpdate = !0);
		}
		getColor(t = this.parent._tempColor) {
			return this.parent.getColorAt(this.instanceId, t), t;
		}
		updateMatrix() {
			const t = this.parent,
				e = t._tempMatrix;
			e.compose(this.position, this.quaternion, this.scale),
				t.setMatrixAt(this.instanceId, e),
				(t.instanceMatrix.needsUpdate = !0);
		}
		applyMatrix4(t) {
			const e = this.parent,
				i = e._tempMatrix;
			return (
				i.compose(this.position, this.quaternion, this.scale),
				i.premultiply(t),
				i.decompose(this.position, this.quaternion, this.scale),
				e.setMatrixAt(this.instanceId, i),
				(e.instanceMatrix.needsUpdate = !0),
				this
			);
		}
		applyQuaternion(t) {
			return this.quaternion.premultiply(t), this;
		}
		rotateOnAxis(t, e) {
			return Y.setFromAxisAngle(t, e), this.quaternion.multiply(Y), this;
		}
		rotateOnWorldAxis(t, e) {
			return Y.setFromAxisAngle(t, e), this.quaternion.premultiply(Y), this;
		}
		applyFocus() {
			this.parent.focus(this);
		}
		applyBlur() {
			this.parent.focusedInstance === this && this.parent.focus();
		}
		on(t, e) {
			if (typeof t == 'string') return this.__eventsDispatcher.add(t, e);
			for (const i of t) this.__eventsDispatcher.add(i, e);
			return e;
		}
		hasEvent(t, e) {
			return this.__eventsDispatcher.has(t, e);
		}
		off(t, e) {
			this.__eventsDispatcher.remove(t, e);
		}
		trigger(t, e) {
			this.__eventsDispatcher.dispatchManual(t, e);
		}
		tween() {
			return new k(this);
		}
	}
	o.Material.prototype.tween = function (n) {
		return new k(this).setId(n);
	};
	const A = class A {
		static get(t) {
			if (typeof t == 'string') return this._results[t];
			const e = [];
			for (const i of t) e.push(this._results[i]);
			return e;
		}
		static getLoader(t) {
			return this._loaders.has(t) || this._loaders.set(t, new t()), this._loaders.get(t);
		}
		static load(t, e, i, s) {
			return new Promise((r) => {
				if (this._results[e]) return r(this._results[e]);
				this.getLoader(t).load(
					e,
					(h) => {
						(this._results[e] = h), r(h);
					},
					i,
					(h) => {
						s && s(h), r(void 0);
					}
				);
			});
		}
		static preload(t, ...e) {
			this._pending.push({ loader: t, paths: e });
		}
		static preloadAllPending(t = {}) {
			const e = this.loadAll(t, ...this._pending);
			return (this._pending = []), e;
		}
		static loadAll(t = {}, ...e) {
			const i = [];
			t.onProgress ?? (t.onProgress = this.onProgress),
				t.onError ?? (t.onError = this.onError),
				(t.total = 0),
				(t.progress = 0);
			for (const s of e) this.loadByLoader(s, i, t);
			return Promise.all(i);
		}
		static loadByLoader(t, e, i) {
			if (t != null && t.paths) {
				const s = this.getLoader(t.loader);
				for (const r of t.paths) e.push(this.startLoad(s, r, i));
			}
		}
		static startLoad(t, e, i) {
			return new Promise((s) => {
				const r = e.path ?? e;
				if (this._results[r]) return s();
				const a = e.onLoad;
				i.total++,
					t.load(
						r,
						(h) => {
							(this._results[r] = h), i.onProgress && i.onProgress(++i.progress / i.total), a && a(h), s();
						},
						void 0,
						(h) => {
							i.onError && i.onError(h), i.onProgress && i.onProgress(++i.progress / i.total), s();
						}
					);
			});
		}
	};
	(A._loaders = new Map()), (A._results = {}), (A._pending = []);
	let ft = A;
	const g = [...Array(4)].map(() => new o.Vector3()),
		Me = new o.Vector3(),
		yt = class yt {
			static getPositionFromObject3D(t) {
				return t.isObject3D ? t.position : t;
			}
			static getPositionsFromObject3D(t) {
				const e = [];
				for (const i of t) e.push(this.getPositionFromObject3D(i));
				return e;
			}
			static computeSign(t, e, i) {
				return Math.sign(g[0].subVectors(t, e).dot(i));
			}
			static haveSameDirection(t, e, i = 10 ** -2) {
				return g[0].copy(t).normalize().dot(g[1].copy(e).normalize()) > 1 - i;
			}
			static haveOppositeDirection(t, e, i = 10 ** -2) {
				return g[0].copy(t).normalize().dot(g[1].copy(e).normalize()) < i - 1;
			}
			static perpendicular(t, e = new o.Vector3(), i = this.DEFAULT_NORMAL) {
				return e.crossVectors(t, i);
			}
			static perpendicularSigned(t, e, i = new o.Vector3(), s = this.DEFAULT_NORMAL) {
				return i.crossVectors(t, s), this.computeSign(e, Me, i) !== 1 ? i : i.multiplyScalar(-1);
			}
			static perpendicularByPoints(t, e, i = new o.Vector3(), s = this.DEFAULT_NORMAL) {
				const [r, a] = this.getPositionsFromObject3D([t, e]);
				return i.crossVectors(g[0].subVectors(r, a), s);
			}
			static perpendicularSignedByPoints(t, e, i, s = new o.Vector3(), r = this.DEFAULT_NORMAL) {
				const [a, h, l] = this.getPositionsFromObject3D([t, e, i]);
				return s.crossVectors(g[0].subVectors(a, h), r), this.computeSign(l, a, s) !== 1 ? s : s.multiplyScalar(-1);
			}
			static bisector(t, e, i = new o.Vector3()) {
				return g[0].copy(t).normalize(), g[1].copy(e).normalize(), i.addVectors(g[0], g[1]).normalize();
			}
			static bisectorByPoints(t, e, i, s = new o.Vector3()) {
				const [r, a, h] = this.getPositionsFromObject3D([t, e, i]);
				return this.bisector(g[2].subVectors(r, h), g[3].subVectors(a, h), s);
			}
			static arePointsOnSameSide(t, e, i) {
				const [s, ...r] = this.getPositionsFromObject3D([t, ...i]),
					a = this.computeSign(r[0], s, e);
				for (let h = 1; h < i.length; h++) if (a !== this.computeSign(r[h], s, e)) return !1;
				return !0;
			}
			static arePointsOnSameSideByPoints(t, e, i, s = this.DEFAULT_NORMAL) {
				const [r, a, ...h] = this.getPositionsFromObject3D([t, e, ...i]),
					l = this.perpendicularByPoints(r, a, g[0], s),
					d = this.computeSign(h[0], r, l);
				for (let u = 1; u < i.length; u++) if (d !== this.computeSign(h[u], r, l)) return !1;
				return !0;
			}
			static angleSignedFromOrigin(t, e, i = this.DEFAULT_NORMAL) {
				return Math.atan2(g[0].crossVectors(t, e).dot(i), t.dot(e));
			}
			static angleSignedByPoints(t, e, i, s = this.DEFAULT_NORMAL) {
				const [r, a, h] = this.getPositionsFromObject3D([t, e, i]),
					l = g[0].subVectors(r, h),
					d = g[1].subVectors(a, h);
				return Math.atan2(g[2].crossVectors(l, d).dot(s), l.dot(d));
			}
			static projectOnLine(t, e, i, s = new o.Vector3()) {
				const [r, a, h] = this.getPositionsFromObject3D([t, e, i]);
				return s.subVectors(r, a).projectOnVector(g[0].subVectors(a, h)).add(a);
			}
		};
	yt.DEFAULT_NORMAL = new o.Vector3(0, 0, 1);
	let z = yt;
	class Ce {
		static line_line_2D(t, e, i, s, r = new o.Vector3()) {
			const [a, h, l, d] = z.getPositionsFromObject3D([t, e, i, s]),
				u = (d.y - l.y) * (h.x - a.x) - (d.x - l.x) * (h.y - a.y);
			if (u === 0) return;
			let p = ((d.x - l.x) * (a.y - l.y) - (d.y - l.y) * (a.x - l.x)) / u;
			return r.set(a.x + p * (h.x - a.x), a.y + p * (h.y - a.y), 0);
		}
		static segment_segment_2D(t, e, i, s, r = new o.Vector3()) {
			const [a, h, l, d] = z.getPositionsFromObject3D([t, e, i, s]),
				u = (d.y - l.y) * (h.x - a.x) - (d.x - l.x) * (h.y - a.y);
			if (u === 0) return;
			let p = ((d.x - l.x) * (a.y - l.y) - (d.y - l.y) * (a.x - l.x)) / u,
				_ = ((h.x - a.x) * (a.y - l.y) - (h.y - a.y) * (a.x - l.x)) / u;
			if (!(p < 0 || p > 1 || _ < 0 || _ > 1)) return r.set(a.x + p * (h.x - a.x), a.y + p * (h.y - a.y), 0);
		}
		static line_line_3D(t, e, i, s, r = new o.Vector3(), a = 10 ** -6) {
			const [h, l, d, u] = z.getPositionsFromObject3D([t, e, i, s]),
				p = g[0].subVectors(h, d),
				_ = g[1].subVectors(u, d);
			if (_.lengthSq() < a) return;
			const f = g[2].subVectors(l, h);
			if (f.lengthSq() < a) return;
			const m = p.x * _.x + p.y * _.y + p.z * _.z,
				E = _.x * f.x + _.y * f.y + _.z * f.z,
				K = p.x * f.x + p.y * f.y + p.z * f.z,
				B = _.x * _.x + _.y * _.y + _.z * _.z,
				V = (f.x * f.x + f.y * f.y + f.z * f.z) * B - E * E;
			if (Math.abs(V) < a) return;
			const x = (m * E - K * B) / V;
			return r.set(h.x + x * f.x, h.y + x * f.y, h.z + x * f.z);
		}
		static line_boxAABB(t, e, i) {
			const s = 1 / e.x,
				r = 1 / e.y,
				a = 1 / e.z;
			let h = 0,
				l = 1 / 0,
				d,
				u,
				p,
				_;
			return (
				s >= 0 ? ((d = i.min.x), (u = i.max.x)) : ((d = i.max.x), (u = i.min.x)),
				(p = (d - t.x) * s),
				(_ = (u - t.x) * s),
				(h = p > h ? p : h),
				(l = _ < l ? _ : l),
				r >= 0 ? ((d = i.min.y), (u = i.max.y)) : ((d = i.max.y), (u = i.min.y)),
				(p = (d - t.y) * r),
				(_ = (u - t.y) * r),
				(h = p > h ? p : h),
				(l = _ < l ? _ : l),
				a >= 0 ? ((d = i.min.z), (u = i.max.z)) : ((d = i.max.z), (u = i.min.z)),
				(p = (d - t.z) * a),
				(_ = (u - t.z) * a),
				(h = p > h ? p : h),
				(l = _ < l ? _ : l),
				h <= l
			);
		}
		static segment_boxAABB(t, e, i) {
			const s = g[0].subVectors(e, t).normalize(),
				r = t.distanceTo(e),
				a = 1 / s.x,
				h = 1 / s.y,
				l = 1 / s.z;
			let d = 0,
				u = 1 / 0,
				p,
				_,
				f,
				m;
			return (
				a >= 0 ? ((p = i.min.x), (_ = i.max.x)) : ((p = i.max.x), (_ = i.min.x)),
				(f = (p - t.x) * a),
				(m = (_ - t.x) * a),
				(d = f > d ? f : d),
				(u = m < u ? m : u),
				h >= 0 ? ((p = i.min.y), (_ = i.max.y)) : ((p = i.max.y), (_ = i.min.y)),
				(f = (p - t.y) * h),
				(m = (_ - t.y) * h),
				(d = f > d ? f : d),
				(u = m < u ? m : u),
				l >= 0 ? ((p = i.min.z), (_ = i.max.z)) : ((p = i.max.z), (_ = i.min.z)),
				(f = (p - t.z) * l),
				(m = (_ - t.z) * l),
				(d = f > d ? f : d),
				(u = m < u ? m : u),
				d <= u && r >= d
			);
		}
	}
	const U = class U {
		static getSceneIntersection(t, e, i) {
			return (
				this._plane.setFromNormalAndCoplanarPoint(
					e.getWorldDirection(this._plane.normal),
					e.getWorldPosition(this._temp)
				),
				this._plane.translate(this._temp.copy(this._plane.normal).setLength(i)),
				t.intersectPlane(this._plane, this._temp)
			);
		}
		static setChildrenDragTarget(t, e) {
			t.traverse((i) => {
				(i.draggable = !0), (i.dragTarget = e);
			});
		}
		static computeBoundingSphereChildren(t) {
			t.traverse((e) => {
				e.updateMatrixWorld(), e.computeBoundingSphere && e.computeBoundingSphere();
			});
		}
		static getNodes(t) {
			return this.generateNodesFromObject(t, {}, {});
		}
		static generateNodesFromObject(t, e, i) {
			const s = this.getNodeName(t, i);
			e[s] = t;
			for (const r of t.children) this.generateNodesFromObject(r, e, i);
			return e;
		}
		static getNodeName(t, e) {
			const i = t.name;
			return e[i] === void 0 ? ((e[i] = 0), i) : `${i}_${++e[i]}`;
		}
	};
	(U._plane = new o.Plane()), (U._temp = new o.Vector3());
	let gt = U;
	(c.ActionCallback = Tt),
		(c.ActionDelay = Rt),
		(c.ActionMotion = F),
		(c.ActionRepeat = It),
		(c.ActionTween = H),
		(c.ActionYoyo = Ot),
		(c.Asset = ft),
		(c.Binding = M),
		(c.CursorHandler = Mt),
		(c.Default = C),
		(c.DragAndDropManager = Ct),
		(c.DragEventExt = P),
		(c.Easings = T),
		(c.EventExt = I),
		(c.EventsCache = b),
		(c.EventsDispatcher = _t),
		(c.EventsDispatcherInstanced = Jt),
		(c.FocusEventExt = D),
		(c.Hitbox = be),
		(c.InstancedMesh2 = te),
		(c.InstancedMeshEntity = ve),
		(c.InteractionEventsQueue = Dt),
		(c.InteractionManager = Pt),
		(c.IntersectionUtils = Ce),
		(c.KeyboardEventExt = j),
		(c.Main = et),
		(c.MouseEventExt = $),
		(c.OrthographicCameraAuto = ee),
		(c.Panel = L),
		(c.PerspectiveCameraAuto = ie),
		(c.PointerEventExt = y),
		(c.PointerIntersectionEvent = tt),
		(c.RaycasterManager = xt),
		(c.RenderManager = zt),
		(c.RenderView = kt),
		(c.RunningTween = O),
		(c.Stats = Et),
		(c.TEMP = g),
		(c.Tween = k),
		(c.TweenManager = v),
		(c.Utils = gt),
		(c.VectorUtils = z),
		(c.WheelEventExt = J),
		(c.activeSmartRendering = Kt),
		(c.addBase = lt),
		(c.applyEulerPatch = Ft),
		(c.applyMatrix4Patch = qt),
		(c.applyObject3DRotationPatch = pt),
		(c.applyObject3DVector3Patch = ut),
		(c.applyQuaternionPatch = Gt),
		(c.applySmartRenderingPatch = Qt),
		(c.applyVec3Patch = Wt),
		(c.applyWebGLRendererPatch = St),
		(c.querySelector = At),
		(c.querySelectorAll = Bt),
		(c.removeBase = dt),
		(c.removeSceneReference = W),
		(c.removeSmartRenderingPatch = Ut),
		(c.setEulerChangeCallback = nt),
		(c.setEulerChangeCallbackSR = st),
		(c.setQuatChangeCallback = rt),
		(c.setQuatChangeCallbackSR = at),
		(c.setSceneReference = G),
		(c.setVec3ChangeCallback = ot),
		(c.setVec3ChangeCallbackSR = ht),
		(c.setup = re),
		Object.defineProperty(c, Symbol.toStringTag, { value: 'Module' });
});
//# sourceMappingURL=index.umd.cjs.map
