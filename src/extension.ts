import * as vscode from 'vscode';

let originalLineNumbers: string | undefined;
let previewDecoration: vscode.TextEditorDecorationType;
let inputBox: vscode.InputBox | undefined;

export function activate(context: vscode.ExtensionContext) {
	previewDecoration = vscode.window.createTextEditorDecorationType({
		backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
		isWholeLine: true
	});

	const restoreSettings = () => {
		if (originalLineNumbers !== undefined) {
			vscode.workspace.getConfiguration('editor')
				.update('lineNumbers', originalLineNumbers, vscode.ConfigurationTarget.Global)
				.then(() => {
					originalLineNumbers = undefined;
				});
		}
	};

	let disposable = vscode.commands.registerCommand('cursor-mover.relativeMove', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('No active editor!');
			return;
		}

		// Сохраняем текущие настройки перед изменением
		const config = vscode.workspace.getConfiguration('editor');
		originalLineNumbers = config.get('lineNumbers');

		// Устанавливаем относительные номера строк
		await config.update('lineNumbers', 'relative', vscode.ConfigurationTarget.Global);

		const currentPosition = editor.selection.active;
		const currentLine = currentPosition.line + 1;

		// Создаем новое inputBox
		inputBox = vscode.window.createInputBox();
		inputBox.title = "Cursor Mover";
		inputBox.prompt = "Enter line number (10) or relative move (+5, -3)";
		inputBox.value = currentLine.toString();

		// Обработка закрытия inputBox
		inputBox.onDidHide(() => {
			clearPreview(editor);
			restoreSettings();
			inputBox?.dispose();
			inputBox = undefined;
		});

		// Остальная логика обработки ввода...
		inputBox.onDidChangeValue(value => {
			clearPreview(editor);

			try {
				const result = parseInput(value, currentLine);
				if (result.isValid) {
					const pos = new vscode.Position(result.line, 0);
					const range = new vscode.Range(pos, pos);

					if (result.isAbsolute) {
						editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
					}
					editor.setDecorations(previewDecoration, [range]);
				}
			} catch {
				// Игнорируем ошибки при вводе
			}
		});

		inputBox.onDidAccept(() => {
			try {
				const result = parseInput(inputBox!.value, currentLine);
				if (result.isValid) {
					const newPosition = new vscode.Position(result.line, 0);
					editor.selection = new vscode.Selection(newPosition, newPosition);
					editor.revealRange(
						new vscode.Range(newPosition, newPosition),
						vscode.TextEditorRevealType.InCenter
					);
				}
			} catch (err) {
				vscode.window.showErrorMessage("Invalid input: " + err);
			}
			inputBox?.dispose();
			inputBox = undefined;
			restoreSettings();
		});

		inputBox.show();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push({
		dispose: () => {
			restoreSettings();
			previewDecoration.dispose();
			inputBox?.dispose();
		}
	});
}

function clearPreview(editor: vscode.TextEditor) {
	editor.setDecorations(previewDecoration, []);
}

function parseInput(input: string, currentLine: number): {
	line: number,
	isValid: boolean,
	isAbsolute: boolean
} {
	if (!input.trim()) {
		return { line: 0, isValid: false, isAbsolute: false };
	};

	const cleanInput = input.trim();
	let line: number;
	let isAbsolute = false;

	if (cleanInput.startsWith('+')) {
		// Относительное перемещение вниз
		const delta = parseInt(cleanInput.slice(1)) || 0;
		line = (currentLine - 1) + delta;
	} else if (cleanInput.startsWith('-')) {
		// Относительное перемещение вверх
		const delta = parseInt(cleanInput.slice(1)) || 0;
		line = Math.max(0, (currentLine - 1) - delta);
	} else {
		// Абсолютное перемещение
		line = Math.max(0, (parseInt(cleanInput) || 1) - 1);
		isAbsolute = true;
	}

	return { line, isValid: true, isAbsolute };
}

export function deactivate() {
    // Явное восстановление настроек при деактивации
    if (originalLineNumbers !== undefined) {
        vscode.workspace.getConfiguration('editor')
            .update('lineNumbers', originalLineNumbers, vscode.ConfigurationTarget.Global);
    }
    previewDecoration.dispose();
    inputBox?.dispose();
}