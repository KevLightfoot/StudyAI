const API_BASE = "https://studyai-backend-jmq5.onrender.com";

const extractBtn = document.getElementById("extractBtn");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");

const studyGuideInput = document.getElementById("studyGuideInput");
const topicsContainer = document.getElementById("topicsContainer");
const output = document.getElementById("output");

const loadingPanda = document.getElementById("loadingPanda");
const topicsLoadingPanda = document.getElementById("topicsLoadingPanda");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

let extractedTopics = [];
let latestStudyGuide = {
  studyGuide: []
};

function chunkArray(array, size) {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

function updateProgress(completed, total) {
  const percent = Math.round((completed / total) * 100);

  progressBar.style.width = `${percent}%`;
  progressText.textContent = `Completed ${completed} of ${total} topics...`;
}

function showTopicsPanda() {
  topicsContainer.textContent = "";
  topicsLoadingPanda.classList.remove("hidden");
}

function hideTopicsPanda() {
  topicsLoadingPanda.classList.add("hidden");
}

function showStudyGuidePanda(message, totalTopics) {
  output.textContent = "";
  downloadBtn.classList.add("hidden");

  progressBar.style.width = "0%";
  progressText.textContent = `Preparing ${totalTopics} topics...`;

  loadingPanda.querySelector("p").textContent = message;
  loadingPanda.classList.remove("hidden");
}

function hideStudyGuidePanda() {
  loadingPanda.classList.add("hidden");
}

function getSelectedTopics() {
  const checkedBoxes = document.querySelectorAll(".topic-checkbox:checked");
  return Array.from(checkedBoxes).map((box) => box.value);
}

function renderTopics(topics) {
  topicsContainer.innerHTML = "";

  if (!topics || topics.length === 0) {
    topicsContainer.textContent = "No topics found.";
    generateBtn.disabled = true;
    return;
  }

  topics.forEach((topic, index) => {
    const topicRow = document.createElement("label");
    topicRow.className = "topic-row";

    topicRow.innerHTML = `
      <input class="topic-checkbox" type="checkbox" value="${topic.title}" checked>
      <div>
        <strong>${index + 1}. ${topic.title}</strong>
        <p>${topic.reason}</p>
      </div>
    `;

    topicsContainer.appendChild(topicRow);
  });

  generateBtn.disabled = false;
}

let pandaMessageIndex = 0;
let pandaMessageTimer = null;

const pandaMessages = [
  "Patience is a tree with bitter roots that bears sweet fruits.",
  "A tiger does not take insults from sheep.",
  "A great man is hard on himself. A small man is hard on others. – Confucius",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "He who asks is a fool for five minutes, but he who does not ask remains a fool forever.",
  "To know the road ahead, ask those coming back.",
  "A journey of a thousand miles begins with a single step. – Lao Tzu",
  "Do not fear going slowly. Fear only standing still.",
  "The gem cannot be polished without friction, nor man perfected without trials.",
  "A closed mind is like a closed book; just a block of wood.",
  "Teachers open the door, but you must enter by yourself.",
  "Learning is a treasure that will follow its owner everywhere.",
  "Be not afraid of growing slowly, be afraid only of standing still.",
  "The bamboo that bends is stronger than the oak that resists.",
  "Tension is who you think you should be. Relaxation is who you are.",
  "The obstacle is the path.",
  "One beam, no matter how big, cannot support an entire house alone.",
  "A wise man adapts himself to circumstances, as water shapes itself to the vessel.",
  "Dig the well before you are thirsty.",
  "A bird does not sing because it has an answer. It sings because it has a song.",
  "He who conquers himself is the mightiest warrior.",
  "The temptation to quit will be greatest just before you are about to succeed.",
  "Knowledge without practice is useless. Practice without knowledge is dangerous.",
  "If you are patient in one moment of anger, you will escape one hundred days of sorrow.",
  "An inch of time is an inch of gold, but you can't buy that inch of time with an inch of gold.",
  "The snow goose need not bathe to make itself white.",
  "The wise adapt themselves to circumstances, as water molds itself to the pitcher.",
  "A man who cannot tolerate small misfortunes can never accomplish great things.",
  "To learn a language is to have one more window from which to look at the world.",
  "Better to light a candle than curse the darkness.",
  "Even the tallest tower began on the ground.",
  "Do not remove a fly from your friend's forehead with a hatchet.",
  "A diamond with a flaw is worth more than a pebble without imperfections.",
  "The person who says something is impossible should not interrupt the person doing it.",
  "You must climb the mountain to see the plain.",
  "An old dog barks not in vain.",
  "The stronger the breeze, the stronger the trees.",
  "Silence is a source of great strength.",
  "The nail that sticks out gets hammered down.",
  "One kind word can warm three winter months.",
  "The soul would have no rainbow had the eyes no tears.",
  "A smile will gain you ten more years of life.",
  "The wise man never lays all his treasures in one place.",
  "Fall seven times, stand up eight.",
  "A man grows most tired while standing still.",
  "Do not confine your children to your own learning, for they were born in another time.",
  "The fire you kindle for your enemy often burns yourself more than them.",
  "True wisdom is knowing what you do not know.",
  "Pearls do not lie on the seashore. If you want one, you must dive for it."
];

const pandaPositions = ["top", "right", "bottom", "left"];

function getReadTime(message) {
  const words = message.split(" ").length;
  return Math.min(Math.max(words * 420, 4000), 12000);
}

let remainingPandaMessages = [];

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function showPandaPopout() {
  const oldPopout = document.querySelector(".panda-popout");

  if (oldPopout) {
    oldPopout.remove();
  }

  if (remainingPandaMessages.length === 0) {
    remainingPandaMessages = shuffleArray(pandaMessages);
  }

  const message = remainingPandaMessages.shift();

  const position = pandaPositions[pandaMessageIndex % pandaPositions.length];

  const popout = document.createElement("div");
  popout.className = `panda-popout ${position}`;

  popout.innerHTML = `
    <img src="assets/wise_panda.gif" alt="Panda">
    <div class="panda-speech">${message}</div>
  `;

  loadingPanda.appendChild(popout);

  pandaMessageIndex++;

  pandaMessageTimer = setTimeout(() => {
    showPandaPopout();
  }, getReadTime(message));
}

function startPandaMessages() {
  stopPandaMessages();

  pandaMessageIndex = 0;

  remainingPandaMessages = shuffleArray(pandaMessages);

  showPandaPopout();
}

function stopPandaMessages() {
  clearTimeout(pandaMessageTimer);

  const oldPopout = document.querySelector(".panda-popout");

  if (oldPopout) {
    oldPopout.remove();
  }
}

function makeList(items) {
  if (!items || items.length === 0) {
    return `<p class="empty-text">Nothing generated for this section.</p>`;
  }

  return `
    <ul>
      ${items.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function makeDeepExplanation(sections) {
  if (!sections || sections.length === 0) {
    return `<p class="empty-text">No explanation generated.</p>`;
  }

  return sections.map((section) => `
    <div class="mini-section">
      <h5>${section.sectionTitle}</h5>
      <p>${section.content}</p>
    </div>
  `).join("");
}

function makeRecallCards(activeRecall) {
  if (!activeRecall) {
    return `<p class="empty-text">No active recall generated.</p>`;
  }

  const levels = ["easy", "medium", "hard"];

  return levels.map((level) => {
    const questions = activeRecall[level] || [];

    return `
      <div class="recall-level">
        <h5>${level.toUpperCase()}</h5>

        ${
          questions.length === 0
            ? `<p class="empty-text">No ${level} questions generated.</p>`
            : questions.map((qa) => `
                <details class="qa-card">
                  <summary>${qa.question}</summary>
                  <p>${qa.answer}</p>
                </details>
              `).join("")
        }
      </div>
    `;
  }).join("");
}

function createChatBox(topic, topicIndex) {
  const chatWrapper = document.createElement("section");
  chatWrapper.className = "topic-chat-section";

  chatWrapper.innerHTML = `
    <h4>Ask StudyAI About This Topic</h4>
    <p class="chat-helper">Any questions? Just ask!</p>

    <div class="chat-messages" id="chatMessages-${topicIndex}"></div>

    <div class="chat-input-row">
      <input 
        class="topic-question-input" 
        id="topicQuestion-${topicIndex}"
        placeholder="Ask a question about ${topic.title}..."
      >
      <button class="ask-topic-btn" id="askTopicBtn-${topicIndex}">
        Ask
      </button>
    </div>
  `;

  const input = chatWrapper.querySelector(`#topicQuestion-${topicIndex}`);
  const button = chatWrapper.querySelector(`#askTopicBtn-${topicIndex}`);
  const messages = chatWrapper.querySelector(`#chatMessages-${topicIndex}`);

  async function askQuestion() {
    const question = input.value.trim();

    if (!question) {
      return;
    }

    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user-bubble";
    userBubble.textContent = question;
    messages.appendChild(userBubble);

    input.value = "";
    button.disabled = true;

    const thinkingBubble = document.createElement("div");
    thinkingBubble.className = "chat-bubble ai-bubble thinking-bubble";
    thinkingBubble.innerHTML = `
      <img src="assets/panda_thinking.gif" alt="Panda thinking">
      <span>StudyAI is thinking...</span>
    `;
    messages.appendChild(thinkingBubble);

    try {
      const studyGuideText = studyGuideInput.value.trim();

      const response = await fetch(`${API_BASE}/api/ask-topic-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic,
          question,
          studyGuideText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Question request failed.");
      }

      thinkingBubble.className = "chat-bubble ai-bubble";
      thinkingBubble.innerHTML = `
        <strong>StudyAI</strong>
        <p>${data.answer}</p>
      `;
    } catch (error) {
      console.error(error);

      thinkingBubble.className = "chat-bubble ai-bubble error-bubble";
      thinkingBubble.innerHTML = `
        <strong>StudyAI</strong>
        <p>Something went wrong answering that question.</p>
      `;
    } finally {
      button.disabled = false;
      messages.scrollTop = messages.scrollHeight;
    }
  }

  button.addEventListener("click", askQuestion);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      askQuestion();
    }
  });

  return chatWrapper;
}

function renderStudyGuide(data) {
  output.innerHTML = "";

  if (!data.studyGuide || data.studyGuide.length === 0) {
    output.textContent = "No study guide generated.";
    downloadBtn.classList.add("hidden");
    return;
  }

  const mainDetails = document.createElement("details");
  mainDetails.className = "main-dropdown";
  mainDetails.open = true;

  mainDetails.innerHTML = `
    <summary>Study Guide</summary>
    <div class="topics-output"></div>
  `;

  const topicsOutput = mainDetails.querySelector(".topics-output");

  data.studyGuide.forEach((topic, index) => {
    const topicDetails = document.createElement("details");
    topicDetails.className = "topic-dropdown";

    topicDetails.innerHTML = `
      <summary>${index + 1}. ${topic.title}</summary>

      <div class="topic-content">

        <section class="study-section">
          <h4>
            <img src="assets/brain.svg" class="section-icon" alt="">
            What You Actually Need To Know
          </h4>
          ${makeList(topic.needToKnow)}
        </section>

        <section class="study-section">
          <h4>
            <img src="assets/book.svg" class="section-icon" alt="">
            Deep Explanation
          </h4>
          ${makeDeepExplanation(topic.deepExplanation)}
        </section>

        <section class="study-section">
          <h4>
            <img src="assets/medical.svg" class="section-icon" alt="">
            Clinical / Real-World Connection
          </h4>
          ${makeList(topic.clinicalConnection)}
        </section>

        <section class="study-section">
          <h4>
            <img src="assets/warning.svg" class="section-icon" alt="">
            Professor Trap Questions
          </h4>
          ${makeList(topic.professorTrap)}
        </section>

        <section class="study-section">
          <h4>
            <img src="assets/puzzle.svg" class="section-icon" alt="">
            Memory Tricks
          </h4>
          ${makeList(topic.memoryTricks)}
        </section>

        <section class="study-section">
          <h4>
            <img src="assets/pencil.svg" class="section-icon" alt="">
            Active Recall
          </h4>
          ${makeRecallCards(topic.activeRecall)}
        </section>

        <section class="study-section rapid-review">
          <h4>
            <img src="assets/fire.svg" class="section-icon" alt="">
            Rapid Review
          </h4>
          ${makeList(topic.rapidReview)}
        </section>

      </div>
    `;

    const topicContent = topicDetails.querySelector(".topic-content");
    topicContent.appendChild(createChatBox(topic, index));

    topicsOutput.appendChild(topicDetails);
  });

  output.appendChild(mainDetails);
  downloadBtn.classList.remove("hidden");
}

extractBtn.addEventListener("click", async () => {
  const studyGuideText = studyGuideInput.value.trim();

  if (!studyGuideText) {
    alert("Paste study material first.");
    return;
  }

  showTopicsPanda();
  output.textContent = "Waiting for topic selection...";
  downloadBtn.classList.add("hidden");

  extractBtn.disabled = true;
  generateBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/extract-topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ studyGuideText })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Topic extraction failed.");
    }

    extractedTopics = data.topics || [];

    hideTopicsPanda();
    renderTopics(extractedTopics);

    output.textContent = "Topics extracted. Select what you want, then generate your study guide.";
  } catch (error) {
    console.error(error);
    hideTopicsPanda();
    topicsContainer.textContent = "Something went wrong extracting topics.";
    output.textContent = "Check your server/API key and try again.";
  } finally {
    extractBtn.disabled = false;
  }
});

generateBtn.addEventListener("click", async () => {
  const studyGuideText = studyGuideInput.value.trim();
  const selectedTopics = getSelectedTopics();

  if (selectedTopics.length === 0) {
    alert("Select at least one topic.");
    return;
  }

  const batchSize = 3;
  const topicBatches = chunkArray(selectedTopics, batchSize);

  latestStudyGuide = {
    studyGuide: []
  };

  showStudyGuidePanda("StudyAI is building your study guide...", selectedTopics.length);
  startPandaMessages();

  generateBtn.disabled = true;

  try {
    let completedTopics = 0;

    for (const batch of topicBatches) {
      progressText.textContent = `Generating topics ${completedTopics + 1}-${completedTopics + batch.length} of ${selectedTopics.length}...`;

      const response = await fetch(`${API_BASE}/api/generate-topic-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studyGuideText,
          topics: batch
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Study guide batch generation failed.");
      }

      latestStudyGuide.studyGuide.push(...(data.studyGuide || []));

      completedTopics += batch.length;
      updateProgress(completedTopics, selectedTopics.length);
    }

    stopPandaMessages();
    hideStudyGuidePanda();
    renderStudyGuide(latestStudyGuide);
  } catch (error) {
    console.error(error);
    stopPandaMessages();
    hideStudyGuidePanda();
    output.textContent = "Something went wrong generating the study guide.";
  } finally {
    generateBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", () => {
  const guideClone = output.cloneNode(true);

  guideClone.querySelectorAll(".topic-chat-section").forEach((chatSection) => {
    chatSection.remove();
  });

  const exportHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>StudyAI Study Guide</title>

  <style>
    body {
      margin: 0;
      background: #0f172a;
      color: white;
      font-family: Arial, sans-serif;
      padding: 30px;
    }

    main {
      max-width: 1050px;
      margin: 0 auto;
    }

    h1 {
      font-size: 42px;
      margin-bottom: 24px;
    }

    p {
      color: #cbd5e1;
    }

    .main-dropdown,
    .topic-dropdown {
      background: #0f172a;
      border-radius: 14px;
      margin-bottom: 14px;
      overflow: hidden;
      border: 1px solid #1e293b;
    }

    .main-dropdown > summary,
    .topic-dropdown > summary {
      cursor: pointer;
      padding: 16px;
      font-weight: bold;
      list-style: none;
    }

    .main-dropdown > summary {
      background: #38bdf8;
      color: #020617;
      font-size: 20px;
    }

    .topic-dropdown > summary {
      background: #111827;
      color: white;
      font-size: 17px;
    }

    .main-dropdown > summary::-webkit-details-marker,
    .topic-dropdown > summary::-webkit-details-marker {
      display: none;
    }

    .main-dropdown > summary::after,
    .topic-dropdown > summary::after {
      content: "+";
      float: right;
      font-size: 22px;
      font-weight: bold;
    }

    .main-dropdown[open] > summary::after,
    .topic-dropdown[open] > summary::after {
      content: "-";
    }

    .topics-output {
      padding: 14px;
    }

    .topic-content {
      padding: 18px;
      background: #1e293b;
    }

    .study-section {
      margin-bottom: 24px;
    }

    .study-section h4 {
      margin: 0 0 10px;
      color: #38bdf8;
      font-size: 18px;
    }

    .study-section ul {
      padding-left: 22px;
    }

    .study-section li {
      margin-bottom: 8px;
    }

    .mini-section {
      background: #0f172a;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .mini-section h5 {
      margin: 0 0 8px;
      color: white;
      font-size: 16px;
    }

    .qa-card {
      background: #0f172a;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .qa-card summary {
      cursor: pointer;
      font-weight: bold;
    }

    .rapid-review {
      background: #082f49;
      padding: 16px;
      border-radius: 14px;
    }

    .section-icon {
      width: 22px;
      height: 22px;
      vertical-align: middle;
      margin-right: 8px;
    }

    .empty-text {
      color: #94a3b8;
      font-style: italic;
    }
  </style>
</head>

<body>
  <main>
    <h1>StudyAI Study Guide</h1>
    ${guideClone.innerHTML}
  </main>
</body>
</html>
`;

  const blob = new Blob([exportHtml], {
    type: "text/html"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "StudyAI-Study-Guide.html";
  link.click();

  URL.revokeObjectURL(url);
});