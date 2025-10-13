import { Hyp3eLogger } from "./logger.mjs";

// Set coin values vs. gp
export const PP_VAL = 5     // Platinum = 1:5 for gold
export const GP_VAL = 1     // Gold is our standard
export const EP_VAL = 0.5   // Electrum is 2:1 for gold
export const SP_VAL = 0.1   // Silver is 10:1 for gold
export const CP_VAL = 0.02  // Copper is 50:1 for gold

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
        parseInt(money.pp?.value ?? 0) * PP_VAL +
        parseInt(money.gp?.value ?? 0) * GP_VAL +
        parseInt(money.ep?.value ?? 0) * EP_VAL +
        parseInt(money.sp?.value ?? 0) * SP_VAL +
        parseInt(money.cp?.value ?? 0) * CP_VAL
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
    const sellMult = merchant.system?.sellMultiplier ?? 1.0;
    // Final price is rounded to the nearest .01, or half a copper piece
    const sellPrice = Math.round(basePrice * sellMult * 100)/100;
    const merchantQty = item.system.quantity?.value ?? 1;
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
        const newQty = (existing.system.quantity.value ?? 1) + qty;
        await existing.update({ "system.quantity": newQty });
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
 * Deducts an amount (in gp) from an actor's money, spending smallest coins first.
 * @param {Actor} actor - Buyer
 * @param {number} cost - Total cost in gp
 */
export async function adjustMoney(actor, cost) {
    const money = foundry.utils.duplicate(actor.system.money);
    const totalFunds = getTotalMoney(money);
    const absCost = Math.abs(cost);

    if (cost < 0 && absCost > totalFunds) {
        ui.notifications.warn(`${actor.name} cannot afford ${absCost} gp!`);
        return false;
    }

    // Coin denominations (smallest to largest)
    const coins = [
        { key: "cp", relativeGpValue: CP_VAL },
        { key: "sp", relativeGpValue: SP_VAL },
        { key: "ep", relativeGpValue: EP_VAL },
        { key: "gp", relativeGpValue: GP_VAL },
        { key: "pp", relativeGpValue: PP_VAL }
    ];

    // Deducting (cost is negative)
    if (cost < 0) {
        let remaining = absCost;

        // Make change if needed
        for (let i = 0; i < coins.length - 1; i++) {
            const { key, relativeGpValue } = coins[i];
            if (money[key].value * relativeGpValue < remaining) {
                // Not enough of this coin; break 1 of next larger coin down to this one
                const next = coins[i + 1];
                while (money[key].value * relativeGpValue < remaining && money[next.key].value > 0) {
                    // Break one larger coin into equivalent smaller coins
                    money[next.key].value -= 1;
                    const smallerCoins = next.relativeGpValue / relativeGpValue;
                    money[key].value += smallerCoins;
                }
            }
        }

        // Spend from smallest denomination to largest
        for (let { key, relativeGpValue } of coins) {
            const coinWorth = money[key].value * relativeGpValue;
            if (coinWorth >= remaining) {
                const coinsToSpend = Math.ceil(remaining / relativeGpValue);
                money[key].value -= coinsToSpend;
                remaining = 0;
                break;
            } else {
                money[key].value = 0;
                remaining -= coinWorth;
            }
        }

        if (remaining > 0.0001) {
            // Floating point tolerance
            ui.notifications.warn(`${actor.name} lacks enough coin denominations to pay ${absCost} gp.`);
            return false;
        }

    } else if (cost > 0) {
        // Adding money (merchant income) — simple
        const gpToAdd = cost; // in gold-equivalent
        money.gp.value += gpToAdd;
    }

    // Round coins to nearest integer to prevent fractions
    for (let c of coins) { money[c.key].value = Math.floor(money[c.key].value); }

    await actor.update({ "system.money": money });
    return true;
}

/**
 * Adjust actor's money by a given amount in gold.
 * Will distribute across gp primarily, but you can expand this to rebalance coins.
 */
// export async function adjustMoney(actor, amountGP) {
//     const money = foundry.utils.duplicate(actor.system.money);

//     // Convert the actor's entire purse to gp first
//     let totalGP = getTotalMoney(money);
//     totalGP += amountGP; // add or subtract

//     if (totalGP < 0) totalGP = 0;

//     // simplify back into gp (you could later re-expand if desired)
//     money.cp.value = 0;
//     money.sp.value = 0;
//     money.ep.value = 0;
//     money.pp.value = Math.floor(totalGP / PP_VAL);
//     money.gp.value = Math.floor(totalGP % PP_VAL);

//     await actor.update({ "system.money": money });
// }