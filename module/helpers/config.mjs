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
  "death": "HYP3E.saves.death.name",
  "transformation": "HYP3E.saves.transformation.name",
  "device": "HYP3E.saves.device.name",
  "avoidance": "HYP3E.saves.avoidance.name",
  "sorcery": "HYP3E.saves.sorcery.name"
};
HYP3E.saveAbbreviations = {
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
 * Alternate damage types
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
}

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

export default HYP3E;