var InventoryComponent = TaroEntity.extend({
	classId: 'InventoryComponent',
	componentId: 'inventory',

	init: function (entity, options) {
		var self = this;
		// Store the entity that this component has been added to
		this._entity = entity;
		// Store any options that were passed to us
		this._options = options;
		this.isDirty = false;
	},

	createInventorySlots: function () {
		// update inventory size and inventoy ids on client and server side
		// render inventory slots on client end
		var entity = this._entity;
		var ownerPlayer = entity.getOwner();
		var mobileClass = taro.isMobile ? 'inventory-slot-mobile inventory-slot ' : 'inventory-slot ';
		if (
			ownerPlayer &&
			taro.isClient &&
			entity._stats.clientId === taro.network.id() &&
			ownerPlayer._stats.selectedUnitId == entity.id()
		) {
			$('#inventory-slots').html('');
			$('#inventory-slots-key-stroke').html('');
			for (var i = 0; i < this._entity._stats.inventorySize; i++) {
				$('#inventory-slots').append(
					$('<div/>', {
						id: `item-${i}`,
						name: i,
						class: `btn inventory-item-button p-0 ${mobileClass}`,
						style: 'position: relative;',
						role: 'button',
					}).on('click', function () {
						var slotIndex = parseInt($(this).attr('name')) + 1;
						if (taro.client.myPlayer) {
							taro.client.myPlayer.control.keyDown('key', slotIndex);
						}
					})
				);

				$('#inventory-slots-key-stroke').append(
					$('<div/>', {
						id: `item-key-stroke-${i}`,
						name: `key-${i}`,
						class: 'item-key-stroke',
					})
				);

				var item = this.getItemBySlotNumber(i + 1);
				if (item) {
					this.insertItem(item, i);
				}
			}

			this.createBackpack();
			this.createTradingSlots();
		}
		this.update();
	},

	createBackpack() {
		var entity = this._entity;
		var backpackSize = entity._stats.backpackSize;
		var mobileClass = taro.isMobile ? 'inventory-slot-mobile inventory-slot ' : 'inventory-slot ';

		if (backpackSize > 0) {
			this.updateBackpackButton(true);

			$('#backpack-items-div').html('');
			var inventorySize = this._entity._stats.inventorySize;
			for (var i = inventorySize; i < backpackSize + inventorySize; i++) {
				$('#backpack-items-div').append(
					$('<div/>', {
						class: 'col-sm-4 margin-top-4',
					}).append(
						$('<div/>', {
							id: `item-${i}`,
							name: i,
							class: `btn inventory-item-button p-0 ${mobileClass}`,
							role: 'button',
						})
					)
				);

				var item = this.getItemBySlotNumber(i + 1);
				if (item) {
					this.insertItem(item, i);
				}
			}
		} else {
			this.updateBackpackButton(false);
		}
	},
	createTradingSlots: function () {
		var mobileClass = taro.isMobile ? 'inventory-slot-mobile inventory-slot' : 'inventory-slot ';
		if (this._entity._stats.inventorySize) {
			var totalInventorySize = this.getTotalInventorySize();
			// total 5 trading slots
			var tradingSlots = $('#user-trading-slots');
			tradingSlots.html('');
			var html = '';
			for (var i = totalInventorySize; i < totalInventorySize + 5; i++) {
				this._entity._stats.itemIds[i] = undefined;
				tradingSlots.append(
					$('<div/>', {
						id: `item-${i}`,
						name: i,
						class: `btn btn-light trade-slot inventory-item-button p-0 ${mobileClass}`,
						role: 'button',
					})
				);

				taro.itemUi.updateItemSlot(undefined, i);
			}
		}
	},
	updateBackpackButton: function (show) {
		var inventoryBtn = $('#open-inventory-button');
		if (show) {
			inventoryBtn.show();
			setTimeout(function () {
				$('#backpack-wrapper').css({
					bottom: $('#my-score-div').height() + 40,
				});
			}, 1000);
		} else {
			inventoryBtn.hide();
		}
	},

	getSameItemsFromInventory: function (itemTypeId) {
		var items = this._entity._stats.itemIds;
		return (
			(items &&
				items.filter((id) => {
					var item = taro.$(id);
					if (item && item._stats && item._stats.itemTypeId === itemTypeId) {
						return true;
					}
				})) ||
			[]
		);
	},

	hasItem: function (itemTypeId) {
		var sameItemTypesInInventory = this._entity.inventory.getSameItemsFromInventory(itemTypeId);
		return sameItemTypesInInventory.length > 0;
	},

	/*
		get total quantity of all items combines of matching item type
		return undefined if item has infinite quantity
	*/
	getQuantity: function (itemTypeId) {
		var quantity = 0;
		var sameItemTypesInInventory = this._entity.inventory.getSameItemsFromInventory(itemTypeId);
		if (sameItemTypesInInventory.length > 0) {
			if (sameItemTypesInInventory.length) {
				for (var i = 0; i < sameItemTypesInInventory.length; i++) {
					var id = sameItemTypesInInventory[i];
					var item = taro.$(id);
					if (!isNaN(parseFloat(item._stats.quantity))) {
						quantity += item._stats.quantity;
					} else {
						quantity = undefined;
					}
				}
			}
		}
		return quantity;
	},

	hasRequiredQuantity: function (itemTypeId, requiredQty) {
		var self = this;
		var actualQuantity = self.getQuantity(itemTypeId);
		// undefined quantity means infinite quantity
		return actualQuantity == undefined || actualQuantity >= requiredQty;
	},

	isMappedSlotAvailable: function (mappedSlot, itemTypeId, ownerPlayer) {
		var existingItem = this.getItemBySlotNumber(mappedSlot);
		if (existingItem == undefined) {
			return true;
		}

		// even if there's an existing item in the designated slot, if we're in a middle of purchasing an item and the item uses the existing item as a recipe, then allow buying the item
		if (ownerPlayer) {
			var lastOpenedShop = ownerPlayer._stats.lastOpenedShop;
			if (lastOpenedShop) {
				var shopItems = taro.game.data.shops[lastOpenedShop] ? taro.game.data.shops[lastOpenedShop].itemTypes : [];
				var shopData = shopItems[itemTypeId];
				if (shopData) {
					if (
						existingItem &&
						existingItem._stats.removeWhenEmpty &&
						existingItem._stats.quantity == shopData.price.requiredItemTypes[existingItem._stats.itemTypeId]
					) {
						return true;
					}
				}
			}
		}
	},

	/**
	 * Return the inventory's first available slot considering the given item's type. If inventory has matching items already, then it'll consider how new item's quantity will be distributed, and eventually be added
	 * @param {*} itemData
	 * @return {int} returns first available slot number (starting from 1). undefined if there's no slot available
	 */
	getFirstAvailableSlotForItem: function (itemData, reservedSlots) {
		var self = this;
		var itemTypeId = itemData.itemTypeId;

		// check if we can assign itemData to its assigned designatedSlot.
		var mappedSlots =
			itemData.controls && Array.isArray(itemData.controls.permittedInventorySlots)
				? itemData.controls.permittedInventorySlots
				: undefined;

		var mappedSlot = undefined;
		var isAvailable = false;
		let ownerPlayer = this._entity.getOwner();

		let equipRequirementMet = self.isEquipRequirementMet(itemData);

		if (mappedSlots != undefined && mappedSlots.length > 0) {
			for (var i = 0; i < mappedSlots.length; i++) {
				if (mappedSlots[i] === 'backpack-slots') {
					for (
						let j = this._entity._stats.inventorySize + 1;
						j <= this._entity._stats.inventorySize + this._entity._stats.backpackSize;
						j++
					) {
						mappedSlot = j;
						isAvailable = this.isMappedSlotAvailable(mappedSlot, itemTypeId, ownerPlayer);
						if (isAvailable && !reservedSlots?.includes(mappedSlot)) {
							return mappedSlot;
						}
					}
				} else {
					mappedSlot = mappedSlots[i];
					// if equip requirement not met, only allow items to be placed in backpack.
					if (mappedSlot <= this._entity._stats.inventorySize && !equipRequirementMet) {
						continue;
					}
					isAvailable = this.isMappedSlotAvailable(mappedSlot, itemTypeId, ownerPlayer);
					if (isAvailable && !reservedSlots?.includes(mappedSlot)) {
						return mappedSlot;
					}
				}
			}
		}

		// check if this item can be merged with an existing item in the inventory
		var totalInventorySize = this.getTotalInventorySize();
		if (itemData.controls?.canMerge != false) {
			// Check if the item can merge
			var quantity = itemData.quantity;
			for (var i = equipRequirementMet ? 0 : this._entity._stats.inventorySize; i < totalInventorySize; i++) {
				var itemId = self._entity._stats.itemIds[i];

				if (itemId) {
					var item = taro.$(itemId);

					// matching item found in inventory
					if (item && item._stats.itemTypeId == itemTypeId) {
						// matching item has infinite quantity. merge items unless item also has infinite quantity
						if (item._stats.quantity === null && quantity !== null) {
							return i + 1;
						}

						let existingQuantity = item._stats.quantity || Infinity;
						let newQuantity = quantity || Infinity;
						let maxQuantity = item._stats.maxQuantity || Infinity;

						// matching item isn't full, and new item can fit in.
						if (maxQuantity - existingQuantity >= newQuantity) {
							return i + 1;
						} else {
							if (item._stats.quantity != undefined) {
								// new item's quantity isn't enough to fill the existing item's. Deduct new item's quantity. and move on. This isn't done for undefined items
								quantity -= item._stats.maxQuantity - item._stats.quantity;
							}
						}
					}
				}
			}
		}

		// get first available empty slot including from backpack
		for (var i = 0; i < totalInventorySize; i++) {
			// if item was mapped to a specific slot, then check if there's available slot in the backpack
			// if item didn't have mapping, then return the first available slot including both inventory + backpack
			if (
				(mappedSlot == undefined && equipRequirementMet && i < this._entity._stats.inventorySize) ||
				(i >= this._entity._stats.inventorySize &&
					(itemData.controls == undefined ||
						itemData.controls.backpackAllowed == true ||
						itemData.controls.backpackAllowed == undefined))
			) {
				var itemId = self._entity._stats.itemIds[i];
				if (!(itemId && taro.$(itemId)) && !reservedSlots?.includes(i + 1)) {
					return i + 1; // empty slot found
				}
			}
		}

		if (mappedSlot && mappedSlots.length == 1) {
			// give slot-specific message when item had ONE mapped slot. (e.g. glock in slot 2. Not slot 2 AND 3)
			self._entity.reasonForFailingToPickUpItem = `slot ${mappedSlot} is occupied`;
		}
		return undefined;
	},

	checkAvailableSlots: function (itemIdArray) {
		itemIdArray = itemIdArray.filter(function (el) {
			return el != null;
		});
		let slotsAvailable = true;
		let availableSlots = [];
		itemIdArray.forEach((itemId) => {
			const item = taro.$(itemId);
			if (this.getFirstAvailableSlotForItem(item._stats, availableSlots)) {
				availableSlots.push(this.getFirstAvailableSlotForItem(item._stats, availableSlots));
			} else {
				slotsAvailable = false;
				return false;
			}
		});
		return slotsAvailable;
	},

	// insert item into first available slot
	insertItem: function (item, slotIndex) {
		var self = this;
		var unit = this._entity;

		if (slotIndex == undefined) slotIndex = self.getFirstAvailableSlotForItem();

		if (slotIndex != undefined && item && unit.canCarryItem(item._stats)) {
			if (taro.isServer) {
				// console.log("inserting item at slot", slotIndex)
				self._entity._stats.itemIds[slotIndex] = item.id();
				if (slotIndex != self._entity.currentItemIndex) {
					item._stats.slotIndex = slotIndex;
				}
				if (slotIndex >= unit._stats.inventorySize) {
					item.hide();
				}
			} else if (taro.isClient && self._entity._stats.clientId === taro.network.id()) {
				var ownerPlayer = self._entity.getOwner();
				if (ownerPlayer) {
					if (ownerPlayer._stats.selectedUnitId == self._entity.id()) {
						item._stats.slotIndex = slotIndex;
						taro.itemUi.updateItemSlot(item, slotIndex);
					}
				}
			}
		}

		return slotIndex;
	},
	getItemFromInventory: function (itemTypeId) {
		var self = this;
		for (var k = 0; k < self._entity._stats.itemIds.length; k++) {
			var id = self._entity._stats.itemIds[k];
			var item = taro.$(id);
			if (item && item._stats && item._stats.itemTypeId === itemTypeId) {
				return item;
			}
		}
		return null;
	},
	getItemFromInventoryWhichCanBeAccumulated: function (itemTypeId) {
		var self = this;
		for (var k = 0; k < self._entity._stats.itemIds.length; k++) {
			var id = self._entity._stats.itemIds[k];
			var item = taro.$(id);
			if (
				item &&
				item._stats &&
				item._stats.itemTypeId === itemTypeId &&
				(item._stats.quantity < item._stats.maxQuantity || item._stats.maxQuantity === undefined)
			) {
				return item;
			}
		}
		return null;
	},
	removeItem: function (slotIndex, id) {
		// first remove itemid on server and send itemids to client for removing.
		let itemExistInItemIds = false;
		let unit = this._entity;
		if (unit._stats.itemIds[slotIndex] == id) {
			unit._stats.itemIds[slotIndex] = null;
			itemExistInItemIds = true;
		}

		if (taro.isServer) {
			unit.streamUpdateData([{ itemIds: unit._stats.itemIds }], unit._stats.clientId);
		} else if (taro.isClient) {
			if (taro.client.myPlayer && taro.client.myPlayer._stats.selectedUnitId == unit.id() && itemExistInItemIds) {
				$(taro.client.getCachedElementById(`item-${slotIndex}`)).html('');
				taro.itemUi.updateItemSlot(item, slotIndex);
			}
		}
	},

	removeItemByItemId: function (itemId) {
		var totalInventorySize = this.getTotalInventorySize();
		for (var slotIndex = 0; slotIndex < totalInventorySize; slotIndex++) {
			if (this._entity._stats.itemIds[slotIndex] == itemId) {
				this._entity._stats.itemIds[slotIndex] = null; // this appears to be redundant but we error in client.js without it
				this.removeItem(slotIndex, itemId);
			}
		}
	},

	// get item from inventory slot using slot number (starting from 1)
	getItemBySlotNumber: function (slotNumber) {
		if (slotNumber == undefined) return null;

		if (this._entity._stats.itemIds) {
			var itemId = this._entity._stats.itemIds[slotNumber - 1];
			if (itemId) {
				var item = taro.$(itemId);
				// make sure item is owned by the unit calling this function
				return item;
			}
		}
	},

	// update my unit's inventory by:
	// 1. highlight currently selected inventory item (using currentItemIndex)
	// 2. if inventory slot is occupied by item, then show item in the inventory slot. otherwise, empty inventory slot
	update: function () {
		if (taro.isClient && this._entity._stats.clientId === taro.network.id()) {
			var ownerPlayer = this._entity.getOwner();
			if (ownerPlayer && ownerPlayer._stats.selectedUnitId == this._entity.id()) {
				$('.popover').popover('hide');

				// highlight currently selected item slots
				// 5 for trading items

				var totalInventorySize = this.getTotalInventorySize();
				for (var slotIndex = 0; slotIndex < totalInventorySize + 5; slotIndex++) {
					// +5 for trade slots?
					var itemId = this._entity._stats.itemIds[slotIndex];
					var item = taro.$(itemId);

					taro.itemUi.updateItemSlot(item, slotIndex);
				}

				// this.updateBackpackButton()
			}

			this.isDirty = false;
		}
	},

	// highlight slot. (slots start from 1)
	highlightSlot: function (slotIndex) {
		for (var i = 0; i < this._entity._stats.inventorySize; i++) {
			// highlight currently selected inventory item (using currentItemIndex)
			if (slotIndex > 0 && slotIndex - 1 == i) {
				$(taro.client.getCachedElementById(`item-${i}`)).addClass('active');
			} else {
				$(taro.client.getCachedElementById(`item-${i}`)).removeClass('active');
			}
		}
	},

	getTotalInventorySize: function () {
		this._entity._stats.backpackSize = this._entity._stats.backpackSize > 0 ? this._entity._stats.backpackSize : 0; // backward compatibility incase backpackSize == undefined
		return this._entity._stats.inventorySize + this._entity._stats.backpackSize;
	},

	isItemDropAllowed: function (fromSlot, toSlot, fromItem, toItem) {
		const totalInventorySize = this.getTotalInventorySize();
		const inventorySize = this._entity._stats.inventorySize;

		if (toSlot >= totalInventorySize) {
			if (fromItem._stats.controls.undroppable) {
				return { allowed: false, reason: 'Item is undroppable' };
			}
			if (fromItem._stats.controls.untradable) {
				return { allowed: false, reason: 'Item is untradable' };
			}
		}

		if (toItem && fromSlot >= totalInventorySize) {
			if (toItem._stats.controls.undroppable) {
				return { allowed: false, reason: 'Item is undroppable' };
			}
			if (toItem._stats.controls.untradable) {
				return { allowed: false, reason: 'Item is untradable' };
			}
		}

		if (toSlot + 1 <= inventorySize && !this.isEquipRequirementMet(fromItem._stats)) {
			return { allowed: false, reason: `'${fromItem._stats.name}' equip requirements not met.` };
		}

		if (toItem && fromSlot + 1 <= inventorySize && !this.isEquipRequirementMet(toItem._stats)) {
			return { allowed: false, reason: `'${toItem._stats.name}' equip requirements not met.` };
		}

		if (fromItem._stats.controls?.permittedInventorySlots?.length > 0) {
			if (
				!fromItem._stats.controls.permittedInventorySlots.includes(toSlot + 1) &&
				(toSlot + 1 <= inventorySize || fromItem._stats.controls.backpackAllowed === false)
			) {
				return { allowed: false, reason: '' };
			}
		}

		if (toItem?._stats.controls?.permittedInventorySlots?.length > 0) {
			if (
				!toItem._stats.controls.permittedInventorySlots.includes(fromSlot + 1) &&
				(fromSlot + 1 <= inventorySize || toItem._stats.controls.backpackAllowed === false)
			) {
				return { allowed: false, reason: '' };
			}
		}

		return { allowed: true, reason: '' };
	},

	isAttributeRequirementMet: function (requirement, key, attributes) {
		if (attributes[key]) {
			switch (requirement.type) {
				case 'atmost':
					if (attributes[key].value > requirement.value) {
						return false;
					}
					break;
				case 'exactly':
					if (attributes[key].value != requirement.value) {
						return false;
					}
					break;
				case 'atleast':
				default:
					if (attributes[key].value < requirement.value) {
						return false;
					}
					break;
			}
			return true;
		}
		return true;
	},

	isEquipRequirementMet: function (itemData) {
		let self = this;
		let ownerPlayer = self._entity.getOwner();
		let playerAttributes = ownerPlayer?._stats.attributes;
		let unitAttributes = self._entity._stats.attributes;

		if (typeof itemData.controls?.equipRequirement === 'object') {
			let equipRequirement = itemData.controls.equipRequirement;
			if (equipRequirement.playerAttributes) {
				for (let key in equipRequirement.playerAttributes) {
					if (playerAttributes && playerAttributes[key]) {
						requirementsSatisfied = self.isAttributeRequirementMet(
							equipRequirement.playerAttributes[key],
							key,
							playerAttributes
						);
						if (!requirementsSatisfied) {
							return false;
						}
					}
				}
			}

			if (equipRequirement.unitAttributes) {
				for (let key in equipRequirement.unitAttributes) {
					if (unitAttributes && unitAttributes[key]) {
						requirementsSatisfied = self.isAttributeRequirementMet(
							equipRequirement.unitAttributes[key],
							key,
							unitAttributes
						);
						if (!requirementsSatisfied) {
							return false;
						}
					}
				}
			}
		}

		return true;
	},
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = InventoryComponent;
}
