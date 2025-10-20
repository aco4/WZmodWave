class TemplateFactory
{
	// componentID -> component
	static WZBODY = TemplateFactory.convert(Stats.Body);
	static WZWEAPON = TemplateFactory.convert(Stats.Weapon);
	static WZPROPULSION = TemplateFactory.convert(Stats.Propulsion);

	static DEFAULT_COMPONENT_WEIGHT = 100;

	static convert(obj) // convert name -> component to id -> component
	{
		const result = {};
		for (const [name, data] of Object.entries(obj)) {
			result[data.Id] = { ...data, name };
		}
		return result;
	}

	static truck()
	{
		return {
			name: "Truck Viper Wheels",
			body: "Body1REC",
			propulsion: "wheeled01",
			weapons: ["Spade1Mk1"]
		};
	}

	static RULES = [
		{ // flying propulsions must use vtol weapons
			propulsionPredicate: (propulsionID) => propulsionID == "V-Tol" || propulsionID == "Helicopter",
			weaponFilter: (weaponID) => weaponID.toUpperCase().includes("VTOL"),
		},
		{ // non-flying propulsions must not use vtol weapons
			propulsionPredicate: (propulsionID) => propulsionID != "V-Tol" && propulsionID != "Helicopter",
			weaponFilter: (weaponID) => !weaponID.toUpperCase().includes("VTOL"),
		},
		{ // non-flying propulsions must not use vtol weapons
			propulsionPredicate: (propulsionID) => propulsionID != "V-Tol" && propulsionID != "Helicopter",
			weaponFilter: (weaponID) => !weaponID.toUpperCase().includes("VTOL"),
		},
		{ // cyborg bodies must use cyborg propulsion
			bodyPredicate: (bodyID) => bodyID.toUpperCase().includes("CYB"),
			propulsionFilter: (propulsionID) => propulsionID.toUpperCase().includes("CYB"),
		},
		{ // non-cyborg bodies must not use cyborg propulsion
			bodyPredicate: (bodyID) => !bodyID.toUpperCase().includes("CYB"),
			propulsionFilter: (propulsionID) => !propulsionID.toUpperCase().includes("CYB"),
		},
		{ // cyborg propulsions must use cyborg bodies
			propulsionPredicate: (propulsionID) => propulsionID.toUpperCase().includes("CYB"),
			bodyFilter: (bodyID) => bodyID.toUpperCase().includes("CYB"),
		},
		{ // cyborg light bodies must use cyborg weapons
			bodyPredicate: (bodyID) => bodyID.toUpperCase().includes("CYBORGLIGHT"),
			weaponFilter: (weaponID) => weaponID.toUpperCase().includes("CYB"),
		},
		{ // cyborg light bodies must not use heavy cyborg weapons
			bodyPredicate: (bodyID) => bodyID.toUpperCase().includes("CYBORGLIGHT"),
			weaponFilter: (weaponID) => !weaponID.toUpperCase().includes("CYB-HVY"),
		},
		{ // cyborg heavy bodies must use heavy cyborg weapons
			bodyPredicate: (bodyID) => bodyID.toUpperCase().includes("CYBORGHEAVY"),
			weaponFilter: (weaponID) => weaponID.toUpperCase().includes("CYB-HVY"),
		},
		{ // non-cyborg bodies must not use cyborg weapons
			bodyPredicate: (bodyID) => !bodyID.toUpperCase().includes("CYB"),
			weaponFilter: (weaponID) => !weaponID.toUpperCase().includes("CYB"),
		},
		{ // helicopter bodies must use vtol propulsion
			bodyPredicate: (bodyID) => bodyID.toUpperCase().includes("CHOPPER"),
			propulsionFilter: (propulsionID) => propulsionID == "V-Tol",
		},
		{ // transport bodies must use vtol propulsion
			bodyPredicate: (bodyID) => TemplateFactory.WZBODY[bodyID].BodyClass.toUpperCase().includes("TRANSPORT"),
			propulsionFilter: (propulsionID) => propulsionID == "V-Tol",
		},
		{ // baba bodies must use baba propulsion
			bodyPredicate: (bodyID) => TemplateFactory.WZBODY[bodyID].BodyClass.toUpperCase().includes("BABA"),
			propulsionFilter: (propulsionID) => propulsionID.toUpperCase().includes("BABA"),
		},
		{ // non-baba bodies must not use baba propulsion
			bodyPredicate: (bodyID) => !TemplateFactory.WZBODY[bodyID].BodyClass.toUpperCase().includes("BABA"),
			propulsionFilter: (propulsionID) => !propulsionID.toUpperCase().includes("BABA"),
		},
		{ // non-baba bodies must not use baba weapons
			bodyPredicate: (bodyID) => !TemplateFactory.WZBODY[bodyID].BodyClass.toUpperCase().includes("BABA"),
			weaponFilter: (weaponID) =>
				!weaponID.toUpperCase().includes("BABA") &&
				!weaponID.toUpperCase().includes("BUSCANNON") &&
				!weaponID.toUpperCase().includes("JEEP") &&
				!weaponID.toUpperCase().includes("BUGGY") &&
				!weaponID.toUpperCase().includes("TRIKE"),
		},

		// Hardcoded baba templates

		{
			bodyPredicate: (bodyID) => bodyID == "B1BaBaPerson01",
			propulsionFilter: (propulsionID) => propulsionID == "BaBaLegs",
			weaponFilter: (weaponID) => weaponID == "BaBaMG",
		},
		{
			bodyPredicate: (bodyID) => bodyID == "BusBody",
			weaponFilter: (weaponID) => weaponID == "BusCannon",
		},
		{
			bodyPredicate: (bodyID) => bodyID == "FireBody",
			weaponFilter: (weaponID) => weaponID == "BusCannon" || weaponID == "BabaFlame",
		},
		{
			bodyPredicate: (bodyID) => bodyID == "B2JeepBody",
			weaponFilter: (weaponID) => weaponID == "BJeepMG",
		},
		{
			bodyPredicate: (bodyID) => bodyID == "B2RKJeepBody",
			weaponFilter: (weaponID) => weaponID == "BabaRocket",
		},
		{
			bodyPredicate: (bodyID) => bodyID == "B3body-sml-buggy01",
			weaponFilter: (weaponID) => weaponID == "BuggyMG",
		},
		{
			bodyPredicate: (bodyID) => bodyID == "B3bodyRKbuggy01",
			weaponFilter: (weaponID) => weaponID == "BabaRocket",
		},
		{
			bodyPredicate: (bodyID) => bodyID == "B4body-sml-trike01",
			weaponFilter: (weaponID) => weaponID == "bTrikeMG",
		},

		// Rules from settings

		settings.rule_hoverFlame && { // hovers must use flame
			propulsionPredicate: (propulsionID) => propulsionID == "hover01",
			weaponFilter: (weaponID) => weaponID.toUpperCase().includes("FLAME"),
		},
		settings.rule_strongHover && { // viper, scorpion, mantis, and leopard must not use hover
			bodyPredicate: (bodyID) =>
				bodyID == "Body1REC" ||
				bodyID == "Body8MBT" ||
				bodyID == "Body12SUP" ||
				bodyID == "Body2SUP",
			propulsionFilter: (propulsionID) => propulsionID != "hover01",
		},
		settings.rule_lateTracks && { // non-T4 bodies must not use tracks
			bodyPredicate: (bodyID) =>
				bodyID != "Body3MBT" &&
				bodyID != "Body7ABT" &&
				bodyID != "Body10MBT" &&
				bodyID != "Body13SUP" &&
				bodyID != "Body14SUP",
			propulsionFilter: (propulsionID) => propulsionID != "tracked01",
		},
		settings.rule_lateTracks && { // T4 bodies must use tracks
			bodyPredicate: (bodyID) =>
				bodyID == "Body3MBT" ||
				bodyID == "Body7ABT" ||
				bodyID == "Body10MBT" ||
				bodyID == "Body13SUP" ||
				bodyID == "Body14SUP",
			propulsionFilter: (propulsionID) => propulsionID == "tracked01",
		},
		settings.rule_lightWeapons && { // leopard/viper must not use Medium Cannon or Inferno or Heavy Cannon or Twin Assault Cannon
			bodyPredicate: (bodyID) => bodyID == "Body2SUP" || bodyID == "Body1REC",
			weaponFilter: (weaponID) =>
				weaponID != "Cannon2A-TMk1" &&
				weaponID != "Flame2" &&
				weaponID != "Cannon6TwinAslt" &&
				weaponID != "Cannon375mmMk1",
		},
	].filter(r => !!r);

	constructor(timeSeconds = 0, data = {})
	{
		Object.assign(this, {
			RESEARCH: {},
			startingComponents: [],
			redundantComponents: {},
			componentWeights: {},
			minimumResearchTime: {},
			...data
		})

		this.bodies      = new Set();
		this.propulsions = new Set();
		this.weapons     = new Set();

		for (const componentID of this.startingComponents)
		{
			if (this.componentWeights[componentID] <= 0) // disabled
			{
				continue;
			}
			if (TemplateFactory.WZBODY[componentID])
			{
				this.bodies.add(componentID);
			}
			if (TemplateFactory.WZPROPULSION[componentID])
			{
				this.propulsions.add(componentID);
			}
			if (TemplateFactory.WZWEAPON[componentID])
			{
				this.weapons.add(componentID);
			}
		}

		const redComponents = new Set();

		for (const [research, seconds] of Object.entries(minimumResearchTime))
		{
			if (seconds <= timeSeconds)
			{
				for (const componentID of this.RESEARCH[research].resultComponents || [])
				{
					if (this.componentWeights[componentID] <= 0) // disabled
					{
						continue;
					}
					if (TemplateFactory.WZBODY[componentID])
					{
						this.bodies.add(componentID);
					}
					if (TemplateFactory.WZPROPULSION[componentID])
					{
						this.propulsions.add(componentID);
					}
					if (TemplateFactory.WZWEAPON[componentID])
					{
						this.weapons.add(componentID);
					}
				}

				for (const componentID of this.redundantComponents[research] || this.RESEARCH[research].redComponents || [])
				{
					redComponents.add(componentID);
				}
			}
		}

		for (const componentID of redComponents)
		{
			this.bodies     .delete(componentID);
			this.propulsions.delete(componentID);
			this.weapons    .delete(componentID);
		}

		// Build weigted random
		this.bodyWeights = {};
		for (const bodyID of this.bodies)
		{
			this.bodyWeights[bodyID] = this.componentWeights[bodyID] ?? TemplateFactory.DEFAULT_COMPONENT_WEIGHT;
		}
		this.bodySelector = new WeightedRandom(this.bodyWeights);
	}

	produce()
	{
		if (this.bodies.length == 0 || this.propulsions.length == 0 || this.weapons.length == 0)
		{
			return TemplateFactory.truck();
		}

		// Initialize
		let availableBodyIDs = Array.from(this.bodies);
		let availablePropulsionIDs = Array.from(this.propulsions);
		let availableWeaponIDs = Array.from(this.weapons);
		let propulsionFilters = [];
		let weaponFilters = [];

		// 1. Pick body
		const bodyID = this.bodySelector.get();

		// 2. Accumulate filters
		for (const rule of TemplateFactory.RULES)
		{
			if (rule.bodyPredicate?.(bodyID))
			{
				if (rule.propulsionFilter)
				{
					propulsionFilters.push(rule.propulsionFilter);
				}
				if (rule.weaponFilter)
				{
					weaponFilters.push(rule.weaponFilter);
				}
			}
		}

		// 3. Apply propulsion filters
		for (const propulsionFilter of propulsionFilters)
		{
			availablePropulsionIDs = availablePropulsionIDs.filter(propulsionFilter);
		}
		if (availablePropulsionIDs.length == 0)
		{
			// console("No available propulsion for", bodyID);
			return TemplateFactory.truck();
		}

		// 4. Pick propulsion
		const propulsionWeights = {};
		for (const propulsionID of availablePropulsionIDs)
		{
			propulsionWeights[propulsionID] = this.componentWeights[propulsionID] ?? TemplateFactory.DEFAULT_COMPONENT_WEIGHT;
		}
		const propulsionID = new WeightedRandom(propulsionWeights).get();

		// 5. Accumulate filters
		for (const rule of TemplateFactory.RULES)
		{
			if (rule.propulsionPredicate?.(propulsionID))
			{
				if (rule.weaponFilter)
				{
					weaponFilters.push(rule.weaponFilter);
				}
			}
		}

		// 6. Apply weapon filters
		for (const weaponFilter of weaponFilters)
		{
			availableWeaponIDs = availableWeaponIDs.filter(weaponFilter);
		}
		if (availableWeaponIDs.length == 0)
		{
			// console("No available weapon for", bodyID, propulsionID);
			return TemplateFactory.truck();
		}

		// 7. Pick weapons
		const weaponWeights = {};
		for (const weaponID of availableWeaponIDs)
		{
			weaponWeights[weaponID] = this.componentWeights[weaponID] ?? TemplateFactory.DEFAULT_COMPONENT_WEIGHT;
		}
		const weaponIDs = [];
		for (let i = 0; i < TemplateFactory.WZBODY[bodyID].WeaponSlots; i++)
		{
			const weaponID = new WeightedRandom(weaponWeights).get();
			weaponIDs.push(weaponID);
		}

		return {
			name: this.nameFrom(weaponIDs, bodyID, propulsionID),
			body: bodyID,
			propulsion: propulsionID,
			weapons: weaponIDs,
		};
	}

	nameFrom(weaponIDs, bodyID, propulsionID)
	{
		const name = [];
		for (const weaponID of weaponIDs)
		{
			name.push(TemplateFactory.WZWEAPON[weaponID].name);
		}
		name.push(TemplateFactory.WZBODY[bodyID].name);
		name.push(TemplateFactory.WZPROPULSION[propulsionID].name);
		return name.join(" ");
	}
};
