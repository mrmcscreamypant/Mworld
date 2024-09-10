class UiScene extends PhaserScene {
	phaserButtonBar: PhaserButtonBar;
	constructor() {
		super({ key: 'Ui', active: true });
	}

	init(): void {
		return;
	}

	create(): void {
		/*if (!taro.isMobile) {
			return;
		}*/

		const phaserButtonBar = (this.phaserButtonBar = new PhaserButtonBar(this));

		taro.client.on(
			'create-ability-bar',
			(data: { keybindings: Record<string, ControlAbility>; abilities: Record<string, UnitAbility> }) => {
				const keybindings = data.keybindings;
				const abilities = data.abilities;
				phaserButtonBar.clear();
				if (abilities) {
					Object.entries(abilities).forEach(([abilityId, ability]) => {
						let key;
						if (
							(keybindings && taro.isMobile && ability.visibility !== 'desktop' && ability.visibility !== 'none') ||
							(!taro.isMobile && ability.visibility !== 'mobile' && ability.visibility !== 'none')
						) {
							Object.entries(keybindings).forEach(([keybindingKey, keybinding]) => {
								if (keybinding.keyDown?.abilityId === abilityId || keybinding.keyUp?.abilityId === abilityId) {
									key = keybindingKey;
								}
							});
							this.generateHTMLButton(key, abilityId, key, ability);
							// phaserButtonBar.addButton(abilityId, ability, key);
						}
					});
				}
			}
		);

		//const phaserButtonBar = this.phaserButtonBar = new PhaserButtonBar(this);

		taro.client.on('enterMapTab', () => {
			this.scene.setVisible(false);
		});

		taro.client.on('leaveMapTab', () => {
			this.scene.setVisible(true);
		});

		taro.client.on('start-press-key', (key: string) => {
			phaserButtonBar.buttons[key]?.activate(true);
		});

		taro.client.on('stop-press-key', (key: string) => {
			phaserButtonBar.buttons[key]?.activate(false);
		});

		taro.client.on('start-casting', (key: string) => {
			phaserButtonBar.buttons[key]?.casting(true);
		});

		taro.client.on('stop-casting', (key: string) => {
			phaserButtonBar.buttons[key]?.casting(false);
		});

		taro.client.on('start-ability-cooldown', (key: string) => {
			phaserButtonBar.buttons[key]?.cooldown(true);
		});

		taro.client.on('stop-ability-cooldown', (key: string) => {
			phaserButtonBar.buttons[key]?.cooldown(false);
		});
	}

	generateHTMLButton(type: string, abilityId: String, keybinding: any, ability: any): void {
		if (document.getElementById(type + '_button')) {
			return;
		}

		// buttons position
		// create a new button using html
		const htmlButton = document.createElement('button');
		htmlButton.id = type + '_button';
		// setting style for button
		Object.assign(htmlButton.style, {
			width: '60px',
			height: '60px',
			fontSize: '16px',
			color: '#fff',
			backgroundColor: '#33333366',
			border: '2px solid #555',
			backdropFilter: 'blur(4px)',
			borderRadius: '8px',
			zIndex: '1000',
			cursor: 'pointer',
		});

		let cooldownInterval: any;

		if (ability && ability.iconUrl) {
			htmlButton.innerHTML = `<img src="${ability.iconUrl}" style="width: 100%; height: 100%; object-fit: cover;"/>`;
		} else {
			htmlButton.textContent = type;
		}

		let abilitiesDiv = document.getElementById('abilities-buttons');

		if (!abilitiesDiv) {
			console.error('unable to add abilities button bcoz there is no div with id abilities-button');
			return;
		}

		abilitiesDiv.appendChild(htmlButton);

		htmlButton.addEventListener('mousedown', function () {
			if (taro.isClient) {
				let timerElement = document.getElementById(type + '_button_timer');
				let button = document.getElementById(type + '_button');
				if (timerElement) return;
				taro.client.emit('key-down', {
					device: 'key',
					key: type.toLowerCase(),
				});
				if (ability && ability.cooldown && !timerElement) {
					let cooldown = ability.cooldown;
					// cooldown logic
					let cooldownCount = 0;
					if (!timerElement) {
						timerElement = document.createElement('h5');
						timerElement.id = type + '_button_timer';
						Object.assign(timerElement.style, {
							right: 0,
							position: 'absolute',
							fontSize: '0.8rem',
						});
						timerElement.innerHTML = (cooldown - cooldownCount).toString();
						button.append(timerElement);
					}
					cooldownInterval = setInterval(() => {
						if (cooldownCount >= cooldown) {
							//ts-ignore
							// button.disabled =  false;
							timerElement.parentNode.removeChild(timerElement);
							clearInterval(cooldownInterval);
						} else {
							console.log(cooldown, cooldownCount);
							// button.disabled = true;
							cooldownCount++;
							timerElement.innerHTML = (cooldown - cooldownCount).toString();
						}
					}, 1000);
				}
			}
		});
		htmlButton.addEventListener('mouseup', function () {
			if (taro.isClient) {
				taro.client.emit('key-up', {
					device: 'key',
					key: type.toLowerCase(),
				});
			}
		});
	}

	preload(): void {
		this.load.plugin('rexroundrectangleplugin', '/assets/js/rexroundrectangleplugin.min.js', true);
		this.load.plugin('rexcirclemaskimageplugin', '/assets/js/rexcirclemaskimageplugin.min.js?v=1.1', true);
		Object.values(taro.game.data.abilities).forEach((ability) => {
			if (ability.iconUrl) this.load.image(ability.iconUrl, this.patchAssetUrl(ability.iconUrl));
		});
		Object.values(taro.game.data.unitTypes).forEach((unitType) => {
			// temp fix for undefined crash
			if (unitType?.controls?.unitAbilities && Object.keys(unitType.controls.unitAbilities).length > 0) {
				Object.values(unitType.controls.unitAbilities).forEach((ability) => {
					if (ability.iconUrl) this.load.image(ability.iconUrl, this.patchAssetUrl(ability.iconUrl));
				});
			}
		});
	}

	update(): void {
		return;
	}
}
