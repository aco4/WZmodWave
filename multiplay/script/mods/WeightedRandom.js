// const randomColor = new WeightedRandom({
//     "Orange": 4,
//     "Yellow": 5,
//     "Purple": 12
// });
//
// const color1 = randomColor.get();
// const color2 = randomColor.get();
// const color3 = randomColor.get();

class WeightedRandom
{
	static cache = {};

	constructor(weights)
	{
		const keys = Object.keys(weights);
		const hash = keys.length + ":" + keys.sort().join(",");
		if (!WeightedRandom.cache[hash])
		{
			// Precompute total sum
			let totalWeight = 0;

			// Create an array of cumulative thresholds and keys
			const thresholds = [];
			const keys = [];

			for (const key in weights)
			{
				totalWeight += weights[key];
				thresholds.push(totalWeight);
				keys.push(key);
			}

			// Return a closure that can be called repeatedly
			WeightedRandom.cache[hash] = function ()
			{
				if (totalWeight <= 0)
				{
					return null;
				}

				const rand = syncRandom(totalWeight); // [0, totalWeight)

				for (let i = 0; i < thresholds.length; i++)
				{
					if (rand < thresholds[i])
					{
						return keys[i];
					}
				}

				throw new Error("Impossible");
			};
		}
		this.get = WeightedRandom.cache[hash];
	}
}
