# Variables Used in the Hyperborea System for Foundry VTT

When creating roll formulas and macros, it is common to use variables for actor and item properties. Below is a list of the most commonly-used variables. But if you need a more complete listing of possible variables, I recommend installing the Koboldworks Data Inspector module.

## Actor (Character) Variables
- @ac.dr
  - Damage Reduction on actor from equipped armor
- @ac.value
  - Armor Class of actor including equipped armor, DX mod, and other factors
- @ac.tempAcMod
  - Temporary AC modifier
- @ac.tempDrMod
  - Temporary DR modifier
- @ca
  - Current (calculated) Casting Ability
- @cha.turnUndead
  - Turn Undead modifier
- @con.feat
  - Feat of CN
- @con.hpMod
  - HP modifier to Hit Points
- @con.test
  - Test of CN
- @dex.atkMod
  - Missile Attack Modifier
- @dex.defMod
  - Defense Modifier to Armor Class and Avoidance saves
- @dex.feat
  - Feat of DX
- @dex.test
  - Test of DX
- @fa
  - Current (calculated) Fighting Ability
- @hd
  - Hit Dice used to roll Hit Points for any actor
- @hp.value
  - Current Hit Points
- @hp.tempHp
  - Temporary Hit Points
- @lvl
  - Character Level
- @mv (simplified), or @movement.base.value
  - Calculated MV per round
- @movement.tempMvMod
  - Temporary MV modifier
- @str.atkMod
  - Melee Attack Modifier
- @str.dmgMod
  - Melee Damage Modifier (also used by some missile weapons)
- @str.feat
  - Feat of ST
- @str.test
  - Test of ST
- @ta
  - Current (calculated) Turning Ability
- @tempAtkMod
  - Temporary attack modifier
- @tempDmgMod
  - Temporary damage modifier

## Item Variables
- @ac
  - Armor Class value
- @atkMod
  - Item Attack Modifier
- @dmgMod
  - Item Damage Modifier
- @dr
  - Damage Reduction value
