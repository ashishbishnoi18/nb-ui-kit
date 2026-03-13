/**
 * NB Alert Dismiss Component
 * Dismissible alerts with fade-out animation.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('alert-dismiss', function (btn) {
    // ARIA
    btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Dismiss alert');

    NB.on(btn, 'click', function (e) {
      e.preventDefault();

      var alert = btn.closest('.nb-alert');
      if (!alert) {
        // Fallback: try parent with role="alert"
        alert = btn.closest('[role="alert"]');
      }
      if (!alert) {
        // Last fallback: just use parentElement
        alert = btn.parentElement;
      }
      if (!alert) return;

      // Start exit animation
      alert.classList.add('is-dismissing');
      alert.style.opacity = '0';
      alert.style.transition = alert.style.transition || 'opacity 0.3s ease';

      var onEnd = function () {
        NB.off(alert, 'transitionend', onEnd);

        // Dispatch event before removal
        NB.emit(alert, 'nb:alert-dismissed', {
          alert: alert
        });

        // Remove from DOM
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      };

      NB.on(alert, 'transitionend', onEnd);

      // Fallback removal if no transition fires
      setTimeout(function () {
        if (alert.parentNode) {
          NB.emit(alert, 'nb:alert-dismissed', { alert: alert });
          alert.parentNode.removeChild(alert);
        }
      }, 500);
    });
  });

})(window.NB);
