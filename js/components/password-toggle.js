/**
 * NB Password Toggle Component
 * Toggle password field visibility with accessible state management.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  // SVG icons for eye/eye-off
  var ICON_EYE = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var ICON_EYE_OFF = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  NB.register('password-toggle', function (btn) {
    var targetSelector = btn.getAttribute('data-nb-password-toggle');
    if (!targetSelector) return;

    var input = targetSelector.charAt(0) === '#' || targetSelector.charAt(0) === '.'
      ? document.querySelector(targetSelector)
      : document.getElementById(targetSelector);

    if (!input) {
      console.warn('NB.password-toggle: input "' + targetSelector + '" not found.');
      return;
    }

    // Ensure button type
    if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) {
      btn.setAttribute('type', 'button');
    }

    // ARIA
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Show password');

    // Set initial icon
    var iconContainer = NB.$('.nb-password-toggle__icon', btn);
    if (!iconContainer) {
      iconContainer = document.createElement('span');
      iconContainer.className = 'nb-password-toggle__icon';
      // Only add icon if button has no text content
      if (!btn.textContent.trim()) {
        btn.innerHTML = '';
        btn.appendChild(iconContainer);
      }
    }

    function updateIcon() {
      var isVisible = input.type === 'text';
      if (iconContainer) {
        iconContainer.innerHTML = isVisible ? ICON_EYE_OFF : ICON_EYE;
      }
    }

    updateIcon();

    /* ---------------------------------------------------------------- */
    /*  Toggle                                                           */
    /* ---------------------------------------------------------------- */

    function toggle() {
      var isPassword = input.type === 'password';

      if (isPassword) {
        input.type = 'text';
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Hide password');
        btn.classList.add('is-active');
      } else {
        input.type = 'password';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Show password');
        btn.classList.remove('is-active');
      }

      updateIcon();

      NB.emit(btn, 'nb:password-toggle', {
        visible: input.type === 'text',
        input: input
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(btn, 'click', function (e) {
      e.preventDefault();
      toggle();
    });
  });

})(window.NB);
