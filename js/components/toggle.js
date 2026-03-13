/**
 * NB Toggle Component
 * Accessible toggle switches backed by a native checkbox.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('toggle', function (el) {
    var checkbox = NB.$('input[type="checkbox"]', el);

    // Create hidden checkbox if not present
    if (!checkbox) {
      checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'nb-toggle__input';
      checkbox.style.position = 'absolute';
      checkbox.style.width = '1px';
      checkbox.style.height = '1px';
      checkbox.style.overflow = 'hidden';
      checkbox.style.clip = 'rect(0,0,0,0)';
      el.insertBefore(checkbox, el.firstChild);
    }

    // Ensure IDs
    if (!checkbox.id) checkbox.id = NB.uid('toggle-input');

    // ARIA: the element acts as a switch
    el.setAttribute('role', 'switch');
    el.setAttribute('tabindex', '0');

    // Sync initial state
    function syncState() {
      var checked = checkbox.checked;
      if (checked) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
      el.setAttribute('aria-checked', String(checked));
    }

    syncState();

    /* ---------------------------------------------------------------- */
    /*  Toggle                                                           */
    /* ---------------------------------------------------------------- */

    function toggle() {
      checkbox.checked = !checkbox.checked;
      syncState();

      // Dispatch change event on checkbox
      var changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);

      NB.emit(el, 'nb:toggle-change', { checked: checkbox.checked });
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      // Prevent double-firing if clicking directly on checkbox
      if (e.target === checkbox) return;
      e.preventDefault();
      toggle();
    });

    NB.on(el, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    // Listen to checkbox change (e.g., changed via label or programmatically)
    NB.on(checkbox, 'change', function () {
      syncState();
    });

    // Prevent the checkbox click from bubbling and double-toggling
    NB.on(checkbox, 'click', function (e) {
      e.stopPropagation();
      syncState();
      NB.emit(el, 'nb:toggle-change', { checked: checkbox.checked });
    });
  });

})(window.NB);
