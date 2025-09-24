# Click to Cancel Assistant

This project is an Expo-managed React Native application that targets the web and can be deployed to Vercel. It provides a cancellation assistant chat experience powered by the DistilGPT-2 model running directly in the browser via [`@xenova/transformers`](https://github.com/xenova/transformers.js).

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run web
```

## Building for Vercel

The repository includes a `vercel.json` configuration that instructs Vercel to run the Expo web export and serve the generated static output. To create the production build locally run:

```bash
npm run build
```

The static site will be emitted to the `dist` directory, matching the `outputDirectory` defined for Vercel deployments.
