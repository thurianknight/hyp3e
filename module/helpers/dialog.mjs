import { HYP3E } from "./config.mjs"
import { Hyp3eLogger } from "./logger.mjs"

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
        Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Dialog dataset:`, dataset);
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
                            if (CONFIG.HYP3E.flipRollUnderMods) {
                                Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Rolling ${dataset.roll} - ${formDataObj.sitMod}...`, formDataObj)
                            } else {
                                Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Rolling ${dataset.roll} + ${formDataObj.sitMod} ...`, formDataObj)
                            }
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Roll canceled!`)
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Register interactivity in the rendered dialog`),
                close: html => Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Dialog closed`)
            })
            rollDialog.render(true)
        })
    }

    /**
     * Handle attack dialogs
     * @param dataset
     */
    static async ShowAttackRollDialog(dataset) {
        // Default rollMode to public roll, the user can change it in the roll dialog
        let rollMode = "publicroll"
        let dialogData = {
            dataset: dataset,
            rollModes: CONFIG.Dice.rollModes,
            rollMode: rollMode,
            ammoTypes: dataset.carriedAmmo ?? null,
            selectedAmmo: dataset.selectedAmmo ?? null,
            rangeGroup: dataset.rangeGroup ?? null,
            ranges: dataset.ranges ?? null,
            chosen: dataset.chosenRange ?? null
        }
        // Log dataset, ammo, ranges
        Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Dialog dataset:`, dataset);
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
                            Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Rolling ${dataset.roll} + ${formDataObj.sitMod}...`, formDataObj)
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Roll canceled!`);
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Register interactivity in the rendered dialog`),
                close: html => Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Dialog closed`)
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
        Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Dialog dataset:`, dataset);
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
                            Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Rolling ${dataset.roll} + ${formDataObj.sitMod}...`, formDataObj)
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Roll canceled!`)
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Register interactivity in the rendered dialog`),
                close: html => Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Dialog closed`)
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
        Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Dialog dataset:`, dataset);
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
                            Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Rolling basic save: ${dataset.roll} + ${formDataObj.sitMod}...`, formDataObj)
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
                            Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Rolling save with Avoidance mod: ${dataset.roll} + ${formDataObj.avoidMod} + ${formDataObj.sitMod}...`, formDataObj)
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
                            Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Rolling save with Poison/Radiation mod: ${dataset.roll} + ${formDataObj.poisonMod} + ${formDataObj.sitMod}...`, formDataObj)
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
                            Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Rolling save with Willpower mod: ${dataset.roll} + ${formDataObj.willMod} + ${formDataObj.sitMod}...`, formDataObj)
                            resolve(formDataObj)
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: (html) => {
                            Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Roll canceled!`)
                            reject()
                        }
                    }
                },
                default: "roll",
                render: html => Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Register interactivity in the rendered dialog`),
                close: html => Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Dialog closed`)
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
                            ui.notifications.info("Hyp3eDialog Set attribute modifiers - canceled!")
                            reject()
                        }
                    }
                },
                default: "cancel",
                render: html => Hyp3eLogger.info("Hyp3eDialog ShowSetModifiersDialog", `Register interactivity in the rendered dialog`),
                close: html => Hyp3eLogger.info("Hyp3eDialog ShowSetModifiersDialog", `Dialog closed`)
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
                            ui.notifications.info("Hyp3eDialog Level up character - canceled!")
                            reject()
                        }
                    }
                },
                default: "cancel",
                render: html => Hyp3eLogger.info("Hyp3eDialog ShowLevelUpDialog", `Register interactivity in the rendered dialog`),
                close: html => Hyp3eLogger.info("Hyp3eDialog ShowLevelUpDialog", `Dialog closed`)
            }).render(true);
        })
    }
}
