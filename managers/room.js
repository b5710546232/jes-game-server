const _ = require('lodash')
const gameEvents = require('../constants/events')
const Player = require('../model/player')
const Room = require('../model/room')
const shortid = require('shortid')
const GameManager = require('./game')

module.exports = class {
    constructor(socket) {
        this.socket = socket
        this.socketHandler(socket)
    }

    socketHandler(socket) {
        socket.on(gameEvents.playerJoinGame, this.onPlayerConnect.bind(this))
        socket.on(gameEvents.playerJoinRoom, this.onPlayerJoinRoom.bind(this))
    }

    onPlayerConnect(data) {
        let username = data.username
        console.log('Created new player', username)
        let playerID = this.socket.playerID
        let player = new Player(playerID, null, null, null, username)
        GameManager.getInstance().addPlayer(playerID, player)
        this.socket.emit(gameEvents.playerJoinGame, { d: [playerID] })
    }

    onPlayerJoinRoom(data) {
        data['d'] = data['d'].replace(/@/g, "\"")
        let jsonData = JSON.parse(data["d"])
        let player = GameManager.getInstance().getPlayer(jsonData[0])
        let room = GameManager.getInstance().getRoom(parseInt(jsonData[1]))
        player.currentRoom = room
        room.addPlayer(player)
        this.socket.emit(gameEvents.playerJoinRoom, { d: [player.playerID] })
    }

    addRoom(roomName, roomID) {
        // let roomID = shortid.generate()
        let room = new Room(roomName)
        GameManager.getInstance().addRoom(roomID, room)
    }

    onPlayerDisconnect() {
        _.remove(GameManager.getInstance().getPlayers(), player => player.playerID === this.socket.playerID)
    }
}