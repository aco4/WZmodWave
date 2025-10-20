namespace("wa_");

let currentWave = null;
let readyForNextWave = false;

function wa_eventGameInit()
{
	if (settings.expansionDirection == "all")
	{
		const {x, y, x2, y2} = {
			x  : (mapWidth - settings.startHeight) / 2,
			y  : (mapHeight - settings.startHeight) / 2,
			x2 : (mapWidth + settings.startHeight) / 2,
			y2 : (mapHeight + settings.startHeight) / 2
		};
		setScrollLimits(x, y, x2, y2);
	}
	if (settings.expansionDirection == "north")
	{
		const {x, y, x2, y2} = {
			x  : 0,
			y  : (mapHeight-settings.startHeight),
			x2 : mapWidth,
			y2 : mapHeight
		};
		setScrollLimits(x, y, x2, y2);
	}
	const salutation = [
		"Mod from Vaut. Repository: https://github.com/vaut/WZmodWave",
		"Explore the Theta sector and destroy the enemy forces.",
		"We're counting on you Commander.",
		"You have no right to make a mistake, loading and saving are not possible.",
		"difficulty " + Math.round(Wave.difficulty * 100) +"%",
	].join("\n");
	console(salutation);
	debug(salutation);

	giveStartingComponents(Wave.AI);

	if (settings.waveExperienceModifier != null)
	{
		setExperienceModifier(Wave.AI, settings.waveExperienceModifier);
	}
	if (settings.playerExperienceModifier != null)
	{
		for (let player = 0; player < maxPlayers; player++)
		{
			if (player != Wave.AI)
			{
				setExperienceModifier(player, settings.playerExperienceModifier);
			}
		}
	}

	setTimer("removeVtol", 6 * 1000);
	setMissionTime(settings.protectTimeM * 60);
	queue("scheduler", settings.protectTimeM * 60 * 1000); // пропускаем стартовые минуты
}

function scheduler()
{
	// первая высадка в волне
	if (!currentWave)
	{
		currentWave = new Wave();
		Wave.number++;
		Dropship.play("Enemy transport detected");
		console(" ");
		console(_("Wave") + " " + Wave.number);
		console(
			currentWave.totalTransportCount + " " +
			(currentWave.totalTransportCount > 1 ? _("incoming enemy transports") : _("incoming enemy transport")) +
			" (" + currentWave.totalDroidCount + " " + _("units") + ")"
		);
		console(" ");
		if (currentWave.isFinal)
		{
			console(_(`Commander, we've spotted a lot of transports.
Our air defense cannot stop them. Landings are observed throughout the sector.
THEY ARE IN THE TREES, JOHNNY! FUCKING HOOKES EVERYWHERE!`
			));
		}
	}

	// следующая высадка в волне
	if (currentWave.isSendingTransports)
	{
		currentWave.sendTransport();
		queue("scheduler", settings.inWavePauseS * 1000);
		return;
	}

	if (currentWave.isDoneLanding && !readyForNextWave) {
		readyForNextWave = true;
		// console(" ");
		// console(currentWave.unitsLandedCount + " " + _("units landed") + ".");
		// console(" ");
	}

	// отразили волну
	if (readyForNextWave && currentWave.isMostlyDefeated && currentWave.isNotFinal)
	{
		const secondsUntilNextWave = (settings.pauseM + settings.INCREM_PAUSEM * Wave.number) * 60;
		if (secondsUntilNextWave > 30)
		{
			setMissionTime(secondsUntilNextWave);
		}
		currentWave = null;
		readyForNextWave = false;
		queue("scheduler", secondsUntilNextWave * 1000);
		return;
	}

	// заглушка на случай отсутсвия действия
	queue("scheduler", 3*1000);
}

function removeVtol()
{
	if (enumStruct(Wave.AI, REARM_PAD).length <= 0)
	{
		enumDroid(Wave.AI, "DROID_WEAPON")
			.filter(d => d.isVTOL && d.weapons[0].armed <= 1)
			.forEach(v => removeObject(v));
	}
}
