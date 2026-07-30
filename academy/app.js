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

  // —— Comic SFX: BAM! SPLAT! POW! stamps ——
  var comicSfxWords = [
    "BAM!", "SPLAT!", "POW!", "ZAP!", "WHAM!",
    "BOOM!", "SNAP!", "KAPOW!", "YEAH!", "NICE!", "WHOOSH!"
  ];
  var comicSfxColors = ["yellow", "pink", "cyan", "orange", "lime"];
  var comicSfxWordIndex = 0;

  function nextComicSfxWord() {
    var word = comicSfxWords[comicSfxWordIndex % comicSfxWords.length];
    comicSfxWordIndex += 1;
    return word;
  }

  function spawnComicSfx(host, options) {
    if (!host || !document.body.classList.contains("comic-page")) return;
    options = options || {};
    var stamp = document.createElement("span");
    stamp.className =
      "comic-sfx comic-sfx-float comic-sfx-" +
      (options.color || comicSfxColors[comicSfxWordIndex % comicSfxColors.length]);
    stamp.setAttribute("aria-hidden", "true");
    var label = document.createElement("i");
    label.textContent = options.word || nextComicSfxWord();
    stamp.appendChild(label);

    var hostRect = host.getBoundingClientRect();
    var stage = options.stage || host;
    if (getComputedStyle(stage).position === "static") {
      stage.style.position = "relative";
    }
    var stageRect = stage.getBoundingClientRect();
    var side = options.side || (Math.random() > 0.5 ? "right" : "left");
    var offsetX = side === "right" ? hostRect.width - 8 : -18;
    var offsetY = options.y != null ? options.y : -6 + Math.random() * 10;
    var rotate = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 16);

    stamp.style.left = Math.round(hostRect.left - stageRect.left + offsetX) + "px";
    stamp.style.top = Math.round(hostRect.top - stageRect.top + offsetY) + "px";
    stamp.style.setProperty("--sfx-rot", rotate + "deg");
    stage.appendChild(stamp);

    // Force reflow so the enter animation plays
    void stamp.offsetWidth;
    stamp.classList.add("is-on");

    window.setTimeout(function () {
      stamp.classList.add("is-out");
    }, options.holdMs || 520);

    window.setTimeout(function () {
      if (stamp.parentNode) stamp.parentNode.removeChild(stamp);
    }, (options.holdMs || 520) + 380);
  }

  // Hero wordmark: letter-by-letter slam (no BAM stamps on the title)
  (function initComicWordmark() {
    if (!document.body.classList.contains("comic-page")) return;
    var wordmark = document.querySelector(".comic-wordmark");
    if (!wordmark) return;

    var text = (wordmark.getAttribute("data-text") || wordmark.textContent || "").trim();
    wordmark.textContent = "";
    wordmark.setAttribute("aria-label", text);
    text.split("").forEach(function (character, index) {
      var letter = document.createElement("span");
      letter.className = "comic-letter";
      letter.style.setProperty("--i", String(index));
      letter.textContent = character;
      wordmark.appendChild(letter);
    });
    wordmark.classList.add("is-slammed");
  })();

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
          // Comic burst on every bubble pop — denser on teachy replies
          var bubble = row.querySelector(".chat-bubble");
          if (bubble) {
            var isTeachy = row.classList.contains("chat-orange");
            spawnComicSfx(bubble, {
              stage: chatSurface,
              side: row.classList.contains("chat-right") ? "right" : "left",
              y: isTeachy ? -14 : -8,
              holdMs: isTeachy ? 620 : 480,
              color: isTeachy
                ? comicSfxColors[(comicSfxWordIndex + 1) % comicSfxColors.length]
                : comicSfxColors[comicSfxWordIndex % comicSfxColors.length]
            });
          }
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
