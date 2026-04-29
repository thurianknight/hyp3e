// systems/hyp3e/module/apps/turn-tracker-app-v2.mjs
import { HYP3E } from "../helpers/config.mjs"
import { Hyp3eLogger } from "../helpers/logger.mjs";
import { TurnAdvanceActionsConfig } from "./turn-advance-actions-config.mjs";

const {
  HandlebarsApplicationMixin,
  ApplicationV2
} = foundry.applications.api;

export class HYP3ETurnTrackerAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "hyp3e-turn-tracker",
    tag: "section",
    classes: ["hyp3e-turn-tracker"],
    window: {
      title: "Turn Tracker",
      headerDragHandle: ".window-content",
      resizable: false,
    },
    position: {
      width: 292,
      height: "auto"
    },
    form: {
      submitOnChange: false,
      closeOnSubmit: false,
      submitOnClose: false,
    },
    // actions: {
    //   openCalendar: HYP3ETurnTrackerAppV2.#openCalendar,
    //   retreatTurn: HYP3ETurnTrackerAppV2.#retreatTurn,
    //   advanceTurn: HYP3ETurnTrackerAppV2.#advanceTurn,
    //   resetTurn: HYP3ETurnTrackerAppV2.#resetTurn,
    //   showTurn: HYP3ETurnTrackerAppV2.#showTurn,
    //   openTurnActions: HYP3ETurnTrackerAppV2.#openTurnActions,
    //   toggleMode: HYP3ETurnTrackerAppV2.#toggleMode,
    // }
  };

  /** Path to the Handlebars template */
  static PARTS = {
    content: {
      template: `${HYP3E.templatePath}/apps/turn-tracker-app-v2.hbs`,
    }
  };

  static _hooksRegistered = false;

  static phobosIcons = {
    "New": `${HYP3E.assetsPath}/moon-phases/moon-phobos-new.png`,
    "Waxing Crescent": `${HYP3E.assetsPath}/moon-phases/moon-phobos-waxing-crescent.png`,
    "First Quarter": `${HYP3E.assetsPath}/moon-phases/moon-phobos-first-quarter.png`,
    "Waxing Gibbous": `${HYP3E.assetsPath}/moon-phases/moon-phobos-waxing-gibbous.png`,
    "Full": `${HYP3E.assetsPath}/moon-phases/moon-phobos-full.png`,
    "Waning Gibbous": `${HYP3E.assetsPath}/moon-phases/moon-phobos-waning-gibbous.png`,
    "Third Quarter": `${HYP3E.assetsPath}/moon-phases/moon-phobos-third-quarter.png`,
    "Waning Crescent": `${HYP3E.assetsPath}/moon-phases/moon-phobos-waning-crescent.png`,
  };
  static seleneIcons = {
    "New": `${HYP3E.assetsPath}/moon-phases/moon-selene-new.png`,
    "Waxing Crescent": `${HYP3E.assetsPath}/moon-phases/moon-selene-waxing-crescent.png`,
    "First Quarter": `${HYP3E.assetsPath}/moon-phases/moon-selene-first-quarter.png`,
    "Waxing Gibbous": `${HYP3E.assetsPath}/moon-phases/moon-selene-waxing-gibbous.png`,
    "Full": `${HYP3E.assetsPath}/moon-phases/moon-selene-full.png`,
    "Waning Gibbous": `${HYP3E.assetsPath}/moon-phases/moon-selene-waning-gibbous.png`,
    "Third Quarter": `${HYP3E.assetsPath}/moon-phases/moon-selene-third-quarter.png`,
    "Waning Crescent": `${HYP3E.assetsPath}/moon-phases/moon-selene-waning-crescent.png`,
  };

  constructor(options = {}) {
    super(options);

    // Only register hooks once
    if (!HYP3ETurnTrackerAppV2._hooksRegistered) {
      Hooks.on("explorationTurnAdvanced", this._onTurnAdvanced.bind(this));
      Hooks.on("explorationTurnRetreat", this._onTurnRetreat.bind(this));
      Hooks.on("explorationTurnReset", this._onTurnReset.bind(this));
      HYP3ETurnTrackerAppV2._hooksRegistered = true;
      Hyp3eLogger.info("HYP3ETurnTrackerAppV2 constructor", "Registered turn tracker hooks.");
    }
  }

  _prepareContext(options) {
    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _prepareContext", `Turn Tracker options:`, options);
    const currentTurn = game.hyp3e.turnTracker.getTurn();
    const timeString = game.hyp3e.calendar.formatTime(game.hyp3e.calendar.getCurrentTime());
    const dateString = game.hyp3e.calendar.formatDate(game.hyp3e.calendar.getCurrentDate(), false);

    // const date = game.hyp3e.calendar.getCurrentDate();
    const daylightHours = game.hyp3e.turnTracker.getCurrentDaylightHours();
    const daylightFormatted =  game.hyp3e.turnTracker.formatDaylightAsHHMM(daylightHours);
    const assetsPath = HYP3E.assetsPath;

    // Calculate sun/moon visibility and moon phases
    const { sunOpacity, moonOpacity, phobosPhase, selenePhase } = this._getSunAndMoons();

    const context = { 
      currentTurn, 
      timeString, 
      showDateInTurnTracker: game.settings.get(game.system.id, "showDateInTurnTracker"),
      currentDate: dateString,
      daylightFormatted,
      assetsPath,
      sunOpacity,
      phobosIcon: HYP3ETurnTrackerAppV2.phobosIcons[phobosPhase] ?? null,
      phobosPhase,
      seleneIcon: HYP3ETurnTrackerAppV2.seleneIcons[selenePhase] ?? null,
      selenePhase,
      moonOpacity,
      isGM: game.user.isGM, 
      mode: game.settings.get("hyp3e", "turnTrackerMode") 
    }
    Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _prepareContext", `Turn Tracker context:`, context);
    return context;
  }

  async render(force = false, options = {}) {
    const mode = game.settings.get("hyp3e", "turnTrackerMode");

    // Always clean up embedded version first
    this.closeEmbedded();
    Hyp3eLogger.info("HYP3ETurnTrackerAppV2 render", `Rendering Turn Tracker in ${mode} mode:`, this);

    // Render the template with current data
    const context = await this._prepareContext();
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      HYP3ETurnTrackerAppV2.PARTS.content.template,
      context
    );
    const $html = $(htmlString).addClass("turn-tracker").addClass(mode);

    if (mode === "embedded") {
      // Insert html element before chat input area
      $(".chat-form").before($html);
    } else {
      // Floating HUD mode
      const container = document.getElementById("ui-overlay") ?? document.body;
      if (!container) {
        Hyp3eLogger.error("HYP3ETurnTrackerAppV2 render", `UI overlay container not found!`);
        return this;
      }
      container.appendChild($html[0]);

      // Apply saved position (fallback if missing)
      let pos = game.settings.get("hyp3e", "turnTrackerPos");
      if (!pos || isNaN(pos.top) || isNaN(pos.left)) {
        pos = { top: 100, left: 300 };
      }
      $html.css({
        position: "absolute",
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        zIndex: 70
      });

      // Manual dragging — no reliance on app.setPosition or this.element
      let isDragging = false;
      let dragOffset = { x: 0, y: 0 };

      const startDrag = (e) => {
        if (e.button !== 0) return; // Left click only
        isDragging = true;
        const rect = $html[0].getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        // Bring to front
        let maxZ = 70; // Base z-index for floating trackers
        $("#ui-overlay > .turn-tracker.floating").each((_, el) => {
          const z = parseInt($(el).css("z-index")) || 70;
          if (z > maxZ) maxZ = z;
        });
        $html.css("z-index", maxZ + 1);
      };

      const doDrag = (e) => {
        if (!isDragging) return;
        const newTop = e.clientY - dragOffset.y;
        const newLeft = e.clientX - dragOffset.x;
        $html.css({
          top: `${newTop}px`,
          left: `${newLeft}px`
        });
      };

      const endDrag = () => {
        if (isDragging) {
          isDragging = false;
          const rect = $html[0].getBoundingClientRect();
          game.settings.set("hyp3e", "turnTrackerPos", {
            top: Math.round(rect.top),
            left: Math.round(rect.left)
          });
        }
      };

      // Attach listeners (remove old ones first to avoid duplicates)
      $html.off("mousedown.drag touchstart.drag")
           .on("mousedown.drag touchstart.drag", startDrag);
      $(document).off("mousemove.drag touchmove.drag").on("mousemove.drag touchmove.drag", doDrag)
                 .off("mouseup.drag touchend.drag").on("mouseup.drag touchend.drag", endDrag);

      // Bring to front on mousedown (local to #ui-overlay)
      $html.on("mousedown.turnTracker", () => {
        let maxZ = 70; // Base z-index for floating trackers
        $("#ui-overlay > .turn-tracker.floating").each((_, el) => {
          const z = parseInt($(el).css("z-index")) || 70;
          if (z > maxZ) maxZ = z;
        });

        $html.css("z-index", maxZ + 1);
      });
    }

    this._embeddedElement = $html;
    this._bindButtons($html);

    // Update display with current turn info
    // this.updateTurnDisplay(context.currentTurn);
    this._refreshDisplay();

    return this;
  }

  async close(options = {}) {
    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 close", "Method close() called.");
    this.closeEmbedded();
    return super.close(options);
  }

  /** Remove the embedded DOM (if any) and clean references */
  closeEmbedded() {
    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 closeEmbedded", "Method closeEmbedded() called.");
    if (this._embeddedElement) {
      this._embeddedElement.remove();
      this._embeddedElement = null;
    }
  }

  _onRender(context, options) {
    super._onRender(context, options);
    Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _onRender", `Turn Tracker render parameters:`, {context, options})
  }

  _bindButtons($html) {
    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _bindButtons", "Method _bindButtons() called.", $html);
    // Manual binding of data-action buttons required since we rendered the app manually
    $html.find('[data-action="openCalendar"]').on("click", () => HYP3ETurnTrackerAppV2.#openCalendar());
    $html.find('[data-action="retreatTurn"]').on("click", async () => await HYP3ETurnTrackerAppV2.#retreatTurn());
    $html.find('[data-action="advanceTurn"]').on("click", async () => await HYP3ETurnTrackerAppV2.#advanceTurn());
    $html.find('[data-action="resetTurn"]').on("click", async () => await HYP3ETurnTrackerAppV2.#resetTurn());
    $html.find('[data-action="showTurn"]').on("click", () => HYP3ETurnTrackerAppV2.#showTurn());
    $html.find('[data-action="openTurnActions"]').on("click", () => HYP3ETurnTrackerAppV2.#openTurnActions());
    $html.find('[data-action="toggleMode"]').on("click", async (event) => {
      await HYP3ETurnTrackerAppV2.#toggleMode()
      // Close current render and re-render in new mode — happens instantly
      await this.close();
      await this.render(true);
    });
  }

  _onTurnAdvanced(data) {
    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _onTurnAdvanced", "Turn advanced:", data);
    // this.updateTurnDisplay(data);
    this._refreshDisplay();
  }

  _onTurnRetreat(data) {
    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _onTurnRetreat", "Turn retreat:", data);
    // this.updateTurnDisplay(data);
    this._refreshDisplay();
  }

  _onTurnReset(data) {
    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _onTurnReset", "Turn reset:", data);
    // this.updateTurnDisplay(data);
    this._refreshDisplay();
  }

  static #openCalendar(event, target) {
    game.hyp3e.openCalendar();
  }

  static async #retreatTurn(event, target) {
    await game.hyp3e.turnTracker.retreatTurn();
    if (game.hyp3e?.calendar) {
      game.hyp3e.calendar.render(false);
    }
  }

  static async #advanceTurn(event, target) {
    await game.hyp3e.turnTracker.advanceTurn();
    if (game.hyp3e?.calendar) {
      game.hyp3e.calendar.render(false);
    }
  }

  static async #resetTurn(event, target) {
    await game.hyp3e.turnTracker.resetTurn();
    if (game.hyp3e?.calendar) {
      game.hyp3e.calendar.render(false);
    }
  }

  static #showTurn(event, target) {
    const turn = game.hyp3e.turnTracker.getTurn();
    const timeString = game.hyp3e.calendar.formatTime(game.hyp3e.calendar.getCurrentTime());
    ChatMessage.create({
      user: game.user.id,
      content: `Current exploration turn: ${turn}, time is ${timeString}.`
    });
  }

  static #openTurnActions(event, target) {
    new TurnAdvanceActionsConfig().render(true);
  }

  /**
   * Switch between embedded and floating mode.
   * @param {*} event 
   * @param {*} target 
   */
  static async #toggleMode(event, target) {
    // event.preventDefault();
    const currentMode = game.settings.get("hyp3e", "turnTrackerMode");
    const newMode = currentMode === "embedded" ? "floating" : "embedded";

    // Save position before switching (if currently floating)
    if (currentMode === "floating" && this._embeddedElement) {
      // const { top, left, width, height } = this.position;
      const rect = this._embeddedElement[0].getBoundingClientRect();
      await game.settings.set("hyp3e", "turnTrackerPos", {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
    await game.settings.set("hyp3e", "turnTrackerMode", newMode);
  }

  /**
   * Calculate the current daylight level and moon phases and return them to the caller
   * @returns {Object} - float sunOpacity, float moonOpacity, string phobosPhase, string selenePhase
   */
  _getSunAndMoons() {
    const date = game.hyp3e.calendar.getCurrentDate();
    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _getSunAndMoons", `Current date:`, date);
    // Sun visibility scales with dawn/daylight/dusk, invisible at night
    const daylightFraction = game.hyp3e.turnTracker.getDaylightFraction();
    const sunOpacity = daylightFraction;
    // Moons visibility scales inversely (brighter at night), but never goes fully invisible
    const moonOpacity = Math.max(1 - daylightFraction, 0.2);
    // Get each moon's phase
    const phobosPhase = game.hyp3e.calendar.getMoonPhase(date.year, date.month, date.day, "Phobos");
    const selenePhase = game.hyp3e.calendar.getMoonPhase(date.year, date.month, date.day, "Selene");

    return { sunOpacity, moonOpacity, phobosPhase, selenePhase };
  }

  /**
   * Refresh only the dynamic parts of the Turn Tracker (turn, time, date)
   * without doing a full re-render. Safe to call from hooks on any client.
   */
  _refreshDisplay() {
    if (!this._embeddedElement) {
      // If somehow the element is gone, do a light re-render
      this.render(false);
      return;
    }

    // Hyp3eLogger.info("HYP3ETurnTrackerAppV2 _refreshDisplay", "Refresh display called from hook");

    // Update turn
    const currentTurn = game.hyp3e.turnTracker.getTurn();
    const turnField = this._embeddedElement.find("#current-turn");
    if (turnField.length) {
      turnField.val(currentTurn);
      // Trigger visual flash
      turnField.addClass("turn-advance-flash");
      setTimeout(() => turnField.removeClass("turn-advance-flash"), 600);
    }  

    // Update time
    const timeString = game.hyp3e.calendar.formatTime(game.hyp3e.calendar.getCurrentTime());
    this._embeddedElement.find("#current-time")?.val(timeString);

    if (!game.settings.get(game.system.id, "showDateInTurnTracker")) return;

    // Update date
    const dateString = game.hyp3e.calendar.formatDate(game.hyp3e.calendar.getCurrentDate(), false);
    this._embeddedElement.find("#current-date")?.text(dateString);

    // Calculate sun/moon visibility and moon phases
    const { sunOpacity, moonOpacity, phobosPhase, selenePhase } = this._getSunAndMoons();
    // Sun visibility scales with daylight
    const sunDisplay = this._embeddedElement.find("#sun-display")[0];
    sunDisplay.style.opacity = sunOpacity;
    // Moons visibility scales inversely (brighter at night)
    const moonDisplay = this._embeddedElement.find("#moons-display")[0];
    moonDisplay.style.opacity = moonOpacity;
    const phobosIcon = this._embeddedElement.find("#Phobos")[0];
    phobosIcon.src = HYP3ETurnTrackerAppV2.phobosIcons[phobosPhase] ?? null;
    const seleneIcon = this._embeddedElement.find("#Selene")[0];
    seleneIcon.src = HYP3ETurnTrackerAppV2.seleneIcons[selenePhase] ?? null;
  }
}