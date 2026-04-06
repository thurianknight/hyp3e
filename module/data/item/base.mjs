// module/data/item/base.mjs
import { Hyp3eDataModel } from "../_utils.mjs";

export default class Hyp3eItemBase extends Hyp3eDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      friendlyName: new fields.StringField({ blank: true, initial: "" }),
      description: new fields.StringField({ blank: true, initial: "" }),
      identified: new fields.BooleanField({ initial: true }),
      realName: new fields.StringField({ blank: true, initial: "" }),
      realDescription: new fields.StringField({ blank: true, initial: "" }),
      itemAlias: new fields.StringField({ blank: true, initial: "" }),
      aliasDescription: new fields.StringField({ blank: true, initial: "" })
    };
  }
  
  /** 
   * Cleanup any missing or invalid data, and set up any derived values that AEs might modify.
   */
  prepareBaseData() {
    super.prepareBaseData?.();

    // Skip processing if this item is in a compendium
    if (this.parent.pack) return;

    // If the item is identified but has no realDescription, set it to the description
    if (this.identified && this.realDescription.trim() == "") {
      this.realDescription = this.description;
    }
    // If the item is identified but has no Description, set it to the realDescription
    if (this.identified && this.description.trim() == "") {
      this.description = this.realDescription;
    }
  }
}