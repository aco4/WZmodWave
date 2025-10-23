namespace("dropship_");

function dropship_eventStartLevel() {
    setTimer("updateDropships", 1 * 1000);
}

function updateDropships() {
    Dropship.tick();
}


////////////////////////////////////////////////////////////////////////////////


class Dropship {

    static dropships = new Set();

    static tick() {
        Dropship.dropships.forEach(d => d.update());
    }

    constructor(player = selectedPlayer, x = 0, y = 0, args = {}) {
        Object.assign(this, {
            cyborgTransport: false,
            turret: "MG1-VTOL",
            objectives: [],
            onDeath: () => {},
            onMissionComplete: () => {},
            experience: 0,

            // Override the properties above ^
            ...args,

            // Cannot override
            curr    : 0,    // Current objective (current index in objectives)
            droidID : null,
        });

        hackNetOff();
        const body = this.cyborgTransport ? "TransporterBody" : "SuperTransportBody";
        const droid = addDroid(player, x, y, "Dropship", body, "V-Tol", "", "", [this.turret]);
        setDroidExperience(droid, this.experience);
        hackNetOn();

        this.droidID = droid?.id;
        Dropship.dropships.add(this);
    }

    // Main update routine
    update() {
        if (this.dead) {
            this.onDeath(this);
            Dropship.dropships.delete(this);
            return;
        }
        if (this.currentObjective.isComplete(this)) {
            this.completeObjective();
        } else {
            this.gotoObjective();
        }
    }

    completeObjective() {
        this.currentObjective.onComplete(this);
        this.curr++;

        if (this.isMissionComplete) {
            this.onMissionComplete(this);
            Dropship.dropships.delete(this);
        } else {
            this.gotoObjective();
        }
    }

    gotoObjective() {
        if (this.currentObjective.getLocation) {
            const { x, y } = this.currentObjective.getLocation(this);
            this.move(x, y);
        }
    }

    move(x, y) {
        x = Math.max(1, Math.min(mapWidth - 1, x));
        y = Math.max(1, Math.min(mapHeight - 1, y));
        hackNetOff();
        orderDroidLoc(this.droid, DORDER_MOVE, x, y); // TODO fails if object is occupying the tile
        hackNetOn();
    }

    kill() {
        hackNetOff();
        removeObject(this.droid, true); // sfx
        hackNetOn();
    }

    despawn() {
        hackNetOff();
        removeObject(this.droid, false); // no sfx
        hackNetOn();
    }

    stop() {
        hackNetOff();
        orderDroid(this.droid, DORDER_STOP);
        hackNetOn();
    }

    isAt(x, y, margin = 1) {
        const objects = enumArea(
            x - margin, y - margin,
            x + margin, y + margin,
            ALL_PLAYERS,
            false
        );
        return objects.some(o => o.id === this.droidID);
    }

    isInside() {
        const { x, y, x2, y2 } = getScrollLimits();
        return this.x > x
            && this.y > y
            && this.x < x2 - 1
            && this.y < y2 - 1;
    }

    isOutside(margin = 1) {
        const { x, y, x2, y2 } = getScrollLimits();
        return this.x <= x + margin
            || this.y <= y + margin
            || this.x >= x2 - 1 - margin
            || this.y >= y2 - 1 - margin;
    }

    get isMissionComplete() {
        return this.curr >= this.objectives.length;
    }
    get currentObjective() {
        return this.objectives[this.curr];
    }
    // Get an updated reference to the droid
    get droid() {
        for (let player = 0; player < maxPlayers; player++) {
            const droid = getObject(DROID, player, this.droidID);
            if (droid) {
                return droid;
            }
        }
        return null;
    }
    get alive() {
        return this.droid != null;
    }
    get dead() {
        return this.droid == null;
    }
    get x() {
        return this.droid?.x;
    }
    get y() {
        return this.droid?.y;
    }
    get player() {
        return this.droid?.player;
    }

    static play(sound, player = null) {
        const SOUNDS = {
            "LZ clear"                        : () => playSound("lz-clear.ogg"),
            "Enemy transport detected"        : () => playSound("pcv381.ogg"),
            "Incoming enemy transport"        : () => playSound("pcv395.ogg"),
            "Enemy landing zone"              : () => playSound("pcv396.ogg"),
            "Reinforcements are available"    : () => playSound("pcv440.ogg"),
            "Reinforcements in transit"       : () => playSound("pcv441.ogg"),
            "Reinforcements landing"          : () => playSound("pcv442.ogg"),
            "Transport under attack"          : () => playSound("pcv443.ogg"),
            "Transport repairing"             : () => playSound("pcv444.ogg"),
            "LZ compromised"                  : () => playSound("pcv445.ogg"),
            "Transport returning to base"     : () => playSound("pcv446.ogg"),
            "Transport unable to land"        : () => playSound("pcv447.ogg"),
        };
        if (player === null || player === me) {
            SOUNDS[sound]?.();
        }
    }

    /**
     * Snap (x, y) to the nearest border.
     *
     * @param {Object} [options={}] - named parameters
     * @param {number} [options.x=0]
     * @param {number} [options.y=0]
     * @param {number} [options.margin=0] - Optional margin offset (e.g. 2 tiles inwards, -3 tiles outward)
     * @param {?string} [options.border=null] - Optional border ("LEFT", "RIGHT", "TOP", "BOTTOM")
     * @returns {Object} x, y
     */
    static snap({ x = 0, y = 0, margin = 0, border = null } = {}) {
        const { x: x1, y: y1, x2, y2 } = getScrollLimits();

        if (border != null) {
            const B = border.toUpperCase();
            if (B == "LEFT" || B == "WEST") {
                return { x: Math.max(1, x1 + 1 + margin), y: y };
            }
            if (B == "RIGHT" || B == "EAST") {
                return { x: Math.min(mapWidth - 1, mapWidth - 1 - margin), y: y };
            }
            if (B == "TOP" || B == "NORTH") {
                return { x: x, y: Math.max(1, y1 + 1 + margin) };
            }
            if (B == "BOTTOM" || B == "SOUTH") {
                return { x: x, y: Math.min(mapHeight - 1, mapHeight - 1 - margin) };
            }
        }

        // Distances to each border
        const distLeft   = Math.abs(x - x1);
        const distRight  = Math.abs(x2 - x);
        const distTop    = Math.abs(y - y1);
        const distBottom = Math.abs(y2 - y);

        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        if (minDist === distLeft) {
            x = x1 + margin;
        } else if (minDist === distRight) {
            x = x2 - margin;
        } else if (minDist === distTop) {
            y = y1 + margin;
        } else { // bottom
            y = y2 - margin;
        }

        return {
            x: Math.max(1, Math.min(mapWidth - 1, x)),
            y: Math.max(1, Math.min(mapHeight - 1, y)),
        };
    }

    static objective(args = {}) {
        if (typeof args === "string") {
            const stockObjective = args.toLowerCase();

            if (stockObjective == "depart") {
                return {
                    getLocation : (dropship) => Dropship.snap({x: dropship.x, y: dropship.y, margin: -250 }),
                    isComplete  : (dropship) => dropship.isOutside(),
                    onComplete  : (dropship) => dropship.despawn(),
                };
            }
            if (stockObjective == "departnorth") {
                return {
                    getLocation : (dropship) => Dropship.snap({x: dropship.x, y: dropship.y, margin: -250, border: "north" }),
                    isComplete  : (dropship) => dropship.isOutside(),
                    onComplete  : (dropship) => dropship.despawn(),
                };
            }
        }
        return {
            getLocation : null,
            isComplete  : (dropship) => true,
            onComplete  : (dropship) => {},
            ...args
        };
    }
}
