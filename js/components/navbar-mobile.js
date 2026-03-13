/**
 * NB Navbar Mobile Component
 * Responsive mobile navigation toggle with accessibility support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('navbar-toggle', function (btn) {
    var navbar = btn.closest('.nb-navbar') || btn.closest('[data-nb-navbar]') || btn.parentElement;
    if (!navbar) return;

    // Find the nav menu
    var targetSelector = btn.getAttribute('data-nb-navbar-toggle');
    var menu = targetSelector
      ? document.querySelector(targetSelector)
      : NB.$('.nb-navbar__menu', navbar) || NB.$('.nb-navbar__nav', navbar) || NB.$('nav', navbar);

    if (!menu) return;

    // ARIA setup
    var menuId = menu.id || NB.uid('navbar-menu');
    menu.id = menuId;
    btn.setAttribute('aria-controls', menuId);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Toggle navigation menu');

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() {
      return navbar.classList.contains('is-open');
    }

    function open() {
      navbar.classList.add('is-open');
      btn.classList.add('is-active');
      btn.setAttribute('aria-expanded', 'true');
      menu.removeAttribute('hidden');
      NB.emit(navbar, 'nb:navbar-open');
    }

    function close() {
      navbar.classList.remove('is-open');
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
      NB.emit(navbar, 'nb:navbar-close');
    }

    function toggle() {
      if (isOpen()) {
        close();
      } else {
        open();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(btn, 'click', function (e) {
      e.preventDefault();
      toggle();
    });

    // Close when clicking a nav link (mobile)
    NB.on(menu, 'click', function (e) {
      var link = e.target.closest('a');
      if (link && isOpen()) {
        close();
      }
    });

    // Close on Escape
    NB.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
        btn.focus();
      }
    });

    // Close on window resize to desktop (optional enhancement)
    var resizeTimer;
    NB.on(window, 'resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        // If menu is open and we're now at desktop width, close it
        if (isOpen() && window.innerWidth >= 1024) {
          close();
        }
      }, 150);
    });
  });

  // Also register under the attribute name used in HTML
  NB.register('navbar-mobile', function () {
    // The actual init happens on [data-nb-navbar-toggle] elements
    // This registration ensures NB.init picks up containers with
    // data-nb-navbar-mobile if needed.
  });

})(window.NB);
