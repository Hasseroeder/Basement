# Contributing

Contributions to Basement's guides, calculations, and site are welcome.
If you are unsure about either OwO or Basement, open an issue or ask in the
[support server](https://discord.gg/wA82GZ2rnR) before doing extensive work.
We're more than happy to help with git, code editors and any languages we use.
The first few steps are always the most difficult ones when starting a hobby.
This is especially so for coding.

Basement is a simple static website.
The foundation of any site is **HTML**, **JS**, and **CSS**.
We use [**Astro**](https://astro.build/), [**TypeScript**](https://www.typescriptlang.org/), and [**SCSS**](https://sass-lang.com/documentation/syntax/) to extend on top of that.  
These allow us to more easily write text pages with Markdown and they make our code vastly more readable.  
To get started with all of this, you'll need node.js and npm.

## Setting up the project

Clone the Repository with this command.

```sh
git clone https://github.com/Hasseroeder/Basement.git
```

Install any reasonably modern Node.js and npm.  
Instructions for these can be found at: https://nodejs.org/en/download/current  
And then run:

```sh
npm clean-install
npm run dev
```

Astro prints the local development URL when the server starts.  
To create and preview a production build, run:

```sh
npm run build
npm run preview
```

## Where to make changes

- Text content is generally a MDX file under `src/content/`, grouped by parent page.
    - The associated Markdown pipeline also includes custom emote handling with `:emote:` and math rendering with `$2+2$`.
    - To add a new emote, head to `src/plugins/remark-emotes.json` and add whatever you need to the list.
- Pages lay in `src/pages/` and their reusable UI lays in `src/components/`.
- Styles lay in `src/styles/` and use Sassy CSS.
- Scripts lay in `src/scripts/`, with related data in `src/data/`.
    - We try to use TypeScript for the purpose of scripts, but JavaScript is also really fine.
    - The associated data is mostly CSV and JSON.
- Imported and processed assets belong in `src/assets/`.
- As-is assets (mostly images) belong in `public/assets`, as this folder is simply served at the root of the website when live.
    - there's also as-is `public/data/neonutilAnimalAPI.json` laying there, which isn't used in production.  
      It allows us to access Neon's data in development without accessing his API.

## Before opening a pull request

Run `npm run build` and check that it completes successfully.  
For UI changes, also use `npm run dev` to review the affected page in a browser.  
In your pull request, summarize what changed and mention any relevant sources or manual checks.
