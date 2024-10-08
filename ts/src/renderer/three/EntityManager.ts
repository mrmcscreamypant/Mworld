namespace Renderer {
	export namespace Three {
		export class EntityManager {
			entities: (Unit | Item | Region)[] = [];
			units: Unit[] = [];
			items: Item[] = [];
			projectiles: Unit[] = [];
			regions: Region[] = [];
			initEntities: InitEntity[] = [];

			private animatedSprites: AnimatedSprite[] = [];
			private unownedItems = new Map<string, Item>();

			create(taroEntity: TaroEntityPhysics, type: 'unit' | 'item' | 'projectile' | 'region') {
				let entity;

				switch (type) {
					case 'unit': {
						entity = Unit.create(taroEntity);
						this.units.push(entity);
						this.animatedSprites.push(entity);
						this.maybeAddUnownedItemsToUnit(entity);
						break;
					}
					case 'item': {
						entity = Item.create(taroEntity);
						this.items.push(entity);
						this.animatedSprites.push(entity);
						this.addItemToUnitOrUnownedItems(entity);
						break;
					}
					case 'projectile': {
						entity = Unit.create(taroEntity, taroEntity._stats.instancedMesh);
						this.projectiles.push(entity);
						this.animatedSprites.push(entity);
						break;
					}
					case 'region': {
						entity = new Region(taroEntity._id, taroEntity._stats.ownerId, taroEntity);
						this.regions.push(entity);
						break;
					}
				}

				if (entity.matrixWorldAutoUpdate && type !== 'region') {
					(entity as THREE.Object3D).matrixWorldAutoUpdate = false;
				}
				this.entities.push(entity);
				entity.updateMatrix?.();
				return entity;
			}

			destroyInitEntity(initEntity: InitEntity) {
				const renderer = Three.instance();
				renderer.entityEditor.selectEntity(initEntity, 'remove');
				this.initEntities = this.initEntities.filter((e) => e.action.actionId !== initEntity.action.actionId);
				initEntity.destroy();
			}

			destroy(entity: Unit | Item | Region) {
				entity.destroy();

				const idx = this.entities.indexOf(entity, 0);
				if (idx === -1) return;

				this.entities.splice(idx, 1);
				this.animatedSprites.splice(this.animatedSprites.indexOf(entity as unknown as AnimatedSprite, 0), 1);

				if (this.units.includes(entity as Unit)) {
					this.units.splice(this.units.indexOf(entity as Unit, 0), 1);
				}

				if (this.items.includes(entity as Item)) {
					this.items.splice(this.items.indexOf(entity as Item, 0), 1);
					this.unownedItems.delete(entity.taroId);
				}

				if (this.projectiles.includes(entity as Unit)) {
					if ((entity as Unit).body === null) {
						const renderer = Renderer.Three.instance();
						renderer.projectilPool.editInstanceMesh(
							{},
							(entity as Unit).textureId,
							(entity as Unit).instancedIdx,
							true
						);
					}
					this.projectiles.splice(this.projectiles.indexOf(entity as Unit, 0), 1);
				}

				if (this.regions.includes(entity as Region)) {
					this.regions.splice(this.regions.indexOf(entity as Region, 0), 1);
				}
			}

			update(dt: number) {
				for (const sprite of this.animatedSprites) {
					sprite.update(dt);
				}
			}

			scaleGui(scale: number) {
				for (const unit of this.units) {
					unit.setHudScale(scale);
				}
			}

			private addItemToUnitOrUnownedItems(item: Item) {
				for (const unit of this.units) {
					if (item.ownerUnitId == unit.taroId) {
						item.ownerUnit = unit;
						return;
					}
				}

				this.unownedItems.set(item.taroId, item);

				if (item.taroEntity) {
					item.taroEntity.on('setOwnerUnit', (unitId: string) => {
						item.ownerUnitId = unitId;
						item.ownerUnit = this.units.find((unit) => unit.taroId === unitId);

						if (item.ownerUnit && this.unownedItems.has(item.taroId)) {
							this.unownedItems.delete(item.taroId);
						}
					});
				}
			}

			private maybeAddUnownedItemsToUnit(unit: Unit) {
				const itemsToDelete = [];

				for (const [taroId, item] of this.unownedItems.entries()) {
					if (unit.taroId == item.ownerUnitId) {
						item.ownerUnit = unit;
						itemsToDelete.push(taroId);
					}
				}

				for (const itemTaroId of itemsToDelete) {
					this.unownedItems.delete(itemTaroId);
				}
			}
		}
	}
}
