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
  prepareData() {
    super.prepareData?.();

    // Skip processing if this item is in a compendium
    if (this.pack) return;

    // Setup the item's realName to be its name, if realName is blank
    if (this.realName.trim() == "") this.realName = this.parent.name;

    // If the item is identified but has no realDescription, set it to the description
    if (this.identified && this.realDescription.trim() == "") {
      this.realDescription = this.description;
    }
    // If the item is identified but has no Description, set it to the realDescription
    if (this.identified && this.description.trim() == "") {
      this.description = this.realDescription;
    }
  }

  /**
   * Check if this item is a light source based on its name. Return properties if found.
   * @param {*} name - Simple name of the light source, e.g. "Torch", "Lantern, Hooded", etc.
   * @returns 
   */
  _getLightSourceProperties() {
    // If the item hasn't been initialized yet, return null
    if (!this.parent.name || !this) return null;

    // Light source lookup table
    const lightSources = {
      "bonfire": { "radius": 60, "angle": 360, "color": null, "alpha": 0.5 },
      "campfire": { "radius": 40, "angle": 360, "color": null, "alpha": 0.5 },
      "candle": { "radius": 5, "angle": 360, "color": null, "alpha": 0.5 },
      "lantern": { "radius": 30, "angle": 360, "color": null, "alpha": 0.5 },
      "lantern_bullseye": { "radius": 60, "angle": 15, "color": null, "alpha": 0.5 },
      "lantern_hooded": { "radius": 30, "angle": 360, "color": null, "alpha": 0.5 },
      "torch": { "radius": 30, "angle": 360, "color": null, "alpha": 0.5 }
    };

    // Convert the name to lowercase and replace spaces with underscores
    let normalized = this.parent.name.toLowerCase().replace(/\s+/g, "_");
    // Remove hyphens, commas, and apostrophes
    normalized = normalized.replace(/[-,']/g, "");
    // Check if the normalized name exists in the lightSources table
    let lightSourceProps
    lightSourceProps = lightSources[normalized];
    if (lightSourceProps) {
      return lightSourceProps;
    }

    // Only if no name-match was found
    return null;
  }
}