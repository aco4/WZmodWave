// Scroll limit manipulation
class Scrim
{
	static get x1() {
		const { x, y, x2, y2 } = getScrollLimits();
		return x;
	}
	static get y1() {
		const { x, y, x2, y2 } = getScrollLimits();
		return y;
	}
	static get x2() {
		const { x, y, x2, y2 } = getScrollLimits();
		return x2;
	}
	static get y2() {
		const { x, y, x2, y2 } = getScrollLimits();
		return y2;
	}

	/**
	 * @returns {object}
	 */
	static get()
	{
		const { x, y, x2, y2 } = getScrollLimits();
		return {
			x1: x,
			y1: y,
			x2: x2,
			y2: y2
		};
	}

	/**
	 * @returns {object}
	 */
	static getDroidZone()
	{
		const { x, y, x2, y2 } = getScrollLimits();
		return {
			x1: x + 1,
			y1: y + 1,
			x2: x2 - 2,
			y2: y2 - 2
		};
	}

	/**
	 * @returns {object}
	 */
	static getStructZone()
	{
		const { x, y, x2, y2 } = getScrollLimits();
		return {
			x1: x + 3,
			y1: y + 3,
			x2: x2 - 4,
			y2: y2 - 4
		};
	}

	/**
	 * @returns {boolean} true on success, false on failure
	 */
	static set ({ x1, y1, x2, y2 } = {})
	{
		if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined)
		{
			return false;
		}

		x1 = Math.max(x1, 0);
		y1 = Math.max(y1, 0);
		x2 = Math.min(x2, mapWidth);
		y2 = Math.min(y2, mapHeight);

		if (x1 > x2)
		{
			[x1, x2] = [x2, x1];
		}

		if (y1 > y2)
		{
			[y1, y2] = [y2, y1];
		}

		setScrollLimits(x1, y1, x2, y2);
		return true;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} type - optional. default DROID
	 * @returns {boolean}
	 */
	static isInside(x, y, type = DROID)
	{
		const { x1, y1, x2, y2 } = Scrim.get();

		if (type == DROID)
		{
			return x > x1
				&& y > y1
				&& x < x2 - 1
				&& y < y2 - 1;
		}

		// STRUCTURE, FEATURE
		return x > x1 + 2
			&& y > y1 + 2
			&& x < x2 - 3
			&& y < y2 - 3;
	}

	/**
	 * @param {object}
	 * @returns {boolean}
	 */
	static isObjectInside(object)
	{
		if (!object)
		{
			return false;
		}

		return Scrim.isInside(x, y, object.type);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} type - optional. default DROID
	 * @returns {boolean}
	 */
	static isOutside(x, y, type = DROID)
	{
		return !Scrim.isInside(x, y, type);
	}

	/**
	 * @param {object}
	 * @returns {boolean}
	 */
	static isObjectOutside(object)
	{
		return !Scrim.isObjectInside(object);
	}

	static grow({ x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = {})
	{
		const { x1: X1, y1: Y1, x2: X2, y2: Y2 } = Scrim.get();
		return Scrim.set({
			x1: X1 + x1,
			y1: Y1 + y1,
			x2: X2 + x2,
			y2: Y2 + y2
		});
	}
	static shrink({ x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = {})
	{
		const { x1: X1, y1: Y1, x2: X2, y2: Y2 } = Scrim.get();
		return Scrim.set({
			x1: X1 - x1,
			y1: Y1 - y1,
			x2: X2 - x2,
			y2: Y2 - y2
		});
	}
	static growAll(n)
	{
		return Scrim.grow({
			x1: n,
			y1: n,
			x2: n,
			y2: n
		})
	}
	static shrinkAll(n)
	{
		return Scrim.shrink({
			x1: n,
			y1: n,
			x2: n,
			y2: n
		})
	}
	static growNorth(n = 1)
	{
		return Scrim.grow({ y1: -n });
	}
	static growEast(n = 1)
	{
		return Scrim.grow({ x2: n });
	}
	static growSouth(n = 1)
	{
		return Scrim.grow({ y2: n });
	}
	static growWest(n = 1)
	{
		return Scrim.grow({ x1: -n });
	}
	static shrinkNorth(n = 1)
	{
		return Scrim.grow({ y1: n });
	}
	static shrinkEast(n = 1)
	{
		return Scrim.grow({ x2: -n });
	}
	static shrinkSouth(n = 1)
	{
		return Scrim.grow({ y2: -n });
	}
	static shrinkWest(n = 1)
	{
		return Scrim.grow({ x1: n });
	}
	static growDirection(direction, n)
	{
		switch (direction.toUpperCase())
		{
			case "NORTH": return Scrim.growNorth(n);
			case "EAST" : return Scrim.growEast(n);
			case "SOUTH": return Scrim.growSouth(n);
			case "WEST" : return Scrim.growWest(n);
		}
	}
	static shrinkDirection(direction, n)
	{
		switch (direction.toUpperCase())
		{
			case "NORTH": return Scrim.shrinkNorth(n);
			case "EAST" : return Scrim.shrinkEast(n);
			case "SOUTH": return Scrim.shrinkSouth(n);
			case "WEST" : return Scrim.shrinkWest(n);
		}
	}
}
