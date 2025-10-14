import { Hyp3eLogger } from "./logger.mjs";

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
 * @returns 
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
 * Logic to handle buying an item from a merchant-actor
 * @param {*} buyer 
 * @param {*} merchant 
 * @param {*} item 
 * @returns 
 */
export async function handleMerchantPurchase(buyer, merchant, item) {
    const itemData = item.toObject();
    const basePrice = getItemBasePrice(itemData);
    const sellMult = parseFloat(merchant.system?.sellMultiplier) ?? 1.0;
    // Final price is rounded to the nearest .01, or half a copper piece
    const sellPrice = Math.round(basePrice * sellMult * 100)/100;
    const merchantQty = parseInt(item.system.quantity?.value) ?? 1;
    Hyp3eLogger.info("handleMerchantPurchase", `Seller's price in gp:`, sellPrice)

    const buyerFunds = getTotalMoney(buyer.system.money);
    Hyp3eLogger.info("handleMerchantPurchase", `Buyer's available funds in gp:`, buyerFunds)

    const maxQty = Math.min(merchantQty, Math.floor(buyerFunds / sellPrice));
    if (maxQty <= 0) {
        return ui.notifications.warn(`${buyer.name} cannot afford ${sellPrice} gp or the merchant is out of stock.`);
    }

    const qty = await Dialog.prompt({
        title: "Purchase Quantity",
        content: `
            <p>${merchant.name} has <strong>${merchantQty}</strong> ${item.name}(s) in stock at <strong>${sellPrice}</strong> gp each.</p>
            <p>
                <label>How many would you like to buy? (Max: ${maxQty})</label>
                <input type="number" id="qty" min="1" max="${maxQty}" value="1" 
                    style="width:80px; text-align: center;">
            </p>
            <p id="total" style="font-weight:bold;">Total: ${sellPrice.toFixed(2)} gp</p>
        `,
        label: "Buy",
        callback: html => {
            const val = parseInt(html.find("#qty").val() ?? "1");
            if (isNaN(val) || val < 0) return 0;
            return Math.clamped(val, 1, maxQty);
        },
        rejectClose: false,
        render: html => {
            const $input = html.find("#qty");
            const $total = html.find("#total");
            const updateTotal = () => {
                const val = Number($input.val());
                const qty = Math.clamped(Math.floor(val || 1), 1, maxQty);
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
        return ui.notifications.warn(`${buyer.name} cannot afford ${totalPrice} gp!`);
    }

    // Update money for buyer & seller
    await adjustMoney(buyer, -totalPrice);
    await adjustMoney(merchant, totalPrice);

    // Adjust the merchant's qty on hand
    const newMerchantQty = merchantQty - qty;
    if (newMerchantQty <= 0) {
        await item.delete(); // merchant sold out
    } else {
        await item.update({ "system.quantity.value": newMerchantQty });
    }

    // Check if the buyer already has this item (match by name & type)
    const existing = buyer.items.find(i =>
        i.name === item.name &&
        i.type === item.type &&
        !['armor','shield','weapon'].includes(i.type) // Don’t merge armor, shields, or weapons
    );

    // Add to buyer's existing qty or create new
    if (existing) {
        const newQty = toNumber(existing.system.quantity.value) + qty;
        await existing.update({ "system.quantity.value": newQty });
        ui.notifications.info(
            `${buyer.name} buys ${qty} ${item.name}(s) for ${totalPrice} gp (now owns ${newQty}).`
        );
    } else {
        itemData.system.quantity.value = qty;
        await buyer.createEmbeddedDocuments("Item", [itemData]);
        ui.notifications.info(
            `${buyer.name} buys ${qty} ${item.name}(s) for ${totalPrice} gp from ${merchant.name}.`
        );
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
    Hyp3eLogger.info("adjustMoney", `${actor.name} has ${totalCp} cp value in coin.`);

    // NOTE: 'cost' in gp may be a decimal number, not just an integer!
    //  But it must be an integer when converted to cp.
    const costCp = Math.round(cost / CP_VAL); // convert gp → cp (1 gp = 50 cp)
    const absCostCp = Math.abs(costCp);
    Hyp3eLogger.info("adjustMoney", `Item cost in cp: ${absCostCp}`);

    // Easy case: adding income to the seller, and exit here
    if (cost > 0) {
        const newTotalCp = totalCp + costCp;
        const newMoney = distributeCopperToCoins(newTotalCp);
        Hyp3eLogger.info("adjustMoney", `Adding coins to seller's purse:`, newMoney);
        await actor.update({ "system.money": newMoney });
        return true;
    }

    // Ensure affordability for negative cost (spending)
    if (cost < 0 && absCostCp > totalCp) {
        const msg = `${actor.name} cannot afford ${Math.abs(cost)} gp!`;
        Hyp3eLogger.warn("adjustMoney", msg)
        ui.notifications.warn(msg);
        return false;
    }

    // Spending money: smallest denominations first
    let accumulator = 0;
    const coins = ["cp", "sp", "ep", "gp", "pp"];

    // Zero out coins as we accumulate value toward the cost
    for (let c of coins) {
        accumulator += (toNumber(money[c].value)) * COIN_TO_CP[c];
        Hyp3eLogger.info("adjustMoney", `Converted ${c} to copper piece value: ${(toNumber(money[c].value)) * COIN_TO_CP[c]}`);
        money[c].value = 0;
        if (accumulator >= absCostCp) break;
    }

    // Subtract the cost
    let changeCp = accumulator - absCostCp;
    Hyp3eLogger.info("adjustMoney", `Remaining cp after purchase: ${changeCp}`);

    // Redistribute change into denominations
    const redistributed = distributeCopperToCoins(changeCp);
    Hyp3eLogger.info("adjustMoney", `Buyer's redistributed coin after purchase:`, redistributed);

    // Merge redistributed change into cleared money object
    for (let c of coins) {
        money[c].value = toNumber(money[c].value) + redistributed[c].value;
    }

    await actor.update({ "system.money": money });
    return true;
}

/**
 * Distribute a copper total into the optimal mix of coins, favoring gold as the standard.
 * Returns a money object matching the system format.
 */
export function distributeCopperToCoins(totalCp) {
    const result = {
        cp: { value: 0 },
        sp: { value: 0 },
        ep: { value: 0 },
        gp: { value: 0 },
        pp: { value: 0 }
    };

    const coins = ["pp", "gp", "ep", "sp", "cp"];
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