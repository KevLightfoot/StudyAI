const API_BASE = "https://studyai-backend-jmq5.onrender.com";

const welcomeOverlay = document.getElementById("welcomeOverlay");
const closeWelcomeBtn = document.getElementById("closeWelcomeBtn");

const extractBtn = document.getElementById("extractBtn");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const saveStudyKitBtn = document.getElementById("saveStudyKitBtn");
const saveAllBtn = document.getElementById("saveAllBtn");

const studyGuideInput = document.getElementById("studyGuideInput");
const topicsContainer = document.getElementById("topicsContainer");
const output = document.getElementById("output");

const loadingPanda = document.getElementById("loadingPanda");
const topicsLoadingPanda = document.getElementById("topicsLoadingPanda");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const uploadPdfBtn = document.getElementById("uploadPdfBtn");
const pdfInput = document.getElementById("pdfInput");
const openSavedBtn = document.getElementById("openSavedBtn");
const saveTextBtn = document.getElementById("saveTextBtn");
const savePdfFileBtn = document.getElementById("savePdfFileBtn");
const PDF_DB_NAME = "studyai_pdf_db";
const PDF_STORE_NAME = "pdf_files";

const savedFilesModal = document.getElementById("savedFilesModal");
const savedFilesList = document.getElementById("savedFilesList");
const closeSavedBtn = document.getElementById("closeSavedBtn");

const readablePdfTextBtn = document.getElementById("readablePdfTextBtn");
const pdfReadableText = document.getElementById("pdfReadableText");

const textareaCoach = document.getElementById("textareaCoach");
const closeCoachBtn = document.getElementById("closeCoachBtn");

const pdfPreviewModal = document.getElementById("pdfPreviewModal");
const pdfPreviewFrame = document.getElementById("pdfPreviewFrame");
const closePdfPreviewBtn = document.getElementById("closePdfPreviewBtn");
const useFullPdfTextBtn = document.getElementById("useFullPdfTextBtn");

let currentPdfFile = null;
let currentPdfUrl = null;

const SAVED_FILES_KEY = "studyai_saved_materials";

let extractedTopics = [];
let latestStudyGuide = {
  studyGuide: []
};

let currentStudyKitTitle = "StudyAI Study Guide";

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

function getSavedFiles() {
  return JSON.parse(localStorage.getItem(SAVED_FILES_KEY)) || [];
}

function saveFiles(files) {
  localStorage.setItem(SAVED_FILES_KEY, JSON.stringify(files));
}


function sanitizeFileName(title) {
  return title
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "StudyAI-Study-Guide";
}

function makeStudyKitTitle(topics) {
  if (!topics || topics.length === 0) {
    return "StudyAI Study Guide";
  }

  const normalized = topics.map((topic) => topic.trim()).filter(Boolean);

  if (normalized.length === 1) {
    return `${normalized[0]} Study Guide`;
  }

  if (normalized.length === 2) {
    return `${normalized[0]} and ${normalized[1]} Study Guide`;
  }

  const systemTopics = normalized.filter((topic) =>
    topic.toLowerCase().includes("system")
  );

  if (systemTopics.length >= 4) {
    return "Body Systems Study Guide";
  }

  if (normalized.length <= 4) {
    return `${normalized.slice(0, -1).join(", ")}, and ${normalized.at(-1)} Study Guide`;
  }

  return `${normalized[0]}, ${normalized[1]}, and ${normalized.length - 2} More Topics Study Guide`;
}

function saveSavedItem(item) {
  const savedFiles = getSavedFiles();

  savedFiles.unshift({
    id: item.id || crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...item
  });

  saveFiles(savedFiles);
}

function promptForSaveTitle(defaultTitle) {
  const title = prompt("Save as:", defaultTitle);

  if (!title || !title.trim()) {
    return null;
  }

  return title.trim();
}

function showSaveButtons() {
  if (saveStudyKitBtn) saveStudyKitBtn.classList.remove("hidden");
  if (saveAllBtn) saveAllBtn.classList.remove("hidden");
}

function hideSaveButtons() {
  if (saveStudyKitBtn) saveStudyKitBtn.classList.add("hidden");
  if (saveAllBtn) saveAllBtn.classList.add("hidden");
}

function saveCurrentStudyKit() {
  if (!latestStudyGuide.studyGuide || latestStudyGuide.studyGuide.length === 0) {
    alert("Generate a study kit first.");
    return false;
  }

  const title = promptForSaveTitle(currentStudyKitTitle);

  if (!title) {
    return false;
  }

  currentStudyKitTitle = title;

  saveSavedItem({
    type: "study-kit",
    title,
    data: latestStudyGuide
  });

  alert("Study kit saved!");
  return true;
}

function getAllGeneratedFlashcards() {
  if (!latestStudyGuide.studyGuide) {
    return [];
  }

  return latestStudyGuide.studyGuide
    .filter((topic) => topic.flashcards && topic.flashcards.length > 0)
    .map((topic) => ({
      topicTitle: topic.title,
      flashcards: topic.flashcards
    }));
}

function saveFlashcardsForTopic(topic) {
  if (!topic.flashcards || topic.flashcards.length === 0) {
    alert("Generate flashcards for this topic first.");
    return false;
  }

  const title = promptForSaveTitle(`${topic.title} Flashcards`);

  if (!title) {
    return false;
  }

  saveSavedItem({
    type: "flashcards",
    title,
    topicTitle: topic.title,
    flashcards: topic.flashcards
  });

  alert("Flashcards saved!");
  return true;
}

function saveAllCurrentStudyMaterials() {
  if (!latestStudyGuide.studyGuide || latestStudyGuide.studyGuide.length === 0) {
    alert("Generate a study kit first.");
    return;
  }

  const title = promptForSaveTitle(currentStudyKitTitle);

  if (!title) {
    return;
  }

  currentStudyKitTitle = title;

  saveSavedItem({
    type: "study-kit-bundle",
    title,
    data: latestStudyGuide,
    flashcardSets: getAllGeneratedFlashcards()
  });

  alert("Study kit and generated flashcards saved!");
}

function openPdfDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PDF_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(PDF_STORE_NAME)) {
        db.createObjectStore(PDF_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePdfToIndexedDb(file) {
  const db = await openPdfDb();

  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();

    const transaction = db.transaction(PDF_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PDF_STORE_NAME);

    store.put({
      id,
      title: file.name,
      savedAt: new Date().toISOString(),
      blob: file
    });

    transaction.oncomplete = () => resolve(id);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getPdfFromIndexedDb(id) {
  const db = await openPdfDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PDF_STORE_NAME, "readonly");
    const store = transaction.objectStore(PDF_STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deletePdfFromIndexedDb(id) {
  const db = await openPdfDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PDF_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PDF_STORE_NAME);

    store.delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function showCoachTip() {
  if (!textareaCoach) return;

  setTimeout(() => {
    textareaCoach.classList.remove("hidden");

    setTimeout(() => {
      textareaCoach.classList.add("hidden");
    }, 9000);
  }, 3000);
}

function cleanPdfText(text) {
  return text
    // Fix words like "R e v i s e d"
    .replace(/\b(?:[A-Za-z]\s){2,}[A-Za-z]\b/g, (match) =>
      match.replace(/\s+/g, "")
    )

    // Fix spaced punctuation
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")

    // Fix missing spaces after periods before numbers/letters
    .replace(/([.!?])(?=[A-Z0-9])/g, "$1 ")

    // Fix common stuck-together words from PDFs
    .replace(/([a-z])([A-Z])/g, "$1 $2")

    // Collapse extra spaces
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    let line = "";

    for (const item of textContent.items) {
      line += item.str + " ";
    }

    const cleanedText = cleanPdfText(line);

    fullText += `\n\n--- Page ${pageNumber} ---\n\n${cleanedText}`;
  }

  return fullText.trim();
}

function renderSavedFiles() {
  const savedFiles = getSavedFiles();

  savedFilesList.innerHTML = "";

  if (savedFiles.length === 0) {
    savedFilesList.innerHTML = `<p>No saved files yet.</p>`;
    return;
  }

  savedFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.className = "saved-item";

    let previewText = "Saved item";
    let buttons = "";

    if (file.type === "pdf") {
      previewText = "Saved PDF file";
      buttons = `
        <button type="button" data-action="open-pdf" data-index="${index}">Open PDF</button>
        <button type="button" data-action="use-pdf-text" data-index="${index}">Use Full Text</button>
        <button type="button" data-action="delete" data-index="${index}">Delete</button>
      `;
    } else if (file.type === "study-kit" || file.type === "study-kit-bundle") {
      const topicCount = file.data?.studyGuide?.length || 0;
      const flashcardCount = file.flashcardSets?.reduce((sum, set) => sum + set.flashcards.length, 0) || 0;

      previewText = `${topicCount} topics${flashcardCount ? ` • ${flashcardCount} flashcards` : ""}`;
      buttons = `
        <button type="button" data-action="open-study-kit" data-index="${index}">Open Study Kit</button>
        <button type="button" data-action="delete" data-index="${index}">Delete</button>
      `;
    } else if (file.type === "flashcards") {
      previewText = `${file.flashcards?.length || 0} flashcards for ${file.topicTitle || "a topic"}`;
      buttons = `
        <button type="button" data-action="open-flashcards" data-index="${index}">Open Flashcards</button>
        <button type="button" data-action="delete" data-index="${index}">Delete</button>
      `;
    } else {
      previewText = `${file.text?.slice(0, 180) || "Saved text"}...`;
      buttons = `
        <button type="button" data-action="load" data-index="${index}">Load Into Textbox</button>
        <button type="button" data-action="delete" data-index="${index}">Delete</button>
      `;
    }

    const savedDate = file.savedAt
      ? new Date(file.savedAt).toLocaleString()
      : "Unknown date";

    div.innerHTML = `
      <h3>${file.title}</h3>
      <p>${previewText}</p>
      <p class="saved-date">Saved: ${savedDate}</p>

      <div class="saved-item-actions">
        ${buttons}
      </div>
    `;

    savedFilesList.appendChild(div);
  });
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
  hideSaveButtons();

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

const pandaIntroMessages = [
  "sorry we are slow, our papa is impoverished",
  "yes, he has to use a free web host cause he has no moneys",
  "Well, while we wait how about some old Chinese proverbs?"
];

const pandaMessages = [
  "Patience is a tree with bitter roots that bears sweet fruits.",
  "A tiger does not take insults from sheep.",
  "A great man is hard on himself. A small man is hard on others. – Confucius",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "He who asks is a fool for five minutes, but he who does not ask remains a fool forever.",
  "To know the road ahead, ask those coming back.",
  "A journey of a thousand miles begins with a single step. – Lao Tzu",
  "Do not fear going slowly. Fear only standing still.",
  "Teachers open the door, but you must enter by yourself.",
  "Learning is a treasure that will follow its owner everywhere.",
  "The bamboo that bends is stronger than the oak that resists.",
  "Dig the well before you are thirsty.",
  "Better to light a candle than curse the darkness.",
  "Even the tallest tower began on the ground.",
  "True wisdom is knowing what you do not know.",
  "Pearls do not lie on the seashore. If you want one, you must dive for it."
];

let pandaMessageIndex = 0;
let pandaMessageTimer = null;
let introMessageIndex = 0;
let remainingPandaMessages = [];

const pandaPositions = ["top", "right", "bottom", "left"];

function getReadTime(message) {
  const words = message.split(" ").length;
  return Math.min(Math.max(words * 420, 4000), 12000);
}


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

  let message;

  if (introMessageIndex < pandaIntroMessages.length) {
    message = pandaIntroMessages[introMessageIndex];
    introMessageIndex++;
  } else {
    if (remainingPandaMessages.length === 0) {
      remainingPandaMessages = shuffleArray(pandaMessages);
    }

    message = remainingPandaMessages.shift();
  }

  const position = pandaPositions[pandaMessageIndex % pandaPositions.length];

  const popout = document.createElement("div");
  popout.className = `panda-popout ${position}`;

  popout.innerHTML = `
    <img src="assets/wise_panda.gif" alt="Panda">
    <div class="panda-speech">${message}</div>
  `;

  loadingPanda.appendChild(popout);
  
  setTimeout(() => {
    popout.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 150);
  pandaMessageIndex++;

  pandaMessageTimer = setTimeout(() => {
    showPandaPopout();
  }, getReadTime(message));
}

function scrollToElement(element) {
  element.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function startPandaMessages() {
  stopPandaMessages();

  pandaMessageIndex = 0;
  introMessageIndex = 0;
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


function renderFlashcards(topic, container) {
  const cards = topic.flashcards || [];

  if (cards.length === 0) {
    container.innerHTML = `<p class="empty-text">No flashcards generated yet.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="flashcard-grid">
      ${cards.map((card, index) => `
        <details class="flashcard">
          <summary>
            <span>Card ${index + 1}</span>
            <strong>${card.front}</strong>
          </summary>
          <p>${card.back}</p>
        </details>
      `).join("")}
    </div>
  `;
}

async function generateFlashcardsForTopic(topic, button, container) {
  button.disabled = true;
  button.textContent = "Generating Flashcards...";

  container.innerHTML = `
    <div class="flashcard-loading">
      <img src="assets/panda_thinking.gif" alt="Panda thinking">
      <span>StudyAI is making flashcards...</span>
    </div>
  `;

  try {
    const studyGuideText = studyGuideInput.value.trim();

    const response = await fetch(`${API_BASE}/api/generate-flashcards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        topic,
        studyGuideText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Flashcard generation failed.");
    }

    topic.flashcards = data.flashcards || [];
    renderFlashcards(topic, container);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="empty-text">Something went wrong generating flashcards.</p>`;
  } finally {
    button.disabled = false;
    button.textContent = topic.flashcards?.length ? "Regenerate Flashcards" : "Generate Flashcards";
  }
}

function createFlashcardBox(topic, topicIndex) {
  const wrapper = document.createElement("section");
  wrapper.className = "topic-flashcard-section";

  wrapper.innerHTML = `
    <h4>Flashcards</h4>
    <p class="chat-helper">Generate exam-style flashcards for this topic when you are ready.</p>

    <div class="flashcard-actions">
      <button type="button" id="generateFlashcards-${topicIndex}">
        ${topic.flashcards?.length ? "Regenerate Flashcards" : "Generate Flashcards"}
      </button>
      <button type="button" id="saveFlashcards-${topicIndex}">
        Save Flashcards
      </button>
    </div>

    <div class="flashcard-output" id="flashcardOutput-${topicIndex}"></div>
  `;

  const generateButton = wrapper.querySelector(`#generateFlashcards-${topicIndex}`);
  const saveButton = wrapper.querySelector(`#saveFlashcards-${topicIndex}`);
  const cardOutput = wrapper.querySelector(`#flashcardOutput-${topicIndex}`);

  renderFlashcards(topic, cardOutput);

  generateButton.addEventListener("click", () => {
    generateFlashcardsForTopic(topic, generateButton, cardOutput);
  });

  saveButton.addEventListener("click", () => {
    saveFlashcardsForTopic(topic);
  });

  return wrapper;
}

function renderStandaloneFlashcards(savedItem) {
  output.innerHTML = "";

  currentStudyKitTitle = savedItem.title || "Saved Flashcards";

  const wrapper = document.createElement("details");
  wrapper.className = "main-dropdown";
  wrapper.open = true;

  wrapper.innerHTML = `
    <summary>${currentStudyKitTitle}</summary>
    <div class="topic-content">
      <section class="study-section">
        <h4>Flashcards</h4>
        <p>${savedItem.topicTitle ? `Topic: ${savedItem.topicTitle}` : ""}</p>
        <div class="flashcard-grid">
          ${(savedItem.flashcards || []).map((card, index) => `
            <details class="flashcard">
              <summary>
                <span>Card ${index + 1}</span>
                <strong>${card.front}</strong>
              </summary>
              <p>${card.back}</p>
            </details>
          `).join("")}
        </div>
      </section>
    </div>
  `;

  output.appendChild(wrapper);
  downloadBtn.classList.add("hidden");
  hideSaveButtons();
  savedFilesModal.classList.add("hidden");
  scrollToElement(document.querySelector(".output-card"));
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
    hideSaveButtons();
    return;
  }

  const mainDetails = document.createElement("details");
  mainDetails.className = "main-dropdown";
  mainDetails.open = true;

  mainDetails.innerHTML = `
    <summary>${currentStudyKitTitle}</summary>
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
    topicContent.appendChild(createFlashcardBox(topic, index));

    topicsOutput.appendChild(topicDetails);
  });

  output.appendChild(mainDetails);
  downloadBtn.classList.remove("hidden");
  showSaveButtons();
}

extractBtn.addEventListener("click", async () => {
  const studyGuideText = studyGuideInput.value.trim();

  if (!studyGuideText) {
    alert("Paste study material first.");
    return;
  }

  showTopicsPanda();
  scrollToElement(document.querySelector("#topicsContainer").closest(".card"));
  output.textContent = "Waiting for topic selection...";
  downloadBtn.classList.add("hidden");
  hideSaveButtons();

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

  currentStudyKitTitle = makeStudyKitTitle(selectedTopics);

  const batchSize = 3;
  const topicBatches = chunkArray(selectedTopics, batchSize);

  latestStudyGuide = {
    studyGuide: []
  };

  showStudyGuidePanda("StudyAI is building your study guide...", selectedTopics.length);
  scrollToElement(document.querySelector(".output-card"));
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
    scrollToElement(document.querySelector(".output-card"));
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
  <title>${currentStudyKitTitle}</title>

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
    <h1>${currentStudyKitTitle}</h1>
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
  link.download = `${sanitizeFileName(currentStudyKitTitle)}.html`;
  link.click();

  URL.revokeObjectURL(url);
});

uploadPdfBtn.addEventListener("click", () => {
  pdfInput.click();
});

pdfInput.addEventListener("change", () => {
  const file = pdfInput.files[0];

  if (!file) return;

  currentPdfFile = file;

  if (currentPdfUrl) {
    URL.revokeObjectURL(currentPdfUrl);
  }

  currentPdfUrl = URL.createObjectURL(file);
  pdfPreviewFrame.src = currentPdfUrl;
  pdfPreviewModal.classList.remove("hidden");

  pdfInput.value = "";
});

saveTextBtn.addEventListener("click", () => {
  const text = studyGuideInput.value.trim();

  if (!text) {
    alert("Paste or upload something first.");
    return;
  }

  const title = prompt("Name this saved material:");

  if (!title) return;

  const savedFiles = getSavedFiles();

  savedFiles.unshift({
    title,
    text,
    savedAt: new Date().toISOString()
  });

  saveFiles(savedFiles);

  alert("Saved!");
});

openSavedBtn.addEventListener("click", () => {
  renderSavedFiles();
  savedFilesModal.classList.remove("hidden");
});

closeSavedBtn.addEventListener("click", () => {
  savedFilesModal.classList.add("hidden");
});

savedFilesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;
  const savedFiles = getSavedFiles();
  const selectedFile = savedFiles[index];

  if (action === "load") {
    studyGuideInput.value = selectedFile.text;
    savedFilesModal.classList.add("hidden");
  }

  if (action === "open-study-kit") {
    latestStudyGuide = selectedFile.data || { studyGuide: [] };
    currentStudyKitTitle = selectedFile.title || "Saved Study Kit";
    renderStudyGuide(latestStudyGuide);
    savedFilesModal.classList.add("hidden");
    scrollToElement(document.querySelector(".output-card"));
  }

  if (action === "open-flashcards") {
    renderStandaloneFlashcards(selectedFile);
  }

  if (action === "open-pdf") {
    const pdfRecord = await getPdfFromIndexedDb(selectedFile.id);

    if (!pdfRecord) {
      alert("Could not find saved PDF file.");
      return;
    }

    currentPdfFile = pdfRecord.blob;

    if (currentPdfUrl) {
      URL.revokeObjectURL(currentPdfUrl);
    }

    currentPdfUrl = URL.createObjectURL(pdfRecord.blob);
    pdfPreviewFrame.src = currentPdfUrl;

    savedFilesModal.classList.add("hidden");
    pdfPreviewModal.classList.remove("hidden");
  }

  if (action === "use-pdf-text") {
    const pdfRecord = await getPdfFromIndexedDb(selectedFile.id);

    if (!pdfRecord) {
      alert("Could not find saved PDF file.");
      return;
    }

    studyGuideInput.value = "Reading saved PDF...";

    try {
      const text = await extractTextFromPdf(pdfRecord.blob);
      studyGuideInput.value = text;
      savedFilesModal.classList.add("hidden");
    } catch (error) {
      console.error(error);
      studyGuideInput.value = "";
      alert("Could not read saved PDF.");
    }
  }

  if (action === "delete") {
    if (selectedFile.type === "pdf") {
      await deletePdfFromIndexedDb(selectedFile.id);
    }

    savedFiles.splice(index, 1);
    saveFiles(savedFiles);
    renderSavedFiles();
  }
});

closeCoachBtn.addEventListener("click", () => {
  textareaCoach.classList.add("hidden");
});

closePdfPreviewBtn.addEventListener("click", () => {
  pdfPreviewModal.classList.add("hidden");
});

useFullPdfTextBtn.addEventListener("click", async () => {
  if (!currentPdfFile) {
    alert("No PDF selected.");
    return;
  }

  useFullPdfTextBtn.disabled = true;
  useFullPdfTextBtn.textContent = "Reading PDF...";

  try {
    const text = await extractTextFromPdf(currentPdfFile);
    studyGuideInput.value = text;
    pdfPreviewModal.classList.add("hidden");
  } catch (error) {
    console.error(error);
    alert("Could not read that PDF.");
  } finally {
    useFullPdfTextBtn.disabled = false;
    useFullPdfTextBtn.textContent = "Use Full PDF Text";
  }
});



savePdfFileBtn.addEventListener("click", async () => {
  if (!currentPdfFile) {
    alert("No PDF selected.");
    return;
  }

  savePdfFileBtn.disabled = true;
  savePdfFileBtn.textContent = "Saving PDF...";

  try {
    const pdfId = await savePdfToIndexedDb(currentPdfFile);
    const savedFiles = getSavedFiles();

    savedFiles.unshift({
      id: pdfId,
      title: currentPdfFile.name,
      type: "pdf",
      savedAt: new Date().toISOString()
    });

    saveFiles(savedFiles);

    alert("PDF file saved!");
  } catch (error) {
    console.error(error);
    alert("Could not save PDF file.");
  } finally {
    savePdfFileBtn.disabled = false;
    savePdfFileBtn.textContent = "Save PDF File";
  }
});

readablePdfTextBtn.addEventListener("click", async () => {
  if (!currentPdfFile) {
    alert("No PDF selected.");
    return;
  }

  if (!pdfReadableText.classList.contains("hidden")) {
    pdfReadableText.classList.add("hidden");
    pdfPreviewFrame.classList.remove("hidden");
    readablePdfTextBtn.textContent = "Readable Text View";
    return;
  }

  readablePdfTextBtn.disabled = true;
  readablePdfTextBtn.textContent = "Reading PDF...";

  try {
    const text = await extractTextFromPdf(currentPdfFile);

    pdfPreviewFrame.classList.add("hidden");
    pdfReadableText.classList.remove("hidden");
    pdfReadableText.textContent = text;

    readablePdfTextBtn.textContent = "PDF Preview";
  } catch (error) {
    console.error(error);
    alert("Could not read that PDF.");
    readablePdfTextBtn.textContent = "Readable Text View";
  } finally {
    readablePdfTextBtn.disabled = false;
  }
});


if (saveStudyKitBtn) {
  saveStudyKitBtn.addEventListener("click", () => {
    saveCurrentStudyKit();
  });
}

if (saveAllBtn) {
  saveAllBtn.addEventListener("click", () => {
    saveAllCurrentStudyMaterials();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const welcomeOverlay = document.getElementById("welcomeOverlay");
  const closeWelcomeBtn = document.getElementById("closeWelcomeBtn");

  if (closeWelcomeBtn && welcomeOverlay) {
    closeWelcomeBtn.addEventListener("click", () => {
      welcomeOverlay.classList.add("hidden");
      showCoachTip();
    });
  }
});