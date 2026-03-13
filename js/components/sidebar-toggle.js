/**
 * NB Sidebar Toggle Component
 * Collapsible sidebar with overlay and responsive behavior.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('sidebar-toggle', function (btn) {
    var targetSelector = btn.getAttribute('data-nb-sidebar-toggle');
    var sidebar = targetSelector
      ? document.querySelector(targetSelector)
      : NB.$('.nb-sidebar');

    if (!sidebar) {
      console.warn('NB.sidebar-toggle: sidebar target not found.');
      return;
    }

    // Ensure IDs for ARIA
    var sidebarId = sidebar.id || NB.uid('sidebar');
    sidebar.id = sidebarId;
    btn.setAttribute('aria-controls', sidebarId);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Toggle sidebar');

    // Create or find overlay
    var overlay = NB.$('.nb-sidebar__overlay') ||
                  NB.$('[data-nb-sidebar-overlay]');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nb-sidebar__overlay';
      overlay.setAttribute('data-nb-sidebar-overlay', '');
      overlay.setAttribute('aria-hidden', 'true');
      sidebar.parentNode.insertBefore(overlay, sidebar.nextSibling);
    }

    /* ---------------------------------------------------------------- */
    /*  State                                                            */
    /* ---------------------------------------------------------------- */

    function isOpen() {
      return sidebar.classList.contains('is-open');
    }

    function isMobile() {
      return window.innerWidth < 1024;
    }

    function open() {
      sidebar.classList.add('is-open');
      btn.classList.add('is-active');
      btn.setAttribute('aria-expanded', 'true');
      overlay.classList.add('is-active');

      if (isMobile()) {
        document.body.style.overflow = 'hidden';
      }

      NB.emit(sidebar, 'nb:sidebar-open');
    }

    function close() {
      sidebar.classList.remove('is-open');
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('is-active');

      if (isMobile()) {
        document.body.style.overflow = '';
      }

      NB.emit(sidebar, 'nb:sidebar-close');
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

    // Toggle button
    NB.on(btn, 'click', function (e) {
      e.preventDefault();
      toggle();
    });

    // Overlay click closes
    NB.on(overlay, 'click', function () {
      close();
    });

    // Escape key closes
    NB.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
        btn.focus();
      }
    });

    // On resize: restore body scroll if switching to desktop while open
    var resizeTimer;
    NB.on(window, 'resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (isOpen() && !isMobile()) {
          document.body.style.overflow = '';
        }
      }, 150);
    });
  });

})(window.NB);
