const GammaCorrectionShader = {

	name: 'GammaCorrectionShader',

	uniforms: {

		'tDiffuse': { value: null }

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 tex = texture2D( tDiffuse, vUv );

			gl_FragColor = sRGBTransferOETF( tex );

		}`

};

class MaskPass extends Pass {
	constructor(scene, camera) {
		super();

		this.scene = scene;
		this.camera = camera;

		this.clear = true;
		this.needsSwap = false;

		this.inverse = false;
	}

	render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {
		const context = renderer.getContext();
		const state = renderer.state;

		// don't update color or depth

		state.buffers.color.setMask(false);
		state.buffers.depth.setMask(false);

		// lock buffers

		state.buffers.color.setLocked(true);
		state.buffers.depth.setLocked(true);

		// set up stencil

		let writeValue, clearValue;

		if (this.inverse) {
			writeValue = 0;
			clearValue = 1;
		} else {
			writeValue = 1;
			clearValue = 0;
		}

		state.buffers.stencil.setTest(true);
		state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
		state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 0xffffffff);
		state.buffers.stencil.setClear(clearValue);
		state.buffers.stencil.setLocked(true);

		// draw into the stencil buffer

		renderer.setRenderTarget(readBuffer);
		if (this.clear) renderer.clear();
		renderer.render(this.scene, this.camera);

		renderer.setRenderTarget(writeBuffer);
		if (this.clear) renderer.clear();
		renderer.render(this.scene, this.camera);

		// unlock color and depth buffer and make them writable for subsequent rendering/clearing

		state.buffers.color.setLocked(false);
		state.buffers.depth.setLocked(false);

		state.buffers.color.setMask(true);
		state.buffers.depth.setMask(true);

		// only render where stencil is set to 1

		state.buffers.stencil.setLocked(false);
		state.buffers.stencil.setFunc(context.EQUAL, 1, 0xffffffff); // draw if == 1
		state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
		state.buffers.stencil.setLocked(true);
	}
}

class ClearMaskPass extends Pass {
	constructor() {
		super();

		this.needsSwap = false;
	}

	render(renderer /*, writeBuffer, readBuffer, deltaTime, maskActive */) {
		renderer.state.buffers.stencil.setLocked(false);
		renderer.state.buffers.stencil.setTest(false);
	}
}

class ShaderPass extends Pass {
	constructor(shader, textureID) {
		super();

		this.textureID = textureID !== undefined ? textureID : 'tDiffuse';

		if (shader instanceof THREE.ShaderMaterial) {
			this.uniforms = shader.uniforms;

			this.material = shader;
		} else if (shader) {
			this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

			this.material = new THREE.ShaderMaterial({
				name: shader.name !== undefined ? shader.name : 'unspecified',
				defines: Object.assign({}, shader.defines),
				uniforms: this.uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader,
			});
		}

		this.fsQuad = new FullScreenQuad(this.material);
	}

	render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {
		if (this.uniforms[this.textureID]) {
			this.uniforms[this.textureID].value = readBuffer.texture;
		}

		this.fsQuad.material = this.material;

		if (this.renderToScreen) {
			renderer.setRenderTarget(null);
			this.fsQuad.render(renderer);
		} else {
			renderer.setRenderTarget(writeBuffer);
			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
			this.fsQuad.render(renderer);
		}
	}

	dispose() {
		this.material.dispose();

		this.fsQuad.dispose();
	}
}

class RenderPass extends Pass {
	constructor(scene, camera, overrideMaterial = null, clearColor = null, clearAlpha = null) {
		super();

		this.scene = scene;
		this.camera = camera;

		this.overrideMaterial = overrideMaterial;

		this.clearColor = clearColor;
		this.clearAlpha = clearAlpha;

		this.clear = true;
		this.clearDepth = false;
		this.needsSwap = false;
		this._oldClearColor = new THREE.Color();
	}

	render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {
		const oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		let oldClearAlpha, oldOverrideMaterial;

		if (this.overrideMaterial !== null) {
			oldOverrideMaterial = this.scene.overrideMaterial;

			this.scene.overrideMaterial = this.overrideMaterial;
		}

		if (this.clearColor !== null) {
			renderer.getClearColor(this._oldClearColor);
			renderer.setClearColor(this.clearColor, renderer.getClearAlpha());
		}

		if (this.clearAlpha !== null) {
			oldClearAlpha = renderer.getClearAlpha();
			renderer.setClearAlpha(this.clearAlpha);
		}

		if (this.clearDepth == true) {
			renderer.clearDepth();
		}

		renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);

		if (this.clear === true) {
			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
		}

		renderer.render(this.scene, this.camera);

		// restore

		if (this.clearColor !== null) {
			renderer.setClearColor(this._oldClearColor);
		}

		if (this.clearAlpha !== null) {
			renderer.setClearAlpha(oldClearAlpha);
		}

		if (this.overrideMaterial !== null) {
			this.scene.overrideMaterial = oldOverrideMaterial;
		}

		renderer.autoClear = oldAutoClear;
	}
}

class EffectComposer {
	constructor(renderer, renderTarget) {
		this.renderer = renderer;

		this._pixelRatio = renderer.getPixelRatio();

		if (renderTarget === undefined) {
			const size = renderer.getSize(new THREE.Vector2());
			this._width = size.width;
			this._height = size.height;

			renderTarget = new THREE.WebGLRenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio, {
				type: THREE.HalfFloatType,
			});
			renderTarget.texture.name = 'EffectComposer.rt1';
		} else {
			this._width = renderTarget.width;
			this._height = renderTarget.height;
		}

		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();
		this.renderTarget2.texture.name = 'EffectComposer.rt2';

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		this.renderToScreen = true;

		this.passes = [];

		this.copyPass = new ShaderPass(CopyShader);
		this.copyPass.material.blending = THREE.NoBlending;

		this.Clock = new THREE.Clock();
	}

	swapBuffers() {
		const tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
	}

	addPass(pass) {
		this.passes.push(pass);
		pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
	}

	insertPass(pass, index) {
		this.passes.splice(index, 0, pass);
		pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
	}

	removePass(pass) {
		const index = this.passes.indexOf(pass);

		if (index !== -1) {
			this.passes.splice(index, 1);
		}
	}

	isLastEnabledPass(passIndex) {
		for (let i = passIndex + 1; i < this.passes.length; i++) {
			if (this.passes[i].enabled) {
				return false;
			}
		}

		return true;
	}

	render(deltaTime) {
		// deltaTime value is in seconds

		if (deltaTime === undefined) {
			deltaTime = this.Clock.getDelta();
		}

		const currentRenderTarget = this.renderer.getRenderTarget();

		let maskActive = false;

		for (let i = 0, il = this.passes.length; i < il; i++) {
			const pass = this.passes[i];

			if (pass.enabled === false) continue;

			pass.renderToScreen = this.renderToScreen && this.isLastEnabledPass(i);
			pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive);

			if (pass.needsSwap) {
				if (maskActive) {
					const context = this.renderer.getContext();
					const stencil = this.renderer.state.buffers.stencil;

					//context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
					stencil.setFunc(context.NOTEQUAL, 1, 0xffffffff);

					this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime);

					//context.stencilFunc( context.EQUAL, 1, 0xffffffff );
					stencil.setFunc(context.EQUAL, 1, 0xffffffff);
				}

				this.swapBuffers();
			}

			if (MaskPass !== undefined) {
				if (pass instanceof MaskPass) {
					maskActive = true;
				} else if (pass instanceof ClearMaskPass) {
					maskActive = false;
				}
			}
		}

		this.renderer.setRenderTarget(currentRenderTarget);
	}

	reset(renderTarget) {
		if (renderTarget === undefined) {
			const size = this.renderer.getSize(new THREE.Vector2());
			this._pixelRatio = this.renderer.getPixelRatio();
			this._width = size.width;
			this._height = size.height;

			renderTarget = this.renderTarget1.clone();
			renderTarget.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
		}

		this.renderTarget1.dispose();
		this.renderTarget2.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;
	}

	setSize(width, height) {
		this._width = width;
		this._height = height;

		const effectiveWidth = this._width * this._pixelRatio;
		const effectiveHeight = this._height * this._pixelRatio;

		this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
		this.renderTarget2.setSize(effectiveWidth, effectiveHeight);

		for (let i = 0; i < this.passes.length; i++) {
			this.passes[i].setSize(effectiveWidth, effectiveHeight);
		}
	}

	setPixelRatio(pixelRatio) {
		this._pixelRatio = pixelRatio;

		this.setSize(this._width, this._height);
	}

	dispose() {
		this.renderTarget1.dispose();
		this.renderTarget2.dispose();

		this.copyPass.dispose();
	}
}
