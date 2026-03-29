// module/data/_utils.mjs
import { Hyp3eLogger } from "../helpers/logger.mjs";

export class Hyp3eDataModel extends foundry.abstract.TypeDataModel {

  // Helper to merge template objects into schema
  static mergeSchema(schema, ...templates) {
    for (const template of templates) {
      Object.assign(schema, typeof template === "function" ? template() : template);
    }
    return schema;
  }

  // If needed, migrate old data formats to new ones here
  static migrateData(source) {
    // Put any data migration logic here later
    return super.migrateData(source);
  }
}