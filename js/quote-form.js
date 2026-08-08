(function () {
  'use strict';

  function initQuoteDelivery() {
    var form = document.getElementById('quote-form');
    if (!form) return;

    var alertBox = document.getElementById('form-alert');
    var successBox = document.getElementById('form-success');
    var button = form.querySelector('button[type="submit"]');
    var dateField = document.getElementById('tarih');

    function setMessage(box, message) {
      if (!box) return;
      box.textContent = message;
      box.hidden = !message;
    }

    function clearMessages() {
      setMessage(alertBox, '');
      setMessage(successBox, '');
    }

    function todayIso() {
      var now = new Date();
      var year = now.getFullYear();
      var month = String(now.getMonth() + 1).padStart(2, '0');
      var day = String(now.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    if (dateField) {
      dateField.addEventListener('focus', function () {
        if (dateField.type === 'date') dateField.min = todayIso();
      });
    }

    var params = new URLSearchParams(window.location.search);
    var fallbackStatus = params.get('teklif');
    if (fallbackStatus === 'basarili') {
      setMessage(successBox, 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.');
    } else if (fallbackStatus === 'hata') {
      setMessage(alertBox, 'Form gönderilemedi. Lütfen 0 535 912 06 91 numarasından bize ulaşın.');
    }
    if (fallbackStatus && window.history && history.replaceState) {
      params.delete('teklif');
      var cleanQuery = params.toString();
      history.replaceState(null, '', window.location.pathname + (cleanQuery ? '?' + cleanQuery : '') + window.location.hash);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearMessages();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var payload = Object.fromEntries(new FormData(form).entries());
      var endpoint = form.getAttribute('action') || '/api/teklif.php';

      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
      }

      fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) {
            var error = new Error(data.message || 'Form gönderilemedi.');
            error.status = response.status;
            throw error;
          }
          return data;
        });
      }).then(function (data) {
        setMessage(successBox, data.message || 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.');
        form.reset();
        if (dateField && dateField.type === 'date') dateField.type = 'text';
      }).catch(function (error) {
        var message = error && error.message
          ? error.message
          : 'Form gönderilemedi. Lütfen 0 535 912 06 91 numarasından bize ulaşın.';
        setMessage(alertBox, message);
      }).then(function () {
        if (button) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        }
      });
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuoteDelivery, { once: true });
  } else {
    initQuoteDelivery();
  }
})();
