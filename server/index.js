/* eslint-disable @typescript-eslint/no-var-requires */
// 跳板机
// 用于做 https ipv6 查询的跳板

const express = require('express')
const cors = require('cors')
const request = require('umi-request')
const app = express()

app.use(cors())
app.use(express.json())

app.use('/ipv6/:ip', async (req, res) => {
  const data = await request.default.get(
    'http://ip-api.com/json/' + req.params.ip,
  )
  res.send(data)
})

app.listen(9812, () => {
  console.log('server listen on 9812')
})
