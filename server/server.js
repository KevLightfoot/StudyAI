import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function parseJsonFromModel(text) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

app.post("/api/extract-topics", async (req, res) => {
  try {
    const { studyGuideText } = req.body;

    if (!studyGuideText) {
      return res.status(400).json({
        error: "Missing study guide text."
      });
    }

    const prompt = `
You are StudyAI.

Extract the most important study topics from the user's material.

Return ONLY valid JSON.
No markdown.
No extra explanation.

Format:
{
  "topics": [
    {
      "title": "Topic name",
      "reason": "Why this topic matters"
    }
  ]
}

User material:
${studyGuideText}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    console.log("TOPIC EXTRACTION USAGE:");
    console.log(response.usage);

    const parsed = parseJsonFromModel(response.output_text);

    res.json(parsed);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Something went wrong extracting topics."
    });
  }
});

app.post("/api/generate-study-kit", async (req, res) => {
  try {
    const { topics, studyGuideText } = req.body;

    if (!topics || topics.length === 0) {
      return res.status(400).json({
        error: "Missing selected topics."
      });
    }

    const topicList = topics.map(topic => `- ${topic}`).join("\n");

    const prompt = `
You are StudyAI.

You are NOT writing generic textbook notes.

You are creating highly effective study material for difficult college classes like:
- Anatomy & Physiology
- Biology
- Neuroscience
- Chemistry

Your goal:
Help students ACTUALLY remember and understand concepts for exams.

For EACH topic, generate:

1. needToKnow
- Short bullet point essentials
- Quick exam survival facts

2. deepExplanation
- Thorough but student-friendly explanation
- Break into logical mini sections
- Avoid giant walls of text

3. clinicalConnection
- Real-world medical or clinical relevance
- Why this topic matters

4. professorTrap
- Common confusion points
- Mistakes students make on exams

5. memoryTricks
- Mnemonics
- Analogies
- Memory shortcuts

6. activeRecall
- Questions with:
  - easy
  - medium
  - hard

7. rapidReview
- Ultra-short final review bullets
- Night-before-exam style

Return ONLY valid JSON.

Format exactly:

{
  "studyGuide": [
    {
      "title": "Topic Title",

      "needToKnow": [
        "Fact"
      ],

      "deepExplanation": [
        {
          "sectionTitle": "Mini section",
          "content": "Explanation"
        }
      ],

      "clinicalConnection": [
        "Clinical relevance"
      ],

      "professorTrap": [
        "Common mistake"
      ],

      "memoryTricks": [
        "Mnemonic"
      ],

      "activeRecall": {
        "easy": [
          {
            "question": "Question",
            "answer": "Answer"
          }
        ],

        "medium": [
          {
            "question": "Question",
            "answer": "Answer"
          }
        ],

        "hard": [
          {
            "question": "Question",
            "answer": "Answer"
          }
        ]
      },

      "rapidReview": [
        "Quick review point"
      ]
    }
  ]
}

Selected topics:
${topicList}

Original material:
${studyGuideText}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    console.log("STUDY GUIDE GENERATION USAGE:");
    console.log(response.usage);

    const parsed = parseJsonFromModel(response.output_text);

    res.json(parsed);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Something went wrong generating the study kit."
    });
  }
});

app.post("/api/ask-topic-question", async (req, res) => {
  try {
    const { topic, question, studyGuideText } = req.body;

    if (!topic || !question) {
      return res.status(400).json({
        error: "Missing topic or question."
      });
    }

    const prompt = `
You are StudyAI, a patient tutor.

The student is asking a follow-up question about ONE study topic.

Answer like a helpful tutor:
- Be clear and simple.
- Focus on the selected topic.
- Use examples if helpful.
- If the question relates to exam prep, explain what to remember.
- Do not be overly long unless needed.

Topic title:
${topic.title}

Topic study content:
${JSON.stringify(topic, null, 2)}

Original pasted material:
${studyGuideText || "No original material provided."}

Student question:
${question}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    console.log("TOPIC CHAT USAGE:");
    console.log(response.usage);

    res.json({
      answer: response.output_text
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Something went wrong answering the question."
    });
  }
});

app.listen(PORT, () => {
  console.log(`StudyAI server running on http://localhost:${PORT}`);
});