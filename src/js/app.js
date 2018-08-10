/* 
 Created on : Jul 17, 2017, 12:31:12 AM
 Author     : Atta-Ur-Rehman Shah (http://attacomsian.com)
 */

var errorMessages = {
  default: "Required",
  name: 'Enter the name',
  email: 'Enter the email',
  emailValid: 'Enter a valid email',
  phone: 'Enter the phone',
  city: 'Enter the city',
  state: 'Enter the state',
  address: 'Enter the address',
  message: 'Enter the message',
  url: 'Enter a valid URL',
  digits: 'Enter only digitis'
};

var validations = function (form, settings) {
  if (form == undefined || settings == undefined) {
    return false;
  }

  $.each(settings.fields, function (fieldId, fieldValidate) {
    if (typeof fieldValidate.extensionId != 'undefined') {
      fieldId += fieldValidate.extensionId;
    }

    var fieldName = $('#' + fieldId).attr('name');

    if (settings.rules[fieldName] == undefined) {
      settings.rules[fieldName] = {};
    }

    if (settings.messages[fieldName] == undefined) {
      settings.messages[fieldName] = {};
    }

    switch (typeof fieldValidate.rule) {
      case 'string':
        settings.rules[fieldName] = fieldValidate.rule;
        settings.messages[fieldName] = fieldValidate.message;
        break;
      case 'object':
        $.each(fieldValidate.rule, function (ruleName, ruleValue) {
          switch (ruleName) {
            case 'required':
              settings.rules[fieldName].required = true;
              settings.messages[fieldName].required = fieldValidate.message.required;
              break;
            default:
              settings.rules[fieldName][ruleName] = ruleValue;
              settings.messages[fieldName][ruleName] = fieldValidate.message[ruleName];
              break;
          }
        });
        break;
    }
  });

  $.extend($.validator.messages, {
    required: errorMessages.default,
    email: errorMessages.emailValid,
    url: errorMessages.url,
    digits: errorMessages.digits
  });

  settings.validator = form.validate({
    debug: false,
    ignore: ':hidden',
    rules: settings.rules,
    messages: settings.messages,
    focusInvalid: false,
    errorElement: 'div',
    errorClass: 'error-message',
    onfocusout: function (element) {
      $(element).valid();
      if (settings.checkFields != undefined && typeof settings.checkFields == 'function') {
        settings.checkFields.call(undefined);
      }
    },
    highlight: function (element, errorClass, validClass) {
      return false;
    },
    unhighlight: function (element, errorClass, validClass) {
      return false;
    },
    submitHandler: function (form) {},
    errorPlacement: function (error, element) {
      if (error.text().length) {
        $(element).parents('.input').addClass('has-error');
        $(element).mouseover();
        error.insertAfter(element.parents('.input'));
      }
    },
    success: function (error, element) {
      $(element).parents('.input').removeClass('has-error');
      error.remove();
    }
  });
}

var contactSubmit = function() {
  var form = $('#contactForm');

  validations(form, {
    rules: {},
    messages: {},
    fields: {
      'form_name': {
        rule: {
          required: true
        },
        message: {
          required: errorMessages.name
        }
      },
      'form_email': {
        rule: {
          required: true,
          email: true
        },
        message: {
          required: errorMessages.email,
          email: errorMessages.emailValid
        }
      },
      'form_message': {
        rule: {
          required: true
        },
        message: {
          required: errorMessages.message
        }
      }
    }
  });

  console.log({ valid: form.valid() })

  if (form.valid()) {
    form.find('.btn-submit').attr('disabled', true);
    $.ajax({
      url: form.attr('action'),
      data: form.serialize(),
      dataType: 'json',
      type: 'post',
      success: function(response) {
        $('#contactForm .alert').removeClass('alert-success');
        $('#contactForm .alert').removeClass('alert-danger');
        if (response.status == 'success') {
          $('#contactForm .alert').addClass('alert-success');
        } else {
          $('#contactForm .alert').addClass('alert-danger');
        }
        $('#contactForm .alert').html(response.status_message);
        form.find('.btn-submit').attr('disabled', false);
      },
      error: function(error) {
        form.find('.btn-submit').attr('disabled', true);
      }
    });
  }
};

$(function () {
  //init 
  init();
  //init wow effects
  new WOW().init();

  //tooltip
  $("[data-toggle='tooltip']").tooltip();

  //popover
  $('[data-toggle="popover"]').popover();

  //scroll menu
  $(window).scroll(function () {
    init();
  });

  //page scroll
  $('a.page-scroll').bind('click', function (event) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: $($anchor.attr('href')).offset().top - 70
    }, 1500, 'easeInOutExpo');
    event.preventDefault();
  });

  //init function
  function init() {
    var scroll = $(window).scrollTop();
    if (scroll >= 200) {
      $('.sticky-navigation').removeClass('navbar-transparent').addClass('bg-primary');
      $('.sticky-navigation-alt').removeClass('navbar-transparent').addClass('bg-inverse').addClass('navbar-raised');
    } else {
      $('.sticky-navigation').removeClass('bg-primary').addClass('navbar-transparent');
      $('.sticky-navigation-alt').removeClass('bg-inverse').removeClass('navbar-raised').addClass('navbar-transparent');
    }
    return false;
  }

  //single date picker
  $('#datepicker').daterangepicker({
    singleDatePicker: true
  });
  //date range picker
  $('#daterange').daterangepicker({
    opens: 'left',
    autoApply: true
  });

  $(document).on('submit', '#contactForm', function () {
    contactSubmit();
    return false;
  });

});