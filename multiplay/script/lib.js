function dist(a,b)
{
	if (!(a.x && b.x && a.y && b.y)) {return Infinity;}
	return ((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
}

function mDist(a,b)
{
	if (!(a.x && b.x && a.y && b.y)) {return Infinity;}
	return (Math.abs(a.x-b.x)+Math.abs(a.y-b.y));
}

function cosPhy(pos, target1, target2)
{
	let a = {x: target1.x-pos.x, y:target1.y-pos.y};
	let b = {x: target2.x-pos.x, y:target2.y-pos.y};
	return (a.x*b.x+a.y*b.y)*Math.abs(a.x*b.x+a.y*b.y)/((a.x**2+a.y**2)*(b.x**2+b.y**2));
}

function sortBymDist(list, pos)
{
	const sorter = (a, b) => mDist (a, pos) -  mDist (b, pos);
	return list.sort(sorter);
}

function sortByDist(list, pos)
{
	const sorter = (a, b) => dist (a, pos) -  dist (b, pos);
	return list.sort(sorter);
}

function getRandom(arr, n)
{
	let len = arr.length;
	if (!n) {return arr[Math.floor(Math.random() * len)];}
	let result = [];
	while (n--)
	{
		let i = Math.floor(Math.random() * len);
		result.push(arr[i]);
	}
	return result;
}

function getTotalTimeS()
{
	if (((gameTime / 1000) + getStartTime()) >= settings.timeHandicapM*60)
	{
		return ((gameTime / 1000) + getStartTime() - settings.timeHandicapM*60);
	}
	else
	{
		return ((gameTime / 1000) + getStartTime());
	}
}

function getStartTime()
{

	var startTime = 1;
	var techLevel = getMultiTechLevel();
	if (baseType == CAMP_BASE)
	{
		startTime = timeBaseTech;
	}
	if (baseType == CAMP_WALLS)
	{
		startTime = timeAdvancedBaseTech;
	}
	if (techLevel == 2)
	{
		startTime = timeT2;
	}
	if (techLevel == 3)
	{
		startTime = timeT3;
	}
	if (techLevel == 4)
	{
		startTime = 100 * 60;
	}
	return startTime;
}

function getNumOil()
{
	const limits =  getScrollLimits();
	numOil = enumFeature(ALL_PLAYERS).filter(function (e)
	{
		if (e.stattype == OIL_RESOURCE && inScrollLimits(e,limits)) {return true;}
		return false;
	}).length;
	numOil += enumStruct(scavengerPlayer, RESOURCE_EXTRACTOR).length;
	for (let playnum = 0; playnum < maxPlayers; playnum++)
	{
		numOil += enumStruct(playnum, RESOURCE_EXTRACTOR).length;
	}
	return numOil;
}

function inScrollLimits(obj,limits)
{
	if (obj.x > limits.x+BORDER && obj.x < limits.x2-BORDER && obj.y > limits.y+BORDER && obj.y < limits.y2-BORDER)
	{
		return true;
	}
	return false;
}

function shuffle(array)
{
	for (let i = array.length - 1; i > 0; i--)
	{
		const j = syncRandom(i);
		[array[i], array[j]] = [array[j], array[i]];
	}
}

// Snap (x, y) to the nearest border
// Optional margin offset (e.g. 2 tiles inwards, -3 tiles outward)
function onBorder(x, y, margin = 0)
{
	const { x: x1, y: y1, x2, y2 } = getScrollLimits();

	// Distances to each border
	const distLeft   = Math.abs(x - x1);
	const distRight  = Math.abs(x2 - x);
	const distTop    = Math.abs(y - y1);
	const distBottom = Math.abs(y2 - y);

	const minDist = Math.min(distLeft, distRight, distTop, distBottom);

	if (minDist === distLeft)
	{
		x = x1 + margin;
	}
	else if (minDist === distRight)
	{
		x = x2 - margin;
	}
	else if (minDist === distTop)
	{
		y = y1 + margin;
	}
	else
	{ // bottom
		y = y2 - margin;
	}

	return {
		x: Math.max(0, Math.min(mapWidth - 1, x)),
		y: Math.max(0, Math.min(mapHeight - 1, y)),
	};
}

function BFS(sx, sy, max_count, shape, can_visit, visit, stop)
{
	const Cardinals = [[0, 1], [1, 0], [0, -1], [-1, 0]];
	const Ordinals = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
	const seen = new Set();
	const queue = [[sx, sy]];
	function addToQueue(x, y)
	{
		if (!seen.has(`${x},${y}`)) {
			seen.add(`${x},${y}`);
			queue.push([x, y]);
		}
	}

	let visit_count = 0;
	while (queue.length > 0 && visit_count < max_count && !stop())
	{
		const [x, y] = queue.shift();
		if (can_visit(x, y))
		{
			visit(x, y);
			visit_count++;
			for (const [dx, dy] of Cardinals)
			{
				addToQueue(x+dx, y+dy);
			}
			for (const [dx, dy] of Ordinals)
			{
				if (syncRandom(100) < shape)
				{
					addToQueue(x+dx, y+dy);
				}
			}
		}
	}
	return visit_count;
}
