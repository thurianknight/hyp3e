export class Hyp3eLogger {
    static LEVELS = {
        INFO: 0,
        WARNING: 1,
        ERROR: 2
    };

    static _getThreshold() {
        return parseInt(game.settings.get("hyp3e", "logLevel"));
    }

    static _shouldLog(severity) {
        return severity >= this._getThreshold();
    }

    static _formatParts(severity, functionName, message) {
        let prefix = "[HYP3E]";
        switch (severity) {
            case this.LEVELS.INFO: prefix += " [INFO]"; break;
            case this.LEVELS.WARNING: prefix += " [WARN]"; break;
            case this.LEVELS.ERROR: prefix += " [ERROR]"; break;
        }
        const timestamp = new Date().toISOString();
        // const body = `${timestamp} [${functionName}] ${message} @ ${this._getCallerLocation()}`;
        const body = `${timestamp} [${functionName}] ${message}`;
        return { prefix, body };
    }

    static _getCallerLocation() {
        const stack = new Error().stack.split("\n");
        // stack[0] is "Error", stack[1] is _getCallerLocation, stack[2] is _log, stack[3] is the caller
        return stack?.[3]?.trim() ?? "unknown location";
    }

    static _log(severity, functionName, message, context) {
        if (!this._shouldLog(severity)) return;

        const { prefix, body } = this._formatParts(severity, functionName, message);

        const styleInfo = "color: #00aaff; font-weight: bold;";
        const styleWarn = "color: #ffaa00; font-weight: bold;";
        const styleError = "color: #ff3333; font-weight: bold;";

        if (severity === this.LEVELS.INFO) {
            context ? console.log(`%c${prefix}%c ${body}`, styleInfo, "color: inherit;", context)
                : console.log(`%c${prefix}%c ${body}`, styleInfo, "color: inherit;");
        } else if (severity === this.LEVELS.WARNING) {
            context ? console.warn(`%c${prefix}%c ${body}`, styleWarn, "color: inherit;", context)
                : console.warn(`%c${prefix}%c ${body}`, styleWarn, "color: inherit;");
        } else if (severity === this.LEVELS.ERROR) {
            context ? console.error(`%c${prefix}%c ${body}`, styleError, "color: inherit;", context)
                : console.error(`%c${prefix}%c ${body}`, styleError, "color: inherit;");
        }
        // Whisper warnings and errors to the GM
        if (severity >= this.LEVELS.WARNING && game.user.isGM) {
            const severityLabel = severity === this.LEVELS.ERROR ? "error" : "warn";
            ChatMessage.create({
                content: `<div class="hyp3e-log hyp3e-${severityLabel}">
                <b>HYP3E ${severityLabel.toUpperCase()}:</b> ${message}
                </div>`,
                whisper: ChatMessage.getWhisperRecipients("GM")
            });
        }
    }

    // Convenience helpers
    static info(functionName, message, context = null) {
        this._log(this.LEVELS.INFO, functionName, message, context);
    }

    static warn(functionName, message, context = null) {
        this._log(this.LEVELS.WARNING, functionName, message, context);
    }

    static error(functionName, message, context = null) {
        this._log(this.LEVELS.ERROR, functionName, message, context);
    }
}
