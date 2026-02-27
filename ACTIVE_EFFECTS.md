# Character or NPC Fields Commonly Used With ActiveEffects

These have mechanical impact in the game, and need specific configuration in the Active Effect in order to work correctly.

## Use the below-noted Attribute Key in the Changes section of the ActiveEffect:
- Attributes
  - Use system.attributes.*.curr, where * is one of: str, dex, con, int, wis, cha
- Attribute mods
  - OK to change directly
- Fighting Ability
  - Use system.fa
- Basic Attack Mod without affecting Fighting Ability, Strength, or other attack modifiers
  - Use system.tempAtkMod
- Basic Damage Mod without affecting Strength or other damage modifiers
  - Use system.tempDmgMod
- Casting Ability
  - Use system.ca
- Turning Ability
  - Use system.ta
- Hit Points
  - Use system.hp.tempHp
- Armor Class
  - Use system.ac.tempAcMod
- Damage Reduction
  - Use system.ac.tempDrMod
- Movement
  - Use system.movement.tempMvMod
- Saves
  - Use system.saves.*.curr, where * is one of: death, device, transformation, avoidance, sorcery
