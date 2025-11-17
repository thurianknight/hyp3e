import { Hyp3eLogger } from "./logger.mjs";

export class HYP3ETurnTrackerSync {
  static init() {
    // Listen for GM broadcast
    game.socket.on("system.hyp3e", (msg) => {
      Hyp3eLogger.info("HYP3ETurnTrackerSync", "Received socket message", msg);
      if (!msg?.type) return;

      switch (msg.type) {
        case "explorationTurnAdvanced":
          Hooks.callAll("explorationTurnAdvanced", msg.newTurn);
          break;

        case "explorationTurnRetreat":
          Hooks.callAll("explorationTurnRetreat", msg.newTurn);
          break;

        case "explorationTurnReset":
          Hooks.callAll("explorationTurnReset", msg.newTurn);
          break;
      }
    });
  }
}
