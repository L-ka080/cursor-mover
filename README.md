# Cursor Mover VSCode extension

I made this for myself just to imitate the vim-like movement between lines of code (12j or 12k iykwim).

Works just fine. I don't know if i will update it any time soon or even publish it to marketplace. I'm more bothered with the fact that you're reading this README.

## Installation

In the realeases of this repository, you can find the `cursor-mover.vsix` file. Download it and with that file, - use the `Extensions: Install from VSIX` in Command Palette. That's it.

## Usage

This extension by default overrides the `ctrl+g` shortcut to do it's job, if the current file is in focus (editorTextFocus). In every other case the behaviour of this shortcut will be VsCode's default one.

If you don't like this and want to change this shortcut - use the `Preferences: Open Keyboard Shortcuts` in Command Palette (not the JSON one) - and change it to your liking.

So, you can use this extention in two ways: 
1. pass the exact line number, which will bring you to that line.
2. pass the relative  line number with `+`/`-` before, so you'll end up on that line. `+` is for going down, `-` is for going up.

Pretty simple.

Also this extension, while the input dialog is open, will change `lineNumber` setting to `relative` for easier use. After that the initial value will be restored.