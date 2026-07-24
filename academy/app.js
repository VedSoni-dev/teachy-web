(function () {
  "use strict";

  // Easter egg for the curious who open the console.
  try {
    console.log(
      "%c ▶ REC %c teachy %c\n\nyou opened the console. of course you did.\nteachy would've pointed at it for you.\n\nnow go make something.\n",
      "background:#ff2d43;color:#fff;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;font-family:monospace;",
      "background:#3380ff;color:#fff;font-weight:700;padding:2px 8px;border-radius:0 4px 4px 0;",
      "color:#6b6478;font-size:12px;"
    );
  } catch (e) {}

  var clickyGuide = document.getElementById("clicky-guide");

  var landingCursorActive = false;
  var pointerX = 0;
  var pointerY = 0;
  var clickyX = 0;
  var clickyY = 0;

  function onPointerMove(event) {
    if (!document.body.classList.contains("has-mouse")) {
      document.body.classList.add("has-mouse");
      document.body.classList.add("landing-cursor");
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
  }

  function followPointerLoop() {
    if (!landingCursorActive || !clickyGuide) return;
    // Ease toward the real cursor so Teachy trails slightly, like the app.
    clickyX += (pointerX - clickyX) * 0.22;
    clickyY += (pointerY - clickyY) * 0.22;
    clickyGuide.style.transform =
      "translate(" + Math.round(clickyX - 3) + "px, " + Math.round(clickyY - 2) + "px)";
    requestAnimationFrame(followPointerLoop);
  }

  // On the landing, Teachy is just the cursor — it follows the visitor's mouse
  // like it does in the real app, instead of clicking buttons for them.
  function startLandingCursor() {
    if (!clickyGuide || landingCursorActive) return;
    landingCursorActive = true;
    pointerX = clickyX = window.innerWidth / 2;
    pointerY = clickyY = window.innerHeight / 2;
    clickyGuide.hidden = false;
    clickyGuide.classList.remove("is-left");
    if (document.body.classList.contains("has-mouse")) {
      document.body.classList.add("landing-cursor");
    }
    window.addEventListener("mousemove", onPointerMove);
    requestAnimationFrame(followPointerLoop);
  }

  var freeLearningBtn = document.getElementById("free-learning");
  if (freeLearningBtn) {
    freeLearningBtn.addEventListener("click", function (event) {
      var href = freeLearningBtn.getAttribute("href");
      if (href) {
        event.preventDefault();
        window.location.href = href;
      }
    });
  }

  startLandingCursor();

  // Chat texting animation — each compact thread loops on its own,
  // staggered so the row feels alive with different tasks.
  (function initChatAnimation() {
    var surfaces = Array.prototype.slice.call(document.querySelectorAll(".chat-surface"));
    if (!surfaces.length) return;

    var typingAppearDelay = 420;
    var messageRevealDelay = 1400;
    var restartHoldDelay = 2200;

    function animateSurface(chatSurface) {
      var rows = Array.prototype.slice.call(chatSurface.querySelectorAll(".chat-row"));
      var typing = chatSurface.querySelector(".chat-typing");
      if (!rows.length || !typing) return;

      var animationStarted = false;
      var startDelay = parseInt(chatSurface.getAttribute("data-chat-delay"), 10) || 0;

      function matchTypingToRow(row) {
        typing.classList.remove("chat-left", "chat-right", "chat-blue", "chat-orange");
        typing.classList.add(
          row.classList.contains("chat-right") ? "chat-right" : "chat-left",
          row.classList.contains("chat-blue") ? "chat-blue" : "chat-orange"
        );
        row.parentNode.insertBefore(typing, row);
      }

      function hideTyping() {
        typing.classList.remove("is-shown");
      }

      function resetConversation() {
        rows.forEach(function (row) {
          row.classList.remove("is-shown");
        });
        hideTyping();
      }

      function showMessage(index) {
        if (index >= rows.length) {
          setTimeout(function () {
            resetConversation();
            setTimeout(function () {
              showMessage(0);
            }, 320);
          }, restartHoldDelay);
          return;
        }

        var row = rows[index];

        setTimeout(function () {
          matchTypingToRow(row);
          typing.classList.add("is-shown");
        }, typingAppearDelay);

        setTimeout(function () {
          hideTyping();
          row.classList.add("is-shown");
          showMessage(index + 1);
        }, messageRevealDelay);
      }

      function startLoop() {
        if (animationStarted) return;
        animationStarted = true;
        setTimeout(function () {
          showMessage(0);
        }, startDelay);
      }

      if ("IntersectionObserver" in window) {
        var chatObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                startLoop();
                chatObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.08 }
        );
        chatObserver.observe(chatSurface);
      } else {
        startLoop();
      }
    }

    surfaces.forEach(animateSurface);
  })();
})();
