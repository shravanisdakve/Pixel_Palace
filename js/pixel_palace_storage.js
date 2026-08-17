/**
 * PixelPalaceStorage
 * Centralized, namespaced localStorage abstraction for Pixel Palace.
 *
 * All Pixel Palace persistence goes through this module.
 * Handles JSON serialization, corruption recovery, and namespaced keys.
 *
 * @namespace PixelPalaceStorage
 */
var PixelPalaceStorage = (function () {
    'use strict';

    var PREFIX = 'pp_';

    /**
     * Read a value from localStorage by namespace key.
     * Returns the parsed value, or defaultValue if the key is missing or corrupt.
     *
     * @param {string} key - Namespace key (without prefix)
     * @param {*} [defaultValue=null] - Value to return if key is missing or corrupt
     * @returns {*}
     */
    function get(key, defaultValue) {
        if (typeof defaultValue === 'undefined') defaultValue = null;
        try {
            var raw = localStorage.getItem(PREFIX + key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            // Corrupt data — attempt recovery by clearing the key
            console.warn('[PixelPalaceStorage] Corrupt data for key "' + key + '", clearing.');
            try { localStorage.removeItem(PREFIX + key); } catch (ignored) {}
            return defaultValue;
        }
    }

    /**
     * Write a value to localStorage under the given namespace key.
     * Returns true on success, false on failure.
     *
     * @param {string} key - Namespace key (without prefix)
     * @param {*} value - Value to store (will be JSON serialized)
     * @returns {boolean}
     */
    function set(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('[PixelPalaceStorage] Failed to write key "' + key + '":', e.message);
            return false;
        }
    }

    /**
     * Remove a single key from namespaced storage.
     *
     * @param {string} key - Namespace key (without prefix)
     */
    function remove(key) {
        try {
            localStorage.removeItem(PREFIX + key);
        } catch (ignored) {}
    }

    /**
     * Clear all Pixel Palace namespaced keys from localStorage.
     * Does NOT touch keys outside the pp_ prefix.
     */
    function clearAll() {
        try {
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(PREFIX) === 0) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(function (k) {
                localStorage.removeItem(k);
            });
        } catch (ignored) {}
    }

    /**
     * Check if a namespaced key exists in localStorage.
     *
     * @param {string} key - Namespace key (without prefix)
     * @returns {boolean}
     */
    function has(key) {
        try {
            return localStorage.getItem(PREFIX + key) !== null;
        } catch (e) {
            return false;
        }
    }

    return {
        get: get,
        set: set,
        remove: remove,
        clearAll: clearAll,
        has: has
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalaceStorage = PixelPalaceStorage;
}
