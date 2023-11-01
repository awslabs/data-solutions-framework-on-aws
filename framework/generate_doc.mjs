import * as fs from 'fs';
import data from './.jsii.tabl.json' assert { type: 'json' };

// select only snippets for readme files
const snippets = Object.fromEntries(
    Object.entries(data.snippets)
        .filter(([_,v]) => v.location.api.api === 'moduleReadme')
);

let previousStart = 0;
let codeLength = 0;
let fullReadme = {};

let currentMDFile = '';
let lines = [];

for (let key in snippets) {
    const snippet = snippets[key];
    const typescript = snippet.translations.$.source;
    const python = snippet.translations.python.source;

    const submodule = snippet.location.api.moduleFqn.replace('aws-dsf.', '');
    const file = `src/${submodule}/README.md`;

    // do not read file on each snippet
    if (file !== currentMDFile) {
        currentMDFile = file;
        const buffer= fs.readFileSync(file);
        const str= buffer.toString();
        lines = str.split("\n");
    }

    let line = snippet.location.field.line;
    let realLine = line - codeLength;

    // jsii does not count comments, we must add lines for each one
    // let numberOfComments = lines.slice(0, realLine).filter(elt => elt.startsWith("[//]: # ")).length;
    // realLine += numberOfComments;

    if (!fullReadme[submodule]) {
        fullReadme[submodule] = '';
    }
    fullReadme[submodule] += lines.slice(previousStart, realLine - 1).join('\n');
    fullReadme[submodule] += `
<Tabs>
  <TabItem value="typescript" label="TypeScript" default>

  \`\`\`typescript
  ${typescript}
  \`\`\`
  
  \`\`\`mdx-code-block
  
  </TabItem>
  <TabItem value="python" label="Python">

  \`\`\`python
  ${python}
  \`\`\`

  </TabItem>
</Tabs>\n
`;

    previousStart = realLine + 1;
    codeLength += typescript.split("\n").length + 1;
}

const titleRegEx = new RegExp('\\[\\/\\/\]: # \\((.*)\\)\\n', 'gm');

for (let module in fullReadme) {
    const moduleReadme = fullReadme[module];
    const constructReadmes = moduleReadme.split(titleRegEx);
    let filename = '';
    for (let i = 0; i < constructReadmes.length; i++) {
        let constructReadme = constructReadmes[i];
        if (constructReadme.startsWith(module)) {
            filename = '../website/docs/constructs/library/_' + constructReadme.replace('.', '-') + '.mdx';
            console.log(filename + ' exported');
        } else if (constructReadme.length !== 0 && filename.length !== 0) {
            let constructReadmeLines = constructReadme.split('\n');
            constructReadmeLines.shift(); // remove title
            constructReadme = constructReadmeLines.join('\n');
            constructReadme = `import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

${constructReadme}`;

            constructReadme = constructReadme.replaceAll("website/static/img", "static/img"); // change image path
            fs.writeFileSync(filename, constructReadme);
            filename = '';
        }
    }
}