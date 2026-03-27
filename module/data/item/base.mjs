// module/data/item/base.mjs
import { SystemDataModel } from "../_utils.mjs";

export default class Hyp3eItemBase extends SystemDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      friendlyName: new fields.StringField({ blank: true }),
      description: new fields.StringField({ blank: true }),
      identified: new fields.BooleanField({ initial: true }),
      realName: new fields.StringField({ blank: true }),
      realDescription: new fields.StringField({ blank: true }),
      itemAlias: new fields.StringField({ blank: true }),
      aliasDescription: new fields.StringField({ blank: true })
    };
  }
}