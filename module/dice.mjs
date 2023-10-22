import { HYP3E } from "./helpers/config";

export class Hyp3eDice {
  static async sendRoll({
    parts = [],
    data = {},
    title = null,
    flavor = null,
    speaker = null,
    form = null,
    chatMessage = true,
  } = {}) {
    const template = `${HYP3E.systemPath()}/templates/chat/roll-result.hbs`;

    let chatData = {
      user: game.user.id,
      speaker: speaker,
    };

    const templateData = {
      title: title,
      flavor: flavor,
      data: data,
    };

    // Optionally include a situational bonus
    if (form !== null && form.bonus.value) {
      parts.push(form.bonus.value);
    }

    //;
    const roll = new Roll(parts.join("+"), data).evaluate({ async: false });

    // Convert the roll to a chat message and return the roll
    let rollMode = game.settings.get("core", "rollMode");
    rollMode = form ? form.rollMode.value : rollMode;

    // Force blind roll (ability formulas)
    if (!form && data.roll.blindroll) {
      rollMode = game.user.isGM ? "selfroll" : "blindroll";
    }

    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
    if (rollMode === "blindroll") {
      chatData["blind"] = true;
      data.roll.blindroll = true;
    }

    templateData.result = Hyp3eDice.digestResult(data, roll);

    return new Promise((resolve) => {
      roll.render().then((r) => {
        templateData.rollHyp3e = r;
        renderTemplate(template, templateData).then((content) => {
          chatData.content = content;
          // Dice So Nice
          if (game.dice3d) {
            game.dice3d
              .showForRoll(
                roll,
                game.user,
                true,
                chatData.whisper,
                chatData.blind
              )
              .then((displayed) => {
                if (chatMessage !== false) ChatMessage.create(chatData);
                resolve(roll);
              });
          } else {
            chatData.sound = CONFIG.sounds.dice;
            if (chatMessage !== false) ChatMessage.create(chatData);
            resolve(roll);
          }
        });
      });
    });
  }

  static digestResult(data, roll) {
    let result = {
      isSuccess: false,
      isFailure: false,
      target: data.roll.target,
      total: roll.total,
    };

    let die = roll.terms[0].total;
    if (data.roll.type == "result") {
      if (roll.total == result.target) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.roll.type == "above") {
      // SAVING THROWS
      if (roll.total >= result.target) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.roll.type == "below") {
      // MORALE, EXPLORATION
      if (roll.total <= result.target) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.roll.type == "check") {
      // SCORE CHECKS (1s and 20s)
      if (die == 1 || (roll.total <= result.target && die < 20)) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.roll.type == "table") {
      // Reaction
      let table = data.roll.table;
      let output = Object.values(table)[0];
      for (let i = 0; i <= roll.total; i++) {
        if (table[i]) {
          output = table[i];
        }
      }
      result.details = output;
    }
    return result;
  }

  static attackIsSuccess(roll, thac0, ac) {
    // Natural 1
    if (roll.terms[0].results[0].result === 1) {
      return false;
    }
    // Natural 20
    if (roll.terms[0].results[0].result === 20) {
      return true;
    }
    if (roll.total + ac >= thac0) {
      return true;
    }
    return false;
  }

  static digestAttackResult(data, roll) {
    let result = {
      isSuccess: false,
      isFailure: false,
      target: "",
      total: roll.total,
    };
    result.target = data.roll.thac0;
    let targetActorData = data.roll.target?.actor?.system || null;

    const targetAc = data.roll.target ? targetActorData.ac.value : 9;
    result.victim = data.roll.target ? data.roll.target.name : null;

    if (!this.attackIsSuccess(roll, result.target, targetAc)) {
      result.details = game.i18n.format("HYP3E.messages.AttackFailure", {
        bonus: result.target,
      });
      result.isFailure = true;
      return result;
    }
    result.isSuccess = true;
    let value = Math.clamped(result.target - roll.total, -3, 9);
    result.details = game.i18n.format("HYP3E.messages.AttackSuccess", {
      result: value,
      bonus: result.target,
    });
    return result;
  }

  static async sendAttackRoll({
    parts = [],
    data = {},
    flags = {},
    title = null,
    flavor = null,
    speaker = null,
    form = null,
  } = {}) {
    if (!data.roll.dmg.filter(v => v !== '').length) {
      /**
       * @todo should this error be localized?
       */
      ui.notifications.error('Attack has no damage dice terms; be sure to set the attack\'s damage');
      return;
    }
    const template = `${HYP3E.systemPath()}/templates/chat/roll-attack.hbs`;
    let chatData = {
      user: game.user.id,
      speaker: speaker,
      flags: flags,
    };

    let templateData = {
      title: title,
      flavor: flavor,
      data: data,
      config: CONFIG.HYP3E,
    };

    // Optionally include a situational bonus
    if (form !== null && form.bonus.value) parts.push(form.bonus.value);

    const roll = new Roll(parts.join("+"), data).evaluate({ async: false });
    const dmgRoll = new Roll(data.roll.dmg.join("+"), data).evaluate({
      async: false,
    });

    // Convert the roll to a chat message and return the roll
    let rollMode = game.settings.get("core", "rollMode");
    rollMode = form ? form.rollMode.value : rollMode;

    // Force blind roll (ability formulas)
    if (data.roll.blindroll) {
      rollMode = game.user.isGM ? "selfroll" : "blindroll";
    }

    if (["gmroll", "blindroll"].includes(rollMode)) { chatData["whisper"] = ChatMessage.getWhisperRecipients("GM"); }
    if (rollMode === "selfroll") { chatData["whisper"] = [game.user._id]; }
    if (rollMode === "blindroll") {
      chatData["blind"] = true;
      data.roll.blindroll = true;
    }

    templateData.result = Hyp3eDice.digestAttackResult(data, roll);

    return new Promise((resolve) => {
      roll.render().then((r) => {
        templateData.rollHyp3e = r;
        dmgRoll.render().then((dr) => {
          templateData.rollDamage = dr;
          renderTemplate(template, templateData).then((content) => {
            chatData.content = content;
            // 2 Step Dice So Nice
            if (game.dice3d) {
              game.dice3d
                .showForRoll(
                  roll,
                  game.user,
                  true,
                  chatData.whisper,
                  chatData.blind
                )
                .then(() => {
                  if (templateData.result.isSuccess) {
                    templateData.result.dmg = dmgRoll.total;
                    game.dice3d
                      .showForRoll(
                        dmgRoll,
                        game.user,
                        true,
                        chatData.whisper,
                        chatData.blind
                      )
                      .then(() => {
                        ChatMessage.create(chatData);
                        resolve(roll);
                      });
                  } else {
                    ChatMessage.create(chatData);
                    resolve(roll);
                  }
                });
            } else {
              chatData.sound = CONFIG.sounds.dice;
              ChatMessage.create(chatData);
              resolve(roll);
            }
          });
        });
      });
    });
  }

  static async RollSave({
    parts = [],
    data = {},
    skipDialog = false,
    speaker = null,
    flavor = null,
    title = null,
    chatMessage = true,
  } = {}) {
    let rolled = false;
    const template = `${HYP3E.systemPath()}/templates/chat/roll-dialog.hbs`;
    let dialogData = {
      formula: parts.join(" "),
      data: data,
      rollMode: game.settings.get("core", "rollMode"),
      rollModes: CONFIG.Dice.rollModes,
    };

    let rollData = {
      parts: parts,
      data: data,
      title: title,
      flavor: flavor,
      speaker: speaker,
      chatMessage: chatMessage,
    };
    if (skipDialog) {
      return Hyp3eDice.sendRoll(rollData);
    }

    let buttons = {
      ok: {
        label: game.i18n.localize("HYP3E.Roll"),
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: (html) => {
          rolled = true;
          rollData.form = html[0].querySelector("form");
          roll = Hyp3eDice.sendRoll(rollData);
        },
      },
      willpower: {
        label: game.i18n.localize("HYP3E.saves.willpower.short"),
        icon: '<i class="fas fa-magic"></i>',
        callback: (html) => {
          rolled = true;
          rollData.form = html[0].querySelector("form");
          rollData.parts.push(`${rollData.data.roll.willpower}`);
          rollData.title += ` ${game.i18n.localize("HYP3E.saves.willpower.short")} (${
            rollData.data.roll.willpower
          })`;
          roll = Hyp3eDice.sendRoll(rollData);
        },
      },
      poison: {
        label: game.i18n.localize("HYP3E.saves.poison.short"),
        icon: '<i class="fas fa-magic"></i>',
        callback: (html) => {
          rolled = true;
          rollData.form = html[0].querySelector("form");
          rollData.parts.push(`${rollData.data.roll.poison}`);
          rollData.title += ` ${game.i18n.localize("HYP3E.saves.poison.short")} (${
            rollData.data.roll.poison
          })`;
          roll = Hyp3eDice.sendRoll(rollData);
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("HYP3E.Cancel"),
        callback: (html) => {},
      },
    };

    const html = await renderTemplate(template, dialogData);
    let roll;

    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: title,
        content: html,
        buttons: buttons,
        default: "ok",
        close: () => {
          resolve(rolled ? roll : false);
        },
      }).render(true);
    });
  }

  static async Roll({
    parts = [],
    data = {},
    skipDialog = false,
    speaker = null,
    flavor = null,
    title = null,
    chatMessage = true,
    flags = {},
  } = {}) {
    let rolled = false;
    const template = `${HYP3E.systemPath()}/templates/chat/roll-dialog.hbs`;
    let dialogData = {
      formula: parts.join(" "),
      data: data,
      rollMode: data.roll.blindroll
        ? "blindroll"
        : game.settings.get("core", "rollMode"),
      rollModes: CONFIG.Dice.rollModes,
    };
    let rollData = {
      parts: parts,
      data: data,
      title: title,
      flavor: flavor,
      speaker: speaker,
      chatMessage: chatMessage,
      flags: flags,
    };
    if (skipDialog) {
      return ["melee", "missile", "attack"].includes(data.roll.type)
        ? Hyp3eDice.sendAttackRoll(rollData)
        : Hyp3eDice.sendRoll(rollData);
    }

    let buttons = {
      ok: {
        label: game.i18n.localize("HYP3E.Roll"),
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: (html) => {
          rolled = true;
          rollData.form = html[0].querySelector("form");
          roll = ["melee", "missile", "attack"].includes(data.roll.type)
            ? Hyp3eDice.sendAttackRoll(rollData)
            : Hyp3eDice.sendRoll(rollData);
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("HYP3E.Cancel"),
        callback: (html) => {},
      },
    };

    const html = await renderTemplate(template, dialogData);
    let roll;

    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: title,
        content: html,
        buttons: buttons,
        default: "ok",
        close: () => {
          resolve(rolled ? roll : false);
        },
      }).render(true);
    });
  }
}
