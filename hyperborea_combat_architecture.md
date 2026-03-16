# Hyperborea 3E Foundry System

## Combat System Architecture Overview

This document summarizes the structural design of the combat subsystem
in the Hyperborea 3E Foundry VTT system. It focuses on the major
components involved in combat resolution and how they interact.

------------------------------------------------------------------------

# 1. Core Combat Components

## CombatTracker Integration

Primary UI and orchestration layer for combat flow.

Responsibilities:
- Displays combatant groups, combatants, and turn order
- Provides combatant group management, and add to or remove combatants from 
groups
- Provides action declaration controls (melee, missile, magic, movement, 
other, delayed)
- Allows initiative rolling (group-based is the default, but individual is 
supported)
- Displays key combat statuses (slowed, hasted, defeated/unconscious, dead)
- Handles round/turn progression
- Manages delayed actions and last-strike positioning

Key Concepts:
- Turn order determined after action declarations
- Combat tracker provides player-facing controls
- Tracker state drives actor combat behavior

------------------------------------------------------------------------

# 2. Actor Combat Logic

Actor documents are responsible for executing most combat mechanics.

Typical responsibilities include:

Attack resolution:
- Determine attack type (melee / missile)
- Collect modifiers from statuses and effects
- Roll attack dice
- Compare result against target AC

Damage resolution:
- Supply weapon damage formula and roll-data to attack chat-card damage buttons
- Apply modifiers
- Subtract from target HP

State updates:
- Apply unconscious and bleeding statuses
- Handle death threshold rules
- Apply delayed death logic (if enabled)

Example conceptual methods:
- Actor.rollAttackOrSpell()
- Actor._prepareDamageFormulas()
- Actor.applyHealthChange()
- Actor.setHealthStatus()

These functions act as the **rules engine** for combat.

------------------------------------------------------------------------

# 3. Item-Based Combat Data

Weapons and combat-related items store mechanical data used by Actor methods.

Typical properties include:

Weapon properties:
- Damage dice
- Damage type
- Weapon class
- Missile vs melee designation
- Rate of attack
- Weapon mastery / grandmastery flags

Missile weapons:
- Range increments
- Ammo use flag
- Current selected ammunition
- Ammo consumption behavior

Items themselves generally **do not resolve combat**, but instead provide the 
data required by Actor combat functions.

------------------------------------------------------------------------

# 4. Initiative System

The initiative system is tightly integrated with the combat tracker.

Features include:

Action Declaration:
- Players declare actions before initiative resolution

Group Initiative:
- Players roll initiative for their group of owned combatants

Turn Order Construction:
- Initiative roll results determine ordering
- Delayed actions and some statuses automatically move to end of round

This design mirrors the tabletop Hyperborea rules structure.

------------------------------------------------------------------------

# 5. Status & Combat Modifiers

Combat modifiers are applied through a status/effect layer.

Types of statuses:

Positional:
- Flank Attack (+1 attack)
- Rear Attack (+2 attack)

Visibility:
- Partial Concealment (-2 missile attack penalty)
- Full Concealment (-4 missile penalty)

State conditions:
- Unconscious, unconscious & bleeding
- Dead

Statuses may provide:
- Attack bonuses or penalties
- Armor class adjustments
- Targeting modifiers

These integrate with attack resolution automatically.

------------------------------------------------------------------------

# 6. Active Effects System

Active Effects provide dynamic modifiers to actors during combat.

Examples include:
- Temporary fighting ability bonuses
- Armor class adjustments
- Saving throw modifiers
- Other combat bonuses & penalties

The system resolves formulas and variables when effects are created to ensure
combat calculations remain stable.

------------------------------------------------------------------------

# 7. Missile Combat Workflow

Missile weapons require special handling.

Key behavior:

Ammo selection persistence:
- The last selected ammo type is remembered

Ammo consumption:
- Automatically decremented when firing

Failure cases:
- Out-of-ammo status give notification but allows the attack

This reduces repetitive player input during combat.

------------------------------------------------------------------------

# 8. Damage & Death Handling

Hyperborea combat rules introduce unique death behavior.

Optional rule supported:

Delayed Death Resolution:
- Characters reduced below 0 HP remain active
- Death or unconscious state evaluated at end of round

Standard thresholds:
- 0 HP → unconscious or dead
  - _Monsters_ die at 0 HP
  - _NPCs_ and _Characters_ 0 to -3 HP → unconscious
  - _NPCs_ die at -4 HP
  - _Characters_ -4 to -10 HP → bleeding/dying 1 HP per round
  - _Characters_ die at -10 HP

If enabled, _unconscious_ and _dead_ statuses are not applied until the end of 
the round. This supports dramatic last actions in combat.

------------------------------------------------------------------------

# 9. Combat Round Lifecycle

Typical combat flow:
1. Combat begins
2. Players declare actions
3. Initiative rolled
4. Turn order established
5. Combatants act in order
6. Damage applied
7. End-of-round status evaluation
8. Death/unconscious resolution

------------------------------------------------------------------------

# 10. Architectural Design Philosophy

The combat system follows several design principles:

Actor-centric rules:
- Actors execute combat mechanics

Item-driven data:
- Items store weapon statistics

Tracker-driven flow:
- CombatTracker manages sequencing

Status-driven modifiers:
- Effects and statuses alter combat calculations

This separation allows:
- Easier rule extensions
- Modular combat features
- Minimal coupling between UI and mechanics

------------------------------------------------------------------------

# 11. Future Extension Points

Possible expansion areas:
- Advanced combat maneuvers
- Reach and engagement rules
- Opportunity attacks
- Expanded status effect automation
- Tactical movement integration

------------------------------------------------------------------------
