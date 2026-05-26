#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import { execa } from "execa";
import fs from "fs";
import path from "path";

async function main() {
  console.log(chalk.bold.cyan("\n🚀 Welcome to the Modern Stack Installer!\n"));

  // 1. Ask for project details and framework choice
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What is your project named?",
      default: "my-awesome-app",
    },
    {
      type: "list",
      name: "framework",
      message: "Which framework would you like to use?",
      choices: [
        { name: "Next.js (App Router)", value: "next" },
        { name: "React.js (Vite Spa - Tailwind v4 Native)", value: "react" },
      ],
    },
  ]);

  const targetDir = path.join(process.cwd(), answers.projectName);
  const spinner = ora();

  try {
    if (answers.framework === "next") {
      // ==========================================
      // PATH A: NEXT.JS PIPELINE
      // ==========================================
      spinner.start("Scaffolding Next.js with Tailwind CSS...");
      await execa("npx", [
        "create-next-app@latest",
        answers.projectName,
        "--ts",
        "--eslint",
        "--app",
        "--src-dir",
        "--import-alias",
        "@/*",
      ]);
      spinner.succeed(chalk.green("Next.js environment created!"));

      spinner.start("Installing Axios and TanStack Query...");
      await execa("npm", ["install", "@tanstack/react-query", "axios"], {
        cwd: targetDir,
      });
      spinner.succeed(chalk.green("Dependencies installed successfully!"));

      spinner.start("Initializing shadcn/ui...");
      await execa("npx", ["shadcn@latest", "init", "-d"], { cwd: targetDir });
      spinner.succeed(chalk.green("Shadcn/UI initialized!"));

      // Inject Axios config
      const libDir = path.join(targetDir, "src", "lib");
      if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });
      fs.writeFileSync(path.join(libDir, "api.ts"), getAxiosContent());

      // Inject Next.js Query Providers
      const compDir = path.join(targetDir, "src", "components");
      if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });
      fs.writeFileSync(
        path.join(compDir, "providers.tsx"),
        getNextProvidersContent(),
      );

      // Wrap layout
      const layoutPath = path.join(targetDir, "src", "app", "layout.tsx");
      let layoutContent = fs.readFileSync(layoutPath, "utf8");
      layoutContent =
        `import Providers from "@/components/providers";\n` + layoutContent;
      layoutContent = layoutContent.replace(
        "{children}",
        "<Providers>{children}</Providers>",
      );
      fs.writeFileSync(layoutPath, layoutContent);
      spinner.succeed(chalk.green("Layout wrapped with QueryClientProvider!"));
    } else {
      // ==========================================
      // PATH B: REACT.JS (VITE) PIPELINE (TAILWIND V4 NATIVE)
      // ==========================================
      spinner.start("Scaffolding React.js with Vite...");
      await execa("npm", [
        "create",
        "vite@latest",
        answers.projectName,
        "--",
        "--template",
        "react-ts",
      ]);
      spinner.succeed(chalk.green("Vite + React structure setup!"));

      spinner.start("Installing Core Dependencies & Latest Tailwind...");
      await execa("npm", ["install", "@tanstack/react-query", "axios"], {
        cwd: targetDir,
      });
      await execa(
        "npm",
        ["install", "-D", "tailwindcss", "@tailwindcss/vite", "@types/node"],
        { cwd: targetDir },
      );
      spinner.succeed(chalk.green("Latest core dependencies ready!"));

      spinner.start("Configuring Path Aliases & Vite Configurations...");

      // Inject alias configurations directly into vite.config.ts
      const viteConfigPath = path.join(targetDir, "vite.config.ts");
      const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})`;
      fs.writeFileSync(viteConfigPath, viteConfigContent);

      // Overwrite tsconfig.json with explicit paths to bypass JSON.parse traps completely
      const tsconfigPath = path.join(targetDir, "tsconfig.json");
      const tsconfigContent = `{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`;
      fs.writeFileSync(tsconfigPath, tsconfigContent);

      // Overwrite tsconfig.app.json with explicit path allocations
      const tsconfigAppPath = path.join(targetDir, "tsconfig.app.json");
      const tsconfigAppContent = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,

    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`;
      fs.writeFileSync(tsconfigAppPath, tsconfigAppContent);

      // Update index.css to use modern Tailwind v4 directive
      const cssPath = path.join(targetDir, "src", "index.css");
      fs.writeFileSync(cssPath, `@import "tailwindcss";`);
      spinner.succeed(
        chalk.green("Path aliases and configurations successfully matched!"),
      );

      spinner.start("Initializing shadcn/ui for Vite...");
      await execa("npx", ["shadcn@latest", "init", "-d"], { cwd: targetDir });
      spinner.succeed(chalk.green("Shadcn/UI injected!"));

      // Add Axios Client
      const libDir = path.join(targetDir, "src", "lib");
      if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });
      fs.writeFileSync(path.join(libDir, "api.ts"), getAxiosContent());

      // Wrap main.tsx with TanStack Query Provider
      spinner.start("Wrapping application tree with Query Client...");
      const mainPath = path.join(targetDir, "src", "main.tsx");
      const updatedMainContent = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)`;
      fs.writeFileSync(mainPath, updatedMainContent);
      spinner.succeed(chalk.green("React tree wrapped successfully!"));
    }

    // Wrap Up Message
    console.log(
      chalk.bold.magenta(
        `\n🎉 Success! Custom boilerplate is ready inside: ./${answers.projectName}\n`,
      ),
    );
    console.log(chalk.gray(`  cd ${answers.projectName}`));
    console.log(chalk.gray(`  npm run dev\n`));
  } catch (error) {
    spinner.fail(chalk.red("Setup failed. Checkout issues log."));
    console.error(error);
  }
}

// Code builder string templates
function getAxiosContent() {
  return `import axios from 'axios';\n\nconst api = axios.create({\n  baseURL: 'https://api.example.com',\n  headers: { 'Content-Type': 'application/json' },\n});\n\nexport default api;\n`;
}

function getNextProvidersContent() {
  return `"use client";\nimport { QueryClient, QueryClientProvider } from "@tanstack/react-query";\nimport { useState } from "react";\n\nexport default function Providers({ children }: { children: React.ReactNode }) {\n  const [queryClient] = useState(() => new QueryClient());\n  return (\n    <QueryClientProvider client={queryClient}>\n      {children}\n    </QueryClientProvider>\n  );\n}`;
}

main();
