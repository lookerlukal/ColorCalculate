# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A CIE1931 chromaticity-based RGB color mixing calculator. Pure frontend implementation, no build tools required.

## Development Environment

- Static web project, run by opening `index.html` in browser
- No build, compilation, or dependency installation required
- Compatible with modern browsers (Canvas API support required)

## Code Architecture

### Core Files

1. **index.html** - Main page with UI for multiple calculation modes
2. **js/** - Modularized JavaScript architecture:
   - **config.js** - Configuration and constants (95 lines)
   - **notification.js** - Error handling and notifications (150 lines) 
   - **color-calculator.js** - Color calculation algorithms (217 lines)
   - **chart-renderer.js** - CIE1931 chart rendering (344 lines)
   - **app-controller.js** - Main application controller (407 lines)
   - **script.js** - Compatibility layer and presets (194 lines)
3. **js/debug.js** - Debug utilities
4. **css/style.css** - Styling

### Key Functions

1. **CIE1931 Visualization**
   - `drawCIE1931Chart()` - Main rendering function
   - Spectral locus, grid, gamut boundary display
   - Drag interaction and real-time updates

2. **Color Calculation Core**
   - `calculateMixedColor()` - Mode 1: RGB mixing results
   - `calculateRequiredLuminance()` - Mode 2: Required luminance for target color
   - `calculateMaxLuminance()` - Mode 3: Maximum achievable luminance
   - `solveLinearEquation()` - Linear equation solver for luminance calculations

3. **Interaction System**
   - Mouse events: `onMouseDown`, `onMouseMove`, `onMouseUp`
   - Keyboard shortcuts: `onKeyDown`
   - Point dragging, slider adjustment, step control

4. **Preset Management**
   - localStorage for preset data storage
   - Save, load, delete presets
   - Multiple built-in default presets

### Key Data Structure

```javascript
colorPoints = {
    red: { x, y, lv },    // Red primary
    green: { x, y, lv },  // Green primary
    blue: { x, y, lv },   // Blue primary
    target: { x, y, lv }, // Target color (Mode 2)
    mix: { x, y, lv }     // Mixed result (Mode 1)
}
```

### Coordinate System

- CIE coordinates range: x, y ∈ [0, 1]
- Canvas coordinate conversion:
  - `screenToCieCoordinates()` - Screen to CIE coordinates
  - `getCanvasScaleFactor()` - Handle high DPI screens

## Development Guidelines

1. **Debugging**: Use browser developer tools, `debug.js` provides utilities
2. **Code Architecture**: Modular design with separation of concerns:
   - Configuration management, error handling, calculations, rendering, and application control are separated
   - Improved maintainability and testability
3. **Performance**: Optimized rendering with background caching, efficient coordinate transformations, and throttled updates
4. **Browser Compatibility**: Requires Canvas API and localStorage support

## Git Management (AI Development)

### ⚠️ MANDATORY BRANCH STRATEGY ⚠️

**CRITICAL RULE: NEVER WORK DIRECTLY ON MAIN BRANCH**

Before making ANY code changes, you MUST:
1. Check current branch with `git branch`
2. If on main, immediately create a new session branch
3. Only then proceed with development

**Main Branches**
- `main` - Stable production version (READ ONLY for development)
- `session/YYYY-MM-DD-feature` - AI development session branches
- `backup/feature` - Backup branches before major refactoring

**Naming Convention**
```bash
session/2025-01-15-color-mixing      # Color mixing feature development
session/2025-01-16-ui-optimization   # UI optimization session
backup/before-script-refactor        # Pre-refactor backup
```

### Commit Standards

**Commit Message Format**
```
[AI] type: Brief description

- Specific change 1
- Specific change 2
- Specific change 3

Session: 2025-01-15
Context: User requirement summary
Files: Main modified files list
```

**Commit Types**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `style` - Style adjustment
- `perf` - Performance optimization
- `docs` - Documentation update

### AI Development Workflow

**1. Session Start (MANDATORY)**
```bash
# ALWAYS check current branch first
git branch

# If on main, IMMEDIATELY create session branch before ANY changes
git checkout main
git checkout -b session/$(date +%Y-%m-%d)-feature-name

# Example:
git checkout -b session/2025-08-15-bug-fix
```

**⚠️ ENFORCEMENT: If you find yourself on main branch during development, STOP immediately and create a session branch**

**2. During Development**
- Commit immediately after completing independent functional modules
- Intermediate commits for single file changes over 300 lines
- Create backup branches before major architectural adjustments

**3. Session End**
```bash
git checkout main
git merge --no-ff session/branch-name
git tag -a "v$(date +%Y%m%d)" -m "AI session: feature description"
git branch -d session/branch-name  # Optional
```

### Quality Control

**Pre-commit Checklist**
- [ ] Code functions completely and runs
- [ ] Single files under 1300 lines (split if exceeded)
- [ ] Browser testing shows basic functionality works
- [ ] Commit message includes necessary context

**Rollback Strategy**
- Keep AI session branches for at least 1 week
- Use Git tags for important versions
- Maintain `backup/` branches for emergency recovery

**Change Management**
- Limit single session code changes to 500 lines
- Step-by-step commits for cross-file refactoring
- Separate new features from bug fixes

### AI Collaboration

**Session Continuity**
- Record current development status in CLAUDE.md
- Document important decisions and architectural choices
- Clearly mark incomplete TODO items

**Version Management**
- Use semantic versioning: `v1.0.0`
- Tag major feature releases
- Use pre-release tags for experimental features: `v1.1.0-beta`