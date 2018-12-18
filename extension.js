const { languages, Uri, DocumentLink, Range } = require('vscode');
const path = require('path');

function buildLink(directory, line, lineIndex, package) {
    const startCharacter = line.text.indexOf(package);
    const endCaracter = startCharacter + package.length;
    const linkRange = new Range(lineIndex, startCharacter, lineIndex, endCaracter);
    const changelog = `${directory}/node_modules/${package}/CHANGELOG.md`;
    const fs = require('fs');
    if (fs.existsSync(changelog)) {
        const linkUri = Uri.parse(`file://${changelog}`);
        return new DocumentLink(linkRange, linkUri);
    }

}

exports.activate = function (context) {
    const disposable = languages.registerDocumentLinkProvider(['javascript', { pattern: '**/package.json' }], {
        provideDocumentLinks(document, token) {
            let links = [];
            let lineIndex = 0;
            let shouldCheckForDependency = false;
            let directory = document.uri.path.substr(0, document.uri.path.lastIndexOf("/"));
            while (lineIndex < document.lineCount) {
                const line = document.lineAt(lineIndex);

                if (shouldCheckForDependency) {
                    // no need to check for dependencies if block ended
                    if (line.text.includes('}')) {
                        shouldCheckForDependency = false;
                    } else {
                        // find dependecy
                        const matches = line.text.match(/"(.*?)"/);

                        if (matches) {
                            let link = buildLink(directory, line, lineIndex, matches[1]);
                            if (link) {
                                links.push(link);
                            }
                        }
                    }

                } else {
                    // check if we are in a dependencies block
                    shouldCheckForDependency = /"(.*?)dependencies"/i.test(line.text);
                }

                lineIndex += 1;
            }

            return links;
        }
    });

    context.subscriptions.push(disposable)
};
