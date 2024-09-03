namespace Renderer {
	export namespace Three {
		export class Voxels extends Node {
			brushArea: TileShape;
			voxelData: { positions: any[]; uvs: any[]; normals: any[]; topIndices: any[]; sidesIndices: any[] }[] = [];
			voxelsCellData: Map<string, VoxelCell>[] = [];
			meshes: Record<string, Record<string, THREE.Mesh>> = {};
			preview: THREE.Mesh | undefined = undefined;
			layerPlanes: THREE.Plane[] = [];
			layerLookupTable: Record<number, number> = {};
			attrs: { positions: THREE.BufferAttribute; uvs: THREE.BufferAttribute; normals: THREE.BufferAttribute };
			previewSidesIndices: number[] = [];
			previewTopIndices: number[] = [];
			lastPreviewChunksNeedsUpdate: string[] = [];
			static Y_OFFSET = 0.001;
			static CHUNK_BLOCK_COUNTS = { x: 16, y: 16 };
			constructor(
				private topTileset: TextureSheet,
				private sidesTileset: TextureSheet
			) {
				super();
				this.matrixAutoUpdate = false;
				this.matrixWorldAutoUpdate = false;
				this.brushArea = new TileShape();
			}

			static create(config?: MapData['layers']) {
				const tilesetMain = taro.getTilesetFromType({ tilesets: taro.game.data.map.tilesets, type: 'top' });
				let tilesetSide = taro.getTilesetFromType({ tilesets: taro.game.data.map.tilesets, type: 'side' });
				if (!tilesetSide) tilesetSide = tilesetMain;

				const texMain = gAssetManager.getTexture(tilesetMain.image);
				const texSide = gAssetManager.getTexture(tilesetSide.image);

				const topTileset = new TextureSheet(
					tilesetMain.image,
					texMain,
					tilesetMain.tilewidth,
					tilesetMain.tileheight,
					true
				);
				const sidesTileset = new TextureSheet(
					tilesetSide.image,
					texSide,
					tilesetSide.tilewidth,
					tilesetSide.tileheight,
					true
				);

				const voxels = new Voxels(topTileset, sidesTileset);
				if (config) {
					let numTileLayers = 0;
					for (const [idx, layer] of config.entries()) {
						if (layer.type === 'tilelayer' && layer.data) {
							voxels.setLayerLookupTable(idx, numTileLayers);
							const voxelsData = Voxels.generateVoxelsFromLayerData(layer, numTileLayers, false);
							voxels.updateLayer(voxelsData, idx);
							numTileLayers++;
						}
					}
				}

				return voxels;
			}

			// because it may have debris layer, so we need a lookup table to find the real floor height
			setLayerLookupTable(k: number, v: number) {
				this.layerLookupTable[k] = v;
			}

			calcHeight(layerIdx: number) {
				return this.layerLookupTable[layerIdx] ?? layerIdx;
			}

			calcLayersHeight(rawLayer: number) {
				const renderer = Renderer.Three.instance();
				const height = this.layerLookupTable[rawLayer ?? renderer.voxelEditor.currentLayerIndex];
				return height + Renderer.Three.Voxels.Y_OFFSET * height;
			}

			static generateVoxelsFromLayerData(data: LayerData, height: number, flat = false) {
				const voxels = new Map<string, VoxelCell>();
				const allFacesVisible = [false, false, false, false, false, false];
				const onlyBottomFaceVisible = [true, true, true, false, true, true];
				const hiddenFaces = flat ? onlyBottomFaceVisible : allFacesVisible;

				for (let z = 0; z < data.height; z++) {
					for (let x = 0; x < data.width; x++) {
						let tileId = data.data[z * data.width + x];
						if (tileId <= 0) continue;
						tileId -= 1;
						const pos = { x: x + 0.5, y: height + Renderer.Three.Voxels.Y_OFFSET * height, z: z + 0.5 };
						voxels.set(getKeyFromPos(pos.x, pos.y, pos.z), {
							position: [pos.x, pos.y, pos.z],
							type: tileId,
							visible: true,
							hiddenFaces: [...hiddenFaces],
							isPreview: false,
							uvs: [],
							normals: [],
							topIndices: [],
							sidesIndices: [],
							positions: [],
						});
					}
				}
				return voxels;
			}

			clearLayer(rawLayerIdx: number) {
				this.voxelsCellData[rawLayerIdx] = new Map();
				for (let mesh of Object.values(this.meshes[rawLayerIdx])) {
					this.remove(mesh);
				}
			}

			updateLayer(updatedVoxels: Map<string, VoxelCell>, layerIdx: number, isPreview = false, forceUpdateAll = false) {
				if (updatedVoxels.size === 0 && !forceUpdateAll) {
					return;
				}
				const chunkBlockCounts = Renderer.Three.Voxels.CHUNK_BLOCK_COUNTS;
				let changedKeys = [];
				const chunksNeedsUpdate = [];
				let changed = false;
				if (!this.voxelsCellData[layerIdx]) {
					this.voxelsCellData[layerIdx] = new Map();
				}

				for (let [k, v] of updatedVoxels.entries()) {
					if (!this.voxelsCellData[layerIdx].has(k) || this.voxelsCellData[layerIdx].get(k).type !== v.type) {
						if (!isPreview) {
							this.voxelsCellData[layerIdx].set(k, rfdc()(v));
						}
						changedKeys.push(k);
						chunksNeedsUpdate.push(Renderer.Three.getChunkKeyFromBlockPos(v.position[0], v.position[2]));
						changed = true;
					}
				}
				if (!changed && !forceUpdateAll) {
					return;
				}
				const renderOrder = (layerIdx + 1) * 100;
				for (let chunkX = 0; chunkX < Math.ceil(taro.map.data.width / chunkBlockCounts.x); chunkX++) {
					for (let chunkZ = 0; chunkZ < Math.ceil(taro.map.data.height / chunkBlockCounts.y); chunkZ++) {
						const chunkKey = Renderer.Three.getChunkKeyFromPos(chunkX, chunkZ);
						if (!chunksNeedsUpdate.includes(chunkKey) || forceUpdateAll) {
							if (!this.lastPreviewChunksNeedsUpdate.includes(chunkKey)) {
								continue;
							} else {
								this.lastPreviewChunksNeedsUpdate = this.lastPreviewChunksNeedsUpdate.filter(
									(chunkId) => chunkId !== chunkKey
								);
							}
						}
						const subVoxels = new Map<string, VoxelCell>();
						const height = this.calcHeight(layerIdx);
						for (let x = chunkX * chunkBlockCounts.x; x < (1 + chunkX) * chunkBlockCounts.x; x++) {
							for (let z = chunkZ * chunkBlockCounts.y; z < (1 + chunkZ) * chunkBlockCounts.y; z++) {
								const pos = { x: x + 0.5, y: height + Renderer.Three.Voxels.Y_OFFSET * height, z: z + 0.5 };
								const key = Renderer.Three.getKeyFromPos(pos.x, pos.y, pos.z);

								if (updatedVoxels.get(key)?.isPreview === true) {
									subVoxels.set(key, rfdc()(updatedVoxels.get(key)));
								} else {
									if (this.voxelsCellData[layerIdx].has(key)) {
										subVoxels.set(key, rfdc()(this.voxelsCellData[layerIdx].get(key)));
									}
								}
							}
						}
						const prunedVoxels = pruneCells(subVoxels, this.voxelsCellData[layerIdx]);
						buildMeshDataFromCells(prunedVoxels, this.topTileset);
						const voxelData = {
							positions: [],
							uvs: [],
							normals: [],
							topIndices: [],
							sidesIndices: [],
						};

						for (let voxel of subVoxels.values()) {
							Object.keys(voxelData).forEach((k) => {
								voxelData[k].push(...voxel[k]);
							});
						}
						if (!this.meshes[layerIdx]) {
							this.meshes[layerIdx] = {};
						}
						let geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>;

						geometry = new THREE.BufferGeometry();

						const uvs = new THREE.BufferAttribute(new Float32Array(voxelData.uvs), 2).setUsage(THREE.StreamDrawUsage);
						const positions = new THREE.BufferAttribute(new Float32Array(voxelData.positions), 3).setUsage(
							THREE.StreamDrawUsage
						);
						const normals = new THREE.BufferAttribute(new Float32Array(voxelData.normals), 3).setUsage(
							THREE.StreamDrawUsage
						);

						geometry.setIndex([
							...voxelData.sidesIndices,
							...voxelData.topIndices,
							...this.previewTopIndices,
							...this.previewSidesIndices,
						]);
						geometry.setAttribute('position', positions);
						geometry.setAttribute('uv', uvs);
						geometry.setAttribute('normal', normals);
						let curLength = 0;
						geometry.addGroup(0, voxelData.sidesIndices.length, 0);
						curLength += voxelData.sidesIndices.length;
						geometry.addGroup(curLength, voxelData.topIndices.length, 1);
						curLength += voxelData.topIndices.length;
						geometry.addGroup(curLength, this.previewSidesIndices.length, 2);
						curLength += this.previewSidesIndices.length;
						geometry.addGroup(curLength, this.previewTopIndices.length, 3);

						const mat1 = new THREE.MeshStandardMaterial({
							map: this.sidesTileset.texture,
							side: THREE.DoubleSide,
							alphaTest: 0.5,
							shadowSide: THREE.BackSide,
						});
						const mat2 = new THREE.MeshStandardMaterial({
							map: this.topTileset.texture,
							side: THREE.DoubleSide,
							alphaTest: 0.5,
							shadowSide: THREE.BackSide,
						});
						const [mat1Preview, mat2Preview] = [mat1.clone(), mat2.clone()];
						[mat1Preview, mat2Preview].forEach((mat) => {
							mat.opacity = 0.5;
							mat.transparent = true;
						});

						//@ts-ignore
						geometry.computeBoundsTree();
						this.remove(this.meshes[layerIdx][chunkKey]);
						const mesh = new THREE.Mesh(geometry, [mat1, mat2, mat1Preview, mat2Preview]);
						this.meshes[layerIdx][chunkKey] = mesh;
						this.add(mesh);

						if (this.layerPlanes[layerIdx] === undefined) {
							const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1 - renderOrder / 100);
							this.layerPlanes[layerIdx] = plane;
						}
					}
				}
				if (isPreview) {
					this.lastPreviewChunksNeedsUpdate = chunksNeedsUpdate.slice();
				}
			}
		}

		export function getKeyFromPos(x: number, y: number, z: number) {
			return `${x}.${y}.${z}`;
		}

		export function getChunkKeyFromBlockPos(x: number, z: number) {
			const chunkBlockCounts = Renderer.Three.Voxels.CHUNK_BLOCK_COUNTS;
			return `${Math.floor(x / chunkBlockCounts.x)}.${Math.floor(z / chunkBlockCounts.y)}`;
		}

		export function getChunkKeyFromPos(x: number, z: number) {
			return `${x}.${z}`;
		}

		function updateCellSides(curCell: VoxelCell, cells: Map<string, VoxelCell>) {
			let visible = false;
			const neighborKeys = findNeighbors(curCell.position[0], curCell.position[1], curCell.position[2]);
			for (let i = 0; i < 6; ++i) {
				const hasNeighbor = cells.has(neighborKeys[i]);

				curCell.hiddenFaces[i] = hasNeighbor;

				if (!hasNeighbor) {
					visible = true;
				}
			}
			return visible;
		}

		function findNeighbors(x: number, y: number, z: number) {
			const k1 = getKeyFromPos(x + 1, y, z);
			const k2 = getKeyFromPos(x - 1, y, z);
			const k3 = getKeyFromPos(x, y + 1, z);
			const k4 = getKeyFromPos(x, y - 1, z);
			const k5 = getKeyFromPos(x, y, z + 1);
			const k6 = getKeyFromPos(x, y, z - 1);

			const neighborKeys = [k1, k2, k3, k4, k5, k6];
			return neighborKeys;
		}

		function pruneCells(cells: Map<string, VoxelCell>, allCells: Map<string, VoxelCell>) {
			const prunedVoxels = new Map<string, VoxelCell>();
			for (let k of cells.keys()) {
				const curCell = cells.get(k);

				let visible = updateCellSides(curCell, allCells);
				if (visible) {
					prunedVoxels.set(k, curCell);
				}
			}
			return prunedVoxels;
		}

		function buildMeshDataFromCells(cells: Map<string, VoxelCell>, tileset: TextureSheet) {
			const xStep = tileset.tileWidth / tileset.width;
			const yStep = tileset.tileHeight / tileset.height;
			const resize = !taro.game.data.defaultData.dontResize;
			const tileWidth = resize ? 1 : tileset.tileWidth / 64;
			const tileHeight = resize ? 1 : tileset.tileHeight / 64;
			const halfTileWidth = tileWidth / 2;
			const halfTileHeight = tileHeight / 2;
			const voxels = Renderer.Three.getVoxels();
			if (voxels) {
				voxels.previewSidesIndices = [];
				voxels.previewTopIndices = [];
			}
			const pxGeometry = new THREE.PlaneGeometry(tileWidth, tileHeight);
			pxGeometry.rotateY(Math.PI / 2);
			pxGeometry.translate(halfTileWidth, 0, 0);

			const nxGeometry = new THREE.PlaneGeometry(tileWidth, tileHeight);
			nxGeometry.rotateY(-Math.PI / 2);
			nxGeometry.translate(-halfTileWidth, 0, 0);

			const pyGeometry = new THREE.PlaneGeometry(tileWidth, tileHeight);
			pyGeometry.rotateX(-Math.PI / 2);
			pyGeometry.translate(0, halfTileHeight, 0);

			const nyGeometry = new THREE.PlaneGeometry(tileWidth, tileHeight);
			nyGeometry.rotateX(Math.PI / 2);
			nyGeometry.translate(0, -halfTileHeight, 0);

			const pzGeometry = new THREE.PlaneGeometry(tileWidth, tileHeight);
			pzGeometry.translate(0, 0, halfTileHeight);

			const nzGeometry = new THREE.PlaneGeometry(tileWidth, tileHeight);
			nzGeometry.rotateY(Math.PI);
			nzGeometry.translate(0, 0, -halfTileHeight);

			const invertUvs = [nyGeometry];

			const geometries = [pxGeometry, nxGeometry, pyGeometry, nyGeometry, pzGeometry, nzGeometry];
			let nowCount = 0;
			for (let c of cells.keys()) {
				const curCell = cells.get(c);
				for (let i = 0; i < geometries.length; ++i) {
					if (curCell.hiddenFaces[i]) {
						continue;
					}
					const bi = nowCount / 3;
					const localPositions = [...geometries[i].attributes.position.array];
					for (let j = 0; j < 3; ++j) {
						for (let v = 0; v < 4; ++v) {
							localPositions[v * 3 + j] += curCell.position[j] * (j === 0 ? tileWidth : tileHeight);
						}
					}
					nowCount += localPositions.length;
					curCell.positions.push(...localPositions);
					const xIdx = curCell.type % tileset.cols;
					const yIdx = Math.floor(curCell.type / tileset.cols);

					const singlePixelOffset = { x: xStep / tileset.tileWidth, y: yStep / tileset.tileHeight };
					const halfPixelOffset = { x: singlePixelOffset.x / 2, y: singlePixelOffset.y / 2 };

					const xOffset = xStep * xIdx + halfPixelOffset.x;
					const yOffset = 1 - yStep * yIdx - yStep - halfPixelOffset.y;

					if (invertUvs.includes(geometries[i])) {
						geometries[i].attributes.uv.array[4] = xOffset;
						geometries[i].attributes.uv.array[5] = yOffset + yStep;

						geometries[i].attributes.uv.array[6] = xOffset + xStep - singlePixelOffset.x;
						geometries[i].attributes.uv.array[7] = yOffset + yStep;

						geometries[i].attributes.uv.array[0] = xOffset;
						geometries[i].attributes.uv.array[1] = yOffset + singlePixelOffset.y;

						geometries[i].attributes.uv.array[2] = xOffset + xStep - singlePixelOffset.x;
						geometries[i].attributes.uv.array[3] = yOffset + singlePixelOffset.y;
					} else {
						geometries[i].attributes.uv.array[0] = xOffset;
						geometries[i].attributes.uv.array[1] = yOffset + yStep;

						geometries[i].attributes.uv.array[2] = xOffset + xStep - singlePixelOffset.x;
						geometries[i].attributes.uv.array[3] = yOffset + yStep;

						geometries[i].attributes.uv.array[4] = xOffset;
						geometries[i].attributes.uv.array[5] = yOffset + singlePixelOffset.y;

						geometries[i].attributes.uv.array[6] = xOffset + xStep - singlePixelOffset.x;
						geometries[i].attributes.uv.array[7] = yOffset + singlePixelOffset.y;
					}

					curCell.uvs.push(...geometries[i].attributes.uv.array);
					curCell.normals.push(...geometries[i].attributes.normal.array);

					const localIndices = [...geometries[i].index.array];
					for (let j = 0; j < localIndices.length; ++j) {
						localIndices[j] += bi;
					}

					// top and bottom face
					if (curCell.isPreview) {
						if (i === 2 || i === 3) {
							voxels.previewTopIndices.push(...localIndices);
						} else {
							voxels.previewSidesIndices.push(...localIndices);
						}
					} else {
						if (i === 2 || i === 3) {
							curCell.topIndices.push(...localIndices);
						} else {
							curCell.sidesIndices.push(...localIndices);
						}
					}
				}
			}
		}

		type LayerData = {
			id: number;
			name: string;
			type: 'tilelayer' | 'objectgroup';
			width: number;
			height: number;
			data: number[];
		};

		export type VoxelCell = {
			position: number[];
			type: number;
			visible: boolean;
			hiddenFaces: boolean[];
			isPreview: boolean;
			uvs: number[];
			normals: number[];
			positions: number[];
			topIndices: number[];
			sidesIndices: number[];
		};
	}
}
