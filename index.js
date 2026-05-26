#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import { execa } from "execa";
import fs from "fs";
import path from "path";

// 1. Helper function to detect the running package manager
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.includes("pnpm")) return "pnpm";
  if (userAgent.includes("yarn")) return "yarn";
  if (userAgent.includes("bun")) return "bun";
  return "npm"; // Default fallback
}

async function main() {
  // Identify environment variables
  const pm = detectPackageManager();

  console.log(chalk.bold.cyan("\n🚀 Welcome to the Modern Stack Installer!"));
  console.log(
    chalk.gray(`   Detected execution environment: ${chalk.yellow.bold(pm)}\n`),
  );

  // 2. Ask for project details and framework choice
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
        { name: "React.js (Vite Spa)", value: "react" },
      ],
    },
  ]);

  const targetDir = path.join(process.cwd(), answers.projectName);
  const spinner = ora();

  // Dynamic Command Arguments Builder based on package manager detected
  const isPnpm = pm === "pnpm";
  const runnerCmd = isPnpm ? "pnpm" : "npx";
  const dlxArgs = isPnpm ? ["dlx"] : [];
  const installCmd = isPnpm ? "add" : "install";

  try {
    if (answers.framework === "next") {
      // ==========================================
      // PATH A: NEXT.JS PIPELINE (DYNAMIC)
      // ==========================================
      spinner.start(`Scaffolding Next.js via ${pm}...`);

      const nextArgs = [
        ...dlxArgs,
        "create-next-app@latest",
        answers.projectName,
        "--ts",
        "--eslint",
        "--app",
        "--src-dir",
        "--import-alias",
        "@/*",
      ];
      if (isPnpm) nextArgs.push("--use-pnpm");

      await execa(runnerCmd, nextArgs);
      spinner.succeed(chalk.green(`Next.js environment created using ${pm}!`));

      spinner.start("Installing Axios and TanStack Query...");
      await execa(pm, [installCmd, "@tanstack/react-query", "axios"], {
        cwd: targetDir,
      });
      spinner.succeed(chalk.green("Dependencies installed successfully!"));

      spinner.start("Initializing shadcn/ui...");
      await execa(runnerCmd, [...dlxArgs, "shadcn@latest", "init", "-d"], {
        cwd: targetDir,
      });
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
      // PATH B: REACT.JS (VITE) PIPELINE (DYNAMIC)
      // ==========================================
      spinner.start(`Scaffolding React.js with Vite via ${pm}...`);

      if (isPnpm) {
        await execa("pnpm", [
          "create",
          "vite",
          answers.projectName,
          "--template",
          "react-ts",
        ]);
      } else {
        await execa("npm", [
          "create",
          "vite@latest",
          answers.projectName,
          "--",
          "--template",
          "react-ts",
        ]);
      }
      spinner.succeed(chalk.green("Vite + React structure setup!"));

      // Explicit install needed for Vite initialization states
      spinner.start(`Running baseline ${pm} setup configurations...`);
      await execa(pm, [isPnpm ? "install" : "install"], { cwd: targetDir });

      spinner.start("Installing Core Dependencies & Latest Tailwind...");
      await execa(pm, [installCmd, "@tanstack/react-query", "axios"], {
        cwd: targetDir,
      });
      await execa(
        pm,
        [installCmd, "-D", "tailwindcss", "@tailwindcss/vite", "@types/node"],
        { cwd: targetDir },
      );
      spinner.succeed(chalk.green("Latest core dependencies ready!"));

      spinner.start("Configuring Path Aliases & Vite Configurations...");

      // Inject configurations directly into vite.config.ts
      const viteConfigPath = path.join(targetDir, "vite.config.ts");
      const viteConfigContent = `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nimport path from 'path'\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  resolve: {\n    alias: {\n      "@": path.resolve(__dirname, "./src"),\n    },\n  },\n})`;
      fs.writeFileSync(viteConfigPath, viteConfigContent);

      // Overwrite base tsconfig mappings
      const tsconfigPath = path.join(targetDir, "tsconfig.json");
      const tsconfigContent = `{\n  "files": [],\n  "references": [\n    { "path": "./tsconfig.app.json" },\n    { "path": "./tsconfig.node.json" }\n  ],\n  "compilerOptions": {\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"]\n    }\n  }\n}`;
      fs.writeFileSync(tsconfigPath, tsconfigContent);

      // Overwrite internal app settings
      const tsconfigAppPath = path.join(targetDir, "tsconfig.app.json");
      const tsconfigAppContent = `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["DOM", "DOM.Iterable", "ES2020"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noImplicitReturns": true,\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"]\n    }\n  },\n  "include": ["src"]\n}`;
      fs.writeFileSync(tsconfigAppPath, tsconfigAppContent);

      // Setup modern Tailwind directive
      const cssPath = path.join(targetDir, "src", "index.css");
      fs.writeFileSync(cssPath, `@import "tailwindcss";`);
      spinner.succeed(chalk.green("Path aliases successfully configured!"));

      spinner.start("Initializing shadcn/ui for Vite...");
      await execa(runnerCmd, [...dlxArgs, "shadcn@latest", "init", "-d"], {
        cwd: targetDir,
      });
      spinner.succeed(chalk.green("Shadcn/UI injected!"));

      // Add Axios Client
      const libDir = path.join(targetDir, "src", "lib");
      if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });
      fs.writeFileSync(path.join(libDir, "api.ts"), getAxiosContent());

      // Wrap entry main tree
      spinner.start("Wrapping application tree with Query Client...");
      const mainPath = path.join(targetDir, "src", "main.tsx");
      const updatedMainContent = `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.tsx'\nimport './index.css'\nimport { QueryClient, QueryClientProvider } from '@tanstack/react-query'\n\nconst queryClient = new QueryClient()\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <QueryClientProvider client={queryClient}>\n      <App />\n    </QueryClientProvider>\n  </React.StrictMode>,\n)`;
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
    console.log(chalk.gray(`  ${pm} dev\n`));
  } catch (error) {
    spinner.fail(chalk.red("Setup failed. Check error logs."));
    console.error(error);
  }
}

function getAxiosContent() {
  return `import axios from 'axios';\n\nconst api = axios.create({\n  baseURL: 'https://api.example.com',\n  headers: { 'Content-Type': 'application/json' },\n});\n\nexport default api;\n`;
}

function getNextProvidersContent() {
  return `"use client";\nimport { QueryClient, QueryClientProvider } from "@tanstack/react-query";\nimport { useState } from "react";\n\nexport default function Providers({ children }: { children: React.ReactNode }) {\n  const [queryClient] = useState(() => new QueryClient());\n  return (\n    <QueryClientProvider client={queryClient}>\n      {children}\n    </QueryClientProvider>\n  );\n}`;
}

main();
