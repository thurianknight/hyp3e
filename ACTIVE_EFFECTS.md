# Character Active Effect Instructions

This guide lists the Hyperborea 3rd Edition system values that are useful as Active Effect change keys on **Character** actors. It is based on hyp3e 4.0.3 and applies to Foundry VTT v13 and v14.

It intentionally does not list every value stored on an actor. The values below are the ones that have a meaningful mechanical or sheet-display effect and are supported by the system's actor-preparation code.

## Creating an effect

1. Open a Character actor and select the **Effects** tab.
2. Select **Add Effect** in the appropriate section.
3. Open the new effect and add a row under **Changes**.
4. Enter one of the full `system.*` paths below as the change key.
5. Select a change mode/type, enter the value, and save the effect.
6. Confirm that the effect is enabled and that any configured duration or condition currently applies.

Use the full path in an effect change key. For example, use `system.attributes.str.curr`, not the roll-formula alias `@str.curr`.

## Change modes and values

| Mode/type | Use |
| --- | --- |
| Add | Add a number to the current value. Use a negative number to reduce it. This is the safest choice for changes that must work in both Foundry v13 and v14. |
| Multiply | Multiply the current value by the entered number. |
| Override | Replace the current value while the effect applies. |
| Subtract | Subtract a number. This is available in Foundry v14, but `Add` with a negative value is preferable when v13 compatibility matters. |

The system's recalculation handlers do not support Upgrade or Downgrade for the derived attribute, AC, DR, and movement keys described below. Use Add, Multiply, or Override instead.

Use fixed numeric values where practical. Effect values containing formulas can be resolved when an effect is created or transferred, but the late character recalculation paths cannot roll dice during actor preparation.

## Current ability scores

Use the `.curr` value, not `.value`. The system copies each permanent score from `.value` into `.curr` before applying Active Effects.

| Character value | Effect change key | Typical mode |
| --- | --- | --- |
| Strength (ST) | `system.attributes.str.curr` | Add or Override |
| Dexterity (DX) | `system.attributes.dex.curr` | Add or Override |
| Constitution (CN) | `system.attributes.con.curr` | Add or Override |
| Intelligence (IN) | `system.attributes.int.curr` | Add or Override |
| Wisdom (WS) | `system.attributes.wis.curr` | Add or Override |
| Charisma (CH) | `system.attributes.cha.curr` | Add or Override |

Example: an effect which sets Strength to 18 should use `system.attributes.str.curr`, Override, `18`.

## Combat, health, and movement

These temporary modifier fields are the preferred keys for routine bonuses and penalties.

| Character value | Effect change key | Typical mode | Notes |
| --- | --- | --- | --- |
| Attack modifier | `system.tempAtkMod` | Add | Positive values improve attack rolls. |
| Damage modifier | `system.tempDmgMod` | Add | Added to applicable damage rolls. |
| Initiative modifier | `system.tempInitiativeMod` | Add | Added to the combatant's initiative calculation. |
| Temporary hit points | `system.hp.tempHp` | Add | Damage is removed from temporary HP before current HP. |
| Temporary armour class modifier | `system.ac.tempAcMod` | Add | Hyperborea uses descending AC. A positive value improves AC by lowering the displayed AC. |
| Temporary damage reduction | `system.ac.tempDrMod` | Add | Positive values increase DR. |
| Temporary movement modifier | `system.movement.tempMvMod` | Add | Positive values increase base combat movement. |

Examples:

- An attack blessing: `system.tempAtkMod`, Add, `1`.
- A +2 defensive bonus: `system.ac.tempAcMod`, Add, `2`. A displayed AC of 5 becomes 3.
- Five temporary hit points: `system.hp.tempHp`, Add, `5`.
- Ten additional feet of movement: `system.movement.tempMvMod`, Add, `10`.

## Fighting, casting, and turning ability

Use the current calculated fields below. Do not target the corresponding `.value` fields because those are the permanent sources used to reset the current values before effects are applied.

| Character value | Effect change key | Typical mode |
| --- | --- | --- |
| Fighting Ability | `system.fa` | Add or Override |
| Casting Ability | `system.ca` | Add or Override |
| Turning Ability | `system.ta` | Add or Override |

## Saving throws

Use `.curr`, not `.value`. Saving throws succeed by rolling at least the displayed target, so a lower target is better.

| Saving throw | Effect change key | Typical mode |
| --- | --- | --- |
| Death | `system.saves.death.curr` | Add |
| Device | `system.saves.device.curr` | Add |
| Transformation | `system.saves.transformation.curr` | Add |
| Avoidance | `system.saves.avoidance.curr` | Add |
| Sorcery | `system.saves.sorcery.curr` | Add |

Example: a one-point bonus to Sorcery saves should use `system.saves.sorcery.curr`, Add, `-1`.

## Derived attribute values

When **Automatically calculate attribute modifiers** is enabled, hyp3e recalculates these values from the current ability scores and then reapplies Active Effects to the following explicit allowlist.

| Ability | Effectable values and keys |
| --- | --- |
| Strength | Attack modifier: `system.attributes.str.atkMod`<br>Damage modifier: `system.attributes.str.dmgMod`<br>Test: `system.attributes.str.test`<br>Feat: `system.attributes.str.feat` |
| Dexterity | Missile attack modifier: `system.attributes.dex.atkMod`<br>Defence modifier: `system.attributes.dex.defMod`<br>Test: `system.attributes.dex.test`<br>Feat: `system.attributes.dex.feat` |
| Constitution | HP modifier: `system.attributes.con.hpMod`<br>Poison/radiation modifier: `system.attributes.con.poisRadMod`<br>Trauma survival: `system.attributes.con.traumaSurvive`<br>Test: `system.attributes.con.test`<br>Feat: `system.attributes.con.feat` |
| Intelligence | Languages: `system.attributes.int.languages`<br>Learn spell: `system.attributes.int.learnSpell` |
| Wisdom | Willpower modifier: `system.attributes.wis.willMod`<br>Learn spell: `system.attributes.wis.learnSpell` |
| Charisma | Reaction modifier: `system.attributes.cha.reaction`<br>Maximum henchmen: `system.attributes.cha.maxHenchmen`<br>Turn undead modifier: `system.attributes.cha.turnUndead` |

These numeric fields support Add, Multiply, and Override in Foundry v13. Foundry v14 also supports Subtract. Fixed numbers or synchronous math expressions may be used; unresolved dice expressions are skipped during this recalculation step.

### Bonus spell flags

The character recalculation allowlist also recognizes these boolean fields:

- `system.attributes.int.bonusSpells.lvl1`
- `system.attributes.int.bonusSpells.lvl2`
- `system.attributes.int.bonusSpells.lvl3`
- `system.attributes.int.bonusSpells.lvl4`
- `system.attributes.wis.bonusSpells.lvl1`
- `system.attributes.wis.bonusSpells.lvl2`
- `system.attributes.wis.bonusSpells.lvl3`
- `system.attributes.wis.bonusSpells.lvl4`

Use Override with `true` to grant a bonus-spell flag. Because Active Effect change values are stored as text and boolean coercion differs between Foundry versions, verify this behavior in the Foundry version used by the world before distributing the effect.

## Direct final AC, DR, and movement changes

The following keys are explicitly reapplied after automatic armour, shield, Dexterity, encumbrance, DR, and movement calculations:

| Final value | Effect change key | Notes |
| --- | --- | --- |
| Armour Class | `system.ac.value` | With descending AC, Add `-1` improves AC by one. Override sets the final AC. |
| Damage Reduction | `system.ac.dr` | Add a positive number to improve DR. |
| Base combat movement | `system.movement.base.value` | Add a positive number to increase movement. |

For normal temporary bonuses, prefer `system.ac.tempAcMod`, `system.ac.tempDrMod`, and `system.movement.tempMvMod`. The direct keys are useful when an effect must set or transform the final calculated value.

## Persistent damage special key

`system.tempPersistentDamage` is a special change key processed by hyp3e's temporary-effect workflow. It is not a normal actor data field.

Use this value format:

```text
damageType,damageFormula;
```

Example: `system.tempPersistentDamage`, Add, `fire,1d6;` applies 1d6 fire damage whenever the temporary-effect processing step advances. If the damage type is omitted, the system uses `basic` damage. This is an advanced key; configure an appropriate temporary duration and test it before using it in a live world.

## Values to avoid as effect keys

- `system.attributes.<ability>.value`: this is the permanent ability score. Use `.curr` for effects.
- `system.fightingAbility.value`, `system.castingAbility.value`, and `system.turningAbility.value`: these are permanent source values. Use `system.fa`, `system.ca`, and `system.ta`.
- `system.saves.<save>.value`: this is the permanent save target. Use `.curr`.
- `system.hp.value`: this is actual current HP and is updated by damage/healing workflows. Use `system.hp.tempHp` for temporary protection.
- `system.hp.percentage`, `system.weightCarried`, `system.encumberedState`, and `system.wornArmorType`: these are calculated display/state values and can be overwritten during actor preparation.
- Attribute modifier fields not included in the derived-value allowlist above: they may be overwritten when automatic attribute calculations are enabled.
- Permanent character data such as level, XP, money, class, race, and spell-slot text: edit those on the actor instead of representing them with a temporary Active Effect.

## Conditional effects

The hyp3e **Conditionally Apply Effect** editor can test actor paths such as `system.attributes.str.curr` or `system.hp.value`. Conditions support `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, and `!in`, and can require all, any, or none of the configured tests to pass.

Conditions decide whether an effect applies; the change keys in the tables above decide what the effect modifies.
