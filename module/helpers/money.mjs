import { Hyp3eLogger } from "./logger.mjs";
import { sendSimpleChat } from "../chat/chat.mjs"

// Coin value constants (in gp-equivalents)
export const PP_VAL = 5     // Platinum = 1:5 for gold
export const GP_VAL = 1     // Gold is our standard
export const EP_VAL = 0.5   // Electrum is 2:1 for gold
export const SP_VAL = 0.1   // Silver is 10:1 for gold
export const CP_VAL = 0.02  // Copper is 50:1 for gold

// Helper: relative coin values in CP
export const COIN_TO_CP = {
    cp: 1,
    sp: 5,
    ep: 25,
    gp: 50,
    pp: 250
};

/**
 * Parse a monetary value string into a GP value, if possible
 * @param {String} coinString 
 */
export function parseGpValue(coinString) {
    let value = 0.0
    let coin = ""

    // Strip off the coin type, if it exists
    const cleaned = String(coinString).trim();
    const match = cleaned.match(/^([\d,]+(?:\.\d+)?)\s*(pp|gp|ep|sp|cp)$/i);
    if (match) {
        const numeric = match[1].replace(/,/g, "");
        value = parseFloat(numeric);
        coin = match[2].toLowerCase();
    } else {
        const numericFallback = cleaned.replace(/,/g, "");
        value = parseFloat(numericFallback);
        coin = "gp"
    }
    // Were we able to get a numeric value?
    if (isNaN(value)) return null

    // Convert to gp, and return
    let gpValue;
    switch (coin) {
        case "pp": gpValue = Math.round((value * PP_VAL)*100)/100; break;
        case "gp": gpValue = Math.round((value)*100)/100; break;
        case "ep": gpValue = Math.round((value * EP_VAL)*100)/100; break;
        case "sp": gpValue = Math.round((value * SP_VAL)*100)/100; break;
        case "cp": gpValue = Math.round((value * CP_VAL)*100)/100; break;
        default: gpValue = null;
    }
    return gpValue;
}

/**
 * Take any valid number or numeric string and return a pure number
 * @param {*} value 
 * @returns {Number}
 */
export function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove commas, currency symbols, and trim spaces
    value = value.replace(/[^0-9.\-]/g, "");
  }
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

/**
 * Extract and convert the base price of an item to GP.
 */
export function getItemBasePrice(itemData) {
    // Example assumes cost is stored in gp
    return parseGpValue(itemData.system?.cost);
}

/**
 * Convert an actor's money object into a total gold-equivalent amount.
 */
export function getTotalMoney(money) {
    if (!money) return 0;
    return (
        toNumber(money.pp?.value) * PP_VAL +
        toNumber(money.gp?.value) * GP_VAL +
        toNumber(money.ep?.value) * EP_VAL +
        toNumber(money.sp?.value) * SP_VAL +
        toNumber(money.cp?.value) * CP_VAL
    );
}

/**
 * Handle buying an item from a merchant-actor
 * @param {*} buyer 
 * @param {*} merchant 
 * @param {*} item 
 * @returns 
 */
export async function buyFromMerchant(buyer, merchant, item) {
    const itemData = item.toObject();
    const basePrice = getItemBasePrice(itemData);
    const itemName = itemData.name;
    const sellMult = parseFloat(merchant.system?.sellMultiplier) ?? 1.0;
    // Final price is rounded to the nearest .01, or half a copper piece
    const sellPrice = Math.round(basePrice * sellMult * 100)/100;
    const merchantQty = parseInt(item.system.quantity?.value) ?? 1;
    Hyp3eLogger.info("buyFromMerchant", `Seller's price in gp:`, sellPrice)

    const buyerFunds = getTotalMoney(buyer.system.money);
    Hyp3eLogger.info("buyFromMerchant", `Buyer's available funds in gp:`, buyerFunds)

    let maxQty = 1000;
    if (!merchant.system.ignoreQty) {
        // Handle max purchase qty based on merchant qty on hand and buyer wealth
        if (merchantQty <= 0) {
            return ui.notifications.warn(`Merchant has no ${itemName} in inventory.`);
        }
        maxQty = Math.min(merchantQty, Math.floor(buyerFunds / sellPrice));
        if (maxQty <= 0) {
            return ui.notifications.warn(`${buyer.displayName} cannot afford ${sellPrice} gp.`);
        }
    } else {
        // Ignore merchant qty on hand, only consider buyer wealth
        maxQty = Math.floor(buyerFunds / sellPrice);
        if (maxQty <= 0) {
            return ui.notifications.warn(`${buyer.displayName} cannot afford ${sellPrice} gp.`);
        }
    }

    // Is the item sold in bundles?
    const bundleAmt = item.system.quantity?.bundle && item.system.quantity.bundle > 1
        ? `bundles of ${item.system.quantity.bundle}`
        : "";

    // Prompt for quantity to buy
    const qty = await Dialog.prompt({
        title: `${itemName} Purchase Quantity`,
        content: `
            <p>${merchant.displayName} has <strong>${merchantQty}</strong> ${item.name}(s) in stock at <strong>${sellPrice}</strong> gp each.</p>
            <p>
                <label>How many ${bundleAmt} to buy? (Max: ${maxQty})</label>
                <input type="number" id="qty" min="1" max="${maxQty}" value="1" 
                    style="width:80px; text-align: center;">
            </p>
            <p id="total" style="font-weight:bold;">Total: ${sellPrice.toFixed(2)} gp</p>
        `,
        label: "Buy",
        callback: html => {
            const val = parseInt(html.find("#qty").val() ?? "1");
            if (isNaN(val) || val < 0) return 0;
            return Math.clamp(val, 1, maxQty);
        },
        rejectClose: false,
        render: html => {
            const $input = html.find("#qty");
            const $total = html.find("#total");
            const updateTotal = () => {
                const val = Number($input.val());
                const qty = Math.clamp(Math.floor(val || 1), 1, maxQty);
                const total = Math.round(qty * sellPrice * 100) / 100;
                $total.text(`Total: ${total.toFixed(2)} gp`);
            };
            $input.on("input", updateTotal);
            $input.focus();
        }
    });
    if (!qty) return;

    const totalPrice = Math.round(sellPrice * qty * 100) / 100;

    // Check again whether the buyer can afford this item at this qty
    if (buyerFunds < totalPrice) {
        return ui.notifications.warn(`${buyer.displayName} cannot afford ${totalPrice} gp!`);
    }

    // Update money for buyer & seller
    await adjustMoney(buyer, -totalPrice);
    await adjustMoney(merchant, totalPrice);

    // Adjust the merchant's qty on hand
    if (!merchant.system.ignoreQty) {
        let newMerchantQty = 0;
        if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, reduce qty based on number of bundles sold
            const unitsSold = qty * item.system.quantity.bundle;
            newMerchantQty = Math.ceil(merchantQty - unitsSold, 0);
        } else {
            newMerchantQty = Math.ceil(merchantQty - qty, 0);
        }
        await item.update({ "system.quantity.value": newMerchantQty });
    }

    // Check if the buyer already has this item (match by name & type)
    const existing = buyer.items.find(i =>
        i.name === item.name &&
        i.type === item.type &&
        !i.system.isContainer &&
        !['armor','shield','weapon'].includes(i.type) // Don’t merge armor, shields, or weapons
    );

    // Add to buyer's existing qty or create new
    if (existing) {
        let newQty = 0;
        let bundlesOf = "";
        if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, increase qty based on number of bundles bought
            bundlesOf = `bundle(s) of ${item.system.quantity.bundle}`;
            const unitsBought = qty * item.system.quantity.bundle;
            newQty = toNumber(existing.system.quantity.value) + unitsBought;
        } else {
            newQty = toNumber(existing.system.quantity.value) + qty;
        }
        await existing.update({ "system.quantity.value": newQty, "system.quantity.max": newQty });

        const message = `${buyer.displayName} buys ${qty} ${bundlesOf} ${item.name}(s) for ${totalPrice} gp (now owns ${newQty}).`;
        sendSimpleChat(buyer, "", message);
        ui.notifications.info(message);

    } else {
        let bundlesOf = "";
        if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, set qty based on number of bundles bought
            bundlesOf = `bundles of ${item.system.quantity.bundle}`;
            const unitsBought = qty * item.system.quantity.bundle;
            itemData.system.quantity.value = unitsBought;
            itemData.system.quantity.max = unitsBought;
        } else {
            // Normal unbundled item
            itemData.system.quantity.value = qty;
            itemData.system.quantity.max = qty;
        }
        await buyer.createEmbeddedDocuments("Item", [itemData]);

        const message = `${buyer.displayName} buys ${qty} ${bundlesOf} ${item.name}(s) for ${totalPrice} gp from ${merchant.displayName}.`;
        sendSimpleChat(buyer, "", message);
        ui.notifications.info(message);

    }
}

/**
 * Handle selling an item to a merchant-actor
 * @param {*} buyer 
 * @param {*} merchant 
 * @param {*} item 
 * @returns 
 */
export async function sellToMerchant(merchant, seller, item) {
    const itemData = item.toObject();
    const basePrice = getItemBasePrice(itemData);
    const itemName = itemData.name;
    const buyMult = parseFloat(merchant.system?.buyMultiplier) ?? 1.0;
    // Final price is rounded to the nearest .01, or half a copper piece
    const buyPrice = Math.round(basePrice * buyMult * 100)/100;
    // const sellerQty = parseInt(item.system.quantity?.value) ?? 1;
    const sellerQty = toNumber(item.system.quantity?.value) ?? 1;
    Hyp3eLogger.info("sellToMerchant", `Merchant's buying price in gp:`, buyPrice)

    const merchantFunds = getTotalMoney(merchant.system.money);
    Hyp3eLogger.info("sellToMerchant", `Merchant's available funds in gp:`, merchantFunds)

    // Handle max purchase qty based on seller qty and merchant wealth
    if (sellerQty <= 0) {
        return ui.notifications.warn(`${seller.displayName} has no ${itemName} to sell!`);
    }
    const maxQty = Math.min(sellerQty, Math.floor(merchantFunds / buyPrice));
    if (maxQty <= 0) {
        return ui.notifications.warn(`${merchant.displayName} cannot afford ${buyPrice} gp.`);
    }

    // Is the item sold in bundles?
    const bundleAmt = item.system.quantity?.bundle && item.system.quantity.bundle > 1
        ? `bundles of ${item.system.quantity.bundle}`
        : "";

    const qty = await Dialog.prompt({
        title: `${itemName} Sell Quantity`,
        content: `
            <p>${seller.displayName} has <strong>${sellerQty}</strong> ${item.name}(s) to sell at <strong>${buyPrice}</strong> gp each.</p>
            <p>
                <label>How many ${bundleAmt} to sell? (Max: ${maxQty})</label>
                <input type="number" id="qty" min="1" max="${maxQty}" value="1" 
                    style="width:80px; text-align: center;">
            </p>
            <p id="total" style="font-weight:bold;">Total: ${buyPrice.toFixed(2)} gp</p>
        `,
        label: "Sell",
        callback: html => {
            const val = parseInt(html.find("#qty").val() ?? "1");
            if (isNaN(val) || val < 0) return 0;
            return Math.clamp(val, 1, maxQty);
        },
        rejectClose: false,
        render: html => {
            const $input = html.find("#qty");
            const $total = html.find("#total");
            const updateTotal = () => {
                const val = Number($input.val());
                const qty = Math.clamp(Math.floor(val || 1), 1, maxQty);
                const total = Math.round(qty * buyPrice * 100) / 100;
                $total.text(`Total: ${total.toFixed(2)} gp`);
            };
            $input.on("input", updateTotal);
            $input.focus();
        }
    });
    if (!qty) return;

    const totalPrice = Math.round(buyPrice * qty * 100) / 100;

    // Check again whether the merchant can afford this item at this qty
    if (merchantFunds < totalPrice) {
        return ui.notifications.warn(`${merchant.displayName} cannot afford ${totalPrice} gp!`);
    }

    // Update money for buyer & seller
    await adjustMoney(seller, totalPrice);
    await adjustMoney(merchant, -totalPrice);

    // Adjust the seller's qty on hand
    let newSellerQty = 0;
    if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
        // For bundled items, reduce qty based on number of bundles sold
        const unitsSold = qty * item.system.quantity.bundle;
        newSellerQty = Math.ceil(sellerQty - unitsSold, 0);
    } else {
        // Normal unbundled item
        newSellerQty = Math.ceil(sellerQty - qty, 0);
    }
    if (newSellerQty <= 0) {
        await item.delete(); // Seller sold it all
    } else {
        await item.update({ "system.quantity.value": newSellerQty, "system.quantity.max": newSellerQty });
    }

    // Check if the merchant already has this item (match by name & type)
    const existing = merchant.items.find(i =>
        i.name === item.name &&
        i.type === item.type
    );

    // Add to merchant's existing qty or create new
    if (existing) {
        let newQty = 0;
        let bundlesOf = "";
        if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, increase qty based on number of bundles bought
            bundlesOf = `bundle(s) of ${item.system.quantity.bundle}`;
            const unitsBought = qty * item.system.quantity.bundle;
            newQty = toNumber(existing.system.quantity.value) + unitsBought;
        } else {
            newQty = toNumber(existing.system.quantity.value) + qty;
        }
        await existing.update({ "system.quantity.value": newQty, "system.quantity.max": newQty });

        const message = `${merchant.displayName} buys ${qty} ${bundlesOf} ${item.name}(s) for ${totalPrice} gp (now owns ${newQty}).`;
        sendSimpleChat(merchant, "", message);
        ui.notifications.info(message);

    } else {
        if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
            // For bundled items, set qty based on number of bundles bought
            bundlesOf = `bundles of ${item.system.quantity.bundle}`;
            const unitsBought = qty * item.system.quantity.bundle;
            itemData.system.quantity.value = unitsBought;
            itemData.system.quantity.max = unitsBought;
        } else {
            // Normal unbundled item
            itemData.system.quantity.value = qty;
            itemData.system.quantity.max = qty;
        }
        await merchant.createEmbeddedDocuments("Item", [itemData]);

        const message = `${merchant.displayName} buys ${qty} ${bundlesOf} ${item.name}(s) for ${totalPrice} gp from ${seller.displayName}.`;
        sendSimpleChat(merchant, "", message);
        ui.notifications.info(message);

    }
}

/**
 * Adjusts an actor's money by a given amount (in gp-equivalent), spending smallest denominations first.
 * Handles proper denomination exchange and change-making.
 * Negative cost = spend money
 * Positive cost = gain money
 * @param {Actor} actor - Buyer
 * @param {number} cost - Total cost in gp
 */
export async function adjustMoney(actor, cost) {
    // Exit early if cost = 0, which shouldn't happen if items are setup correctly
    if (cost === 0) return true;

    // Clone the actor's money so we can work with it
    const money = foundry.utils.duplicate(actor.system.money);

    // Convert all holdings to copper for internal math
    const totalCp = Object.entries(money).reduce(
        (sum, [k, v]) => sum + (toNumber(v.value)) * COIN_TO_CP[k], 0
    );
    Hyp3eLogger.info("adjustMoney", `${actor.displayName} has ${totalCp} cp value in coin.`);

    // NOTE: 'cost' in gp may be a decimal number, not just an integer!
    //  But it must be an integer when converted to cp.
    const costCp = Math.round(cost / CP_VAL); // convert gp → cp (1 gp = 50 cp)
    const absCostCp = Math.abs(costCp);
    Hyp3eLogger.info("adjustMoney", `Item cost in cp: ${absCostCp}`);

    // Easy case: adding income to the seller, and exit here
    if (cost > 0) {
        // Convert the purchase cp value to distributed coin, and add to the seller's purse
        const newMoney = distributeCopperToCoins(costCp);
        Hyp3eLogger.info("adjustMoney", `Adding coins to seller's purse:`, newMoney);
        const mergeMoney = mergeStructuredMoney(money, newMoney);
        console.log(mergeMoney);
        await actor.update({ "system.money": mergeMoney });
        return true;
    }

    // Ensure affordability for negative cost (spending)
    if (cost < 0 && absCostCp > totalCp) {
        const msg = `${actor.displayName} cannot afford ${Math.abs(cost)} gp!`;
        Hyp3eLogger.warn("adjustMoney", msg)
        ui.notifications.warn(msg);
        return false;
    }

    // Spending money: smallest denominations first
    let accumulator = 0;
    const coins = ["cp", "sp", "ep", "gp", "pp"];
    const coinsUsed = [];

    // Zero out coins as we accumulate value toward the cost
    for (let c of coins) {
        accumulator += (toNumber(money[c].value)) * COIN_TO_CP[c];
        Hyp3eLogger.info("adjustMoney", `Converted ${c} to copper piece value: ${(toNumber(money[c].value)) * COIN_TO_CP[c]}`);
        money[c].value = 0;
        coinsUsed.push(c);
        if (accumulator >= absCostCp) break;
    }
    Hyp3eLogger.info("adjustMoney", `Coins used:`, coinsUsed);

    // Subtract the cost
    let changeCp = accumulator - absCostCp;
    Hyp3eLogger.info("adjustMoney", `Remaining cp after purchase: ${changeCp}`);

    // Redistribute change only among the used denominations
    const redistributed = distributeChangeToCoins(changeCp, coinsUsed);
    Hyp3eLogger.info("adjustMoney", `Buyer's localized change returned in same denominations:`, redistributed);

    // Merge redistributed change into cleared money object
    for (let c of coins) {
        money[c].value = toNumber(money[c].value) + redistributed[c].value;
    }

    await actor.update({ "system.money": money });
    return true;
}

/**
 * Distribute change (in copper) back to the payer using the same denominations that were spent.
 * This assumes coins were cleared starting from smallest → largest.
 */
export function distributeChangeToCoins(changeCp, coinsUsed) {
    const result = { cp:{value:0}, sp:{value:0}, ep:{value:0}, gp:{value:0}, pp:{value:0} };

    // Work backward from the last denomination used to pay
    for (let i = coinsUsed.length - 1; i >= 0; i--) {
        const c = coinsUsed[i];
        const coinValue = COIN_TO_CP[c];
        result[c].value = Math.floor(changeCp / coinValue);
        changeCp = changeCp % coinValue;
        if (changeCp <= 0) break;
    }

    // Any leftover rounding cp (should be zero) goes to cp
    if (changeCp > 0) result.cp.value += changeCp;

    return result;
}

/**
 * Distribute a copper total into the optimal mix of coins, favoring gold as the standard.
 * Returns a money object matching the format used by characters and merchants.
 */
export function distributeCopperToCoins(totalCp) {
    const result = {
        cp: { value: 0 },
        sp: { value: 0 },
        ep: { value: 0 },
        gp: { value: 0 },
        pp: { value: 0 }
    };

    // const coins = ["pp", "gp", "ep", "sp", "cp"];
    const coins = ["gp", "ep", "sp", "cp"];
    let remaining = totalCp;
    const PP_CAP = 0.1;

    // Process coins from highest to lowest value.
    //  Platinum is capped at 10% of total; gold absorbs the rest of the high-value share.
    for (let c of coins) {
        const coinValue = COIN_TO_CP[c];
        if (c === "pp") {
            // We could make this 10% cap a config option...
            const maxPlatinumInCp = Math.floor(totalCp * PP_CAP);
            const availableForPlatinum = Math.min(remaining, maxPlatinumInCp);

            result[c].value = Math.floor(availableForPlatinum / coinValue);
            remaining -= result[c].value * coinValue;
        } else {
            result[c].value = Math.floor(remaining / coinValue);
            remaining = remaining % coinValue;
        }
    }

    return result;
}

/**
 * Safely merge two structured money objects (e.g. from Foundry actor.system.money).
 * Does not mutate inputs.
 */
export function mergeStructuredMoney(a, b) {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const merged = {};

    for (const k of allKeys) {
        const aVal = Number(a[k]?.value) ?? 0;
        const bVal = Number(b[k]?.value) ?? 0;
        merged[k] = { value: aVal + bVal };
    }

    return merged;
}

/**
 * Handle transferring an item from another actor - like a treasure hoard
 * @param {*} recipient 
 * @param {*} giver 
 * @param {*} item 
 * @returns 
 */
export async function transferFromActor(recipient, giver, item) {
  const itemData = item.toObject();
  const itemName = itemData.name;
  const giverQty = toNumber(item.system.quantity?.value) ?? 1;

  // Handle max transfer qty based on giver qty on hand
  if (giverQty <= 0) {
    return ui.notifications.warn(`${giver.displayName} has no ${itemName} in inventory.`);
  }
  let maxQty = giverQty;

  // Is the item sold in bundles?
  const bundleAmt = item.system.quantity?.bundle && item.system.quantity.bundle > 1
    ? `bundles of ${item.system.quantity.bundle}`
    : "";

  // Prompt for quantity to transfer
  const qty = await Dialog.prompt({
    title: `${itemName} Transfer Quantity`,
    content: `
      <p>${giver.displayName} has <strong>${giverQty}</strong> ${item.name}(s).</p>
      <p>
        <label>How many ${bundleAmt} to transfer? (Max: ${maxQty})</label>
        <input type="number" id="qty" min="1" max="${maxQty}" value="1" 
          style="width:80px; text-align: center;">
      </p>
    `,
    label: "Transfer",
    callback: html => {
      const val = parseInt(html.find("#qty").val() ?? "1");
      if (isNaN(val) || val < 0) return 0;
      return Math.clamp(val, 1, maxQty);
    },
    rejectClose: false,
    render: html => {
      const $input = html.find("#qty");
      $input.focus();
    }
  });
  if (!qty) return;

  // Adjust the giver's qty on hand
  let newGiverQty = 0;
  if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
    // For bundled items, reduce qty based on number of bundles transferred
    const unitsTransferred = qty * item.system.quantity.bundle;
    newGiverQty = Math.ceil(giverQty - unitsTransferred, 0);
  } else {
    newGiverQty = Math.ceil(giverQty - qty, 0);
  }
  await item.update({ "system.quantity.value": newGiverQty });

  // Check if the recipient already has this item (match by name & type)
  const existing = recipient.items.find(i =>
    i.name === item.name &&
    i.type === item.type &&
    !i.system.isContainer &&
    !['armor','shield','weapon'].includes(i.type) // Don’t merge armor, shields, or weapons
  );

  // Add to recipient's existing qty or create new
  if (existing) {
    let newQty = 0;
    let bundlesOf = "";
    if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
      // For bundled items, increase qty based on number of bundles transferred
      bundlesOf = `bundle(s) of ${item.system.quantity.bundle}`;
      const unitsTaken = qty * item.system.quantity.bundle;
      newQty = toNumber(existing.system.quantity.value) + unitsTaken;
    } else {
      newQty = toNumber(existing.system.quantity.value) + qty;
    }
    await existing.update({ "system.quantity.value": newQty, "system.quantity.max": newQty });

    const message = `${recipient.displayName} takes ${qty} ${bundlesOf} ${item.name}(s) (now owns ${newQty}).`;
    sendSimpleChat(recipient, "", message);
    ui.notifications.info(message);

  } else {
    let bundlesOf = "";
    if (item.system.quantity.bundle && item.system.quantity.bundle > 1) {
      // For bundled items, set qty based on number of bundles bought
      bundlesOf = `bundles of ${item.system.quantity.bundle}`;
      const unitsTaken = qty * item.system.quantity.bundle;
      itemData.system.quantity.value = unitsTaken;
      itemData.system.quantity.max = unitsTaken;
    } else {
      // Normal unbundled item
      itemData.system.quantity.value = qty;
      itemData.system.quantity.max = qty;
    }
    await recipient.createEmbeddedDocuments("Item", [itemData]);

    const message = `${recipient.displayName} takes ${qty} ${bundlesOf} ${item.name}(s) from ${giver.displayName}.`;
    sendSimpleChat(recipient, "", message);
    ui.notifications.info(message);

  }
}

/**
 * Handle transferring coin from another actor
 * @param {*} recipient 
 * @param {*} giver 
 * @param {*} currency 
 * @returns 
 */
export async function transferCoinFromActor(recipient, giver, currency) {
  const coinLabel = currency.toUpperCase();
  const coin = giver.system.money[currency];
  if (!coin) {
    return ui.notifications.warn(`${giver.displayName} has no ${coinLabel}.`)
    return;
  }
  let giverAmount = toNumber(coin.value);

  // Prompt for amount to transfer
  const amount = await Dialog.prompt({
    title: `${coinLabel} Transfer Amount`,
    content: `
      <p>${giver.displayName} has <strong>${giverAmount}</strong> ${coinLabel}.</p>
      <p>
        <label>How many ${coinLabel} to transfer? (Max: ${giverAmount})</label>
        <input type="number" id="amount" min="1" max="${giverAmount}" value="1" 
          style="width:80px; text-align: center;">
      </p>
    `,
    label: "Transfer",
    callback: html => {
      const val = parseInt(html.find("#amount").val() ?? "1");
      if (isNaN(val) || val < 0) return 0;
      return Math.clamp(val, 1, giverAmount);
    },
    rejectClose: false,
    render: html => {
      const $input = html.find("#amount");
      $input.focus();
    }
  });
  if (!amount) return;

  // Adjust the giver's coin amount
  const fromMoney = foundry.utils.deepClone(giver.system.money);
  const fromCoin = toNumber(fromMoney[currency].value);
  fromMoney[currency].value = fromCoin - amount;
  await giver.update({ 'system.money': fromMoney });

  // Add to the recipient's coin amount
  const toMoney = foundry.utils.deepClone(recipient.system.money);
  const toCoin = toNumber(toMoney[currency]?.value) || 0;
  toMoney[currency].value = toCoin + amount;
  await recipient.update({ 'system.money': toMoney });

  const message = `${amount} ${coinLabel} transferred from ${giver.displayName} to ${recipient.displayName}.`;
  sendSimpleChat(recipient, "", message);
  ui.notifications.info(message);
}