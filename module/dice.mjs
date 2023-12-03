import { HYP3E } from "./helpers/config.mjs";

export class Hyp3eDice {
  /**
   * Handle roll dialogs
   * @param dataset
   */
  static async ShowBasicRollDialog(dataset) {
    // Get rollMode, if it was set to something other than default
    let rollMode = game.settings.get("core", "rollMode")
    if (dataset.rollMode) {
      rollMode = dataset.rollMode
    }
    let dialogData = {
      roll: dataset.roll,
      dataset: dataset,
      rollModes: CONFIG.Dice.rollModes,
      rollMode: rollMode
    }
    console.log("Roll-dialog Dataset: ", dataset)
    const template = `${HYP3E.systemRoot}/templates/dialog/roll-dialog.hbs`;
    const dialogHtml = await renderTemplate(template, dialogData);
    // console.log("Dialog HTML:", dialogHtml)

    // Roll dialog for everything except saving throws (for now at least)
    return new Promise((resolve, reject) => {
      const rollDialog = new Dialog({
        title: `${dataset.label}`,
        content: dialogHtml,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: "Roll",
            callback: (html) => {
              const formElement = html[0].querySelector('form');
              const formData = new FormDataExtended(formElement);
              const formDataObj = formData.toObject();
              // const formDataObj2 = formData.object();
              // No situational modifier? Set it to 0
              if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
              console.log('Form data object:', formDataObj);
              console.log("Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
              // ui.notifications.info("Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
              resolve(formDataObj)
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: (html) => {
              // console.log("Roll canceled!"); 
              ui.notifications.info("Roll canceled!")
              reject()
            }
          }
        },
        default: "roll",
        render: html => console.log("Register interactivity in the rendered dialog"),
        close: html => console.log("Dialog closed")
      });
      rollDialog.render(true);
    })
  }
  /**
   * Handle roll dialogs
   * @param dataset
   */
  static async ShowSaveRollDialog(dataset) {
    let dialogData = {
      roll: dataset.roll,
      dataset: dataset,
      rollModes: CONFIG.Dice.rollModes,
      rollMode: game.settings.get("core", "rollMode")  
    }
    console.log("Roll-dialog Dataset: ", dataset)
    const template = `${HYP3E.systemRoot}/templates/dialog/roll-dialog.hbs`;
    const dialogHtml = await renderTemplate(template, dialogData);
    // console.log("Dialog HTML:", dialogHtml)

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
              const formElement = html[0].querySelector('form');
              const formData = new FormDataExtended(formElement);
              const formDataObj = formData.toObject();
              // const formDataObj2 = formData.object();
              // No situational modifier? Set it to 0
              if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
              console.log('Form data object:', formDataObj);
              console.log("Rolling basic save: " + dataset.roll + " + " + formDataObj.sitMod + " ...")
              // ui.notifications.info("Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
              resolve(formDataObj)
            }
          },
          avoid: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: "Avoidance Mod",
            callback: (html) => {
              const formElement = html[0].querySelector('form');
              const formData = new FormDataExtended(formElement);
              const formDataObj = formData.toObject();
              // const formDataObj2 = formData.object();
              formDataObj.avoidMod = dataset.avoidMod
              // No situational modifier? Set it to 0
              if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
              console.log('Form data object:', formDataObj);
              console.log("Rolling with Avoidance mod: " + dataset.roll + " + " + formDataObj.avoidMod + " + " + formDataObj.sitMod + " ...")
              // ui.notifications.info("Rolling " + dataset.roll + " + " + formDataObj.avoidMod + " + " + formDataObj.sitMod + " ...")
              resolve(formDataObj)
            }
          },
          poison: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: "Poison/Rad Mod",
            callback: (html) => {
              const formElement = html[0].querySelector('form');
              const formData = new FormDataExtended(formElement);
              const formDataObj = formData.toObject();
              // const formDataObj2 = formData.object();
              formDataObj.poisonMod = dataset.poisonMod
              // No situational modifier? Set it to 0
              if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
              console.log('Form data object:', formDataObj);
              console.log("Rolling with Poison/Radiation mod: " + dataset.roll + " + " + formDataObj.poisonMod + " + " + formDataObj.sitMod + " ...")
              // ui.notifications.info("Rolling " + dataset.roll + " + " + formDataObj.poisonMod + " + " + formDataObj.sitMod + " ...")
              resolve(formDataObj)
            }
          },
          willpower: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: "Willpower Mod",
            callback: (html) => {
              const formElement = html[0].querySelector('form');
              const formData = new FormDataExtended(formElement);
              const formDataObj = formData.toObject();
              // const formDataObj2 = formData.object();
              formDataObj.willMod = dataset.willMod
              // No situational modifier? Set it to 0
              if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
              console.log('Form data object:', formDataObj);
              console.log("Rolling with Willpower mod: " + dataset.roll + " + " + formDataObj.willMod + " + " + formDataObj.sitMod + " ...")
              // ui.notifications.info("Rolling " + dataset.roll + " + " + formDataObj.willMod + " + " + formDataObj.sitMod + " ...")
              resolve(formDataObj)
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: (html) => {
              console.log("Roll canceled!"); 
              // ui.notifications.info("Roll canceled!")
              reject()
            }
          }
        },
        default: "roll",
        render: html => console.log("Register interactivity in the rendered dialog"),
        close: html => console.log("Dialog closed")
      });
      rollDialog.render(true);
    })
  }
}
