# Contract Editor

A web-based document comparison and editing tool that allows users to track changes between different versions of contracts  The application features dual TinyMCE editors with advanced diff generation and change tracking capabilities.



## Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Modern web browser with JavaScript enabled
- Basic understanding of document editing concepts

## Installation

1. Clone the repository:
```bash
git clone https://github.com/captainoggy/contract-editor

cd contract-editor
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run watch
```

Build for production:
```bash
npm run build
```

Serve the built application:
```bash
npm run serve
```

## Project Structure

```
├── src/
│   ├── main.ts           # Main application logic
│   ├── types.d.ts        # TypeScript type definitions
│   └── styles/
│       └── main.css      # Application styles
├── dist/                 # Compiled output
├── index.html           # Main HTML file
├── package.json         # Project configuration
└── tsconfig.json        # TypeScript configuration
```

## Key Components

### ContractEditor Class

The main class handling the contract editing functionality:

- Document creation and editing
- Change tracking and diff generation


### Features

1. **Editor Initialization**
   - Dual TinyMCE editors
   - Customized toolbar and plugins
   - Image upload support

2. **Change Tracking**
   - Line-by-line diff generation
   - Character-level change highlighting
   - Change type classification (addition/deletion/modification)


## Configuration

The application uses several configuration files:

- `tsconfig.json` for TypeScript settings


## Build Scripts

- `clean`: Remove previous build artifacts
- `create-dirs`: Create necessary directories
- `build`: Compile TypeScript and copy static assets
- `watch`: Watch for changes during development
- `serve`: Serve the built application


```




