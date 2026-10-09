# 🌿 NatureSnap + Go

Snap a photo. Discover something. Go outside.

NatureSnap + Go uses Gemma 4 to help you explore the nature around you. Upload a photo of a plant, bird or insect, learn what to look at more closely, and get a small outdoor mission.

The idea is simple: use AI to help people spend less time on their screens and more time exploring the real world.

Built for the DEV **Best Use of Gemma 4** challenge and the **Hacktoberfest Open-Source AI: Touch Grass** challenge.

**Live demo:**[ Try It Here](https://nature-snap-go.vercel.app/) 

## How it works

1. **Snap:** upload a nature photo or choose an example. You can add a short note, like "found near my building".
2. **Discover:** Gemma 4 looks at the photo and describes what it sees.
3. **Look closer:** you get one detail worth noticing.
4. **Go outside:** you get one simple outdoor mission and a time estimate.

Once you're ready, put your phone away and go explore.

Behind the scenes, the browser shrinks your photo and sends it to a small server. The server keeps the API key private and asks Gemma 4 to look at the photo. The prompt (`server/prompt.js`) tells Gemma to be honest when it's unsure, give only one mission, and never suggest touching, eating or picking anything unfamiliar.

## Tech stack

- **React + Vite** for the frontend
- **Tailwind CSS** for styling
- **Gemma 4 through the Gemini API** for image understanding and mission writing (`gemma-4-26b-a4b-it` by default)
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