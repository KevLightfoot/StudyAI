# StudyAI

StudyAI is an AI-powered study platform that transforms lecture notes, study guides, and course materials into interactive study resources. Students can extract important topics from their materials, choose what to focus on, and generate structured study guides designed to support understanding and exam preparation.

**Live Demo:** https://kevlightfoot.github.io/StudyAI/

## Features

- **Topic Extraction** — Analyze pasted study materials and identify important topics to study.
- **AI-Generated Study Guides** — Generate structured learning materials with essential facts, detailed explanations, real-world connections, common exam mistakes, memory tricks, active-recall questions, and rapid-review summaries.
- **Topic Selection** — Choose specific topics before generating a study kit.
- **Flashcard Generation** — Create exam-focused flashcards from generated study content.
- **AI Tutor** — Ask follow-up questions about individual topics and receive contextual explanations.
- **PDF Support** — Upload PDF study materials, preview documents, and extract readable text for studying.
- **Saved Resources** — Save and reopen study materials, generated study kits, flashcards, and PDFs.
- **Downloadable Study Guides** — Download generated study materials for later review.
- **Interactive Interface** — A student-focused interface featuring guided workflows and animated panda illustrations.

## How It Works

1. Paste notes, learning objectives, a study guide, or other course materials—or upload a PDF.
2. Extract the important topics using AI.
3. Select the topics you want to study.
4. Generate a study kit containing explanations, essential facts, memory aids, and active-recall questions.
5. Generate flashcards, ask follow-up questions, and save resources for future review.

## Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript
- PDF.js for PDF processing and previews

**Backend**
- Node.js
- Express
- OpenAI API
- CORS
- dotenv

**AI Integration**
- OpenAI API
- `gpt-4.1-mini` for topic extraction, study-material generation, flashcards, and contextual tutoring

## Project Structure

```text
StudyAI/
├── index.html
├── style.css
├── app.js
├── docs/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── assets/
└── server/
    ├── server.js
    ├── package.json
    └── package-lock.json
```

The `docs/` directory contains the static frontend used for GitHub Pages deployment. The `server/` directory contains the Express backend responsible for AI-powered functionality.

## Running Locally

### Prerequisites

- Node.js and npm
- An OpenAI API key

### 1. Clone the Repository

```bash
git clone https://github.com/KevLightfoot/StudyAI.git
cd StudyAI
```

### 2. Configure the Backend

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=3001
```

Replace the placeholder with your own API key. Never commit API keys or other secrets to GitHub.

### 3. Start the Backend

```bash
npm start
```

The backend will start on port `3001` by default, unless another port is supplied through the environment.

### 4. Open the Frontend

Serve the project root using a local static web server, then open `index.html` in your browser.

The frontend must be configured to send its API requests to your local backend. If the frontend currently points to a deployed backend, update its API base URL in `app.js` for local development.

## API Endpoints

The Express backend exposes the following POST endpoints:

| Endpoint | Purpose |
|---|---|
| `/api/extract-topics` | Extract important topics from supplied study material |
| `/api/generate-topic-batch` | Generate structured study content for selected topics |
| `/api/ask-topic-question` | Answer follow-up questions about a topic |
| `/api/generate-flashcards` | Generate flashcards from a study topic |

Requests use JSON bodies, and successful responses contain JSON data or generated text, depending on the endpoint.

## Deployment

The frontend is deployed through GitHub Pages, while the AI functionality relies on a separately hosted Node.js backend.

Because GitHub Pages only serves static files, the Express backend must run on a server that supports Node.js. The backend also requires a valid OpenAI API key configured through environment variables.

AI features may incur API usage costs depending on the provider account and usage.

## Future Improvements

Potential areas for further development include:

- User accounts and cloud-based resource synchronization
- Additional study modes and question formats
- Improved progress tracking and review scheduling
- More configurable study-kit generation
- Expanded accessibility and mobile usability

## Author

**Kevin Lightfoot**

Computer Science graduate student at Louisiana State University, interested in software development, data engineering, and AI-powered applications.

- **Portfolio:** https://kevlightfoot.github.io/Portfolio/
- **GitHub:** https://github.com/KevLightfoot
- **LinkedIn:** https://www.linkedin.com/in/kevin-lightfoot-1ba3b9205/
