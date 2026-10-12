# 🌿 NatureSnap + Go

Snap a photo. Discover something. Go outside.

NatureSnap + Go uses Gemma 4 to help you explore the nature around you. Upload a photo of a plant, bird or insect, learn what to look at more closely, and get a small outdoor mission.

The idea is simple: use AI to help people spend less time on their screens and more time exploring the real world.

Built for the DEV **Best Use of Gemma 4** challenge and the **Hacktoberfest Open-Source AI: Touch Grass** challenge.

**Live demo:**[ Try It Here](https://nature-snap-go.vercel.app/) 

## How it works

1. **Snap:** upload a nature photo or choose an example. You can add a short note, like "found near my building".
2. **Discover:** Gemma 4 looks at the photo and describes what it sees, with a **High / Medium / Low** confidence label so you know how sure it is.
3. **Look closer:** you get one detail worth noticing.
4. **Go outside:** you get one simple outdoor mission and a time estimate.

Once you're ready, put your phone away and go explore.

## Under the hood

- The browser shrinks the photo and sends it to a small Node server that keeps the API key private.
- The server asks Gemma 4 (`gemma-4-26b-a4b-it` by default) to look at the photo. The prompt (`server/prompt.js`) asks for honest uncertainty, one mission only, and forbids suggesting touching, eating or picking anything unfamiliar.
- A **safety net** (`server/safety.js`) checks every reply too. If a mission still suggests touching or picking something, it is replaced with a safe one.

## Tech stack

- **React + Vite** for the frontend
- **Tailwind CSS** for styling
- **Gemma 4 through the Gemini API** for image understanding and mission writing (`gemma-4-26b-a4b-it` by default)
- **Sentry** for tracing and error tracking
- **Node.js** for the API: validation, rate limiting and keeping the key off the browser

## Run it yourself

You need [Node.js](https://nodejs.org) 20.6 or newer and a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm install
```

Create a file called `.env.local` in the project folder with your key:

```
GEMINI_API_KEY=paste-your-key-here
```

Then start it and open http://localhost:5173:

```bash
npm run dev
```

To try the model on its own first: `npm run test:api -- path/to/photo.jpg "found near my building"`

To run the tests: `npm test`

### Optional settings

| Setting | What it does |
|---|---|
| `GEMINI_MODEL` | Use a different model, e.g. `gemma-4-31b-it` |
| `SENTRY_DSN` | Turn on Sentry. Leave it empty and the app works without it. |
| `RATE_LIMIT_PER_10MIN` | Requests one visitor can make in 10 minutes (default 30) |
| `LLM_PROVIDER=ollama` | Use a Gemma model on your own computer through [Ollama](https://ollama.com) instead of the Gemini API. Set `OLLAMA_MODEL` to a vision-capable tag. |

## Deploy

- **Render, Railway or any Node host:** build with `npm install && npm run build`, start with `npm start`, and add `GEMINI_API_KEY` in the host's environment settings.
- **Vercel:** import the repo, add `GEMINI_API_KEY`, and deploy.

## Project structure

```
src/        the website (screens, photo resizing)
server/     the backend (prompt, Gemma call, reply parser)
api/        entry point for Vercel
tests/      automated tests
docs/       write-up drafts and submission checklist
```

## Safety

- The AI is told never to suggest touching, eating, picking or approaching unfamiliar plants, animals, insects or mushrooms.
- Every screen reminds you that identification is a best guess, not an expert's answer.
- Your typed note is treated as context only, so it can't change the AI's instructions.

## License

MIT