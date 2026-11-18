// Every Teachy change worth telling someone about, newest first.
// Written as what changes for the person using Teachy, from the real commit history
// of github.com/VedSoni-dev/teachy. Only shipped or merged work goes here.
//
// status: "released" = in a downloadable build (has a version)
//         "on main"  = merged in the repo, lands in the next build
// platforms: any of "mac", "windows", "site"
//
// To add a release: put a new object at the top. index.html shows the first one,
// changelog.html shows them all.
window.TEACHY_CHANGELOG = [
  {
    date: "2026-11-18",
    status: "released",
    version: "2.1",
    platforms: ["mac"],
    title: "Teachy takes the wheel",
    summary:
      "Agent jobs can now use your Mac like you do, drawings stay live while Teachy talks, and every chat is saved. Existing installs get it through the in-app updater.",
    sections: [
      {
        name: "New",
        items: [
          { title: "Real computer use", text: "Agent jobs can click, type and scroll with the real pointer, and drive a built-in browser. Risky clicks like send, buy or delete still ask first." },
          { title: "Borrow the mouse", text: "Nudge the mouse mid-job and Teachy hands it back, counts down, then takes another look before carrying on. Escape still stops it." },
          { title: "Projects and a live rail", text: "Agent jobs and drawings are grouped into projects, with a rail at the side of your desktop showing what is running." },
          { title: "Live drawings", text: "Pause, scrub and replay a drawing while it narrates. Marks follow the thing they point at, and Teachy can adjust a drawing that is already on screen." },
          { title: "Saved chats", text: "Every conversation is kept, searchable, and summarised as it grows. A daily journal lets Teachy remember what you worked on yesterday." },
          { title: "Coding help in jobs", text: "Point a job at a project folder and it can read, search and edit code, asking before it changes anything." },
          { title: "Tap the screen to talk", text: "On Apple silicon MacBooks, tap beside the camera to start and stop talking. Off by default, in Settings, Touch and Eyes." },
          { title: "Eye tracking (experimental)", text: "Calibrate your webcam and Teachy knows roughly where you were looking when you said \"this\". Nothing leaves your Mac." },
          { title: "A notch on every Mac", text: "Macs without a notch get one too, and the on-screen pointer stays hidden until Teachy needs it." },
          { title: "Sharper screen marks", text: "Circles and highlights land on the exact words you asked about." },
          { title: "Easier Chrome setup", text: "Get the Chrome extension from Settings and Teachy walks you through installing it." },
          { title: "Bolder voice", text: "Teachy takes the next step without being asked, and can open the links it mentions." },
        ],
      },
      {
        name: "Fixes",
        items: [
          { title: "Push-to-talk never goes silent", text: "Fixed a case where holding the keys recorded nothing." },
          { title: "Microphone switching", text: "Changing mics mid-session no longer breaks the next question." },
          { title: "Lighter on the battery", text: "3D drawings render at 30 fps and agent jobs use far fewer tokens." },
        ],
      },
    ],
  },
  {
    date: "2026-11-16",
    status: "released",
    version: "2.0",
    platforms: ["mac"],
    title: "Teachy grows up: from course app to assistant",
    summary:
      "The biggest change since launch. Courses are gone and Teachy is now an assistant you talk to: ask about anything on your screen and it helps you right there, or just does it.",
    sections: [
      {
        name: "New",
        items: [
          { title: "Answers out loud, fast", text: "Hold control + option and ask. Teachy starts speaking on the first sentence, about half a second in." },
          { title: "Draws to explain", text: "Teachy sketches in 2D and builds 3D scenes over your screen, narrates them as it goes, points a camera that directs itself, and can save the drawing as a video." },
          { title: "Walkthroughs in any app", text: "Ask how to do something and Teachy walks you through it click by click, with app skills for the tools you use." },
          { title: "Agent jobs", text: "Hand off a job and keep working. Several can run at once, they have names and history, and routines run on a schedule." },
          { title: "It asks first", text: "Anything that touches your Mac goes through a permission gate in code: allow once, for this job, always, or not now." },
          { title: "Works in your own browser", text: "A Chrome extension lets agent jobs use the browser you're already signed into, behind the same gate." },
          { title: "Connectors", text: "Plug in MCP servers over stdio or HTTP, with an API key or a browser sign-in." },
          { title: "Dictation everywhere", text: "Hold fn + control in any text field and talk; it types live and fixes itself in place. Pick your own keys." },
          { title: "A memory you can read", text: "What Teachy knows about you is plain text on your Mac. Edit it and Teachy picks it up." },
          { title: "Always-on voice", text: "Talk hands-free, interrupt it mid-sentence, it goes quiet on calls, replies in your language, and has 22 more voices with real speed control." },
          { title: "Chat window and files", text: "Type instead of talk, attach files, and have Teachy read documents." },
          { title: "Pick your mic", text: "See which microphone Teachy is listening with, test the level live, and fail over if it drops." },
        ],
      },
      {
        name: "Removed",
        items: [
          { title: "Courses", text: "The course store, lessons and teach-backs are gone. One general assistant replaces them." },
        ],
      },
    ],
  },
  {
    date: "2026-07-28",
    status: "on main",
    platforms: ["mac", "windows"],
    title: "Progress that sticks",
    summary: "A reliability pass: nothing you did gets lost, and setting up your own key is walked through.",
    sections: [
      {
        name: "Fixes",
        items: [
          { title: "Progress stays saved", text: "Fixed a bug that could lose your progress, and covered the store with tests." },
          { title: "Push-to-talk holds up", text: "Releasing the talk key no longer kills the Windows helper process." },
          { title: "Bring your own key", text: "Teachy now walks you through adding your own AI key step by step." },
        ],
      },
    ],
  },
  {
    date: "2026-07-27",
    status: "on main",
    platforms: ["windows"],
    title: "Teachy on Windows",
    summary: "A cross-platform desktop app, so Teachy isn't Mac-only.",
    sections: [
      {
        name: "New",
        items: [
          { title: "Windows build", text: "An Electron app with a native helper for the hotkey, screen capture and mic, packaged so it actually installs." },
          { title: "Same behavior as the Mac", text: "Coaching, the cursor overlay and the design match the Mac app." },
          { title: "Progress tab", text: "See what you've done at a glance." },
        ],
      },
    ],
  },
  {
    date: "2026-07-19",
    status: "on main",
    platforms: ["mac"],
    title: "Teachy starts doing, not just telling",
    summary: "A week of making Teachy act on your Mac, see more of what you're doing, and remember where you left off.",
    sections: [
      {
        name: "New",
        items: [
          { title: "Does the mechanical steps", text: "Guided tasks plan from your real screen, do the boring clicks themselves, check the result and replan when something changes." },
          { title: "Native Mac control", text: "One-shot actions like opening apps and pages, chained in one breath." },
          { title: "Knows your tab", text: "Teachy knows the exact browser page you're on and every app you have open." },
          { title: "Writes the prompt for you", text: "Teachy crafts a strong prompt and puts it on your clipboard." },
          { title: "Builds that survive", text: "Projects persist across days and relaunches; Teachy offers to pick up where you stopped." },
          { title: "Catches you stuck", text: "A debugging coach steps in at the moment people usually quit." },
          { title: "Permissions, one at a time", text: "An animated setup wizard instead of a wall of system prompts." },
        ],
      },
      {
        name: "Fixes",
        items: [
          { title: "No zombie voice", text: "Interrupting Teachy stops it cleanly, and buttons respond instantly." },
        ],
      },
    ],
  },
  {
    version: "1.1",
    date: "2026-07-14",
    status: "released",
    platforms: ["mac"],
    title: "Whiteboard and a better course screen",
    summary: "The first update, delivered through the in-app updater.",
    sections: [
      {
        name: "New",
        items: [
          { title: "Whiteboard", text: "Teachy can sketch on a whiteboard while it explains." },
          { title: "More AI providers", text: "The proxy talks to more than one provider." },
          { title: "Course screen redesign", text: "A cleaner layout for picking and following courses." },
        ],
      },
    ],
  },
  {
    version: "1.0",
    date: "2026-07-13",
    status: "released",
    platforms: ["mac"],
    title: "Hello, Teachy",
    summary: "The first public build, picking up from the open-source Clicky codebase.",
    sections: [
      {
        name: "New",
        items: [
          { title: "A buddy next to your cursor", text: "Push to talk, screen pointing, and a notch panel." },
          { title: "Free downloads with updates", text: "Community builds on GitHub Releases, with signed Sparkle updates." },
        ],
      },
    ],
  },
];

// Recent commit subjects from the repo, for the shipping ticker. Newest first.
window.TEACHY_COMMITS = [
  ["69432a8", "Give the 3D drawing a camera that directs itself, and refine drawings in place"],
  ["fa329b2", "Drawings narrate themselves, mark up the live screen, and can be replayed and saved as video"],
  ["96073df", "Wire walkthroughs and app skills into the voice turn"],
  ["cdb4db6", "Walkthrough engine and app skills"],
  ["a39c78e", "Give agent jobs browser tools through the Chrome extension, behind the permission gate"],
  ["ef66eae", "Chrome extension: agents work in the person's own browser"],
  ["274a5c4", "Start the routine scheduler and show agents on the Home tab"],
  ["61edf30", "Agents: concurrent jobs, faster loop, history, named agents, routines, connector catalog"],
  ["6c7fb21", "Always-on voice mode, barge-in, quiet on calls, mic failover, reply languages, 22 more voices"],
  ["c7c80b4", "Dictation: live typing, instant release, in-place correction; screen-aware writer"],
  ["6be632b", "feat: MCP connectors (stdio + HTTP, API key or browser sign-in)"],
  ["df8a762", "feat: give Teachy a memory you can read and edit"],
];
window.TEACHY_REPO = "https://github.com/VedSoni-dev/teachy";
window.TEACHY_DMG = "https://github.com/VedSoni-dev/teachy-releases/releases/latest/download/Teachy.dmg";
