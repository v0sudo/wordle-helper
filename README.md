## Wordle Helper

An interactive helper for narrowing down Wordle answers. Enter guesses and toggle each letter's state (correct, present, absent) to filter the dictionary.

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS, Radix UI, shadcn/ui components
- **Icons**: lucide-react

### Getting Started

## Run Remotely

1. Visit [https://wordle.ldo.dev](https://wordle.ldo.dev)

## Run Locally

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open `http://localhost:3000` in your browser.

### Scripts

- `npm run dev`: Start the Next.js dev server
- `npm run build`: Create a production build
- `npm run start`: Start the production server (after build)
- `npm run lint`: Run Next.js lint

### Project Structure

```
app/
  layout.tsx       # App shell
  page.tsx         # Wordle Helper UI and filtering logic
components/
  ui/              # Reusable shadcn/ui wrappers (button, card, input, etc.)
lib/
  wordlist.ts      # Fallback 5-letter word list
public/            # Static assets
styles/            # Global styles
```

### How It Works

- Type a 5-letter guess and click Add Guess.
- Click each letter tile to cycle its state:
  - Green = correct (right letter, right position)
  - Yellow = present (right letter, wrong position)
  - Gray = absent (letter not in solution)
- Possible words update live below as you mark letters.

### Filtering Logic (Wordle-style)

- Enforces exact letter positions for green tiles.
- Ensures yellow letters are present in the word but not in that position.
- Handles repeated letters with per-letter counts:
  - If a letter is marked present/correct N times in a guess, candidate words must include at least N occurrences (and exactly N when mixed with absent for that letter in the same guess).
  - Absent letters are excluded globally unless the same guess shows that letter as present/correct elsewhere, in which case it's only banned at that position.
- Words are normalized to uppercase before checks.

### Dictionary Source

- Tries to fetch a remote 5-letter word list on load.
- Falls back to `lib/wordlist.ts` if the fetch fails.

### Customization

- Update color tokens in `getLetterStateColor` in `app/page.tsx` to match your preferred palette.
- Replace or extend the fallback words in `lib/wordlist.ts`.

### Deployment

Any Next.js-compatible platform works (Vercel recommended).

```bash
npm run build && npm run start
```

### Troubleshooting

- Empty results after marking letters usually means conflicting constraints. Review your guess states.
- If the remote dictionary fails to load, the app automatically uses the fallback list.

### License

MIT
