# Hra Podle Specifikace

Vytvoř hru podle přiložené specifikace.

Answer briefly, in simple language. Use short sentences and common words.

No introductions, no summaries, no repeating my question.

Do not explain what you did unless I ask. For code, show only the changed parts.

If something is unclear, ask one short question instead of guessing at length.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

By default, opening the page in an iframe shows the previous placeholder with its
developer panel and test FINISH/ERROR messages. Opening it directly starts the game.
Set `placeholderInIframe` to `false` in `game.config.json` to run the game in
iframes too.
