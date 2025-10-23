class Scrim {
    static get() {
        const { x: x1, y: y1, x2, y2 } = getScrollLimits();
        return { x1, y1, x2, y2 };
    }
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
    static get mapArea() {
        return { x1: 0, y1: 0, x2: mapWidth, y2: mapHeight };
    }
    static get droidArea() {
        const { x, y, x2, y2 } = getScrollLimits();
        return { x1: x + 1, y1: y + 1, x2: x2 - 1, y2: y2 - 1 };
    }
    static get structArea() {
        const { x, y, x2, y2 } = getScrollLimits();
        return { x1: x + 3, y1: y + 3, x2: x2 - 3, y2: y2 - 3 };
    }
    static get scrollArea() {
        return Scrim.get();
    }
    static getArea(type) {
        switch (type?.toLowerCase()) {
            case "map"    : return Scrim.mapArea;
            case "droid"  : return Scrim.droidArea;
            case "struct" : return Scrim.structArea;
            default       : return Scrim.scrollArea;
        }
    }
    static iterate(area) {
        const x1 = area?.x1;
        const y1 = area?.y1;
        const x2 = area?.x2;
        const y2 = area?.y2;
        return {
            *[Symbol.iterator]() {
                for (let x = x1; x < x2; x++) {
                    for (let y = y1; y < y2; y++) {
                        yield { x, y };
                    }
                }
            }
        };
    }
    static contains(x, y, type) {
        if (x == null || y == null) {
            return false;
        }
        const { x1, y1, x2, y2 } = Scrim.getArea(type);
        return x >= x1
            && y >= y1
            && x < x2
            && y < y2;
    }
    static containsObject(obj, type) {
        return Scrim.contains(obj?.x, obj?.y, type);
    }
    // snap to nearest border with optional margin offset (2 tiles in, -3 tiles out)
    // result x, y will satisfy Scrim.contains() assuming margin = 0
    static snap(x, y, border, type, margin = 0) {
        const { x1, y1, x2, y2 } = Scrim.getArea(type);
        const B = border.toUpperCase();
        if (["N", "NORTH", "TOP", "UP", "Y1"].includes(B)) {
            return Scrim.clamp(x, y1 + margin, "map");
        } else if (["E", "EAST", "RIGHT", "X2"].includes(B)) {
            return Scrim.clamp(x2 - 1 - margin, y, "map");
        } else if (["S", "SOUTH", "DOWN", "Y2"].includes(B)) {
            return Scrim.clamp(x, y2 - 1 - margin, "map");
        } else if (["W", "WEST", "LEFT", "X1"].includes(B)) {
            return Scrim.clamp(x1 + margin, y, "map");
        } else {
            return Scrim.snap(x, y, Scrim.nearestBorder(x, y, type), type);
        }
    }
    static snapObject(obj, border, type, margin = 0) {
        return Scrim.snap(obj?.x, obj?.y, border, type, margin);
    }
    static nearestBorder(x, y, type) {
        const { x1, y1, x2, y2 } = Scrim.getArea(type);
        const distWest  = Math.abs(x - x1);
        const distEast  = Math.abs(x2 - x);
        const distNorth = Math.abs(y - y1);
        const distSouth = Math.abs(y2 - y);
        const minDist = Math.min(distWest, distEast, distNorth, distSouth);
        if (minDist === distWest) {
            return "west";
        } else if (minDist === distEast) {
            return "east";
        } else if (minDist === distNorth) {
            return "north";
        } else {
            return "south";
        }
    }
    // result x, y will satisfy Scrim.contains()
    static clamp(x, y, type) {
        const { x1, y1, x2, y2 } = Scrim.getArea(type);
        return {
            x: Math.max(x1, Math.min(x2 - 1, x)),
            y: Math.max(y1, Math.min(y2 - 1, y)),
        };
    }
    static get isMax() {
        const { x, y, x2, y2 } = getScrollLimits();
        return x == 0 && y == 0 && x2 == mapWidth && y2 == mapHeight;
    }

////////////////////////////////////////////////////////////////////////////////

    static validate({ x1 = 0, y1 = 0, x2 = mapWidth, y2 = mapHeight } = {}) {
        x1 ??= 0;
        y1 ??= 0;
        x2 ??= mapWidth;
        y2 ??= mapHeight;

        if (x1 > x2) {
            [x1, x2] = [x2, x1];
        }
        if (y1 > y2) {
            [y1, y2] = [y2, y1];
        }

        x1 = Math.max(x1, 0);
        y1 = Math.max(y1, 0);
        x2 = Math.min(x2, mapWidth);
        y2 = Math.min(y2, mapHeight);

        return { x1, y1, x2, y2 };
    }

    static set(values) {
        const { x1, y1, x2, y2 } = Scrim.validate(values);
        setScrollLimits(x1, y1, x2, y2);
        return { x1, y1, x2, y2 };
    }

    static grow({ x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = {}) {
        const { x1: X1, y1: Y1, x2: X2, y2: Y2 } = Scrim.get();
        return Scrim.set({
            x1: X1 + x1,
            y1: Y1 + y1,
            x2: X2 + x2,
            y2: Y2 + y2
        });
    }
    static shrink({ x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = {}) {
        const { x1: X1, y1: Y1, x2: X2, y2: Y2 } = Scrim.get();
        return Scrim.set({
            x1: X1 - x1,
            y1: Y1 - y1,
            x2: X2 - x2,
            y2: Y2 - y2
        });
    }

    static growAll(n) {
        return Scrim.grow({ x1: n, y1: n, x2: n, y2: n });
    }
    static shrinkAll(n) {
        return Scrim.shrink({ x1: n, y1: n, x2: n, y2: n });
    }

    static growWest(n = 1)    { return Scrim.grow({ x1: -n }); }
    static growNorth(n = 1)   { return Scrim.grow({ y1: -n }); }
    static growEast(n = 1)    { return Scrim.grow({ x2:  n }); }
    static growSouth(n = 1)   { return Scrim.grow({ y2:  n }); }
    static growDirection(direction, n) {
        switch (direction.toUpperCase()) {
            case "NORTH": return Scrim.growNorth(n);
            case "EAST" : return Scrim.growEast(n);
            case "SOUTH": return Scrim.growSouth(n);
            case "WEST" : return Scrim.growWest(n);
        }
    }

    static shrinkWest(n = 1)  { return Scrim.grow({ x1:  n }); }
    static shrinkNorth(n = 1) { return Scrim.grow({ y1:  n }); }
    static shrinkEast(n = 1)  { return Scrim.grow({ x2: -n }); }
    static shrinkSouth(n = 1) { return Scrim.grow({ y2: -n }); }
    static shrinkDirection(direction, n) {
        switch (direction.toUpperCase()) {
            case "NORTH": return Scrim.shrinkNorth(n);
            case "EAST" : return Scrim.shrinkEast(n);
            case "SOUTH": return Scrim.shrinkSouth(n);
            case "WEST" : return Scrim.shrinkWest(n);
        }
    }
}
