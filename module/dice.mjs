import { HYP3E } from "./helpers/config.mjs";

export class Hyp3eDice {
  /**
   * Handle roll dialogs
   * @param dataset
   */
  static async GetDialogOutput(dataset) {
    return new Promise((resolve, reject) => {

      const dialogHtml = `
        <form>
        <div class='flexrow form-group'>
          <label class='resource-label'>Formula: </label>
          <input type='text' name='data-roll' value=${dataset.roll} disabled />
        </div>
        <div class='flexrow form-group'>
          <label class='resource-label'>Situational Modifier: </label>
          <input type='text' name='sitMod' value="0" />
        </div>
        <div class='flexrow form-group'>
          <label class='resource-label'>Roll Mode: </label>
          <input type='text' name='rollMode' value=${dataset.rollMode} />
        </div>
        </form>
      `

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
              console.log('Form data object:', formDataObj);
              // console.log("Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
              ui.notifications.info("Rolling " + dataset.roll + " + " + formDataObj.sitMod + " ...")
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

}
