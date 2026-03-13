/**
 * NB File Upload Component
 * Drag-and-drop file upload with previews and validation.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i >= units.length) i = units.length - 1;
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  NB.register('file-upload', function (el) {
    var isMultiple = el.hasAttribute('data-nb-file-upload-multiple');
    var acceptAttr = el.getAttribute('data-nb-file-upload-accept') || '';
    var input = NB.$('input[type="file"]', el);
    var fileList = NB.$('.nb-file-upload__list', el) ||
                   NB.$('[data-nb-file-list]', el);

    // Create file input if not present
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.className = 'nb-file-upload__input';
      input.style.position = 'absolute';
      input.style.width = '1px';
      input.style.height = '1px';
      input.style.overflow = 'hidden';
      input.style.clip = 'rect(0,0,0,0)';
      el.appendChild(input);
    }

    if (isMultiple) input.setAttribute('multiple', '');
    if (acceptAttr) input.setAttribute('accept', acceptAttr);

    // Create file list container if not present
    if (!fileList) {
      fileList = document.createElement('div');
      fileList.className = 'nb-file-upload__list';
      el.appendChild(fileList);
    }

    // Stored files (maintained as array since FileList is read-only)
    var _files = [];

    /* ---------------------------------------------------------------- */
    /*  Validation                                                       */
    /* ---------------------------------------------------------------- */

    function isAccepted(file) {
      if (!acceptAttr) return true;
      var types = acceptAttr.split(',').map(function (t) { return t.trim().toLowerCase(); });
      var fileName = file.name.toLowerCase();
      var fileType = file.type.toLowerCase();

      return types.some(function (type) {
        if (type.charAt(0) === '.') {
          // Extension match
          return fileName.endsWith(type);
        }
        if (type.endsWith('/*')) {
          // MIME type wildcard (e.g. image/*)
          return fileType.indexOf(type.replace('/*', '/')) === 0;
        }
        return fileType === type;
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Render file list                                                  */
    /* ---------------------------------------------------------------- */

    function renderFiles() {
      fileList.innerHTML = '';

      if (!_files.length) {
        fileList.classList.remove('is-active');
        return;
      }

      fileList.classList.add('is-active');

      _files.forEach(function (file, index) {
        var item = document.createElement('div');
        item.className = 'nb-file-upload__item';

        var info = document.createElement('span');
        info.className = 'nb-file-upload__file-info';
        info.innerHTML = '<span class="nb-file-upload__file-name">' +
                         escapeHtml(file.name) + '</span>' +
                         '<span class="nb-file-upload__file-size">' +
                         formatFileSize(file.size) + '</span>';

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'nb-file-upload__remove';
        removeBtn.setAttribute('aria-label', 'Remove ' + file.name);
        removeBtn.innerHTML = '&times;';
        removeBtn.setAttribute('data-index', String(index));

        item.appendChild(info);
        item.appendChild(removeBtn);
        fileList.appendChild(item);
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Handle files                                                      */
    /* ---------------------------------------------------------------- */

    function handleFiles(newFiles) {
      var added = [];
      var rejected = [];

      for (var i = 0; i < newFiles.length; i++) {
        var file = newFiles[i];
        if (!isAccepted(file)) {
          rejected.push(file);
          continue;
        }

        if (isMultiple) {
          _files.push(file);
        } else {
          _files = [file];
        }
        added.push(file);
      }

      renderFiles();

      NB.emit(el, 'nb:file-change', {
        files: _files.slice(),
        added: added,
        rejected: rejected
      });

      if (rejected.length) {
        NB.emit(el, 'nb:file-rejected', { files: rejected });
      }
    }

    function removeFile(index) {
      var removed = _files.splice(index, 1);
      renderFiles();

      // Clear input value so the same file can be re-selected
      input.value = '';

      NB.emit(el, 'nb:file-change', {
        files: _files.slice(),
        removed: removed
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Drag and drop                                                    */
    /* ---------------------------------------------------------------- */

    var dragCounter = 0;

    NB.on(el, 'dragenter', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      el.classList.add('is-dragover');
    });

    NB.on(el, 'dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    NB.on(el, 'dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        el.classList.remove('is-dragover');
      }
    });

    NB.on(el, 'drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      el.classList.remove('is-dragover');

      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length) {
        handleFiles(dt.files);
      }
    });

    /* ---------------------------------------------------------------- */
    /*  File input change                                                */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'change', function () {
      if (input.files && input.files.length) {
        handleFiles(input.files);
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Click to open file dialog                                        */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      // Don't trigger if clicking the remove button or input itself
      if (e.target === input || e.target.closest('.nb-file-upload__remove')) return;
      input.click();
    });

    /* ---------------------------------------------------------------- */
    /*  Remove button (delegated)                                        */
    /* ---------------------------------------------------------------- */

    NB.on(fileList, 'click', function (e) {
      var removeBtn = e.target.closest('.nb-file-upload__remove');
      if (removeBtn) {
        e.stopPropagation();
        var index = parseInt(removeBtn.getAttribute('data-index'), 10);
        if (!isNaN(index)) {
          removeFile(index);
        }
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Enter / Space opens file dialog                        */
    /* ---------------------------------------------------------------- */

    if (!el.getAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
    }
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', el.getAttribute('aria-label') || 'Choose files to upload');

    NB.on(el, 'keydown', function (e) {
      if (e.target === input || e.target.closest('.nb-file-upload__remove')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });
  });

})(window.NB);
