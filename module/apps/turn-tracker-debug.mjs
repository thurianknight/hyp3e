// Set Turn Tracker floating position and size for testing
game.settings.set("hyp3e", "turnTrackerPos", { top: 100, left: 100, width: 290, height: 160 });

// Set Turn Tracker to embedded mode for testing
game.settings.set("hyp3e", "turnTrackerMode", "embedded");

// Query current Turn Tracker mode
game.settings.get("hyp3e", "turnTrackerMode");

// Render the Turn Tracker
game.hyp3e.turnTrackerApp.render();
// Close the Turn Tracker
game.hyp3e.turnTrackerApp.close();