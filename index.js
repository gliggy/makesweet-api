// -*- mode: js; js-indent-level: 4; -*-

const express = require('express')
const childProcess = require('child_process')
const multer  = require('multer')
const uuid = require('uuid')
const fs = require ('fs')
const os = require('os')
const path = require('path')

const host = process.env.MAKESWEET_HOST || 'localhost'
const port = process.env.MAKESWEET_PORT || 3000

const workDir = '/tmp/makesweet-api'
const upload = multer({ dest: workDir })
const app = express()

app.use(express.static('public'));

app.post('/make/:template', upload.any('images'), handleErrors, (req, res) => {
    const authorization = String(req.header('authorization')).replace(/[^a-zA-Z0-9]/g, '');
    if (authorization.length === 0 || !fs.existsSync(path.join(process.cwd(), 'keys', authorization))) {
        throw new ApiError(401, 'You need a good Authorization header');
    }
    
    const textHtml = `${process.cwd()}/text.html`;
    const output = `${workDir}/${uuid.v4()}.gif`;
    const template = getTemplatePathFromName(req.params.template);
    const generator = new Generator();
    generator.useTemplate(template);
    try {
        if (req.query.textborder) {
	    generator.setTextBorder(Number(req.query.textborder));
        }
        generator.addTexts(req.query.text, textHtml);
        generator.addImages(req.files);
	if (req.query.textfirst) {
	    generator.setTextFirst();
	}
        generator.setOutput(output);
	res.send(generator.apply());
    } finally {
        generator.clean();
    }
})

app.use(handleErrors)

app.listen(port, host, () => {
    console.log(`Example app listening at http://${host}:${port}`)
})

function execSync(command) {
    console.log("Executing: " + command);
    childProcess.execSync(command, { stdio: 'inherit' });
}

function text2image(htmlTemplate, outputDir, prefix, txt, border) {
    console.log("text2image:", txt);
    const data = {
        text: txt.replace(/[ \n\r\t]+\/\/[ \n\r\t]+/g, '\n').trim()
    };
    fs.writeFileSync(`${outputDir}/text.json`, JSON.stringify(data));
    fs.copyFileSync(htmlTemplate, `${outputDir}/text.html`);
    console.log("ready");
    execSync(`wkhtmltoimage --enable-local-file-access  --transparent --width 3000 --window-status ready_to_print ${outputDir}/text.html ${outputDir}/${prefix}.png`);
    console.log("123");
    execSync(`convert ${outputDir}/${prefix}.png -trim  -bordercolor none -border ` + border + ` ${outputDir}/${prefix}2.png`);
    console.log("234");
    return `${outputDir}/${prefix}2.png`;
}

function getTemplatePathFromName(name) {
    if (!name) {
        throw new ApiError(400, 'i must have a template i cannot do anything without a template');
    }
    const nameStr = String(name);
    if (!nameStr.match(/^[-a-zA-Z0-9]+$/)) {
        throw new ApiError(400, 'is that really a template: ' + nameStr);
    }
    const template = `templates/${nameStr}.zip`
    if (!fs.existsSync(template)) {
        throw new ApiError(404, 'i seek the template everywhere, but it is not to be found.');
    }
    return template;
}

function handleErrors(err, req, res, next) {
    console.error(err);
    if (err.code) {
	return res.status(err.code).json({error: err.message})
    } else {
        res.status(500).json({error: err})
    }
}

class ApiError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

class Generator {
    constructor() {
        this.fnames = [];
        this.images = [];
        this.texts = [];
        this.template = null;
        this.output = null;
        this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'makesweet-api'));
	this.textFirst = false;
        this.textBorder = 60;
    }
    useFile(fname) {
        this.fnames.push(fname);
    }
    useTemplate(fname) {
        this.useFile(fname);
        this.template = fname;
    }
    setTextFirst() {
	this.textFirst = true;
    }
    setTextBorder(border) {
	this.textBorder = border;
    }
    addImages(files) {
        if (!files) { return; }
        for (const file of files) {
            this.images.push(file.path);
            this.fnames.push(file.path);
        }
    }
    addTexts(textOrTexts, htmlTemplate) {
        console.log({textOrTexts, htmlTemplate});
        const texts = !textOrTexts ? [] :
              (typeof textOrTexts === 'string') ? [textOrTexts] :
              [...textOrTexts];
        console.log("texts", texts)
        let i = 0;
        for (const txt of texts) {
	    const fname = text2image(htmlTemplate, this.tmpDir, `text_${i}`, txt, this.textBorder);
            this.texts.push(fname);
            this.fnames.push(fname);
            i++;
        }
    }
    setOutput(output) {
        this.output = output;
        this.fnames.push(output);
    }
    getVolumes() {
        const dirs = new Set(this.fnames.map(fname => path.resolve(path.dirname(fname))));
        return [...dirs].sort();
    }
    getCommand() {
        const command = ['run', '--rm'];
        for (const volume of this.getVolumes()) {
            command.push('-v', `${volume}:${volume}`);
        }
        command.push('--mount', 'type=tmpfs,destination=/share')

        command.push('paulfitz/makesweet');
        command.push('--zip', path.resolve(this.template));
        command.push('--in');
	const parts = this.textFirst ? [this.texts, this.images] : [this.images, this.texts];
	for (const part of parts) {
            for (const file of part) {
		command.push(file);
	    }
        }
        command.push('--gif', this.output);
        return command;
    }
    apply() {
        const command = this.getCommand();
        console.log("command:", command);
	childProcess.execFileSync('docker', command);
	return fs.readFileSync(this.output);
    }
    clean() {
        try {
            fs.rmSync(this.tmpDir, { recursive: true });
            for (const image of this.images) {
                fs.unlinkSync(image);
            }
            if (this.output) {
                fs.unlinkSync(this.output);
            }
        } catch (e) {
            console.error(`Error removing tmpDir: ${e}`);
        }
    }
}
