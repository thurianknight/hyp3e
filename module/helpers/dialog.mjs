import { HYP3E } from "./config.mjs"

export class Hyp3eDialog {
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
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("ShowBasicRollDialog: dataset: ", dataset) }
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
                        label: dataset.rollButtonLabel,
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) { 
                                console.log('ShowBasicRollDialog: Form data object:', formDataObj)
                                if (CONFIG.HYP3E.flipRollUnderMods) {
                                    console.log("ShowBasicRollDialog: Rolling " + dataset.roll + " - " + formDataObj.sitMod + " ...")
                                } else {
                                    console.log("ShowBasicRollDialog: Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
                                }
                            }
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            if (CONFIG.HYP3E.debugMessages) { console.log("ShowBasicRollDialog: Roll canceled!") }
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => console.log("ShowBasicRollDialog: Register interactivity in the rendered dialog"),
                close: html => console.log("ShowBasicRollDialog: Dialog closed")
            })
            rollDialog.render(true)
        })
    }

    /**
     * Handle attack dialogs
     * @param dataset
     */
    static async ShowAttackRollDialog(dataset, ammoTypes = null, rangeGroup = null, ranges = null, chosen = null) {
        // Default rollMode to public roll, the user can change it in the roll dialog
        let rollMode = "publicroll"
        let dialogData = {
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode,
            ammoTypes: ammoTypes,
            rangeGroup: rangeGroup,
            ranges: ranges,
            chosen: chosen
        }
        // Log dataset, ammo, ranges
        if (CONFIG.HYP3E.debugMessages) { console.log("ShowAttackRollDialog: dataset: ", dataset) }
        if (CONFIG.HYP3E.debugMessages) { console.log("ShowAttackRollDialog: ammo types: ", ammoTypes) }
        if (CONFIG.HYP3E.debugMessages) { console.log("ShowAttackRollDialog: ranges: ", ranges) }
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
                            if (CONFIG.HYP3E.debugMessages) { console.log("ShowAttackRollDialog: Roll canceled!") }
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => console.log("ShowAttackRollDialog: Register interactivity in the rendered dialog"),
                close: html => console.log("ShowAttackRollDialog: Dialog closed")
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
            // roll: dataset.roll,
            enableRoll: dataset.enableRoll,
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("ShowSpellcastingDialog: dataset: ", dataset) }
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
                        label: "Cast Spell",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) {
                                console.log('ShowSpellcastingDialog: Form data object:', formDataObj)
                                console.log("ShowSpellcastingDialog: Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
                            }
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            console.log("ShowSpellcastingDialog: Roll canceled!")
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => console.log("ShowSpellcastingDialog: Register interactivity in the rendered dialog"),
                close: html => console.log("ShowSpellcastingDialog: Dialog closed")
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
            // roll: dataset.roll,
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode
        }
        if (CONFIG.HYP3E.debugMessages) { console.log("ShowSaveRollDialog: dataset: ", dataset) }
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
                        label: "Roll Save",
                        callback: (html) => {
                            const formElement = html[0].querySelector('form')
                            const formData = new FormDataExtended(formElement)
                            const formDataObj = formData.object
                            // No situational modifier? Set it to 0
                            if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
                            if (CONFIG.HYP3E.debugMessages) {
                                console.log('ShowSaveRollDialog: Form data object:', formDataObj)
                                console.log("ShowSaveRollDialog: Rolling basic save: " + dataset.roll + " + " + formDataObj.sitMod + " ...")
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
                                console.log('ShowSaveRollDialog: Form data object:', formDataObj)
                                console.log("ShowSaveRollDialog: Rolling save with Avoidance mod: " + dataset.roll + " + " + formDataObj.avoidMod + " + " + formDataObj.sitMod + " ...")
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
                                console.log('ShowSaveRollDialog: Form data object:', formDataObj)
                                console.log("ShowSaveRollDialog: Rolling save with Poison/Radiation mod: " + dataset.roll + " + " + formDataObj.poisonMod + " + " + formDataObj.sitMod + " ...")
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
                                console.log('ShowSaveRollDialog: Form data object:', formDataObj)
                                console.log("ShowSaveRollDialog: Rolling save with Willpower mod: " + dataset.roll + " + " + formDataObj.willMod + " + " + formDataObj.sitMod + " ...")
                            }
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            console.log("ShowSaveRollDialog: Roll canceled!")
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => console.log("ShowSaveRollDialog: Register interactivity in the rendered dialog"),
                close: html => console.log("ShowSaveRollDialog: Dialog closed")
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
                render: html => console.log("ShowSetModifiersDialog: Register interactivity in the rendered dialog"),
                close: html => console.log("ShowSetModifiersDialog: Dialog closed")
            }).render(true);
        })
    }

    /**
     * Handle Level-Up confirmation dialog
     * @param dataset
     */
    static async ShowLevelUpDialog(dataset) {
        // Dialog to confirm setting modifiers
        return new Promise((resolve, reject) => {
            new Dialog({
                title: "Confirm character level-up",
                content: "Level up character? This will replace any values already in place!",
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
                            ui.notifications.info("Level up character - canceled!")
                            reject()
                        }
                    }
                },
                default: "cancel",
                render: html => console.log("ShowLevelUpDialog: Register interactivity in the rendered dialog"),
                close: html => console.log("ShowLevelUpDialog: Dialog closed")
            }).render(true);
        })
    }
}
