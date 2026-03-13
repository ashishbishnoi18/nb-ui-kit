/**
 * NB Modal Component
 * Accessible modal dialogs with focus trapping and keyboard support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** @type {Object.<string, function>} release functions keyed by modal id */
  var _traps = {};

  /** Stack of currently open modal ids */
  var _openStack = [];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function getBackdrop(id) {
    var modal = document.getElementById(id);
    if (!modal) return null;
    // The backdrop is either the modal element itself or a parent with
    // [data-nb-modal-backdrop]
    if (modal.hasAttribute('data-nb-modal-backdrop')) return modal;
    var backdrop = modal.closest('[data-nb-modal-backdrop]');
    return backdrop || modal;
  }

  function getModal(id) {
    return document.getElementById(id);
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function open(id) {
    if (!id) return;
    id = id.replace(/^#/, '');

    var backdrop = getBackdrop(id);
    var modal = getModal(id);
    if (!backdrop || !modal) {
      console.warn('NB.modal: element "#' + id + '" not found.');
      return;
    }

    if (_openStack.indexOf(id) !== -1) return; // already open

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');

    document.body.style.overflow = 'hidden';
    _openStack.push(id);

    // Trap focus
    _traps[id] = NB.trapFocus(modal);

    NB.emit(modal, 'nb:modal-open', { id: id });
  }

  function close(id) {
    if (!id) return;
    id = id.replace(/^#/, '');

    var backdrop = getBackdrop(id);
    var modal = getModal(id);

    var idx = _openStack.indexOf(id);
    if (idx === -1) return; // not open

    backdrop && backdrop.classList.remove('is-open');
    backdrop && backdrop.setAttribute('aria-hidden', 'true');
    modal && modal.removeAttribute('aria-modal');

    _openStack.splice(idx, 1);

    // Release focus trap
    if (_traps[id]) {
      _traps[id]();
      delete _traps[id];
    }

    // Restore body scroll only when no modals remain open
    if (_openStack.length === 0) {
      document.body.style.overflow = '';
    }

    modal && NB.emit(modal, 'nb:modal-close', { id: id });
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

  NB.register('modal', function () {
    // We use event delegation on document instead of per-element init
  });

  // Delegate: trigger clicks
  NB.on(document, 'click', function (e) {
    // Open trigger
    var trigger = e.target.closest('[data-nb-modal]');
    if (trigger) {
      e.preventDefault();
      var targetId = trigger.getAttribute('data-nb-modal');
      open(targetId);
      return;
    }

    // Close button
    var closeBtn = e.target.closest('[data-nb-modal-close]');
    if (closeBtn) {
      e.preventDefault();
      // Find the closest open modal
      var modal = closeBtn.closest('[data-nb-modal-backdrop]');
      if (modal) {
        var id = modal.querySelector('[id]');
        if (id) {
          close(id.id);
        } else {
          close(modal.id);
        }
      }
      return;
    }

    // Backdrop click (click directly on backdrop, not its children)
    var backdrop = e.target.closest('[data-nb-modal-backdrop]');
    if (backdrop && e.target === backdrop) {
      // Find the modal id inside
      var innerModal = backdrop.querySelector('[id]');
      if (innerModal && backdrop.classList.contains('is-open')) {
        close(innerModal.id);
      } else if (backdrop.id && backdrop.classList.contains('is-open')) {
        close(backdrop.id);
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.modal = {
    open: open,
    close: close,
    closeAll: closeAll
  };

})(window.NB);
