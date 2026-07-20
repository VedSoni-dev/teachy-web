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

  var INTRO_STORAGE_KEY = "teachyIntroSeen_v1";

  var tourTimer = null;
  var introAborted = false;
  var demoWaitingCleanup = null;

  var introEl = document.getElementById("intro");
  var introStage = document.getElementById("intro-stage");
  var panelFlood = document.getElementById("panel-flood");
  var panelManifesto = document.getElementById("panel-manifesto");
  var panelName = document.getElementById("panel-name");
  var panelDemo = document.getElementById("panel-demo");
  var floodStack = document.getElementById("flood-stack");
  var floodKicker = document.getElementById("flood-kicker");
  var floodType = document.getElementById("flood-type");
  var manifestoType = document.getElementById("manifesto-type");
  var introducingType = document.getElementById("introducing-type");
  var bamWrap = document.getElementById("bam-wrap");
  var skipIntroBtn = document.getElementById("skip-intro");
  var skipDemoBtn = document.getElementById("skip-demo");
  var replayIntroBtn = document.getElementById("replay-intro");
  var tryDemoBtn = document.getElementById("try-demo");
  var clickyGuide = document.getElementById("clicky-guide");

  var demoPhase = document.getElementById("demo-phase");
  var demoPage = document.getElementById("demo-page");
  var demoClicky = document.getElementById("demo-clicky");
  var demoSpeech = document.getElementById("demo-speech");
  var demoCursor = document.getElementById("demo-cursor");
  var demoChalk = document.getElementById("demo-chalk");
  var demoUrlText = document.getElementById("demo-url-text");
  var demoViewHome = document.getElementById("demo-view-home");
  var demoViewForm = document.getElementById("demo-view-form");
  var demoViewDone = document.getElementById("demo-view-done");
  var demoBtnNew = document.getElementById("demo-btn-new");
  var demoBtnCreate = document.getElementById("demo-btn-create");
  var demoRepoName = document.getElementById("demo-repo-name");
  var demoDoneTitle = document.getElementById("demo-done-title");

  var FLOOD_THUMBS = [
    "thumbs/1.png",
    "thumbs/2.png",
    "thumbs/3.png",
    "thumbs/4.png",
    "thumbs/5.png",
    "thumbs/6.png",
  ];

  var STACK_LAYOUT = [
    { x: -150, y: 28, r: -14, z: 1 },
    { x: 150, y: 20, r: 12, z: 2 },
    { x: -70, y: -10, r: -6, z: 3 },
    { x: 80, y: -6, r: 7, z: 4 },
    { x: -20, y: 8, r: -2, z: 5 },
    { x: 10, y: -18, r: 3, z: 6 },
  ];

  function waitOrAbort(ms) {
    return new Promise(function (resolve) {
      var started = Date.now();
      var id = setInterval(function () {
        if (introAborted || Date.now() - started >= ms) {
          clearInterval(id);
          resolve();
        }
      }, 40);
    });
  }

  function showPanel(panel) {
    [panelFlood, panelManifesto, panelName, panelDemo].forEach(function (el) {
      if (!el) return;
      el.hidden = el !== panel;
      if (el === panel) {
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
      }
    });
  }

  async function typewrite(el, text, msPerChar) {
    if (!el) return;
    var speed = msPerChar || 42;
    el.innerHTML = "";
    var textNode = document.createTextNode("");
    var caret = document.createElement("span");
    caret.className = "caret";
    el.appendChild(textNode);
    el.appendChild(caret);

    for (var i = 0; i < text.length; i++) {
      if (introAborted) return;
      textNode.textContent += text.charAt(i);
      var ch = text.charAt(i);
      var pause = speed;
      if (ch === "." || ch === "—" || ch === ",") pause = speed * 7;
      if (ch === "g") pause = speed * 2.2;
      await waitOrAbort(pause);
    }
    await waitOrAbort(280);
    if (!introAborted && caret.parentNode) caret.remove();
  }

  function buildFloodStack() {
    if (!floodStack) return;
    floodStack.innerHTML = "";
    FLOOD_THUMBS.forEach(function (src, index) {
      var layout = STACK_LAYOUT[index] || STACK_LAYOUT[STACK_LAYOUT.length - 1];
      var card = document.createElement("div");
      card.className = "flood-card-big";
      card.style.zIndex = String(layout.z);
      card.style.animationDelay = (index * 0.1).toFixed(2) + "s";
      card.style.setProperty(
        "--stack-end",
        "translate(" + layout.x + "px, " + layout.y + "px) scale(1) rotate(" + layout.r + "deg)"
      );
      card.innerHTML =
        '<img src="' +
        src +
        '" alt="" />' +
        '<div class="fc-play" aria-hidden="true"></div>';
      floodStack.appendChild(card);
    });
  }

  function setDemoPhase(text, mode) {
    if (!demoPhase) return;
    demoPhase.textContent = text;
    demoPhase.classList.toggle("is-wait", mode === "wait");
    demoPhase.classList.toggle("is-done", mode === "done");
  }

  function showDemoView(view) {
    [demoViewHome, demoViewForm, demoViewDone].forEach(function (el) {
      if (!el) return;
      el.hidden = el !== view;
    });
  }

  function clearDemoHighlights() {
    [demoBtnNew, demoBtnCreate, demoRepoName].forEach(function (el) {
      if (el) el.classList.remove("is-hot");
    });
    if (demoChalk) demoChalk.classList.remove("is-on");
  }

  function showDemoClicky() {
    if (!demoClicky) return;
    demoClicky.hidden = false;
  }

  function hideDemoClicky() {
    if (!demoClicky) return;
    demoClicky.hidden = true;
    if (demoSpeech) {
      demoSpeech.classList.remove("is-on");
      demoSpeech.textContent = "";
    }
  }

  function placeDemoClicky(left, top, flip) {
    if (!demoClicky) return;
    showDemoClicky();
    demoClicky.style.left = Math.round(left) + "px";
    demoClicky.style.top = Math.round(top) + "px";
    demoClicky.classList.toggle("is-flipped", !!flip);
  }

  function pointDemoAt(el) {
    if (!demoPage || !el) return;
    var pageRect = demoPage.getBoundingClientRect();
    var targetRect = el.getBoundingClientRect();
    var nearRightEdge = targetRect.left - pageRect.left > pageRect.width * 0.55;
    var left = targetRect.left - pageRect.left + (nearRightEdge ? -8 : targetRect.width + 10);
    var top = targetRect.top - pageRect.top + Math.max(0, targetRect.height * 0.15);
    placeDemoClicky(left, top, nearRightEdge);

    if (demoChalk) {
      var pad = 6;
      demoChalk.style.left = Math.round(targetRect.left - pageRect.left - pad) + "px";
      demoChalk.style.top = Math.round(targetRect.top - pageRect.top - pad) + "px";
      demoChalk.style.width = Math.round(targetRect.width + pad * 2) + "px";
      demoChalk.style.height = Math.round(targetRect.height + pad * 2) + "px";
      demoChalk.classList.add("is-on");
    }
    el.classList.add("is-hot");
  }

  async function clickySays(text) {
    showDemoClicky();
    if (demoSpeech) {
      demoSpeech.classList.add("is-on");
      await typewrite(demoSpeech, text, 20);
    }
  }

  function cancelDemoWait() {
    if (typeof demoWaitingCleanup === "function") {
      demoWaitingCleanup();
      demoWaitingCleanup = null;
    }
  }

  function waitForUser(register) {
    return new Promise(function (resolve) {
      if (introAborted) {
        resolve(null);
        return;
      }
      cancelDemoWait();
      var settled = false;
      function done(value) {
        if (settled) return;
        settled = true;
        cancelDemoWait();
        resolve(value);
      }
      demoWaitingCleanup = register(done);
      var poll = setInterval(function () {
        if (introAborted) {
          clearInterval(poll);
          done(null);
        }
      }, 80);
      var prevCleanup = demoWaitingCleanup;
      demoWaitingCleanup = function () {
        clearInterval(poll);
        if (typeof prevCleanup === "function") prevCleanup();
      };
    });
  }

  function resetDemo() {
    cancelDemoWait();
    clearDemoHighlights();
    hideDemoClicky();
    if (demoCursor) demoCursor.classList.remove("is-click");
    if (demoClicky) {
      demoClicky.style.left = "48px";
      demoClicky.style.top = "120px";
      demoClicky.classList.remove("is-flipped");
    }
    if (demoRepoName) {
      demoRepoName.value = "";
      demoRepoName.blur();
    }
    if (demoBtnCreate) demoBtnCreate.disabled = true;
    if (demoUrlText) demoUrlText.textContent = "github.com";
    if (demoDoneTitle) demoDoneTitle.textContent = "hello-teachy";
    showDemoView(demoViewHome);
    setDemoPhase("Demo", "");
  }

  async function playInteractiveDemo() {
    resetDemo();
    if (introAborted) return;

    setDemoPhase("Watch", "");
    placeDemoClicky(56, 100, false);
    await clickySays("hey — pretend this browser is your Mac. i’ll teach you like i do for real.");
    if (introAborted) return;
    await waitOrAbort(450);
    if (introAborted) return;

    // Step 1: click New
    if (demoUrlText) demoUrlText.textContent = "github.com";
    showDemoView(demoViewHome);
    await clickySays("goal: create a GitHub repo. click New.");
    if (introAborted) return;
    pointDemoAt(demoBtnNew);
    setDemoPhase("Your turn", "wait");

    await waitForUser(function (done) {
      function onClick(event) {
        event.preventDefault();
        if (demoCursor) {
          demoCursor.classList.add("is-click");
          setTimeout(function () {
            if (demoCursor) demoCursor.classList.remove("is-click");
          }, 180);
        }
        done(true);
      }
      if (demoBtnNew) demoBtnNew.addEventListener("click", onClick);
      return function () {
        if (demoBtnNew) demoBtnNew.removeEventListener("click", onClick);
      };
    });
    if (introAborted) return;

    clearDemoHighlights();
    setDemoPhase("Nice", "");
    placeDemoClicky(56, 100, false);
    await clickySays("good — you acted. that’s the loop.");
    if (introAborted) return;

    // Step 2: name the repo
    showDemoView(demoViewForm);
    if (demoUrlText) demoUrlText.textContent = "github.com/new";
    await waitOrAbort(350);
    if (introAborted) return;
    await clickySays("name it hello-teachy — then press return.");
    if (introAborted) return;
    pointDemoAt(demoRepoName);
    if (demoRepoName) demoRepoName.focus();
    setDemoPhase("Your turn", "wait");

    var repoName = await waitForUser(function (done) {
      var typingTimer = null;

      function currentValue() {
        return (demoRepoName && demoRepoName.value.trim()) || "";
      }

      function syncCreateEnabled() {
        if (demoBtnCreate) demoBtnCreate.disabled = currentValue().length < 2;
      }

      function onInput() {
        syncCreateEnabled();
        clearTimeout(typingTimer);
        if (currentValue().length >= 2) {
          typingTimer = setTimeout(function () {
            done(currentValue());
          }, 900);
        }
      }

      function onKey(event) {
        if (event.key === "Enter" && currentValue().length >= 2) {
          clearTimeout(typingTimer);
          done(currentValue());
        }
      }

      if (demoRepoName) {
        demoRepoName.addEventListener("input", onInput);
        demoRepoName.addEventListener("keydown", onKey);
      }
      syncCreateEnabled();

      return function () {
        clearTimeout(typingTimer);
        if (demoRepoName) {
          demoRepoName.removeEventListener("input", onInput);
          demoRepoName.removeEventListener("keydown", onKey);
        }
      };
    });
    if (introAborted) return;

    repoName = (repoName || (demoRepoName && demoRepoName.value.trim()) || "hello-teachy").replace(
      /\s+/g,
      "-"
    );
    if (demoRepoName) demoRepoName.value = repoName;
    if (demoBtnCreate) demoBtnCreate.disabled = false;
    clearDemoHighlights();

    await clickySays("perfect. hit Create repository.");
    if (introAborted) return;
    pointDemoAt(demoBtnCreate);
    setDemoPhase("Your turn", "wait");

    await waitForUser(function (done) {
      function onClick(event) {
        event.preventDefault();
        if (demoBtnCreate && demoBtnCreate.disabled) return;
        if (demoCursor) {
          demoCursor.classList.add("is-click");
          setTimeout(function () {
            if (demoCursor) demoCursor.classList.remove("is-click");
          }, 180);
        }
        done(true);
      }
      if (demoBtnCreate) demoBtnCreate.addEventListener("click", onClick);
      return function () {
        if (demoBtnCreate) demoBtnCreate.removeEventListener("click", onClick);
      };
    });
    if (introAborted) return;

    clearDemoHighlights();
    if (demoDoneTitle) demoDoneTitle.textContent = repoName;
    if (demoUrlText) demoUrlText.textContent = "github.com/you/" + repoName;
    showDemoView(demoViewDone);
    setDemoPhase("Checked ✓", "done");
    placeDemoClicky(56, 80, false);

    await clickySays("checked. point → you act → i check. that’s me.");
    if (introAborted) return;
    await waitOrAbort(900);
    if (introAborted) return;

    await clickySays(
      "also — ask me anything. i keep memory of what you’re working on, so help stays specific to your day."
    );
    if (introAborted) return;
    await waitOrAbort(1400);
  }

  async function runIntro(options) {
    options = options || {};
    introAborted = false;
    stopLandingCursor();
    resetDemo();
    buildFloodStack();
    if (bamWrap) {
      bamWrap.hidden = true;
      bamWrap.classList.remove("is-in");
    }
    if (floodKicker) floodKicker.classList.remove("is-on");
    if (floodType) floodType.textContent = "";
    if (manifestoType) manifestoType.innerHTML = "";
    if (introducingType) introducingType.textContent = "";
    if (introStage) introStage.classList.remove("is-shake");

    document.body.classList.add("intro-active");
    if (introEl) {
      introEl.classList.remove("is-done");
      introEl.setAttribute("aria-hidden", "false");
    }

    if (!options.demoOnly) {
      showPanel(panelFlood);
      if (floodKicker) floodKicker.classList.remove("is-on");
      if (floodType) floodType.textContent = "";
      await waitOrAbort(220);
      if (introAborted) return finishIntro(false);
      if (floodKicker) floodKicker.classList.add("is-on");
      await waitOrAbort(280);
      if (introAborted) return finishIntro(false);
      await typewrite(floodType, "When you try to learn anything…", 30);
      if (introAborted) return finishIntro(false);
      await waitOrAbort(450);
      if (introAborted) return finishIntro(false);
      await typewrite(floodType, "You get this.", 36);
      if (introAborted) return finishIntro(false);
      await waitOrAbort(650);
      if (introAborted) return finishIntro(false);

      showPanel(panelManifesto);
      var manifestoLines = [
        "The era of reaction-based learning is gone.",
        "No one learns from watching someone else do the work anymore.",
        "It’s time for a 1:1 tutor who teaches by acting first.",
      ];
      if (manifestoType) manifestoType.innerHTML = "";
      for (var manifestoIndex = 0; manifestoIndex < manifestoLines.length; manifestoIndex++) {
        if (introAborted) return finishIntro(false);
        var manifestoLine = document.createElement("p");
        manifestoLine.className = "type-line manifesto-line-typed";
        if (manifestoType) manifestoType.appendChild(manifestoLine);
        await typewrite(manifestoLine, manifestoLines[manifestoIndex], 34);
        if (introAborted) return finishIntro(false);
        await waitOrAbort(420);
      }
      if (introAborted) return finishIntro(false);
      await waitOrAbort(550);
      if (introAborted) return finishIntro(false);

      showPanel(panelName);
      await waitOrAbort(300);
      if (introAborted) return finishIntro(false);
      await typewrite(introducingType, "introducinggg…", 75);
      if (introAborted) return finishIntro(false);
      await waitOrAbort(380);
      if (introAborted) return finishIntro(false);

      if (bamWrap) {
        bamWrap.hidden = false;
        void bamWrap.offsetWidth;
        bamWrap.classList.add("is-in");
      }
      if (introStage) {
        introStage.classList.remove("is-shake");
        void introStage.offsetWidth;
        introStage.classList.add("is-shake");
      }
      await waitOrAbort(1600);
      if (introAborted) return finishIntro(false);
    }

    showPanel(panelDemo);
    await playInteractiveDemo();
    if (introAborted) return finishIntro(false);

    await waitOrAbort(400);
    finishIntro(true);
  }

  function finishIntro(markSeen) {
    introAborted = true;
    cancelDemoWait();
    resetDemo();
    if (markSeen) {
      try {
        localStorage.setItem(INTRO_STORAGE_KEY, "1");
      } catch (e) {}
    }
    if (introEl) {
      introEl.classList.add("is-done");
      introEl.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("intro-active");
    startLandingCursor();
  }

  function skipIntro() {
    finishIntro(true);
  }

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
  // Only hide the native cursor when a real mouse is present (touch fallback).
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

  function stopLandingCursor() {
    landingCursorActive = false;
    document.body.classList.remove("landing-cursor");
    window.removeEventListener("mousemove", onPointerMove);
    if (clickyGuide) clickyGuide.hidden = true;
  }

  function beginReplay(demoOnly) {
    if (tourTimer) clearTimeout(tourTimer);
    if (clickyGuide) clickyGuide.hidden = true;
    try {
      localStorage.removeItem(INTRO_STORAGE_KEY);
    } catch (e) {}
    runIntro({ demoOnly: !!demoOnly });
  }

  if (skipIntroBtn) skipIntroBtn.addEventListener("click", skipIntro);
  if (skipDemoBtn) skipDemoBtn.addEventListener("click", skipIntro);
  if (replayIntroBtn) {
    replayIntroBtn.addEventListener("click", function () {
      beginReplay(false);
    });
  }
  if (tryDemoBtn) {
    tryDemoBtn.addEventListener("click", function () {
      beginReplay(true);
    });
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

  var seen = false;
  try {
    seen = localStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch (e) {}

  var forceIntro =
    /(?:\?|&)(?:intro|fresh)=1\b/.test(window.location.search) ||
    window.location.hash === "#intro";

  if (seen && !forceIntro) {
    if (introEl) {
      introEl.classList.add("is-done");
      introEl.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("intro-active");
    startLandingCursor();
  } else {
    document.body.classList.add("intro-active");
    setTimeout(function () {
      runIntro({ demoOnly: false });
    }, 200);
  }

  // Chat texting animation — remake of the reference AnimatedChat loop:
  // for each message, show a typing bubble (colored like the upcoming message),
  // then reveal the message; after the last one, hold and restart forever.
  (function initChatAnimation() {
    var chatSurface = document.querySelector(".chat-surface");
    if (!chatSurface) return;

    var rows = Array.prototype.slice.call(chatSurface.querySelectorAll(".chat-row"));
    var typing = chatSurface.querySelector(".chat-typing");
    if (!rows.length || !typing) return;

    var typingAppearDelay = 500;   // wait before the typing bubble pops in
    var messageRevealDelay = 1700; // total time per message (typing hides, message shows)
    var restartHoldDelay = 2600;   // pause on the finished conversation before looping
    var animationStarted = false;

    // Style the shared typing bubble like the message that is about to arrive
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
          setTimeout(function () { showMessage(0); }, 400);
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
      showMessage(0);
    }

    // Start as soon as any part of the surface scrolls into view; the old 30%
    // threshold could never be reached on short viewports, so the demo never played.
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
        { threshold: 0.1 }
      );
      chatObserver.observe(chatSurface);
    } else {
      startLoop();
    }
  })();
})();
