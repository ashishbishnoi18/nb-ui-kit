/**
 * NB Drawer Component
 * Accessible slide-over / drawer panels with focus trapping and keyboard support.
 * Triggered by buttons with [data-nb-drawer-open="drawer-id"].
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** @type {Object.<string, function>} release functions keyed by drawer id */
  var _traps = {};

  /** Stack of currently open drawer ids */
  var _openStack = [];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Get or create the shared backdrop element.
   * @returns {HTMLElement}
   */
  function getBackdrop() {
    var backdrop = NB.$('[data-nb-drawer-backdrop]');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nb-drawer-backdrop';
      backdrop.setAttribute('data-nb-drawer-backdrop', '');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function open(id) {
    if (!id) return;
    id = id.replace(/^#/, '');

    var drawer = document.getElementById(id);
    if (!drawer) {
      console.warn('NB.drawer: element "#' + id + '" not found.');
      return;
    }

    if (_openStack.indexOf(id) !== -1) return; // already open

    var backdrop = getBackdrop();

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('role', 'dialog');

    document.body.style.overflow = 'hidden';
    _openStack.push(id);

    // Trap focus
    _traps[id] = NB.trapFocus(drawer);

    NB.emit(drawer, 'nb:drawer-open', { id: id });
  }

  function close(id) {
    if (!id) return;
    id = id.replace(/^#/, '');

    var drawer = document.getElementById(id);
    var idx = _openStack.indexOf(id);
    if (idx === -1) return; // not open

    drawer && drawer.classList.remove('is-open');
    drawer && drawer.removeAttribute('aria-modal');

    _openStack.splice(idx, 1);

    // Release focus trap
    if (_traps[id]) {
      _traps[id]();
      delete _traps[id];
    }

    // Hide backdrop and restore body scroll only when no drawers remain open
    if (_openStack.length === 0) {
      var backdrop = getBackdrop();
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    drawer && NB.emit(drawer, 'nb:drawer-close', { id: id });
  }

  function closeAll() {
    // Close in reverse order (LIFO)
    var stack = _openStack.slice();
    for (var i = stack.length - 1; i >= 0; i--) {
      close(stack[i]);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard handler (Escape)                                          */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && _openStack.length) {
      e.preventDefault();
      close(_openStack[_openStack.length - 1]);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Registration                                                       */
  /* ------------------------------------------------------------------ */

  NB.register('drawer-open', function (btn) {
    var targetId = btn.getAttribute('data-nb-drawer-open');
    if (!targetId) return;

    btn.setAttribute('aria-haspopup', 'dialog');

    NB.on(btn, 'click', function (e) {
      e.preventDefault();
      open(targetId);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Delegated click handlers (close button & backdrop)                 */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'click', function (e) {
    // Close button inside drawer
    var closeBtn = e.target.closest('[data-nb-drawer-close]');
    if (closeBtn) {
      e.preventDefault();
      var drawer = closeBtn.closest('.nb-drawer');
      if (drawer && drawer.id) {
        close(drawer.id);
      }
      return;
    }

    // Backdrop click
    var backdrop = e.target.closest('[data-nb-drawer-backdrop]');
    if (backdrop && e.target === backdrop && _openStack.length) {
      close(_openStack[_openStack.length - 1]);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.drawer = {
    open: open,
    close: close,
    closeAll: closeAll
  };

})(window.NB);
