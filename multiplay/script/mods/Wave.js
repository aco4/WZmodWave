class Wave
{
	static type = {
		"NORMAL": 0,
		"ROYAL": 1,
		"FINAL": 2,
	};
	static number = 0;
	static difficulty;
	static AI;
	static {
		this.difficulty = 1;
		if (scavengers != 0)
		{
			this.AI = scavengerPlayer;
			this.difficulty = (scavengers + 2) / 3; //general danger of waves 1, 1.33
		}
		else
		{
			for (let playnum = 0; playnum < maxPlayers; playnum++)
			{
				if (playerData[playnum].isAI && playerData[playnum].name == "Wave")
				{
					this.AI = playnum;
					this.difficulty = (playerData[this.AI].difficulty + 1) / 3; //general danger of waves 0.66, 1, 1.33, 1.6
				}
			}
		}
	}

	constructor()
	{
		this.currentExpansionDirection = this.getCurrentExpansionDirection();
		Scrim.growDirection(this.currentExpansionDirection, settings.expansionAmount);

		giveResearch(Wave.AI);

		this.timeS = getTotalTimeS();
		const { budget, rang, experience } = this.calcBudget(this.timeS);
		this.type = this.isFinal ? Wave.type.FINAL : Wave.type.NORMAL;
		this.droidBudget  = this.isFinal ? budget * settings.Kfinal : budget;
		this.rang         = rang;
		this.experience   = experience;
		this.droids       = [];
		this.unfinishedTransports = 0;
		this.unitsLandedCount = 0;

		const { droidZone, structZone } = this.getZones();
		this.droidZone = droidZone;
		this.pushStructs(structZone);
		this.predetermine(this.timeS);
	}

	getCurrentExpansionDirection()
	{
		if (settings.expansionDirection == "all" )
		{
			const expansionOrder = ["north", "west", "south", "east"];
			return expansionOrder[Wave.number % 4];
		}
		else
		{
			return settings.expansionDirection;
		}
	}

	get isSendingTransports()
	{
		return this.transports.length > 0;
	}

	get isDoneLanding()
	{
		return this.unfinishedTransports == 0;
	}

	get isMostlyDefeated()
	{
		return this.currentDroidCount < this.residualAdjustment(this.totalDroidCount);
	}

	get isDefeated()
	{
		return this.currentDroidCount == 0;
	}

	get currentDroidCount()
	{
		return enumDroid(Wave.AI, "DROID_WEAPON").filter(d => !d.isVTOL && d.canHitGround).length;
	}

	get isFinal()
	{
		return Scrim.isMax;
	}

	get isNotFinal()
	{
		return !this.isFinal;
	}

	residualAdjustment(unitCount)
	{
		if (typeof settings.RESIDUAL == "number")
		{
			return Math.ceil(unitCount * settings.RESIDUAL);
		}
		else
		{
			return Infinity; // disable residual adjustment
		}
	}

	getZones()
	{
		if (settings.landEverywhere)
		{
			return { droidZone: Scrim.structArea, structZone: null };
		}
		let droidZone = Scrim.droidArea;
		let structZone = Scrim.structArea;

		if (this.isFinal)
		{
			structZone.x1 = 0; // TODO still place structures. need to know how much the map expanded
			structZone.y1 = 0;
			structZone.x2 = 0;
			structZone.y2 = 0;
		}
		else if (this.currentExpansionDirection == "north")
		{
			droidZone.y2 = droidZone.y1 + Math.max(1, settings.expansionAmount);
			structZone.y2 = structZone.y1 + settings.expansionAmount;
		}
		else if (this.currentExpansionDirection == "east")
		{
			droidZone.x1 = droidZone.x2 - Math.max(1, settings.expansionAmount);
			structZone.x1 = structZone.x2 - settings.expansionAmount;
		}
		else if (this.currentExpansionDirection == "south")
		{
			droidZone.y1 = droidZone.y2 - Math.max(1, settings.expansionAmount);
			structZone.y1 = structZone.y2 - settings.expansionAmount;
		}
		else if (this.currentExpansionDirection == "west")
		{
			droidZone.x2 = droidZone.x1 + Math.max(1, settings.expansionAmount);
			structZone.x2 = structZone.x1 + settings.expansionAmount;
		}

		return {
			droidZone,
			structZone
		};
	}

	calcBudget(timeS)
	{
		const K = getNumOil() * settings.Kpower;
		// Игрок по мере игры получает апы на ген, что проиводит к росуту доступных ресурсов.
		// При первом приблежении вторая производная энергии по времени прямая с увеличением в два раза за 20 минут.
		// Используем два способа компенсиовать одновременно.
		// Первый: бюджет зависит от квадрата времени
		const A = K / (settings.doublePowerM * 60);
		const budget = Math.max(1, Math.round(
			((K * timeS + A * timeS ** 2) / 2) * Wave.difficulty + settings.startPowerC
		));
		//Второй: опытом. При первом приближении юниты усиливаются +11% за каждый ранг.
		//Опыт ограничен 16 рангом, вероятно. По этому делаем что бы к концу юниты были максимально злые.
		const rang = Math.round((14 / (settings.totalGameTime * 60)) * timeS);

		return {
			budget: budget,
			rang: rang,
			experience: Math.round(2 ** rang)
		};
	}

	predetermine(timeS)
	{
		const landFactory = new TemplateFactory(timeS, {
			RESEARCH: allResearch,
			startingComponents: startingComponents,
			redundantComponents: redundantComponents,
			componentWeights: componentWeights,
		});
		const waterFactory = settings.waterLanding ? new TemplateFactory(timeS, {
			RESEARCH: allResearch,
			startingComponents: startingComponents,
			redundantComponents: redundantComponents,
			componentWeights: {
				...componentWeights,
				"BaBaProp": 0,
				"wheeled01": 0,
				"CyborgLegs": 0,
				"HalfTrack": 0,
				"tracked01": 0,
				"CyborgLightBody": 0,
				"CyborgHeavyBody": 0
			},
		}) : null;

		let availableTiles = this.getDroidTiles();
		shuffle(availableTiles);

		this.transports = [];
		this.totalDroidCount = 0;

		while (this.droidBudget > 0 && availableTiles.length > 0)
		{
			const [x, y] = availableTiles.pop();

			const virtualDroids = [];

			BFS(x, y,
				/* maxCount = */ settings.transporterUnitCount,
				/* shape    = */ 25,
				/* canVisit = */ (x, y) =>
				{
					return Scrim.contains(x, y, "droid")
						&& terrainType(x, y) != TER_CLIFFFACE
						&& (terrainType(x, y) != TER_WATER || settings.waterLanding)
						&& !getObject(x, y);
				},
				/* visit = */ (x, y) =>
				{
					const virtualDroid = terrainType(x, y) == TER_WATER
						? waterFactory?.produce()
						: landFactory.produce();

					if (virtualDroid == null || virtualDroid.name == "Truck Viper Wheels") // WARNING FAILURE
					{
						// console(`FACTORY FAILURE`);
						return;
					}

					if (!makeTemplate(
						Wave.AI,
						virtualDroid.name,
						virtualDroid.body,
						virtualDroid.propulsion,
						"",
						...virtualDroid.weapons
					))
					{
						console(`FAILED TO MAKE TEMPLATE ${virtualDroid.name}`);
						return;
					}
					this.totalDroidCount++;
					this.droidBudget -= makeTemplate(
						Wave.AI,
						virtualDroid.name,
						virtualDroid.body,
						virtualDroid.propulsion,
						"",
						...virtualDroid.weapons
					).power;

					virtualDroid.x = x;
					virtualDroid.y = y;

					virtualDroids.push(virtualDroid);
				},
				/* stop = */ () => this.droidBudget <= 0
			);

			this.transports.push({ x, y, virtualDroids });
		}
		this.unfinishedTransports = this.transports.length;
		this.totalTransportCount = this.transports.length;
	}

	pushStructs(structZone)
	{
		let availableStructs = getStructures(this.timeS);
		let availableTiles = this.getStructTiles(structZone);
		shuffle(availableTiles);

		for (const [type, multiplier] of Object.entries(settings.structPower))
		{
			let structureBudget = Math.round(this.droidBudget * multiplier);
			let structs = availableStructs.filter(id => allStructs[id].type == type);
			while (structureBudget > 0 && availableTiles.length > 0 && structs.length > 0)
			{
				const [x, y] = availableTiles.pop();
				const i = syncRandom(structs.length);
				const key = structs[i];

				if (enumStruct(Wave.AI, key).length >= getStructureLimit(key, Wave.AI))
				{
					structs.splice(i, 1); // remove
					continue;
				}

				hackNetOff();
				addStructure(key, Wave.AI, x*128, y*128);
				hackNetOn();
				structureBudget -= allStructs[key].buildPower;
			}
		}
	}

	getStructTiles(structZone)
	{
		let availableTiles = [];
		for (const { x, y } of Scrim.iterate(structZone))
		{
			if (terrainType(x, y) == TER_CLIFFFACE)
			{
				continue;
			}
			if (settings.waterStructure == false && terrainType(x, y) == TER_WATER)
			{
				continue;
			}
			if (getObject(x, y))
			{
				continue;
			}
			availableTiles.push([x, y]);
		}
		return availableTiles;
	}

	getDroidTiles()
	{
		let availableTiles = [];
		for (const { x, y } of Scrim.iterate(this.droidZone))
		{
			if (terrainType(x, y) == TER_CLIFFFACE)
			{
				continue;
			}
			if (settings.waterLanding == false && terrainType(x, y) == TER_WATER)
			{
				continue;
			}
			if (getObject(x, y))
			{
				continue;
			}
			availableTiles.push([x, y]);

		}
		return availableTiles;
	}

	sendTransport()
	{
		const { x, y, virtualDroids } = this.transports.pop();
		let finished = false;
		const dropCargo = () => {
			for (const virtualDroid of virtualDroids)
			{
				hackNetOff();
				const droid = addDroid(
					Wave.AI,
					virtualDroid.x,
					virtualDroid.y,
					virtualDroid.name,
					virtualDroid.body,
					virtualDroid.propulsion,
					"",
					"",
					...virtualDroid.weapons
				);
				if (settings.enableWaveExperience)
				{
					setDroidExperience(droid, this.experience);
				}
				hackNetOn();
				this.droids.push(droid);
				this.unitsLandedCount++;
			}
			finished = true;
			if (this.totalTransportCount <= 5) {
				Dropship.play("Incoming enemy transport");
			}
			this.unfinishedTransports--;
		};

		const spawnLocation = Dropship.snap({ x, y, margin: -10, border: this.currentExpansionDirection })

		new Dropship(Wave.AI, spawnLocation.x, spawnLocation.y, {
			experience: settings.transporterExperience,
			cyborgTransport: settings.cyborgTransport,
			objectives: [
				Dropship.objective({
					getLocation : (dropship) => { return { x, y }; },
					isComplete  : (dropship) => dropship.isAt(x, y),
					onComplete  : (dropship) => dropship.stop(),
				}),
				Dropship.objective("pause"),
				Dropship.objective({
					getLocation : null,
					isComplete  : (dropship) => true,
					onComplete  : (dropship) => dropCargo(),
				}),
				Dropship.objective(`depart${this.currentExpansionDirection}`)
			],
			onDeath: () =>
			{
				if (!finished)
				{
					this.unfinishedTransports--;
				}
			},
		});
	}
}
