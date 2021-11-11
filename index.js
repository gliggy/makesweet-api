// -*- mode: js; js-indent-level: 4; -*-

const express = require('express')
const childProcess = require('child_process')
const multer  = require('multer')
const uuid = require('uuid')
const fs = require ('fs')
const app = express()

const workDir = '/tmp/api'
const port = 3000

const upload = multer({ dest: workDir })

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/make/:template', upload.any('images'), (req, res) => {
    if (!req.files) {
	return res.status(400).json({error: "i hunger for images..."})
    }
    const template = `templates/${req.params.template}.zip`
    if (!fs.existsSync(template)) {
	return res.status(404).json({error: "i seek the template everywhere, but it is not to be found. try 'heart-locket'"})
    }
    const path=`${workDir}/${uuid.v4()}.gif`
    try {
        const cwd = process.cwd()
	const command = ['run', '-v', `${workDir}:${workDir}`, '-v', `${cwd}:/share`, 'paulfitz/makesweet', '--zip', template, '--in']
	for (const file of req.files) {
	    command.push(file.path)
	}
	command.push('--gif', path)
	console.log(command)
	
	const result = childProcess.execFileSync('docker', command).stdout
	res.send(fs.readFileSync(path))
    } finally {
	for (const file of req.files) {
	    fs.unlinkSync(file.path)
	}
	fs.unlinkSync(path)
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

