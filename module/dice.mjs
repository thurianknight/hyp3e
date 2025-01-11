import { HYP3E } from "./helpers/config.mjs"

export class Hyp3eDice {
    /**
     * Construct damage roll from relevant parts, return roll formula
     * @param {Object} actorData
     * @param {Object} item
     */
    static buildDamageFormula(itemData, actorData = null, actorType = null) {
        let dmgRollParts = []
        let masteryMod = 0
        let debugDmgRollFormula = ""

        // Check if the weapon attack has Master or Grandmaster flags set
        if (itemData.wpnGrandmaster) {
            masteryMod = 2
        } else if (itemData.wpnMaster) {
            masteryMod = 1
        }

        // All items start with the base damage formula
        dmgRollParts.push(itemData.damage)
        if (itemData.melee) {
            if (actorData && actorType == "character") {
                // Characters apply their ST Damage Mod to all melee damage
                dmgRollParts.push(actorData.str.dmgMod)
                // Apply the item damage mod
                dmgRollParts.push(itemData.dmgMod)
                if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage} + @str.dmgMod + @item.dmgMod` }
            } else {
                // NPCs and monsters don't have a ST damage modifier, but might have an item damage mod
                dmgRollParts.push(itemData.dmgMod)
                if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage} + @item.dmgMod` }
            }
        } else if (itemData.missile) {
            // Apply the item damage mod
            dmgRollParts.push(itemData.dmgMod)
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage} + @item.dmgMod` }
        } else {
            // This should only happen with spells
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula = `Damage Formula: ${itemData.damage}` }
        }
        // Add Weapon Mastery mod if applicable
        if (masteryMod > 0) {
            dmgRollParts.push(masteryMod)
            if (CONFIG.HYP3E.debugMessages) { debugDmgRollFormula += ` + masteryMod` }
        }
        // Log the damage roll parts & the constructed formula
        if (CONFIG.HYP3E.debugMessages) { 
            console.log("Damage roll parts:", dmgRollParts)
            console.log(debugDmgRollFormula)
        }

        // Construct the damage roll formula from parts
        return dmgRollParts.join(" + ")
    }

    /**
     * Handle item and ability check dialogs
     * @param dataset
     */
    static async ShowBasicRollDialog(dataset) {
        // Default rollMode to public roll, the user can change it in the roll dialog
        let rollMode = "publicroll"
        if (dataset.rollMode) {
            rollMode = dataset.rollMode
        }
        let dialogData = {
            roll: dataset.roll,
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("Basic/check roll dialog dataset: ", dataset) }
        const template = `${HYP3E.templatePath}/dialog/roll-dialog.hbs`
        const dialogHtml = await renderTemplate(template, dialogData)

        // Roll dialog for item and ability checks
        return new Promise((resolve, reject) => {
            const rollDialog = new Dialog({
                title: `${dataset.label}`,
                content: dialogHtml,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-dice-d20"></i>',
                        label: "Roll",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) { 
                                console.log('Form data object:', formDataObj)
                                if (CONFIG.HYP3E.flipRollUnderMods) {
                                    console.log("Rolling " + dataset.roll + " - " + formDataObj.sitMod + " ...")
                                } else {
                                    console.log("Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
                                }
                            }
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            if (CONFIG.HYP3E.debugMessages) { console.log("Roll canceled!") }
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => console.log("Register interactivity in the rendered dialog"),
                close: html => console.log("Dialog closed")
            })
            rollDialog.render(true)
        })
    }

    /**
     * Handle attack dialogs
     * @param dataset
     */
    static async ShowAttackRollDialog(dataset, rangeGroup = null, ranges = null, chosen = null) {
        // Default rollMode to public roll, the user can change it in the roll dialog
        let rollMode = "publicroll"
        let dialogData = {
            roll: dataset.roll,
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode,
            rangeGroup: rangeGroup,
            ranges: ranges,
            chosen: chosen
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("Attack roll dialog dataset: ", dataset) }
        const template = `${HYP3E.templatePath}/dialog/roll-dialog.hbs`
        const dialogHtml = await renderTemplate(template, dialogData)

        // Roll dialog for attacks
        return new Promise((resolve, reject) => {
            const rollDialog = new Dialog({
                title: `${dataset.label}`,
                content: dialogHtml,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-dice-d20"></i>',
                        label: "Attack",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) { 
                                console.log('Form data object:', formDataObj) 
                                console.log("Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
                            }
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            if (CONFIG.HYP3E.debugMessages) { console.log("Roll canceled!") }
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => console.log("Register interactivity in the rendered dialog"),
                close: html => console.log("Dialog closed")
            })
            rollDialog.render(true)
        })
    }

    /**
     * Handle spellcasting dialog
     * @param dataset
     */
    static async ShowSpellcastingDialog(dataset) {
        // Default rollMode to public roll, the user can change it in the roll dialog
        let rollMode = "publicroll"
        let dialogData = {
            roll: dataset.roll,
            enableRoll: dataset.enableRoll,
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("Spellcasting roll dialog dataset: ", dataset) }
        const template = `${HYP3E.templatePath}/dialog/roll-dialog.hbs`
        const dialogHtml = await renderTemplate(template, dialogData)

        // Roll dialog for casting spells
        return new Promise((resolve, reject) => {
            const rollDialog = new Dialog({
                title: `${dataset.label}`,
                content: dialogHtml,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-scroll"></i>',
                        label: "Cast",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) {
                                console.log('Form data object:', formDataObj)
                                console.log("Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
                            }
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            console.log("Roll canceled!")
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => console.log("Register interactivity in the rendered dialog"),
                close: html => console.log("Dialog closed")
            })
            rollDialog.render(true)
        })
    }
  
    /**
     * Handle saving throw dialog
     * @param dataset
     */
    static async ShowSaveRollDialog(dataset) {
        // Default rollMode to pulic roll, the user can change it in the roll dialog
        let rollMode = "publicroll"
        // if (dataset.rollMode) {
        //   rollMode = dataset.rollMode
        // }
        let dialogData = {
            roll: dataset.roll,
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("Save roll dialog dataset: ", dataset) }
        const template = `${HYP3E.templatePath}/dialog/roll-dialog.hbs`
        const dialogHtml = await renderTemplate(template, dialogData)

        // Roll dialog for saving throws, with save modifiers
        return new Promise((resolve, reject) => {
            const rollDialog = new Dialog({
                title: `${dataset.label}`,
                content: dialogHtml,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-dice-d20"></i>',
                        label: "Roll",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) {
                                console.log('Form data object:', formDataObj)
                                console.log("Rolling basic save: " + dataset.roll + " + " + formDataObj.sitMod + " ...")
                            }
                            resolve(formDataObj)
                        }
                    },
                    avoid: {
                        icon: '<i class="fas fa-dice-d20"></i>',
                        label: "Avoidance Mod",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            formDataObj.avoidMod = dataset.avoidMod
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) {
                                console.log('Form data object:', formDataObj)
                                console.log("Rolling save with Avoidance mod: " + dataset.roll + " + " + formDataObj.avoidMod + " + " + formDataObj.sitMod + " ...")
                            }
                            resolve(formDataObj)
                        }
                    },
                    poison: {
                        icon: '<i class="fas fa-dice-d20"></i>',
                        label: "Poison/Rad Mod",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            formDataObj.poisonMod = dataset.poisonMod
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) {
                                console.log('Form data object:', formDataObj)
                                console.log("Rolling save with Poison/Radiation mod: " + dataset.roll + " + " + formDataObj.poisonMod + " + " + formDataObj.sitMod + " ...")
                            }
                            resolve(formDataObj)
                        }
                    },
                    willpower: {
                        icon: '<i class="fas fa-dice-d20"></i>',
                        label: "Willpower Mod",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            formDataObj.willMod = dataset.willMod
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) {
                                console.log('Form data object:', formDataObj)
                                console.log("Rolling save with Willpower mod: " + dataset.roll + " + " + formDataObj.willMod + " + " + formDataObj.sitMod + " ...")
                            }
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            console.log("Roll canceled!")
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => console.log("Register interactivity in the rendered dialog"),
                close: html => console.log("Dialog closed")
            })
            rollDialog.render(true)
        })
    }

    /**
     * Handle Set Attribute Mods confirmation dialog
     * @param dataset
     */
    static async ShowSetModifiersDialog(dataset) {
        // Dialog to confirm setting modifiers
        return new Promise((resolve, reject) => {
            new Dialog({
                title: "Confirm set/reset attribute modifiers",
                content: "Set attribute modifiers? This will replace any values already in place!",
                buttons: {
                    confirm: {
                        label: "Confirm",
                        icon: `<i class="fas fa-check"></i>`,
                        callback: () => {
                            // Set/reset all attribute modifiers
                            resolve()
                        }
                    },
                    cancel: {
                        label: "Cancel",
                        icon: `<i class="fas fa-times"></i>`,
                        callback: () => {
                            ui.notifications.info("Set attribute modifiers - canceled!")
                            reject()
                        }
                    }
                },
                default: "cancel",
                render: html => console.log("Register interactivity in the rendered dialog"),
                close: html => console.log("Dialog closed")
            }).render(true);
        })
    }
}
