const {
	settings,
	allResearch,
	allStructs,
	redundantComponents,
	startingComponents,
	componentWeights,
} = loadJSON();

function loadJSON()
{
	const map = mapName.replace(/-T[1-4]$/, "");

	const defaultSettings = includeJSON("settings.json");
	const defaultStructure = includeJSON("structure.json");
	const defaultRedundantComponents = includeJSON("redundantComponents.json");
	const defaultStartingComponents = includeJSON("startingComponents.json");
	const defaultComponentWeights = includeJSON("componentWeights.json");

	const customSettings = includeJSON(`${map}/settings.json`);
	const customStructure = includeJSON(`${map}/structure.json`);
	const customRedundantComponents = includeJSON(`${map}/redundantComponents.json`);
	const customStartingComponents = includeJSON(`${map}/startingComponents.json`);
	const customComponentWeights = includeJSON(`${map}/componentWeights.json`);

	const settings = { ...defaultSettings, ...customSettings };
	const allResearch = includeJSON("research.json");
	const allStructs = customStructure || defaultStructure;
	const redundantComponents = customRedundantComponents || defaultRedundantComponents;
	const startingComponents = customStartingComponents || defaultStartingComponents;
	const componentWeights = customComponentWeights || defaultComponentWeights;

	if (!defaultSettings && !customSettings)
	{
		throw new Error(`Could not find ${map}/settings.json or settings.json in multiplay/script/rules/`);
	}
	if (!allResearch)
	{
		throw new Error(`Could not find ${map}/research.json in multiplay/script/rules/`);
	}
	if (!allStructs)
	{
		throw new Error(`Could not find ${map}/structure.json or structure.json in multiplay/script/rules/`);
	}
	if (!redundantComponents)
	{
		throw new Error(`Could not find ${map}/redundantComponents.json or redundantComponents.json in multiplay/script/rules/`);
	}
	if (!startingComponents)
	{
		throw new Error(`Could not find ${map}/startingComponents.json or startingComponents.json in multiplay/script/rules/`);
	}
	if (!componentWeights)
	{
		throw new Error(`Could not find ${map}/componentWeights.json or componentWeights.json in multiplay/script/rules/`);
	}

	return { settings, allStructs, allResearch, redundantComponents, startingComponents, componentWeights };
}
