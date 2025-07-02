-- SQL schema for storing miscellaneous application settings
-- Each setting is saved as a key/value pair so the React app can
-- fetch configuration values at runtime (e.g. Firebase options).
CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value text
);
