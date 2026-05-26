# create-modern-frontend-stack

🚀 An interactive, zero-configuration CLI tool to instantly scaffold production-ready frontend architectures.

Instead of spending hours setting up linters, path aliases, style frameworks, and HTTP Clients, this tool handles the heavy lifting in seconds—completely tailored to your environment.

---

## ✨ Features

- **🧠 Smart Environment Auto-Detection:** Automatically detects whether you invoked the tool using `npm` or `pnpm` and executes all internal configurations natively using your preferred package manager.
- **🛠️ Interactive Stack Selection:** Choose between a full-stack meta-framework layout or a lightning-fast Single Page Application setup.
- **⚛️ Standardized Ecosystem:** Every choice pre-wires absolute TypeScript safety, global configuration architectures, and standard industry dependencies.

---

## 📦 What's Included in the Box?

No matter which path you select, the tool hooks up a robust foundation:

| Feature                  | Next.js Path             | React + Vite Path                             |
| :----------------------- | :----------------------- | :-------------------------------------------- |
| **Framework Engine**     | Next.js (App Router)     | Vite + React                                  |
| **Styling Architecture** | Tailwind CSS + Shadcn/UI | Native Tailwind CSS + Shadcn/UI               |
| **Data Fetching**        | Axios + TanStack Query   | Axios + TanStack Query                        |
| **Type Safety**          | TypeScript (Strict Mode) | TypeScript + Custom Vite Path Aliases (`@/*`) |

---

## 🚀 Usage & Installation

You have two ways to use this tool: executing it dynamically on-the-fly (recommended) or installing it globally on your system.

### Method 1: Execute On-The-Fly (Zero Install)

Run it directly from the cloud registry without permanently downloading it to your machine:

- **Using pnpm:**
  ```bash
  pnpm dlx create-modern-frontend-stack
  ```
- **Using npm:**
  ```bash
  npx create-modern-frontend-stack
  ```
