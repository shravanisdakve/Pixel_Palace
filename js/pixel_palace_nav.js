/**
 * Pixel Palace Navigation Module
 * M1 Task 3: Game Navigation & Exit UX
 *
 * Provides consistent back-to-home navigation across all 46 games.
 * Injects a styled back-link element if one doesn't already exist.
 *
 * Usage: Include this script after DOM is ready, or call PixelPalaceNav.init().
 *
 * Convention:
 *   - All games link back to ../../index.html (2 levels deep)
 *   - Nested games (3+ levels) use ../../../index.html
 *   - Root-level games use ../index.html
 */

(function() {
  'use strict';

  window.PixelPalaceNav = {
    VERSION: '1.0.0',
    _initialized: false,

    /**
     * Determine the correct href back to index.html based on current path depth.
     */
    getHomeHref: function() {
      var path = window.location.pathname;
      var segments = path.split('/').filter(function(s) { return s.length > 0; });
      var depth = segments.length;
      // If last segment is a file (contains a dot), it doesn't count as a directory level
      if (depth > 0 && segments[depth - 1].indexOf('.') !== -1) {
        depth--;
      }
      if (depth >= 3) {
        return '../../../index.html';
      } else if (depth === 2) {
        return '../../index.html';
      } else {
        return '../index.html';
      }
    },

    /**
     * Check if a back-link already exists in the DOM.
     */
    hasBackLink: function() {
      return !!document.querySelector('.back-link');
    },

    /**
     * Create and inject the back-link element if none exists.
     * Returns the created element, or the existing one.
     */
    ensureBackLink: function() {
      if (this.hasBackLink()) {
        return document.querySelector('.back-link');
      }

      var link = document.createElement('a');
      link.href = this.getHomeHref();
      link.className = 'back-link';
      link.textContent = '\u2190 Back to Pixel Palace';
      link.setAttribute('aria-label', 'Back to Pixel Palace homepage');

      // Inject styles if not already present
      if (!document.querySelector('#pixel-palace-nav-styles')) {
        var style = document.createElement('style');
        style.id = 'pixel-palace-nav-styles';
        style.textContent = [
          '.back-link {',
          '  position: fixed;',
          '  top: 20px;',
          '  left: 20px;',
          '  z-index: 9999;',
          '  color: #00e5ff;',
          '  text-decoration: none;',
          '  font-size: 1em;',
          '  font-weight: bold;',
          '  background: rgba(0,0,0,0.6);',
          '  padding: 8px 16px;',
          '  border-radius: 6px;',
          '  backdrop-filter: blur(4px);',
          '  -webkit-backdrop-filter: blur(4px);',
          '  transition: background 0.2s, color 0.2s;',
          '  font-family: inherit;',
          '}',
          '.back-link:hover {',
          '  background: rgba(0,229,255,0.2);',
          '  color: #ffffff;',
          '}',
          '.back-link:focus {',
          '  outline: 2px solid #00e5ff;',
          '  outline-offset: 2px;',
          '}',
          '@media (max-width: 600px) {',
          '  .back-link {',
          '    font-size: 0.85em;',
          '    padding: 6px 12px;',
          '    top: 10px;',
          '    left: 10px;',
          '  }',
          '}'
        ].join('\n');
        document.head.appendChild(style);
      }

      // Prepend to body so it appears above other content
      document.body.insertBefore(link, document.body.firstChild);
      return link;
    },

    /**
     * Initialize navigation. Safe to call multiple times.
     */
    init: function() {
      if (this._initialized) return;
      this._initialized = true;
      this.ensureBackLink();
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.PixelPalaceNav.init();
    });
  } else {
    window.PixelPalaceNav.init();
  }
})();
