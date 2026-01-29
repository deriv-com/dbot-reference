// Journal stats videos
export const JOURNAL_STATS_VIDEO_ID = {
    light: '7221d8b2b532def533e0448a8a410d62', // accumulators_manual_desktop.mp4
    dark: '2627ac2a8744e9c42e8dea01790edc93', // accumulators_manual_desktop_dark.mp4
};

// Helper function to get journal stats video ID
export const getJournalStatsVideoId = (is_dark_theme = false) =>
    is_dark_theme ? JOURNAL_STATS_VIDEO_ID.dark : JOURNAL_STATS_VIDEO_ID.light;
