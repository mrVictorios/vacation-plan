// UI and planner constants

export const MIN_BREAK_DAYS_DEFAULT = 7; // minimum contiguous off-days for a break
export const MIN_GAP_DAYS_DEFAULT = 21; // min gap between breaks to avoid clustering

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 1.2;
export const ZOOM_STEP = 0.05;

export const WEEKEND_EXTENSION_BONUS = 0.4; // start Mon or end Fri
export const BRIDGE_DAY_WEIGHT = 0.8; // score bonus per bridge day within a window
export const SEASON_SUMMER_BONUS = 0.4; // slight bonus for summer (May–Sep)
export const SEASON_WINTER_BONUS = 0.1; // small bonus in deep winter for short breaks

