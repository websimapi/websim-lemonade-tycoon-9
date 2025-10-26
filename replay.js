/**
 * ReplayService handles the recording of game events for instant replays.
 * This is a foundational implementation. In a real game, this would
 * also handle saving/loading replays and playing them back.
 */
export class ReplayService {
    constructor() {
        this.replayData = [];
        this.startTime = Date.now();
        console.log("ReplayService initialized.");
    }

    /**
     * Records a new event to the replay log.
     * @param {string} eventType - The type of event (e.g., 'player_move', 'item_purchased').
     * @param {object} eventData - A payload of data associated with the event.
     */
    recordEvent(eventType, eventData) {
        const timestamp = Date.now() - this.startTime;
        const event = {
            timestamp,
            type: eventType,
            data: eventData,
        };
        this.replayData.push(event);
        console.log(`Recorded event: ${eventType}`, event);
    }

    /**
     * Retrieves the entire log of recorded events.
     * @returns {Array<object>} The replay data.
     */
    getReplayData() {
        return this.replayData;
    }

    /**
     * Clears the current replay data.
     */
    clearReplay() {
        this.replayData = [];
        this.startTime = Date.now();
        console.log("Replay data cleared.");
    }
}

