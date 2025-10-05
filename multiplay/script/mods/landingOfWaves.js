include("multiplay/script/lib.js");
include("multiplay/script/mods/AItechAndComponents.js");

var settings = {};
var allTemplates = {};
var allStructs = {};
var research = {};

namespace("wa_");

// константы типы волн
var WAVETYPE = ["NORMAL", "ROYAL"];
var { waveDifficulty, AI } = getWaveAI(); //num wawe AI
var wave = { time: 0, active: false };
var numberWave = 0;
var BORDER = 4;
var LZRADIUS = null; // initialize in loadSettings()


function getWaveAI()
{
	let AI = false;
	let waveDifficulty = 1;
	// Defining script variables
	if (scavengers != 0)
	{
		AI = scavengerPlayer;
		waveDifficulty = (scavengers + 2) / 3; //general danger of waves 1, 1.33
	}
	else
	{
		for (let playnum = 0; playnum < maxPlayers; playnum++)
		{
			if (playerData[playnum].isAI && playerData[playnum].name == "Wave")
			{
				AI = playnum;
				waveDifficulty = (playerData[AI].difficulty + 2) / 3; //general danger of waves 0.66, 1, 1.33, 1.6
			}
		}
	}
	return { AI: AI, waveDifficulty: waveDifficulty };
}

function wa_eventGameInit()
{
	const cleanMapName = mapName.replace(/-T[1-4]$/, "");
	loadSettings(cleanMapName);
	loadData(cleanMapName);
	overrideData();

	if (settings.expansionDirection == "all")
	{
		const {x, y, x2, y2} = {x:(mapWidth-settings.startHeight)/2, y:(mapHeight-settings.startHeight)/2, x2:(mapWidth+settings.startHeight)/2, y2:(mapHeight+settings.startHeight)/2 };
		setScrollLimits(x, y, x2, y2);
	}
	if (settings.expansionDirection == "north")
	{
		const {x, y, x2, y2} = {x:0, y:(mapHeight-settings.startHeight), x2:mapWidth, y2:mapHeight };
		setScrollLimits(x, y, x2, y2);
	}
	const salutation = [
		"Mod from Vaut. Repository: https://github.com/vaut/WZmodWave",
		"Explore the Theta sector and destroy the enemy forces.",
		"We're counting on you Commander.",
		"You have no right to make a mistake, loading and saving are not possible.",
		"difficulty " + Math.round(waveDifficulty*100) +"%",
	].join("\n");
	console(salutation);
	debug(salutation);
	scheduler();
	setTimer("removeVtol", 6*1000);
	setMissionTime(settings.protectTimeM*60);
	makeComponentAvailable("MG1Mk1", AI);
	avalibleScavComponents(AI);
}

function loadSettings(map)
{
	const settingsName = `${map}.settings.json`;

	let defaultSettings = includeJSON("settings.json");
	if (!defaultSettings)
	{
		throw new Error("Missing default settings file: multiplay/script/rules/settings.json");
	}

	let customSettings = includeJSON(settingsName);
	if (!customSettings)
	{
		customSettings = {};

		const str = settingsName + _(" settings file not found\nUsing default settings");
		debug(str);
		console(str);
	}

	settings = {
		...defaultSettings,
		...customSettings
	};

	LZRADIUS = settings.LZRADIUS;
}

function loadData(map)
{
	const defaultTemplates = includeJSON("templates.json");
	const defaultStructure = includeJSON("structure.json");
	const defaultResearch = includeJSON("research.json");

	const customTemplates = includeJSON(`${map}.templates.json`);
	const customStructure = includeJSON(`${map}.structure.json`);
	const customResearch = includeJSON(`${map}.research.json`);

	allTemplates = customTemplates || defaultTemplates;
	allStructs = customStructure || defaultStructure;
	research = customResearch || defaultResearch;

	if (!allTemplates)
	{
		throw new Error(`Missing ${map}.templates.json and templates.json in multiplay/script/rules/`);
	}
	if (!allStructs)
	{
		throw new Error(`Missing ${map}.structure.json and structure.json in multiplay/script/rules/`);
	}
	if (!research)
	{
		throw new Error(`Missing ${map}.research.json and research.json in multiplay/script/rules/`);
	}
}

function overrideData()
{
	// Needle Gun is better than Heavy Cannon
	research["R-Wpn-RailGun01"].redComponents.push("Cannon375mmMk1");
}

function scheduler()
{
	// пропускаем стартовые минуты
	if (settings.protectTimeM *60 > gameTime / 1000)
	{
		queue("scheduler", 6*1000);
		return;
	}
	wave.droids = enumDroid(AI, "DROID_WEAPON").filter(d => !d.isVTOL && d.canHitGround);

	// отразили финальную волну
	if (wave.droids.length == 0 && wave.active == true && wave.budget <= 0 && wave.type == "FINAL")
	{
		wave.active = false;
		return;
	}

	// отразили волну
	if (wave.droids.length <= residualAdjustment(wave.droidsCount) && wave.active == true && wave.budget <= 0 && wave.type !== "FINAL" )
	{
		wave.time = gameTime/1000 + (settings.pauseM + settings.INCREM_PAUSEM * numberWave) * 60 ;
		setMissionTime((settings.pauseM + settings.INCREM_PAUSEM * numberWave) * 60);
		wave.active = false;
		queue("scheduler", 3*1000);
		return;
	}

	// первая высадка в волне
	if (wave.time <= gameTime/1000 && wave.active == false)
	{
		newWave();
		landing();
		queue("scheduler", settings.inWavePauseS*1000);
		return;
	}

	// следующая высадка в волне
 	if (wave.time <= gameTime/1000 && wave.active == true)
	{
		landing();
		queue("scheduler", settings.inWavePauseS*1000);
		return;
	}

	// заглушка на случай отсутсвия действия
	queue("scheduler", 3*1000);
}

function residualAdjustment(unitCount)
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

function removeVtol()
{
	if (enumStruct(AI, REARM_PAD).length <= 0)
	{
		enumDroid(AI, "DROID_WEAPON")
			.filter(d => d.isVTOL && d.weapons[0].armed <= 1)
			.forEach(v => removeObject(v));
	}
}

function landing()
{
	if (wave.budget > 0)
	{
		// делаем высадку
		wave.LZ = getLZ();
		pushUnits();
	}

	if (wave.structBudget > 0)
	{
		pushStructs();
	}
}

function getLZ()
{
	const {x, y, x2, y2} = wave.unitZone;
	let LZ = {
		x: syncRandom(x2-x)+x,
		y: syncRandom(y2-y)+y,
		radius: LZRADIUS,
	};
	LZ.tiles = LZtile(LZ);
	return LZ;
}

function LZtile(LZ)
{
	const PLACE = "O"; //landing place
	const CLIFF = "X"; //impassable tile
	const POSS = "."; //landing is possible

	function isPassable(x, y)
	{
		if (terrainType(x, y) == TER_CLIFFFACE)
		{
			return false;
		}
		if (getObject(x, y))
		{
			return false;
		}
		if (settings.waterLanding == false && terrainType(x, y) == TER_WATER)
		{
			return false;
		}
		return true;
	}

	function markAvailableTile(tiles)
	{
		let addPOSS = false;
		tiles.forEach(function O(row, x)
		{
			row.forEach(function M(tile, y)
			{
				if (tile == CLIFF)
				{
					return;
				}
				if (tile == PLACE)
				{
					return;
				}
				if (
					tile == POSS &&
          ((tiles[x - 1] && tiles[x - 1][y] == PLACE) ||
            (tiles[x + 1] && tiles[x + 1][y] == PLACE) ||
            tiles[x][y - 1] == PLACE ||
            tiles[x][y + 1] == PLACE)
				)
				{
					tiles[x][y] = PLACE;
					addPOSS = true;
				}
			});
		});
		if (addPOSS)
		{
			markAvailableTile(tiles);
		} // TODO заменить на цикл
	}

	let tiles = [];
	for (let x = LZ.x - LZ.radius; x <= LZ.x + LZ.radius; x++)
	{
		tiles[x] = [];
		for (let y = LZ.y - LZ.radius; y <= LZ.y + LZ.radius; y++)
		{
			if (isPassable(x, y))
			{
				tiles[x][y] = POSS;
			} // TODO add check radius
			else
			{
				tiles[x][y] = CLIFF;
			}
		}
	}
	if (isPassable(LZ.x, LZ.y))
	{
		tiles[LZ.x][LZ.y] = PLACE;
	}
	else
	{
		var naruto = [];
		tiles.forEach((Xs, x) =>
		{
			Xs.forEach((Ys,y) =>
			{
				if (isPassable(x, y))
				{
					let sq = {x: x, y:y};
					naruto.push(sq);
				}
			});
		});
		sortBymDist(naruto, LZ);
		const first = naruto.shift();
		tiles[first.x][first.y] = PLACE;
	}

	markAvailableTile(tiles);

	let LZtile = [];
	for (let x = LZ.x - LZ.radius; x <= LZ.x + LZ.radius; x++)
	{
		for (let y = LZ.y - LZ.radius; y <= LZ.y + LZ.radius; y++)
		{
			if (tiles[x][y] == PLACE)
			{
				LZtile.push({ x: x, y: y });
			}
		}
	}
	sortBymDist(LZtile, LZ);
	return LZtile;
}

function newWave()
{
	let {x, y, x2, y2} = getScrollLimits();
	let unitZone = {x:x+BORDER+LZRADIUS, y:y+BORDER+LZRADIUS, x2:x2-BORDER-LZRADIUS, y2:y2-BORDER-LZRADIUS};
	let structZone = {x:x, y:y, x2:x2, y2:y2};
	if ((y <= settings.expansion) && (numberWave % 4 == 0 || settings.expansionDirection == "north" )) //Final
	{
		y = 0;
		x = 0;
		x2 = mapWidth;
		y2 = mapHeight;

		giveResearch();
		const budget = calcBudget(getTotalTimeS());
		setPower (budget, AI);
		wave = {
			type: "FINAL",
			budget: budget.budget * settings.Kfinal,
			rang: budget.rang,
			experience: budget.experience,
			droids: [],
			unitZone: {x:LZRADIUS+BORDER, y:LZRADIUS+BORDER, x2:x2-LZRADIUS-BORDER, y2:y2-LZRADIUS-BORDER},
			active:true,
			time:0,
			droidsCount:0
		};
		setScrollLimits(x, y, x2, y2);
		console(_(`Commander, we've spotted a lot of transports.
Our air defense cannot stop them. Landings are observed throughout the sector.
THEY ARE IN THE TREES, JOHNNY! FUCKING HOOKES EVERYWHERE!`
		));
		return;
	}

	if (numberWave % 4 == 0 || settings.expansionDirection == "north")
	{
		unitZone.y = y-LZRADIUS;
		unitZone.y2 = y;
		structZone.y = y-settings.expansion;
		structZone.y2 = y-LZRADIUS*2;
		y -= settings.expansion;
	}
	if (numberWave % 4 == 1 && settings.expansionDirection == "all")
	{
		unitZone.x = x-LZRADIUS;
		unitZone.x2 = x;
		structZone.x = x-settings.expansion;
		structZone.x2 = x-LZRADIUS*2;
		x -= settings.expansion;
	}
	if (numberWave % 4 == 2 && settings.expansionDirection == "all")
	{
		unitZone.y = y2;
		unitZone.y2 = y2+LZRADIUS;
		structZone.y = y2+LZRADIUS*2;
		structZone.y2 = y2+settings.expansion;
		y2 += settings.expansion;
	}
	if (numberWave % 4 == 3 && settings.expansionDirection == "all")
	{
		unitZone.x = x2;
		unitZone.x2 = x2+LZRADIUS;
		structZone.x = x2+LZRADIUS*2;
		structZone.x2 = x2+settings.expansion;
		x2 += settings.expansion;
	}
	setScrollLimits(x, y, x2, y2);

	giveResearch();
	const budget = calcBudget(getTotalTimeS());
	wave = {
		type: "NORMAL",
		budget: budget.budget,
		structBudget: budget.budget * settings.multiplierForStructures,
		rang: budget.rang,
		experience: budget.experience,
		droids: [],
		unitZone: unitZone,
		structZone: structZone,
		active:true,
		time:0,
		droidsCount:0
	};
}

function calcBudget(timeS)
{
	const K = getNumOil() * settings.Kpower;
	// Игрок по мере игры получает апы на ген, что проиводит к росуту доступных ресурсов.
	// При первом приблежении вторая производная энергии по времени прямая с увеличением в два раза за 20 минут.
	// Используем два способа компенсиовать одновременно.
	// Первый: бюджет зависит от квадрата времени
	const A = K / (settings.doublePowerM * 60);
	const budget = Math.round(
		((K * timeS + A * timeS ** 2) / 2) * waveDifficulty
	);
	//Второй: опытом. При первом приближении юниты усиливаются +11% за каждый ранг.
	//Опыт ограничен 16 рангом, вероятно. По этому делаем что бы к концу юниты были максимально злые.
	const rang = Math.round((14 / (settings.totalGameTime * 60)) * timeS);
	return { budget: budget, rang: rang, experience: Math.round(2 ** rang) };
}

function getTemplates(timeS)
{
	const redComponents = getRedComponents(timeS);
	const redBody = getRedBody(timeS);

	let availableTemplates = [];
	for (const [id, template] of Object.entries(allTemplates))
	{
		if (
			template.weapons &&
			template.weapons.length > 0 &&
			!settings.disablePropulsions.includes(template.propulsion) &&
			!settings.disableWeapons.includes(template.weapons[0]) &&
			!redComponents.includes(template.weapons[0]) &&
			!redBody.includes(template.body) &&
			makeTemplate(AI, id, template.body, template.propulsion, "", ...template.weapons) //у makeTemplate изменен синтаксис в мастере. Не совместимо с 3.4.1
		)
		{
			availableTemplates.push(id);
		}
	}
	return availableTemplates;
}

function pushUnits()
{
	const availableUnits = getTemplates(getTotalTimeS());
	let tiles = Object.assign([], wave.LZ.tiles);

	hackNetOff();
	while (wave.budget > 0 && tiles.length > 0)
	{
		let droidName = availableUnits[syncRandom(availableUnits.length)];
		let pos = tiles.shift();
		if (allTemplates[droidName].propulsion == "V-Tol")
		{
			let {x, y, x2, y2} = getScrollLimits();
			[x, y, x2, y2] = [x+BORDER, y+BORDER, x2-BORDER, y2-BORDER];

			let borders = [
				{ x: x, y: pos.y },
				{ x: pos.x, y: y },
				{ x: x2, y: pos.y },
				{ x: pos.x, y: y2 },
			];
			sortBymDist(borders, pos);
			pos = borders.shift();
		}
		let unit = addDroid(
			AI,
			pos.x,
			pos.y,
			droidName,
			allTemplates[droidName].body,
			allTemplates[droidName].propulsion,
			"",
			"",
			...allTemplates[droidName].weapons
		);
		if (settings.enableExperience)
		{
			setDroidExperience(unit, wave.experience);
		}
		wave.budget -= makeTemplate(
			AI,
			droidName,
			allTemplates[droidName].body,
			allTemplates[droidName].propulsion,
			"",
			...allTemplates[droidName].weapons
		).power;
		wave.droids.push(unit);
		wave.droidsCount++;
	}
	hackNetOn();
	if (wave.budget <= 0)
	{
		numberWave++;
		const str = [_("Wave number "), numberWave, ". ", _("Units landed: "), wave.droidsCount, "."].join("");
		debug(str);
		console(str);
		setMissionTime(-1);
	}
	playSound("pcv395.ogg", wave.LZ.x, wave.LZ.y, 0);
}

function getStructs(timeS)
{
	const redComponents = getRedComponents(timeS);

	let availableStructs = [];
	for (const [id, struct] of Object.entries(allStructs))
	{
		if (!settings.structs.includes(struct.type))
		{
			continue;
		}
		if (!isStructureAvailable(id, AI))
		{
			continue;
		}
		if (struct.weapons && redComponents.includes(struct.weapons[0]))
		{
			continue;
		}
		availableStructs.push(id);
	}
	return availableStructs;
}

function getStructTiles()
{
	const {x, y, x2, y2} = wave.structZone;

	let availableTiles = [];
	for (let X = x; X < x2; X++)
	{
		for (let Y = y; Y < y2; Y++)
		{
			if (terrainType(X, Y) == TER_CLIFFFACE)
			{
				continue;
			}
			if (settings.waterStructure == false && terrainType(X, Y) == TER_WATER)
			{
				continue;
			}
			if (getObject(X, Y))
			{
				continue;
			}
			availableTiles.push([X, Y]);
		}
	}
	return availableTiles;
}

function pushStructs()
{
	let availableStructs = getStructs(getTotalTimeS());
	let availableTiles = getStructTiles();

	shuffle(availableTiles);

	while (wave.structBudget > 0 && availableTiles.length > 0 && availableStructs.length > 0)
	{
		const [x, y] = availableTiles.pop();
		const i = syncRandom(availableStructs.length);
		const key = availableStructs[i];

		if (enumStruct(AI, key).length >= getStructureLimit(key, AI))
		{
			availableStructs.splice(i, 1); // remove
			continue;
		}

		hackNetOff();
		addStructure(key, AI, x*128, y*128);
		hackNetOn();
		wave.structBudget -= allStructs[key].buildPower;
	}
}


