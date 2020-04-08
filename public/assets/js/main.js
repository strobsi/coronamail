/*
	Overflow by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function ($) {
  var $window = $(window),
    $body = $("body"),
    settings = {
      // Parallax background effect?
      parallax: true,

      // Parallax factor (lower = more intense, higher = less intense).
      parallaxFactor: 10,
    };

  // Breakpoints.
  breakpoints({
    wide: ["1081px", "1680px"],
    normal: ["841px", "1080px"],
    narrow: ["737px", "840px"],
    mobile: [null, "736px"],
  });

  // Mobile?
  if (browser.mobile) $body.addClass("is-scroll");

  // Play initial animations on page load.
  $window.on("load", function () {
    $body.removeClass("is-preload");
  });

  // Scrolly.
  $(".scrolly-middle").scrolly({
    speed: 1000,
    anchor: "middle",
  });

  $(".scrolly").scrolly({
    speed: 1000,
    offset: function () {
      return breakpoints.active("<=mobile") ? 70 : 190;
    },
  });

  // Disable parallax on IE/Edge (smooth scrolling is jerky), and on mobile platforms (= better performance).
  if (browser.name == "ie" || browser.name == "edge" || browser.mobile)
    settings.parallax = false;

  if (settings.parallax) {
    var $dummy = $(),
      $bg;

    $window
      .on("scroll.overflow_parallax", function () {
        // Adjust background position.
        $bg.css(
          "background-position",
          "center " +
            -1 * (parseInt($window.scrollTop()) / settings.parallaxFactor) +
            "px"
        );
      })
      .on("resize.overflow_parallax", function () {
        // If we're in a situation where we need to temporarily disable parallax, do so.
        if (breakpoints.active("<=narrow")) {
          $body.css("background-position", "");
          $bg = $dummy;
        }

        // Otherwise, continue as normal.
        else $bg = $body;

        // Trigger scroll handler.
        $window.triggerHandler("scroll.overflow_parallax");
      })
      .trigger("resize.overflow_parallax");
  }

  // Poptrox.
  $(".gallery").poptrox({
    useBodyOverflow: false,
    usePopupEasyClose: false,
    overlayColor: "#0a1919",
    overlayOpacity: 0.75,
    usePopupDefaultStyling: false,
    usePopupCaption: true,
    popupLoaderText: "",
    windowMargin: 10,
    usePopupNav: true,
  });

  // Cookie Popup
  function GetCookie(name) {
    var arg = name + "=";
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    while (i < clen) {
      var j = i + alen;
      if (document.cookie.substring(i, j) == arg) return "here";
      i = document.cookie.indexOf(" ", i) + 1;
      if (i == 0) break;
    }
    return null;
  }

  function testFirstCookie() {
    var offset = new Date().getTimezoneOffset();
    if (offset >= -180 && offset <= 0) {
      // European time zones
      var visit = GetCookie("cookieCompliancyAccepted");
      if (visit == null) {
        $("#cookie_popup").fadeIn(400); // Show warning
      } else {
        // Already accepted
        gtag("config", "UA-162978011-1");
        $("#cookie_popup").hide(400);
      }
    }
  }

  function stripHtml(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  function sendData() {
    var cb = document.getElementById("dse_checkbox");
    if (cb.checked) {
      var loadingOverlay = document.getElementById("overlay");
      loadingOverlay.classList.remove("hidden");

      const XHR = new XMLHttpRequest();

      // Bind the FormData object and the form element
      var fd = new FormData(form);

      for (var key in fd) {
        fd[key] = stripHtml(fd[key]);
      }

      var mailDate = Math.floor(Date.now() / 1000);
      if ($("#btn_month_1").hasClass("selected")) {
        mailDate = mailDate + 30 * 24 * 60 * 60;
      } else if ($("#btn_month_3").hasClass("selected")) {
        mailDate = mailDate + 90 * 24 * 60 * 60;
      } else if ($("#btn_month_6").hasClass("selected")) {
        mailDate = mailDate + 180 * 24 * 60 * 60;
      } else if ($("#btn_month_12").hasClass("selected")) {
        mailDate = mailDate + 365 * 24 * 60 * 60;
      } else {
        var date = Date.parse($("#dateInput input").val());
        mailDate = Math.floor(date / 1000);
      }

      fd.set("mailDate", mailDate);
      XHR.withCredentials = true;
      // Define what happens on successful data submission
      XHR.addEventListener("load", function (event) {
        loadingOverlay.classList.add("hidden");
        if (event.target.status == 200) {
          $("#successModal").modal();
        } else {
          $("#errorModal").modal();
        }
      });

      // Define what happens in case of error
      XHR.addEventListener("error", function (event) {
        loadingOverlay.classList.add("hidden");
        $("#errorModal").modal();
      });

      // Set up our request
      XHR.open("POST", "/send");

      // The data sent is what the user provided in the form
      XHR.send(fd);
    } else {
      alert(
        "Die Datenschutzerklärung muss akzeptiert werden um das Formular senden zu dürfen."
      );
    }
  }

  // Access the form element...
  let form = document.getElementById("mailForm");

  // ...and take over its submit event.
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendData();
  });

  $("#cookieButton").click(function () {
    var expire = new Date();
    expire = new Date(expire.getTime() + 7776000000);
    document.cookie =
      "cookieCompliancyAccepted=here; expires=" + expire + ";path=/";
    $("#cookie_popup").hide(400);
    gtag("config", "UA-162978011-1");
  });
  testFirstCookie();

  $(".groupBtn").click(function (e) {
    e.preventDefault();
    if (!$(this).hasClass("selected")) {
      $(".groupBtn").each(function (index) {
        $(this).removeClass("selected");
      });
      $(this).addClass("selected");
      $("#dateInput input").val("");
    }
  });

  $("#dateInput input").focus(function (e) {
    $(".groupBtn").each(function (index) {
      $(this).removeClass("selected");
    });
  });

  $("#dateInput input").datepicker({
    startView: 1,
    maxViewMode: 3,
    language: "de",
  });
})(jQuery);
