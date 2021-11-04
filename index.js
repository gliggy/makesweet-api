const express = require('express')
const bodyParser = require('body-parser')
const multer  = require('multer')
const app = express()
const port = 3000
const upload = multer({ dest: '/tmp/' })

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/make', upload.single('image'), (req, res) => {
    res.send('not yet ready\n' + req.file)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

