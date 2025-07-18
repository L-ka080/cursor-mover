import * as vscode from 'vscode';

let originalLineNumbers: string | undefined;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('cursor-mover.relativeMove', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('No active editor!');
			return;
		}

		const config = vscode.workspace.getConfiguration('editor');
		originalLineNumbers = config.get('lineNumbers');

		await config.update('lineNumbers', 'relative', vscode.ConfigurationTarget.Global);

		const currentPosition = editor.selection.active;
		const currentLine = currentPosition.line + 1;

		const lineHighlightDecoration = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
			isWholeLine: true
		});

		const input = await new Promise<string | undefined>(resolve => {
			const inputBox = vscode.window.createInputBox();
			inputBox.prompt = "Enter line number (10) or relative move (+5, -3)";
			inputBox.value = currentLine.toString();

			let previewTimeout: NodeJS.Timeout;

			inputBox.onDidChangeValue(value => {
				clearTimeout(previewTimeout);
				previewTimeout = setTimeout(() => {
					try {
						const line = parseInput(value, currentLine);
						if (line >= 0) {
							const pos = new vscode.Position(line, 0);
							const range = new vscode.Range(pos, pos);

							if (!value.startsWith('+') && !value.startsWith('-')) {
								editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
							}

							editor.setDecorations(lineHighlightDecoration, [range]);
						}
					} catch {
					}
				}, 75);
			});

			inputBox.onDidAccept(() => {
				resolve(inputBox.value);
				inputBox.dispose();
			});

			inputBox.onDidHide(() => {
				resolve(undefined);
				inputBox.dispose();
			});

			inputBox.show();
		});

		lineHighlightDecoration.dispose();

		if (originalLineNumbers !== undefined) {
			await config.update('lineNumbers', originalLineNumbers, vscode.ConfigurationTarget.Global);
		}

		if (!input) {
			return;
		}

		try {
			const targetLine = parseInput(input, currentLine);
			if (targetLine >= 0) {
				const newPosition = new vscode.Position(targetLine, 0);
				editor.selection = new vscode.Selection(newPosition, newPosition);
				editor.revealRange(new vscode.Range(newPosition, newPosition));
			}
		} catch (err) {
			vscode.window.showErrorMessage("Invalid input: " + err);
		}
	});

	context.subscriptions.push(disposable);
}

function parseInput(input: string, currentLine: number): number {
	if (!input) {
		return -1;
	};

	const cleanInput = input.trim();

	if (cleanInput.startsWith('+')) {
		const delta = parseInt(cleanInput.slice(1)) || 0;
		return (currentLine - 1) + delta;
	} else if (cleanInput.startsWith('-')) {
		const delta = parseInt(cleanInput.slice(1)) || 0;
		return Math.max(0, (currentLine - 1) - delta);
	} else {
		return Math.max(0, (parseInt(cleanInput) || 1) - 1);
	}
}

export function deactivate() {
	if (originalLineNumbers !== undefined) {
		vscode.workspace.getConfiguration('editor')
			.update('lineNumbers', originalLineNumbers, vscode.ConfigurationTarget.Global);
	}
}