/**
 * NB Stepper Component
 * Multi-step wizard with navigation, completion tracking, and step change events.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('stepper', function (el) {
    var steps = NB.$$('.nb-stepper__step', el);
    if (!steps.length) return;

    var total = steps.length;
    var activeIndex = parseInt(el.getAttribute('data-nb-stepper-active'), 10) || 1;

    // Clamp to valid range
    activeIndex = Math.max(1, Math.min(activeIndex, total));

    /* ---------------------------------------------------------------- */
    /*  State management                                                 */
    /* ---------------------------------------------------------------- */

    function applyState() {
      steps.forEach(function (step, i) {
        var stepNum = i + 1;

        step.classList.remove('is-active', 'is-completed');

        if (stepNum < activeIndex) {
          step.classList.add('is-completed');
        } else if (stepNum === activeIndex) {
          step.classList.add('is-active');
        }
        // Steps after activeIndex remain unstyled (pending)
      });
    }

    function goTo(stepNum) {
      stepNum = Math.max(1, Math.min(stepNum, total));
      if (stepNum === activeIndex) return;

      activeIndex = stepNum;
      el.setAttribute('data-nb-stepper-active', String(activeIndex));
      applyState();

      NB.emit(el, 'nb:stepper-change', { step: activeIndex, total: total });
    }

    /* ---------------------------------------------------------------- */
    /*  Initial state                                                    */
    /* ---------------------------------------------------------------- */

    applyState();

    /* ---------------------------------------------------------------- */
    /*  Click on completed step indicator to navigate back               */
    /* ---------------------------------------------------------------- */

    steps.forEach(function (step, i) {
      var indicator = NB.$('.nb-stepper__indicator', step);
      if (!indicator) return;

      NB.on(indicator, 'click', function () {
        // Only allow clicking completed steps
        if (step.classList.contains('is-completed')) {
          goTo(i + 1);
        }
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Listen for programmatic step changes                             */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'nb:stepper-goto', function (e) {
      var targetStep = e.detail && e.detail.step;
      if (typeof targetStep === 'number') {
        goTo(targetStep);
      }
    });
  });

})(window.NB);
