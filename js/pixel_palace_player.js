/**
 * PixelPalacePlayer
 * Lightweight local player identity for Pixel Palace.
 *
 * Generates a stable anonymous player ID persisted in localStorage.
 * Supports an optional nickname. No authentication, no server, no accounts.
 *
 * @namespace PixelPalacePlayer
 */
var PixelPalacePlayer = (function () {
    'use strict';

    var STORAGE_KEY = 'player';

    /**
     * Generate a UUID v4 (simplified, RFC4122-ish).
     * Good enough for local player identity.
     *
     * @returns {string}
     */
    function generateId() {
        return 'pp_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get or create the current player.
     *
     * @returns {Object} Player object { id, nickname, createdAt, updatedAt }
     */
    function get() {
        var player = PixelPalaceStorage.get(STORAGE_KEY);
        if (!player || typeof player !== 'object' || !player.id) {
            player = create();
        }
        return player;
    }

    /**
     * Create a new player and persist it.
     *
     * @param {string|null} [nickname=null] - Optional display name
     * @returns {Object} The created player
     */
    function create(nickname) {
        var now = new Date().toISOString();
        var player = {
            id: generateId(),
            nickname: nickname || null,
            createdAt: now,
            updatedAt: now
        };
        PixelPalaceStorage.set(STORAGE_KEY, player);
        return player;
    }

    /**
     * Update the current player's nickname.
     *
     * @param {string|null} nickname
     * @returns {Object} Updated player
     */
    function setNickname(nickname) {
        var player = get();
        player.nickname = nickname || null;
        player.updatedAt = new Date().toISOString();
        PixelPalaceStorage.set(STORAGE_KEY, player);
        return player;
    }

    /**
     * Get just the player ID string.
     *
     * @returns {string}
     */
    function getId() {
        return get().id;
    }

    /**
     * Get the player's nickname (or null if unset).
     *
     * @returns {string|null}
     */
    function getNickname() {
        var player = get();
        return player.nickname;
    }

    /**
     * Get just the player's display name (nickname or fallback).
     *
     * @returns {string}
     */
    function getDisplayName() {
        var player = get();
        return player.nickname || 'Player';
    }

    return {
        get: get,
        create: create,
        setNickname: setNickname,
        getId: getId,
        getNickname: getNickname,
        getDisplayName: getDisplayName
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalacePlayer = PixelPalacePlayer;
}
