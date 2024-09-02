(function (h, s) {
	typeof exports == 'object' && typeof module < 'u'
		? s(exports, require('three'), require('bvh.js'), require('three/examples/jsm/utils/SortUtils.js'))
		: typeof define == 'function' && define.amd
			? define(['exports', 'three', 'bvh.js', 'three/examples/jsm/utils/SortUtils.js'], s)
			: ((h = typeof globalThis < 'u' ? globalThis : h || self),
				s((h.InstancedMesh = {}), h.three, h.bvh_js, h.SortUtils_js));
})(this, function (h, s, N, ct) {
	'use strict';
	if (s === undefined) {
		s = window.THREE;
	}
	class D extends s.GLBufferAttribute {
		constructor(t, e, n, i, r, a, o = 1) {
			super(t, e, n, i, r),
				(this.isInstancedBufferAttribute = !0),
				(this.isGLInstancedBufferAttribute = !0),
				(this.meshPerAttribute = o),
				(this.array = a);
		}
	}
	class v {
		constructor(t, e) {
			(this.isInstanceEntity = !0),
				(this.id = e),
				(this.owner = t),
				(this.position = new s.Vector3()),
				(this.scale = new s.Vector3(1, 1, 1)),
				(this.quaternion = new s.Quaternion());
		}
		get visible() {
			return this.owner.getVisibilityAt(this.id);
		}
		set visible(t) {
			this.owner.setVisibilityAt(this.id, t);
		}
		get color() {
			return this.owner.getColorAt(this.id);
		}
		set color(t) {
			this.owner.setColorAt(this.id, t);
		}
		get matrix() {
			return this.owner.getMatrixAt(this.id);
		}
		get matrixWorld() {
			return this.matrix.premultiply(this.owner.matrixWorld);
		}
		updateMatrix() {
			this.owner.composeMatrixInstance(this);
		}
		setUniform(t, e) {
			this.owner.setUniformAt(this.id, t, e);
		}
		copyTo(t) {
			t.position.copy(this.position), t.scale.copy(this.scale), t.quaternion.copy(this.quaternion);
		}
		applyMatrix4(t) {
			return this.matrix.premultiply(t).decompose(this.position, this.quaternion, this.scale), this;
		}
		applyQuaternion(t) {
			return this.quaternion.premultiply(t), this;
		}
		rotateOnAxis(t, e) {
			return I.setFromAxisAngle(t, e), this.quaternion.multiply(I), this;
		}
		rotateOnWorldAxis(t, e) {
			return I.setFromAxisAngle(t, e), this.quaternion.premultiply(I), this;
		}
		rotateX(t) {
			return this.rotateOnAxis(V, t);
		}
		rotateY(t) {
			return this.rotateOnAxis(k, t);
		}
		rotateZ(t) {
			return this.rotateOnAxis(L, t);
		}
		translateOnAxis(t, e) {
			return G.copy(t).applyQuaternion(this.quaternion), this.position.add(G.multiplyScalar(e)), this;
		}
		translateX(t) {
			return this.translateOnAxis(V, t);
		}
		translateY(t) {
			return this.translateOnAxis(k, t);
		}
		translateZ(t) {
			return this.translateOnAxis(L, t);
		}
	}
	const I = new s.Quaternion(),
		G = new s.Vector3(),
		V = new s.Vector3(1, 0, 0),
		k = new s.Vector3(0, 1, 0),
		L = new s.Vector3(0, 0, 1);
	function ut(u) {
		const t = Math.ceil(Math.sqrt(u)),
			e = new Float32Array(t * t),
			n = new s.DataTexture(e, t, t, s.RedFormat, s.FloatType);
		return (n.needsUpdate = !0), n;
	}
	function lt(u) {
		const t = Math.ceil(Math.sqrt(u)),
			e = new Float32Array(t * t * 2),
			n = new s.DataTexture(e, t, t, s.RGFormat, s.FloatType);
		return (n.needsUpdate = !0), n;
	}
	function q(u) {
		const t = Math.ceil(Math.sqrt(u)),
			e = new Float32Array(t * t * 4),
			n = new s.DataTexture(e, t, t, s.RGBAFormat, s.FloatType);
		return (n.needsUpdate = !0), n;
	}
	function ht(u) {
		const t = Math.ceil(Math.sqrt(u)),
			e = new Float32Array(t * t * 4),
			n = new s.DataTexture(e, t, t, s.RGBAFormat, s.FloatType);
		return (n.needsUpdate = !0), n;
	}
	function xt(u) {
		let t = Math.sqrt(u * 3);
		(t = Math.ceil(t / 3) * 3), (t = Math.max(t, 3));
		const e = new Float32Array(t * t * 4),
			n = new s.DataTexture(e, t, t, s.RGBAFormat, s.FloatType);
		return (n.needsUpdate = !0), n;
	}
	function W(u) {
		let t = Math.sqrt(u * 4);
		(t = Math.ceil(t / 4) * 4), (t = Math.max(t, 4));
		const e = new Float32Array(t * t * 4),
			n = new s.DataTexture(e, t, t, s.RGBAFormat, s.FloatType);
		return (n.needsUpdate = !0), n;
	}
	class P {
		constructor(t, e = 0, n = !1) {
			(this.map = new Map()),
				(this.target = t),
				t.geometry.boundingBox || t.geometry.computeBoundingBox(),
				(this.geoBoundingBox = t.geometry.boundingBox),
				(this._arrayType = n ? Float64Array : Float32Array),
				(this.bvh = new N.BVH(new N.HybridBuilder(e), N.WebGLCoordinateSystem));
		}
		create() {
			const t = this.target.instancesCount,
				e = new Array(t),
				n = new Uint32Array(t);
			this.clear();
			for (let i = 0; i < t; i++) (e[i] = this.getBox(i, new this._arrayType(6))), (n[i] = i);
			this.bvh.createFromArray(n, e, (i) => {
				this.map.set(i.object, i);
			});
		}
		insert(t) {
			const e = this.bvh.insert(t, this.getBox(t, new this._arrayType(6)));
			this.map.set(t, e);
		}
		insertRange(t) {
			const e = t.length,
				n = new Array(e);
			for (let i = 0; i < e; i++) n[i] = this.getBox(t[i], new this._arrayType(6));
			this.bvh.insertRange(t, n, (i) => {
				this.map.set(i.object, i);
			});
		}
		move(t) {
			const e = this.map.get(t);
			e && (this.getBox(t, e.box), this.bvh.move(e));
		}
		delete(t) {
			const e = this.map.get(t);
			e && (this.bvh.delete(e), this.map.delete(t));
		}
		clear() {
			this.bvh.clear(), (this.map = new Map());
		}
		frustumCulling(t, e) {
			this.bvh.frustumCulling(t.elements, e);
		}
		frustumCullingConservative() {
			throw new Error('Not implemented yet.');
		}
		raycast(t, e) {
			const n = t.ray;
			(C[0] = n.origin.x),
				(C[1] = n.origin.y),
				(C[2] = n.origin.z),
				(S[0] = n.direction.x),
				(S[1] = n.direction.y),
				(S[2] = n.direction.z),
				this.bvh.intersectRay(S, C, t.near, t.far, e);
		}
		getBox(t, e) {
			w.copy(this.geoBoundingBox).applyMatrix4(this.target.getMatrixAt(t));
			const n = w.min,
				i = w.max;
			return (e[0] = n.x), (e[1] = i.x), (e[2] = n.y), (e[3] = i.y), (e[4] = n.z), (e[5] = i.z), e;
		}
	}
	const C = new Float64Array(3),
		S = new Float64Array(3),
		w = new s.Box3();
	class H {
		constructor() {
			(this.list = []), (this.pool = []);
		}
		push(t, e) {
			const n = this.pool,
				i = this.list.length;
			i >= n.length && n.push({ depth: null, index: null });
			const r = n[i];
			(r.depth = t), (r.index = e), this.list.push(r);
		}
		reset() {
			this.list.length = 0;
		}
	}
	class dt extends s.Mesh {
		constructor(t, e, n, i) {
			if (!t) throw new Error("'renderer' is mandatory.");
			if (!(e > 0)) throw new Error("'count' must be greater than 0.");
			if (!n) throw new Error("'geometry' is mandatory.");
			if (
				(super(n, i),
				(this.type = 'InstancedMesh2'),
				(this.isInstancedMesh2 = !0),
				(this.colorsTexture = null),
				(this.morphTexture = null),
				(this.boundingBox = null),
				(this.boundingSphere = null),
				(this.perObjectFrustumCulled = !0),
				(this.sortObjects = !1),
				(this.customSort = null),
				(this.raycastOnlyFrustum = !1),
				(this._uniformsSetCallback = new Map()),
				(this.customDepthMaterial = new s.MeshDepthMaterial({ depthPacking: s.RGBADepthPacking })),
				(this.customDistanceMaterial = new s.MeshDistanceMaterial()),
				(this.isInstancedMesh = !0),
				(this.instanceMatrix = new s.InstancedBufferAttribute(new Float32Array(0), 16)),
				(this.instanceColor = null),
				this.geometry.getAttribute('instanceIndex'))
			)
				throw new Error('Cannot reuse already patched geometry.');
			(this.instancesCount = e),
				(this._maxCount = e),
				(this._count = e),
				(this._material = i),
				this.initIndixesAndVisibility(t),
				this.initMatricesTexture(),
				this.patchMaterial(this.customDepthMaterial),
				this.patchMaterial(this.customDistanceMaterial);
		}
		get count() {
			return this._count;
		}
		get maxCount() {
			return this._maxCount;
		}
		get material() {
			return this._material;
		}
		set material(t) {
			(this._material = t), this.patchMaterials(t);
		}
		onBeforeRender(t, e, n, i, r) {
			if (!this.perObjectFrustumCulled) return;
			this.frustumCulling(n);
			const a = t.getContext(),
				o = this.instanceIndex;
			a.bindBuffer(a.ARRAY_BUFFER, o.buffer), a.bufferSubData(a.ARRAY_BUFFER, 0, o.array, 0, this._count);
		}
		onBeforeShadow(t, e, n, i, r, a) {
			this.onBeforeRender(t, null, i, r, a);
		}
		initIndixesAndVisibility(t) {
			const e = this._maxCount,
				n = t.getContext(),
				i = n.createBuffer(),
				r = new Uint32Array(e),
				a = (this.visibilityArray = new Array(e));
			for (let o = 0; o < e; o++) (r[o] = o), (a[o] = !0);
			n.bindBuffer(n.ARRAY_BUFFER, i),
				n.bufferData(n.ARRAY_BUFFER, r, n.DYNAMIC_DRAW),
				(this.instanceIndex = new D(i, n.UNSIGNED_INT, 1, 4, r.length, r)),
				this.geometry.setAttribute('instanceIndex', this.instanceIndex);
		}
		initMatricesTexture() {
			(this.matricesTexture = W(this._maxCount)), (this._matrixArray = this.matricesTexture.image.data);
		}
		patchMaterials(t) {
			if (t) {
				if (t.isMaterial) {
					this.patchMaterial(t);
					return;
				}
				for (const e of t) this.patchMaterial(e);
			}
		}
		patchMaterial(t) {
			if (t.isInstancedMeshPatched) throw new Error('Cannot reuse already patched material.');
			const e = t.onBeforeCompile;
			(t.onBeforeCompile = (n, i) => {
				e && e(n, i),
					n.instancing &&
						((n.instancing = !1),
						(n.instancingColor = !1),
						(n.uniforms.matricesTexture = { value: this.matricesTexture }),
						n.defines || (n.defines = {}),
						(n.defines.USE_INSTANCING_INDIRECT = ''),
						this.colorsTexture !== null &&
							((n.uniforms.colorsTexture = { value: this.colorsTexture }),
							(n.defines.USE_INSTANCING_COLOR_INDIRECT = ''),
							(n.fragmentShader = n.fragmentShader.replace(
								'#include <common>',
								`#define USE_COLOR
#include <common>`
							))));
			}),
				(t.isInstancedMeshPatched = !0);
		}
		updateInstances(t) {
			const e = this.instancesCount;
			if (this.instances) {
				const i = this.instances;
				for (let r = 0; r < e; r++) {
					const a = i[r];
					t(a, r), this.composeMatrixInstance(a);
				}
				return;
			}
			p.owner = this;
			for (let i = 0; i < e; i++)
				(p.id = i),
					p.position.set(0, 0, 0),
					p.scale.set(1, 1, 1),
					p.quaternion.set(0, 0, 0, 1),
					t(p, i),
					this.composeMatrixInstance(p);
		}
		createInstances(t) {
			const e = this._maxCount,
				n = (this.instances = new Array(e));
			for (let i = 0; i < e; i++) {
				const r = new v(this, i);
				(n[i] = r), t && (t(r, i), this.composeMatrixInstance(r));
			}
		}
		computeBVH(t = {}) {
			(this.bvh = new P(this, t.margin, t.highPrecision)), this.bvh.create();
		}
		disposeBVH() {
			this.bvh = null;
		}
		setMatrixAt(t, e) {
			var n;
			if ((e.toArray(this._matrixArray, t * 16), this.instances)) {
				const i = this.instances[t];
				e.decompose(i.position, i.quaternion, i.scale);
			}
			(this.matricesTexture.needsUpdate = !0), (n = this.bvh) == null || n.move(t);
		}
		getMatrixAt(t, e = pt) {
			return e.fromArray(this._matrixArray, t * 16);
		}
		setVisibilityAt(t, e) {
			this.visibilityArray[t] = e;
		}
		getVisibilityAt(t) {
			return this.visibilityArray[t];
		}
		setColorAt(t, e) {
			this.colorsTexture === null &&
				((this.colorsTexture = q(this._maxCount)), (this._colorArray = this.colorsTexture.image.data)),
				e.isColor ? e.toArray(this._colorArray, t * 4) : $.set(e).toArray(this._colorArray, t * 4),
				(this.colorsTexture.needsUpdate = !0);
		}
		getColorAt(t, e = $) {
			return e.fromArray(this._colorArray, t * 4);
		}
		setUniformAt(t, e, n) {
			let i = this._uniformsSetCallback.get(e);
			if (!i) {
				const r = this.material.uniforms[e].value,
					a = r.format === s.RedFormat ? 1 : r.format === s.RGFormat ? 2 : 4,
					o = r.image.data;
				a === 1
					? (i = (c, l) => {
							o[c] = l;
						})
					: (i = (c, l) => {
							l.toArray(o, c * a);
						}),
					this._uniformsSetCallback.set(e, i);
			}
			i(t, n);
		}
		getMorphAt(t, e) {
			const n = e.morphTargetInfluences,
				i = this.morphTexture.source.data.data,
				r = n.length + 1,
				a = t * r + 1;
			for (let o = 0; o < n.length; o++) n[o] = i[a + o];
		}
		setMorphAt(t, e) {
			const n = e.morphTargetInfluences,
				i = n.length + 1;
			this.morphTexture === null &&
				(this.morphTexture = new s.DataTexture(
					new Float32Array(i * this._maxCount),
					i,
					this._maxCount,
					s.RedFormat,
					s.FloatType
				));
			const r = this.morphTexture.source.data.data;
			let a = 0;
			for (let l = 0; l < n.length; l++) a += n[l];
			const o = this.geometry.morphTargetsRelative ? 1 : 1 - a,
				c = i * t;
			(r[c] = o), r.set(n, c + 1);
		}
		composeMatrixInstance(t) {
			var at;
			const e = t.position,
				n = t.quaternion,
				i = t.scale,
				r = this._matrixArray,
				a = t.id,
				o = a * 16,
				c = n._x,
				l = n._y,
				d = n._z,
				m = n._w,
				f = c + c,
				y = l + l,
				b = d + d,
				J = c * f,
				K = c * y,
				tt = c * b,
				et = l * y,
				nt = l * b,
				it = d * b,
				st = m * f,
				rt = m * y,
				ot = m * b,
				U = i.x,
				z = i.y,
				j = i.z;
			(r[o + 0] = (1 - (et + it)) * U),
				(r[o + 1] = (K + ot) * U),
				(r[o + 2] = (tt - rt) * U),
				(r[o + 3] = 0),
				(r[o + 4] = (K - ot) * z),
				(r[o + 5] = (1 - (J + it)) * z),
				(r[o + 6] = (nt + st) * z),
				(r[o + 7] = 0),
				(r[o + 8] = (tt + rt) * j),
				(r[o + 9] = (nt - st) * j),
				(r[o + 10] = (1 - (J + et)) * j),
				(r[o + 11] = 0),
				(r[o + 12] = e.x),
				(r[o + 13] = e.y),
				(r[o + 14] = e.z),
				(r[o + 15] = 1),
				(this.matricesTexture.needsUpdate = !0),
				(at = this.bvh) == null || at.move(a);
		}
		raycast(t, e) {
			if (this.material === void 0) return;
			const n = this.raycastOnlyFrustum && this.perObjectFrustumCulled && !this.bvh;
			let i;
			(A.geometry = this.geometry), (A.material = this.material);
			const r = t.ray,
				a = t.near,
				o = t.far;
			g.copy(this.matrixWorld).invert(), X.setFromMatrixScale(this.matrixWorld), Z.copy(t.ray.direction).multiply(X);
			const c = Z.length();
			if (((t.ray = mt.copy(t.ray).applyMatrix4(g)), (t.near /= c), (t.far /= c), this.bvh))
				(i = B), this.bvh.raycast(t, B);
			else {
				if (
					(this.boundingSphere === null && this.computeBoundingSphere(),
					x.copy(this.boundingSphere),
					!t.ray.intersectsSphere(x))
				)
					return;
				i = this.instanceIndex.array;
			}
			const l = this.instancesCount,
				d = n ? this._count : Math.min(i.length, l);
			for (let m = 0; m < d; m++) {
				const f = i[m];
				if (!(f > l || !this.getVisibilityAt(f))) {
					this.getMatrixAt(f, A.matrixWorld), A.raycast(t, R);
					for (const y of R) (y.instanceId = f), (y.object = this), e.push(y);
					R.length = 0;
				}
			}
			(B.length = 0), e.sort(ft), (t.ray = r), (t.near = a), (t.far = o);
		}
		frustumCulling(t) {
			var i;
			const e = this.sortObjects,
				n = this.instanceIndex.array;
			if (
				(M.multiplyMatrices(t.projectionMatrix, t.matrixWorldInverse).multiply(this.matrixWorld),
				e &&
					(g.copy(this.matrixWorld).invert(),
					O.setFromMatrixPosition(t.matrixWorld).applyMatrix4(g),
					E.set(0, 0, -1).transformDirection(t.matrixWorld).transformDirection(g)),
				this.bvh ? this.BVHCulling() : this.linearCulling(),
				e)
			) {
				const r = this.customSort;
				r === null ? _.list.sort((i = this.material) != null && i.transparent ? _t : yt) : r(_.list, t);
				const a = _.list;
				for (let o = 0, c = a.length; o < c; o++) n[o] = a[o].index;
				(this._count = a.length), _.reset();
			}
		}
		BVHCulling() {
			const t = this.instanceIndex.array,
				e = this.instancesCount,
				n = this.sortObjects;
			let i = 0;
			this.bvh.frustumCulling(M, F);
			for (const r of F)
				if (r < e && this.getVisibilityAt(r))
					if (n) {
						T.setFromMatrixPosition(this.getMatrixAt(r));
						const a = T.sub(O).dot(E);
						_.push(a, r);
					} else t[i++] = r;
			(this._count = i), (F.length = 0);
		}
		linearCulling() {
			const t = this.instanceIndex.array,
				e = this.geometry.boundingSphere,
				n = e.radius,
				i = e.center,
				r = this.instancesCount,
				a = i.x === 0 && i.y === 0 && i.z === 0,
				o = this.sortObjects;
			let c = 0;
			Q.setFromProjectionMatrix(M);
			for (let l = 0; l < r; l++) {
				if (!this.getVisibilityAt(l)) continue;
				const d = this.getMatrixAt(l);
				if (
					(a ? x.center.copy(T.setFromMatrixPosition(d)) : x.center.copy(i).applyMatrix4(d),
					(x.radius = n * d.getMaxScaleOnAxis()),
					Q.intersectsSphere(x))
				)
					if (o) {
						const m = T.subVectors(x.center, O).dot(E);
						_.push(m, l);
					} else t[c++] = l;
			}
			this._count = c;
		}
		computeBoundingBox() {
			const t = this.geometry,
				e = this.instancesCount;
			this.boundingBox === null && (this.boundingBox = new s.Box3()), t.boundingBox === null && t.computeBoundingBox();
			const n = t.boundingBox,
				i = this.boundingBox;
			i.makeEmpty();
			for (let r = 0; r < e; r++) Y.copy(n).applyMatrix4(this.getMatrixAt(r)), i.union(Y);
		}
		computeBoundingSphere() {
			const t = this.geometry,
				e = this.instancesCount;
			this.boundingSphere === null && (this.boundingSphere = new s.Sphere()),
				t.boundingSphere === null && t.computeBoundingSphere();
			const n = t.boundingSphere,
				i = this.boundingSphere;
			i.makeEmpty();
			for (let r = 0; r < e; r++) x.copy(n).applyMatrix4(this.getMatrixAt(r)), i.union(x);
		}
		copy(t, e) {
			return (
				super.copy(t, e),
				this.instanceIndex.copy(t.instanceIndex),
				(this.matricesTexture = t.matricesTexture.clone()),
				t.colorsTexture !== null && (this.colorsTexture = t.colorsTexture.clone()),
				t.morphTexture !== null && (this.morphTexture = t.morphTexture.clone()),
				(this.instancesCount = t.instancesCount),
				(this._count = t._maxCount),
				(this._maxCount = t._maxCount),
				t.boundingBox !== null && (this.boundingBox = t.boundingBox.clone()),
				t.boundingSphere !== null && (this.boundingSphere = t.boundingSphere.clone()),
				this
			);
		}
		dispose() {
			return (
				this.dispatchEvent({ type: 'dispose' }),
				this.matricesTexture.dispose(),
				(this.matricesTexture = null),
				this.colorsTexture !== null && (this.colorsTexture.dispose(), (this.colorsTexture = null)),
				this.morphTexture !== null && (this.morphTexture.dispose(), (this.morphTexture = null)),
				this
			);
		}
	}
	const Y = new s.Box3(),
		x = new s.Sphere(),
		Q = new s.Frustum(),
		M = new s.Matrix4(),
		F = [],
		B = [],
		R = [],
		A = new s.Mesh(),
		mt = new s.Ray(),
		Z = new s.Vector3(),
		X = new s.Vector3(),
		g = new s.Matrix4(),
		_ = new H(),
		E = new s.Vector3(),
		O = new s.Vector3(),
		T = new s.Vector3(),
		pt = new s.Matrix4(),
		$ = new s.Color(),
		p = new v(void 0, -1);
	function ft(u, t) {
		return u.distance - t.distance;
	}
	function yt(u, t) {
		return u.depth - t.depth;
	}
	function _t(u, t) {
		return t.depth - u.depth;
	}
	const gt = `
	float getFloatFromTexture( sampler2D texture, const in uint i ) {
		int size = textureSize( texture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return float( texelFetch( texture, ivec2( x, y ), 0 ).r );
	}

	vec2 getVec2FromTexture( sampler2D texture, const in uint i ) {
		int size = textureSize( texture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( texture, ivec2( x, y ), 0 ).rg;
	}

    vec3 getVec3FromTexture( sampler2D texture, const in uint i ) {
		int size = textureSize( texture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( texture, ivec2( x, y ), 0 ).rgb;
	}

    vec4 getVec4FromTexture( sampler2D texture, const in uint i ) {
		int size = textureSize( texture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( texture, ivec2( x, y ), 0 );
	}

	mat3 getMat3FromTexture( sampler2D texture, const in uint i ) {
		int size = textureSize( texture, 0 ).x;
		int j = int( i ) * 3;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( texture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( texture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( texture, ivec2( x + 2, y ), 0 );
		return mat3( v1, v2, v3);
	}

	mat4 getMat4FromTexture( sampler2D texture, const in uint i ) {
		int size = textureSize( texture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( texture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( texture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( texture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( texture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
`,
		It = `
#ifdef USE_INSTANCING_INDIRECT
	attribute uint instanceIndex;
	uniform highp sampler2D matricesTexture;

	#ifdef USE_INSTANCING_COLOR_INDIRECT
		uniform highp sampler2D colorsTexture;
	#endif
#endif
`,
		Ct = `
#ifdef USE_INSTANCING_INDIRECT
	mat4 instanceMatrix = getMat4FromTexture( matricesTexture, instanceIndex );

	#ifdef USE_INSTANCING_COLOR_INDIRECT
		vec3 instanceColor = getVec3FromTexture( colorsTexture, instanceIndex );
		vColor.xyz *= instanceColor.xyz;
	#endif
#endif
`;
	(s.ShaderChunk.get_from_texture = gt),
		(s.ShaderChunk.instanced_pars_vertex = It),
		(s.ShaderChunk.instanced_vertex = Ct),
		(s.ShaderChunk.project_vertex = s.ShaderChunk.project_vertex.replace(
			'#ifdef USE_INSTANCING',
			'#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT'
		)),
		(s.ShaderChunk.worldpos_vertex = s.ShaderChunk.worldpos_vertex.replace(
			'#ifdef USE_INSTANCING',
			'#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT'
		)),
		(s.ShaderChunk.defaultnormal_vertex = s.ShaderChunk.defaultnormal_vertex.replace(
			'#ifdef USE_INSTANCING',
			'#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT'
		)),
		(s.ShaderChunk.color_pars_vertex = s.ShaderChunk.color_pars_vertex.replace(
			'defined( USE_INSTANCING_COLOR )',
			'defined( USE_INSTANCING_COLOR ) || defined( USE_INSTANCING_COLOR_INDIRECT )'
		)),
		(s.ShaderChunk.color_vertex = s.ShaderChunk.color_vertex.replace(
			'defined( USE_INSTANCING_COLOR )',
			'defined( USE_INSTANCING_COLOR ) || defined( USE_INSTANCING_COLOR_INDIRECT )'
		)),
		(s.ShaderChunk.common = s.ShaderChunk.common.concat(`
#include <get_from_texture>`)),
		(s.ShaderChunk.batching_pars_vertex = s.ShaderChunk.batching_pars_vertex.concat(`
#include <instanced_pars_vertex>`)),
		(s.ShaderChunk.batching_vertex = s.ShaderChunk.batching_vertex.concat(`
#include <instanced_vertex>`));
	function St(u) {
		return u
			.replace('#ifdef USE_INSTANCING', '#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT')
			.replace(
				'#ifdef USE_INSTANCING_COLOR',
				'#if defined USE_INSTANCING_COLOR || defined USE_INSTANCING_COLOR_INDIRECT'
			)
			.replace(
				'defined( USE_INSTANCING_COLOR )',
				'defined( USE_INSTANCING_COLOR ) || defined( USE_INSTANCING_COLOR_INDIRECT )'
			);
	}
	function At(u) {
		const t = { get: (e) => e.depth, aux: new Array(u.maxCount), reversed: null };
		return function (n) {
			t.reversed = u.material.transparent;
			let i = 1 / 0,
				r = -1 / 0;
			for (const { depth: c } of n) c > r && (r = c), c < i && (i = c);
			const a = r - i,
				o = (2 ** 32 - 1) / a;
			for (const c of n) c.depth = (c.depth - i) * o;
			ct.radixSort(n, t);
		};
	}
	(h.GLInstancedBufferAttribute = D),
		(h.InstancedEntity = v),
		(h.InstancedMesh2 = dt),
		(h.InstancedMeshBVH = P),
		(h.InstancedRenderList = H),
		(h.createRadixSort = At),
		(h.createTexture_float = ut),
		(h.createTexture_mat3 = xt),
		(h.createTexture_mat4 = W),
		(h.createTexture_vec2 = lt),
		(h.createTexture_vec3 = q),
		(h.createTexture_vec4 = ht),
		(h.patchShader = St),
		Object.defineProperty(h, Symbol.toStringTag, { value: 'Module' });
});
//# sourceMappingURL=index.umd.cjs.map
