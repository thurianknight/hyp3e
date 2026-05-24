export const HYP3E = {
    systemRoot() {
        // return `systems/${game.system.id}`
        return `systems/hyp3e`
    },
    get assetsPath() {
        return `${this.systemRoot()}/assets`
    },
    get cssPath() {
        return `${this.systemRoot()}/css`;
    },
    get modulePath() {
        return `${this.systemRoot()}/module`;
    },
    get templatePath() {
        return `${this.systemRoot()}/templates`;
    },
    colors: {
        green: "HYP3E.colors.green",
        red: "HYP3E.colors.red",
        yellow: "HYP3E.colors.yellow",
        purple: "HYP3E.colors.purple",
        blue: "HYP3E.colors.blue",
        orange: "HYP3E.colors.orange",
        white: "HYP3E.colors.white",
    },
};

HYP3E.calendar = {
  days: {
    sun: {
      abbreviation: "HYP3E.calendar.days.sun.abbreviation",
      name: "HYP3E.calendar.days.sun.name",
      ordinal: 1
    },
    earth: {
      abbreviation: "HYP3E.calendar.days.earth.abbreviation",
      name: "HYP3E.calendar.days.earth.name",
      ordinal: 2
    },
    sea: {
      abbreviation: "HYP3E.calendar.days.sea.abbreviation",
      name: "HYP3E.calendar.days.sea.name",
      ordinal: 3
    },
    moon: {
      abbreviation: "HYP3E.calendar.days.moon.abbreviation",
      name: "HYP3E.calendar.days.moon.name",
      ordinal: 4
    },
    star: {
      abbreviation: "HYP3E.calendar.days.star.abbreviation",
      name: "HYP3E.calendar.days.star.name",
      ordinal: 5
    },
    sky: {
      abbreviation: "HYP3E.calendar.days.sky.abbreviation",
      name: "HYP3E.calendar.days.sky.name",
      ordinal: 6
    },
    saturn: {
      abbreviation: "HYP3E.calendar.days.saturn.abbreviation",
      name: "HYP3E.calendar.days.saturn.name",
      ordinal: 7
    }
  },
  months: {
    I: {
      name: "HYP3E.calendar.months.I.name",
      abbreviation: "HYP3E.calendar.months.I.abbreviation",
      days: 28,
      ordinal: 1
    },
    II: {
      name: "HYP3E.calendar.months.II.name",
      abbreviation: "HYP3E.calendar.months.II.abbreviation",
      days: 28,
      ordinal: 2
    },
    III: {
      name: "HYP3E.calendar.months.III.name",
      abbreviation: "HYP3E.calendar.months.III.abbreviation",
      days: 28,
      ordinal: 3
    },
    IV: {
      name: "HYP3E.calendar.months.IV.name",
      abbreviation: "HYP3E.calendar.months.IV.abbreviation",
      days: 28,
      ordinal: 4
    },
    V: {
      name: "HYP3E.calendar.months.V.name",
      abbreviation: "HYP3E.calendar.months.V.abbreviation",
      days: 28,
      ordinal: 5
    },
    VI: {
      name: "HYP3E.calendar.months.VI.name",
      abbreviation: "HYP3E.calendar.months.VI.abbreviation",
      days: 28,
      ordinal: 6
    },
    VII: {
      name: "HYP3E.calendar.months.VII.name",
      abbreviation: "HYP3E.calendar.months.VII.abbreviation",
      days: 28,
      ordinal: 7
    },
    VIII: {
      name: "HYP3E.calendar.months.VIII.name",
      abbreviation: "HYP3E.calendar.months.VIII.abbreviation",
      days: 28,
      ordinal: 8
    },
    IX: {
      name: "HYP3E.calendar.months.IX.name",
      abbreviation: "HYP3E.calendar.months.IX.abbreviation",
      days: 28,
      ordinal: 9
    },
    X: {
      name: "HYP3E.calendar.months.X.name",
      abbreviation: "HYP3E.calendar.months.X.abbreviation",
      days: 28,
      ordinal: 10
    },
    XI: {
      name: "HYP3E.calendar.months.XI.name",
      abbreviation: "HYP3E.calendar.months.XI.abbreviation",
      days: 28,
      ordinal: 11
    },
    XII: {
      name: "HYP3E.calendar.months.XII.name",
      abbreviation: "HYP3E.calendar.months.XII.abbreviation",
      days: 28,
      ordinal: 12
    },
    XIII: {
      name: "HYP3E.calendar.months.XIII.name",
      abbreviation: "HYP3E.calendar.months.XIII.abbreviation",
      days: 28,
      ordinal: 13
    },
  }
};

/**
 * The six Attribute scores that define a character
 * @type {Object}
 */
HYP3E.attributes = {
  "str": "HYP3E.attributes.str.name",
  "dex": "HYP3E.attributes.dex.name",
  "con": "HYP3E.attributes.con.name",
  "int": "HYP3E.attributes.int.name",
  "wis": "HYP3E.attributes.wis.name",
  "cha": "HYP3E.attributes.cha.name"
};

HYP3E.attributeAbbreviations = {
  "str": "HYP3E.attributes.str.abbrev",
  "dex": "HYP3E.attributes.dex.abbrev",
  "con": "HYP3E.attributes.con.abbrev",
  "int": "HYP3E.attributes.int.abbrev",
  "wis": "HYP3E.attributes.wis.abbrev",
  "cha": "HYP3E.attributes.cha.abbrev"
};

/**
 * The three standard creature sizes
 * @type {Object}
 */
HYP3E.creatureSizes = {
    "S": "HYP3E.sizes.S",
    "M": "HYP3E.sizes.M",
    "L": "HYP3E.sizes.L"
}

/**
 * True/False options for blind rolls
 * @type {Object} 
 */
HYP3E.blindRollOpts = {
  "true": "HYP3E.true",
  "false": "HYP3E.false"
};

/**
 * The five types of saving throws
 * @type {Object}
 */
HYP3E.saves = {
  "base": "HYP3E.saves.base.name",
  "death": "HYP3E.saves.death.name",
  "transformation": "HYP3E.saves.transformation.name",
  "device": "HYP3E.saves.device.name",
  "avoidance": "HYP3E.saves.avoidance.name",
  "sorcery": "HYP3E.saves.sorcery.name"
};
HYP3E.saveAbbreviations = {
  "base": "HYP3E.saves.base.abbrev",
  "death": "HYP3E.saves.death.abbrev",
  "transformation": "HYP3E.saves.transformation.abbrev",
  "device": "HYP3E.saves.device.abbrev",
  "avoidance": "HYP3E.saves.avoidance.abbrev",
  "sorcery": "HYP3E.saves.sorcery.abbrev"
};

/**
 * d6 task resolution difficulty levels
 * @type {Object}
 */
HYP3E.taskResolution = {
  "simple": {
    "name": "HYP3E.taskResolution.simple.name",
    "hint": "HYP3E.taskResolution.simple.hint",
    "tn": 5
  },
  "moderate": {
    "name": "HYP3E.taskResolution.moderate.name",
    "hint": "HYP3E.taskResolution.moderate.hint",
    "tn": 4
  },
  "challenging": {
    "name": "HYP3E.taskResolution.challenging.name",
    "hint": "HYP3E.taskResolution.challenging.hint",
    "tn": 3
  },
  "difficult": {
    "name": "HYP3E.taskResolution.difficult.name",
    "hint": "HYP3E.taskResolution.difficult.hint",
    "tn": 2
  },
  "veryDifficult": {
    "name": "HYP3E.taskResolution.veryDifficult.name",
    "hint": "HYP3E.taskResolution.veryDifficult.hint",
    "tn": 1
  }
}

/**
 * The five standard money/coinage types
 * @type {Object}
 */
HYP3E.money = {
  "cp": "HYP3E.money.cp",
  "sp": "HYP3E.money.sp",
  "ep": "HYP3E.money.ep",
  "gp": "HYP3E.money.gp",
  "pp": "HYP3E.money.pp"
};

/**
 * The three standard movement types
 * @type {Object}
 */
HYP3E.movement = {
  "base": "HYP3E.movement.base.name",
  "exploration": "HYP3E.movement.exploration.name",
  "travel": "HYP3E.movement.travel.name"
};

HYP3E.movementAbbreviations = {
  "base": "HYP3E.movement.base.abbrev",
  "exploration": "HYP3E.movement.exploration.abbrev",
  "travel": "HYP3E.movement.travel.abbrev"
};

/**
 * The overall item types
 * @type {Object}
 */
HYP3E.itemTypes = {
    "armor": "HYP3E.itemTypes.armor", 
    "feature": "HYP3E.itemTypes.feature", 
    "item": "HYP3E.itemTypes.item", 
    "shield": "HYP3E.itemTypes.shield", 
    "spell": "HYP3E.itemTypes.spell", 
    "weapon": "HYP3E.itemTypes.weapon", 
    "effectTemplate": "HYP3E.itemTypes.effectTemplate"
}

/**
 * The weapon types
 * @type {Object}
 */
HYP3E.weaponTypes = {
  "melee": "HYP3E.weapon.type.melee",
  "missile": "HYP3E.weapon.type.missile"
};

/**
 * Weapon annotations, both melee and missile
 * @type {Object}
 */
HYP3E.weaponAnnotations = {
    "ignoreShieldAc": "HYP3E.weapon.annotations.ignoreShieldAc",
    "p1VsPlate": "HYP3E.weapon.annotations.p1VsPlate",
    "1hOr2h": "HYP3E.weapon.annotations.1hOr2h",
    "true2Hand": "HYP3E.weapon.annotations.true2Hand",
    "hurled": "HYP3E.weapon.annotations.hurled",
    "p1VsMelee": "HYP3E.weapon.annotations.p1VsMelee",
    "dblDmgVsCharge": "HYP3E.weapon.annotations.dblDmgVsCharge",
    "dismountRider": "HYP3E.weapon.annotations.dismountRider",
    "dblDmgFromCharge": "HYP3E.weapon.annotations.dblDmgFromCharge",
    "d10FromWarhorse": "HYP3E.weapon.annotations.d10FromWarhorse",
    "strDmgAdj": "HYP3E.weapon.annotations.strDmgAdj",
    "strDmgIfCustomized": "HYP3E.weapon.annotations.strDmgIfCustomized"
};

/**
 * Standard damage types
 * @type {Object}
 */
HYP3E.damageTypes = {
    "basic": "HYP3E.weapon.damageTypes.basic",
    "bludgeoning": "HYP3E.weapon.damageTypes.bludgeoning",
    "piercing": "HYP3E.weapon.damageTypes.piercing",
    "slashing": "HYP3E.weapon.damageTypes.slashing",
    "acid": "HYP3E.weapon.damageTypes.acid",
    "cold": "HYP3E.weapon.damageTypes.cold",
    "electricity": "HYP3E.weapon.damageTypes.electricity",
    "fire": "HYP3E.weapon.damageTypes.fire",
    "gas": "HYP3E.weapon.damageTypes.gas",
    "negative": "HYP3E.weapon.damageTypes.negative",
    "pain": "HYP3E.weapon.damageTypes.pain",
    "poison": "HYP3E.weapon.damageTypes.poison",
    "positive": "HYP3E.weapon.damageTypes.positive",
    "healing": "HYP3E.weapon.damageTypes.healing",
}
HYP3E.damageTypeIcons = {
    "basic": `${HYP3E.assetsPath}/damage-icons/cross-mark-red.svg`,
    "bludgeoning": `${HYP3E.assetsPath}/damage-icons/thor-hammer-red.svg`,
    "piercing": `${HYP3E.assetsPath}/damage-icons/broadhead-arrow-red.svg`,
    "slashing": `${HYP3E.assetsPath}/damage-icons/broadsword-red.svg`,
    "acid": `${HYP3E.assetsPath}/damage-icons/chemical-bolt-red.svg`,
    "cold": `${HYP3E.assetsPath}/damage-icons/snowflake-2-red.svg`,
    "electricity": `${HYP3E.assetsPath}/damage-icons/lightning-helix-red.svg`,
    "fire": `${HYP3E.assetsPath}/damage-icons/small-fire-red.svg`,
    "gas": `${HYP3E.assetsPath}/damage-icons/poison-gas-red.svg`,
    "negative": `${HYP3E.assetsPath}/damage-icons/thunder-skull-red.svg`,
    "pain": `${HYP3E.assetsPath}/damage-icons/back-pain-red.svg`,
    "poison": `${HYP3E.assetsPath}/damage-icons/poison-bottle-red.svg`,
    "positive": `${HYP3E.assetsPath}/damage-icons/rolling-energy-red.svg`,
    "healing": `${HYP3E.assetsPath}/damage-icons/caduceus-red.svg`
};

/**
 * The armor types
 * @type {Object}
 */
HYP3E.armorTypes = {
  "unarmored": "HYP3E.armor.type.unarmored",
  "light": "HYP3E.armor.type.light",
  "medium": "HYP3E.armor.type.medium",
  "heavy": "HYP3E.armor.type.heavy",
  "shield": "HYP3E.armor.type.shield"
};
/**
 * The shield types
 * @type {Object}
 */
HYP3E.shieldTypes = {
  "small": "HYP3E.shield.type.small",
  "large": "HYP3E.shield.type.large",
  "passive": "HYP3E.shield.type.passive"
};

/**
 * [Optional] Combat options, many of which are optional/Advanced.
 *  Allowed modifier properties: ac, attack, and damage
 * @type {Object}
 */
HYP3E.combatOptions = {
  "flank": { 
    "nameLong": "Flank Attack (+1 attack)", 
    "name": "Flank Attack", 
    "attack": 1 
  },
  "rear": { 
    "nameLong": "Rear Attack (+2 attack)", 
    "name": "Rear Attack", 
    "attack": 2 
  },
  "charge": { 
    "nameLong": "Charge Attack (+2 damage, -2 AC)", 
    "name": "Charge Attack", 
    "damage": 2, 
    "ac": -2 
  },
  // "withdraw": "Fighting Withdrawal",
  "runAway": { 
    "nameLong": "Run Away (-2 AC)", 
    "name": "Run Away", 
    "ac": -2 
  },
  "mounted": { 
    "nameLong": "Mounted Combat (+1 attack & +1 AC vs. foot)", 
    "name": "Mounted Combat vs. Foot", 
    "attack": 1, 
    "ac": 1 
  },
  "mountedCharge": { 
    "nameLong": "Mounted Charge (+1 attack, +2 damage, -2 AC)", 
    "name": "Mounted Charge", 
    "attack": 1, 
    "damage": 2, 
    "ac": -2 
  },
  // "arrowSetting": "Arrow Setting (+1/2 RoF)",
  "conservative": { 
    "nameLong": "Conservative Fighting (+1 AC, -2 attack)", 
    "name": "Conservative Fighting", 
    "ac": 1, 
    "attack": -2 
  },
  "disarm": { 
    "nameLong": "Disarm Attempt (-4 attack)", 
    "name": "Disarm Attempt", 
    "attack": -4 
  },
  "dodge": { 
    "nameLong": "Dodging (+2 AC, no attack)", 
    "name": "Dodging", 
    "ac": 2 
  },
  "doubleArrow": { 
    "nameLong": "Double Arrow Shot (-2 attack)", 
    "name": "Double Arrow Shot", 
    "attack": -2 
  },
  "doubleFeint": { 
    "nameLong": "Double Feint (+2 attack)", 
    "name": "Double Feint", 
    "attack": 2 
  },
  // "firingMarch": "Firing March",
  "indirect": { 
    "nameLong": "Indirect Fire (-2 attack, ignore nearby allies)", 
    "name": "Indirect Fire", 
    "attack": -2 
  },
  "parry": { 
    "nameLong": "Off-hand Weapon Parry (+1 AC, no off-hand attack)", 
    "name": "Off-hand Weapon Parry", 
    "ac": 1 
  },
  "parryAndBlock": { 
    "nameLong": "Parry and Block (+2 AC, + ST attack mod)", 
    "name": "Parry and Block", 
    "ac": 2, 
  },
  // "pommel": "Pommel Strike",
  // "ready": "Ready Shooter",
  "reckless": { 
    "nameLong": "Reckless Fighting (+1 attack, -2 AC)", 
    "name": "Reckless Fighting", 
    "attack": 1, 
    "ac": -2
  },
  "recumbent": { 
    "nameLong": "Recumbent Fire (+2 AC, -4 attack)", 
    "name": "Recumbent Fire", 
    "ac": 2, 
    "attack": -4 
  },
  "runningDodge": { 
    "namelong": "Running Dodge (+2 AC, no attack)", 
    "name": "Running Dodge", 
    "ac": 2
  },
  // "saddleCasting": "Saddle Casting",
  // "saddleFire": "Saddle Fire",
  // "shieldBash": "Shield Bash",
  // "shieldBind": { 
  //   "nameLong": "Shield Bind (cancels shield AC bonuses)", 
  //   "name": "Shield Bind" 
  // },
  // "shieldCover": "Shield Cover for Ally",
  // "shieldSplitter": "Shield Splitter",
  "shieldWall": { 
    "nameLong": "Shield Wall (+4 AC, replaces shield AC)", 
    "name": "Shield Wall", 
    "ac": 2   // Net +2 bonus w/ large shield already calculated
  },
  "behindShieldWall": {
    "nameLong": "2nd Rank Behind Shield Wall (+4 AC, -2 attack)",
    "name": "Behind Shield Wall",
    "ac": 4,
    "attack": -2
  },
  // "spearCharge": "Spear Charge",
  // "spearSet": "Spear Setting",
  // "throwAndAttack": "Throw and Attack",
  // "twoWeaponFighting": "Two-Weapon Fighting"
};

export default HYP3E;