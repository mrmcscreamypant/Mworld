class Box2dDebugDrawerThree {
	unitsPerMeter: any;
	polygonLines: THREE.LineSegments<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.LineBasicMaterial>;
	circleLines: THREE.LineSegments<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.LineBasicMaterial>;
	polygonVertexPositions: any[];
	polygonVertexColors: any[];
	circleVertexPositions: any[];
	circleVertexColors: any[];
	instance: any;
	box2d: typeof Box2D & EmscriptenModule;
	sizeOfB2Vec2 = Float32Array.BYTES_PER_ELEMENT * 2;
	constructor(scene, unitsPerMeter, box2d: typeof Box2D & EmscriptenModule) {
		this.unitsPerMeter = unitsPerMeter;
		this.box2d = box2d;
		const polygonLineMaterial = new THREE.LineBasicMaterial({
			color: 0xffffff,
			vertexColors: true,
			linewidth: 3,
		});
		const polygonGeometry = new THREE.BufferGeometry();

		const circleLineMaterial = new THREE.LineBasicMaterial({
			color: 0xffffff,
			vertexColors: true,
		});
		const circleGeometry = new THREE.BufferGeometry();

		this.polygonLines = new THREE.LineSegments(polygonGeometry, polygonLineMaterial);
		this.polygonLines.position.y = 0.511;
		this.polygonLines.frustumCulled = false;
		scene.add(this.polygonLines);
		this.circleLines = new THREE.LineSegments(circleGeometry, circleLineMaterial);
		this.circleLines.frustumCulled = false;
		this.circleLines.position.y = 0.511;
		scene.add(this.circleLines);

		this.polygonVertexPositions = [];
		this.polygonVertexColors = [];
		this.circleVertexPositions = [];
		this.circleVertexColors = [];

		const {
			b2Color,
			b2Draw: { e_shapeBit },
			b2Vec2,
			JSDraw,
			wrapPointer,
		} = box2d;

		const reifyArray = (array_p, numElements, sizeOfElement, ctor) =>
			Array(numElements)
				.fill(undefined)
				.map((_, index) => wrapPointer(array_p + index * sizeOfElement, ctor));

		var self = this;
		const debugDrawer = Object.assign(new JSDraw(), {
			DrawSegment(vert1_p, vert2_p, color_p) {},
			DrawPolygon(vertices_p, vertexCount, color_p) {},
			DrawSolidPolygon(vertices_p, vertexCount, color_p) {
				const color = wrapPointer(color_p, b2Color);
				self.createRectangle(vertices_p, vertexCount, color);
			},
			DrawCircle(center_p, radius, color_p) {},
			DrawSolidCircle(center_p, radius, axis_p, color_p) {
				const center = wrapPointer(center_p, b2Vec2);
				const color = wrapPointer(color_p, b2Color);
				self.createCircle(
					center.x * self.unitsPerMeter,
					center.y * self.unitsPerMeter,
					radius * self.unitsPerMeter,
					color
				);
			},
			DrawTransform(transform_p) {},
			DrawPoint(vertex_p, sizeMetres, color_p) {},
		});
		debugDrawer.SetFlags(e_shapeBit);
		this.instance = debugDrawer;
	}

	begin() {
		this.polygonVertexPositions = [];
		this.polygonVertexColors = [];
		this.circleVertexPositions = [];
		this.circleVertexColors = [];
	}

	createRectangle(verts: number, vertexCount: number, color): void {
		const vertices = [];
		for (let tmpI = 0; tmpI < vertexCount; tmpI++) {
			const vert = this.box2d.wrapPointer(verts + tmpI * 8, this.box2d.b2Vec2);
			vertices.push({ x: vert.get_x(), y: vert.get_y() });
		}
		this.polygonVertexPositions.push(vertices[0].x * this.unitsPerMeter);
		this.polygonVertexPositions.push(0);
		this.polygonVertexPositions.push(vertices[0].y * this.unitsPerMeter);
		this.polygonVertexPositions.push(vertices[1].x * this.unitsPerMeter);
		this.polygonVertexPositions.push(0);
		this.polygonVertexPositions.push(vertices[1].y * this.unitsPerMeter);

		this.polygonVertexPositions.push(vertices[1].x * this.unitsPerMeter);
		this.polygonVertexPositions.push(0);
		this.polygonVertexPositions.push(vertices[1].y * this.unitsPerMeter);
		this.polygonVertexPositions.push(vertices[2].x * this.unitsPerMeter);
		this.polygonVertexPositions.push(0);
		this.polygonVertexPositions.push(vertices[2].y * this.unitsPerMeter);

		this.polygonVertexPositions.push(vertices[2].x * this.unitsPerMeter);
		this.polygonVertexPositions.push(0);
		this.polygonVertexPositions.push(vertices[2].y * this.unitsPerMeter);
		this.polygonVertexPositions.push(vertices[3].x * this.unitsPerMeter);
		this.polygonVertexPositions.push(0);
		this.polygonVertexPositions.push(vertices[3].y * this.unitsPerMeter);

		this.polygonVertexPositions.push(vertices[3].x * this.unitsPerMeter);
		this.polygonVertexPositions.push(0);
		this.polygonVertexPositions.push(vertices[3].y * this.unitsPerMeter);
		this.polygonVertexPositions.push(vertices[0].x * this.unitsPerMeter);
		this.polygonVertexPositions.push(0);
		this.polygonVertexPositions.push(vertices[0].y * this.unitsPerMeter);

		for (let i = 0; i < 8; i++) {
			this.polygonVertexColors.push(color.r);
			this.polygonVertexColors.push(color.g);
			this.polygonVertexColors.push(color.b);
			this.polygonVertexColors.push(1);
		}
	}

	createCircle(x0, y0, radius, color) {
		let angle = 0;
		const angleStep = 20;
		const n = 360 / angleStep;

		let x = radius * Math.cos((angle * Math.PI) / 180);
		let y = radius * Math.sin((angle * Math.PI) / 180);
		// Start point
		this.circleVertexPositions.push(x0 + x);
		this.circleVertexPositions.push(0);
		this.circleVertexPositions.push(y0 + y);
		angle += angleStep;

		for (let i = 0; i < n; i++) {
			x = radius * Math.cos((angle * Math.PI) / 180);
			y = radius * Math.sin((angle * Math.PI) / 180);
			// End point
			this.circleVertexPositions.push(x0 + x);
			this.circleVertexPositions.push(0);
			this.circleVertexPositions.push(y0 + y);
			// Start point
			this.circleVertexPositions.push(x0 + x);
			this.circleVertexPositions.push(0);
			this.circleVertexPositions.push(y0 + y);
			angle += angleStep;
		}

		for (let i = 0; i < this.circleVertexPositions.length / 3; i++) {
			this.circleVertexColors.push(color.r);
			this.circleVertexColors.push(color.g);
			this.circleVertexColors.push(color.b);
			this.circleVertexColors.push(1);
		}
	}

	end() {
		if (this.polygonVertexPositions.length > 0) {
			this.polygonLines.geometry.setAttribute(
				'position',
				new THREE.BufferAttribute(new Float32Array(this.polygonVertexPositions), 3)
			);
			this.polygonLines.geometry.setAttribute(
				'color',
				new THREE.BufferAttribute(new Float32Array(this.polygonVertexColors), 4)
			);
		}

		if (this.circleVertexPositions.length > 0) {
			this.circleLines.geometry.setAttribute(
				'position',
				new THREE.BufferAttribute(new Float32Array(this.circleVertexPositions), 3)
			);
			this.circleLines.geometry.setAttribute(
				'color',
				new THREE.BufferAttribute(new Float32Array(this.circleVertexColors), 4)
			);
		}
	}
}
