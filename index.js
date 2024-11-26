import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
// import cors from 'cors'



import { UserController, OrderController } from './controllers/index.js'
import { checkAuth, handleValidationErrors, gpt } from './utils/index.js'

mongoose.set('strictQuery', false)
dotenv.config()
const MONGO_DB = process.env.MONGO_DB

mongoose
  .connect(MONGO_DB)
  .then(() => console.log('DB ok'))
  .catch(err => console.log('DB error', err))

const app = express()
app.use(express.json())
// app.use(cors())

app.listen(1234, (err) => {
  if (err) {
    return console.log(err)
  }

  console.log('Server OK ')
})

app.get('/', (req, res) => {
  res.send('Гугуца батрачит')
})




app.post('/auth/login', handleValidationErrors, UserController.login)
app.post('/auth/register', handleValidationErrors, UserController.register)
app.get('/auth/me', checkAuth, UserController.getMe)

app.get('/orders', checkAuth, OrderController.getAll);
app.get('/orders/:id', checkAuth, OrderController.getById);
app.post('/orders', checkAuth, handleValidationErrors, OrderController.create);
app.patch('/orders/:id', checkAuth, handleValidationErrors, OrderController.update);

app.delete('/stages/:id', checkAuth, OrderController.remove);

app.put('/stages/:id', checkAuth, handleValidationErrors, OrderController.createstage);

app.post('/risks/:id', checkAuth, OrderController.podborka)

// app.get('/currentTime', (req, res) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");
//   res.flushHeaders();

//   const intervalId = setInterval(() => {
//     res.write(`data: ${new Date().toLocaleString()}\n\n`);
//   }, 1000);

//   res.on("close", () => {
//     clearInterval(intervalId);
//     res.end();
// })
// });

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

const handler = (req, res) => {
  const d = new Date()
  res.end(d.toString())
}

module.exports = allowCors(handler)
