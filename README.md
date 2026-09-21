# Insolvency UI

### Instructions
```
npm install
npm run dev
```

## Git Hooks Setup

This repository uses shared git hooks to ensure code quality. The pre-commit hook runs `npm run build` before each commit to catch build errors early.

### For New Users

Run the setup script to configure git hooks:
```bash
./setup-hooks.sh
```

### Manual Setup

If you prefer manual setup:
```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
```

The hooks will now apply to all users committing to this repository.
# idbi-hackathon-ui
