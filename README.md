[Русский/Russian](README.ru.md)

[Français/French](README.fr.md)

# Wave Defense MOD

Mod changes skirmish mode to wave protection mode. Supports multiplayer.
The mod is compatible with Warzone2100 version 4.6.1. Older versions of the game are not supported.

You start in the South frontier of the map. You only have a tiny stip of land available, everything else
is blocked (but will be revealed as you go). You have 4 minutes to prepare for the first attack.
When the timer goes off, the map grows by 10 tiles, and the enemy reinforcements arrive immediately.
Once you clean up the map, the timer starts again, but now you will only have 2 minutes to prepare, and so on.

In order to win, you have to survive untill the whole map is revealed.

## Good to know

- Enemy waves are always technologically ahead of you. Theoretically, you could research as fast as your enemy, but practically your units will always lag behind.
- Number of enemies per wave grows quadratically with time, and linearly with number of oil wells on the map.
- Enemy does have VTOL.
- Structure limits depend on number of oil wells on the map, and increases with each wave.
- Structure limits do not depend on number of players.
- You can't save/load.

## How to launch

- Pack catalog `multiplay` into a zip archive and put them in `autoload`.
- Put the maps `10c-Stone-Jungle-v3w.wz` in the catalog `maps` 
- Add one `waveAI` to the last slot. AI difficulty level will affect the number of enemy units.
- Only the host needs to enable the mod.

## Settings and maps
### Choosing a map
You can use any map, but `10c-Stone-Jungle-v3w.wz` is recommended.
Another mode is supported, when the map is expanding to North, for that
you can use the map `10c-ntw_trail10pro2.wz` which is provided. Replace
`multiplay/script/rules/settings.json` with   `multiplay/script/rules/settings.json_ntw_trail10pro2.` to use it.


When choosing another map:
- must not contain any isolated areas, units may be stuck inside them
- must not contain large, sharp cliffs
- in the center (or in the south, with one-side expansion) must be an area suitable for your own base building. Spawn points don't depend on location of your HQ.

### Configuration
By default, the mod will use:
- `multiplay/script/rules/settings.json`
- `multiplay/script/rules/research.json`
- `multiplay/script/rules/structure.json`
- `multiplay/script/rules/startingComponents.json`
- `multiplay/script/rules/componentWeights.json`
- `multiplay/script/rules/redundantComponents.json`
or, if present:
- `multiplay/script/rules/<MapName>/settings.json`
- `multiplay/script/rules/<MapName>/research.json`
- `multiplay/script/rules/<MapName>/structure.json`
- `multiplay/script/rules/<MapName>/startingComponents.json`
- `multiplay/script/rules/<MapName>/componentWeights.json`
- `multiplay/script/rules/<MapName>/redundantComponents.json`

Explanation for `settings.json`:
```
{
	"totalGameTime": 90,  # time in minutes until enemies reach the rank 16
	"protectTimeM": 3,    # minutes until the first wave
	"pauseM": 0.8,        # delay in minutes between waves
	"inWavePauseS": 7,    # delay between landings within the same wave
	"INCREM_PAUSEM": 0.1, # each wave, increase the delay between waves in minutes
	"timeHandicapM": 2,   # slight lag in research for AI
	"RESIDUAL": 0.03,     # a wave is considered defeated when only 3% of units remain
                                     
	"startHeight": 50,             # initial map height/radius
	"expansionDirection": "all",   # expansion direction (north/east/south/west/all)
	"expansionAmount": 24,         # tile growth after each wave
	"transporterUnitCount": 45,    # number of units that land from each transporter
	"transporterExperience": 9999, # give rank to the transporters (harder to kill)
                                  
	"Kpower": 0.15,        # linear wave growth factor, depends on time
	"doublePowerM": 120,   # quadratic wave growth factor, depends on time
	"startPowerC": 0,      # constant extra power
	"Kfinal": 3,           # final wave power multiplier
	"structPower": {       # allowed structure types
		"DEFENSE": 0.01,   # amount of DEFENSE structures
		"REARM PAD": 0.001 # amount of REARM PAD structures
	},                             
                          
	"waterLanding": false,            # units can land in water
	"waterStructure": false,          # structures can appear on water
	"enableWaveExperience": true,     # rank of enemy units increase over time
	"waveExperienceModifier": null,   # how fast enemy units gain experience (null = default)
	"playerExperienceModifier": null, # how fast your units gain experience (null = default)
	"playersManipulation": true       # change the player's base and limits
}
```
Explanation for `componentWeights.json`:
```
{
	"Rocket-Sunburst": 40,     # 60% less
	"EMP-Cannon": 50,          # 50% less
	"CyborgLegs": 100,         # default
	"V-Tol": 0,                # disable
	"Rocket-VTOL-Sunburst": 0, # disable
	"RailGun1Mk1": 300,        # 300% more
	"RailGun2Mk1": 300,        # 350% more
	"TransporterBody": 0,      # disable
	"SuperTransportBody": 0,   # disable
	"CommandTurret1": 0        # disable
}
```
Explanation for `redundantComponents.json`:
```
{
	"R-Vehicle-Prop-Halftracks": [
		"wheeled01"                # Stop using wheels after Half-Track is researched
	],
	"R-Wpn-Howitzer-Incendiary": [
		"Mortar-Incendiary"        # Stop using Incendiary Mortar after research Incendiary Howitzer
	],
	"R-Vehicle-Body11": [
		"Body1REC"                 # Stop using Viper after Python is researched
	]
}
```
Explanation for `startingComponents.json`:
```
[
	"B2JeepBody",
	"BusBody",    # Make components available to the Wave AI at start
	"BaBaMG"     
]
```

## Tricks & hints
- Enemies don't make any difference between a structure or a droid. You could use cheap structures to distract them, and get some time
- Enemy's droid templates do vary with time, but do not depend on your templates. Try to find more effective propulsion/body combinations.
- Enemy doesn't have Sensors units, but has artillery and sensor towers.
- In about an hour of game, number of enemies will start growing huge. You should try to win before that time mark.
- You can delay next landing by leaving some enemy units alive for some time. This doesn't include VTOL, AA guns, and fortifications.
- Don't forget to add more structures, as your limits increase.
- About a half of enemy units will have fragile propulsion, so use heavy artillery to your advantage.
