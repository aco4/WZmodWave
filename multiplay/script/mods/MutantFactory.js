class MutantFactory
{
	static nameFrom(weapons, bodyName, propulsionName)
	{
		const name = [];
		for (const [weaponName, weapon] of weapons)
		{
			name.push(weaponName);
		}
		name.push(bodyName);
		name.push(propulsionName);
		return name.join(" ");
	}

	static pick(obj)
	{
		const entries = Object.entries(obj);
		return entries[syncRandom(entries.length)];
	}

	produce()
	{
		const [bodyName, body] = MutantFactory.pick(Stats.Body);
		const [propulsionName, propulsion] = MutantFactory.pick(Stats.Propulsion);
		const weapons = [];
		for (let i = 0; i < body.WeaponSlots; i++)
		{
			const [weaponName, weapon] = MutantFactory.pick(Stats.Weapon);
			weapons.push([weaponName, weapon]);
		}
		return {
			name: MutantFactory.nameFrom(weapons, bodyName, propulsionName),
			body: body.Id,
			propulsion: propulsion.Id,
			weapons: weapons.map(e => e[1].Id),
		};
	}
}
