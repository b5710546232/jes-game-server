
const express = require('express')
const app = express()
const server = require('http').Server(app)
const _ = require('lodash')
const shortid = require('shortid')
const path = require('path')

const io = require('socket.io')(server)

const PlayerManager = require('./managers/player')
const GameManager = require('./managers/game')
const gameEvents = require('./constants/events')
const GameWorld = require('./managers/gameworld')

const gameWorldConfig = require('./config/gameworld')

const APP_CONFIG = require('./config.json')

const Room = require('./lobby/room')
const Rooms = require('./lobby/rooms')

let gameInterval = null
let gameWorld = new GameWorld(io, gameWorldConfig)
let gameWorldRoomA = new GameWorld(io, gameWorldConfig)
let gameWorldRoomB = new GameWorld(io, gameWorldConfig)

// let gameManager = new GameManager(io, gameWorld)

console.log('GAME-SERVER VERSION :: ', APP_CONFIG.GAME_VERSION)

let roomA = new Room('Room A', gameWorldRoomA);
let roomB = new Room('Room B', gameWorldRoomB);
let rooms = new Rooms();
rooms.addRoom(roomA);
rooms.addRoom(roomB);

io.on('connection', (socket) => {
    let playerManager = new PlayerManager(socket, gameWorld)
    socket.playerID = shortid.generate()
    console.log('Player', socket.playerID, socket.id, 'connected')
    // let weaponsInMap = gameWorld.getUpdateWeaponInMap()
    // console.log('send-weapon-data',weaponsInMap)
    // socket.emit(gameEvents.setupEquitment,{d:weaponsInMap})

    socket.on(gameEvents.playerJoinRoom, (data) => {
        data['d'] = data['d'].replace(/@/g, "\"")
        let jsonData = JSON.parse(data["d"])
        let playerID = jsonData[0]
        let roomIndex = parseInt(jsonData[1])
        rooms.joinRoom(playerID, roomIndex);
        socket.emit(gameEvents.playerJoinRoom, { d: [playerID] })
    })

    socket.on('disconnect', () => {
        let pid = socket.playerID
        let data = { "d": pid }
        io.emit(gameEvents.playerDisconnect, data)
        console.log('remove player', socket.playerID)
        playerManager.deletePlayer()
    })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`Listen on http://localhost:${PORT}`)
    // gameInterval = gameManager.createGameInterval()
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'))
})