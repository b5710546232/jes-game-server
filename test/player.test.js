const _ = require('lodash')
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))
const expect = chai.expect

const io = require('socket.io-client')
const PORT = process.env.PORT || 5000
const SOCKET_URL = `http://localhost:${PORT}`

const GameManager = require('../managers/game')
const gameEvents = require('../constants/events')
const API = require('../constants/api')

let options = {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
}

let axiosMock

describe('Player', () => {

    beforeEach(() => {
        axiosMock = new MockAdapter(axios)
        axiosMock.onGet(API.USER + '/me', {
            "headers": { "access-token": 'abcd' }
        }).replyOnce(200, {
            id: 'user_id_1',
            username: '1234'
        })
    })

    afterEach(() => {
        axiosMock.reset()
    })

    describe('update position / rotation', () => {
        let client
        beforeEach(() => {
            client = io.connect(SOCKET_URL, options)
            client.on('connect', (data) => {
                client.emit(gameEvents.playerJoinGame, { d: '[@1234@,@abcd@]' })
            })
        })

        it('should not send new position if it doesnt change', (done) => {
            client.on(gameEvents.playerJoinGame, (data) => {
                let player = GameManager.getPlayer(data.d[0])
                player.position = {x: 0, y: 0, z: 0}
                player.lastMove = player.position
                player.sendPositionData = sinon.spy()
                player.updatePostionToClient()
                expect(player.sendPositionData).to.not.have.been.calledOnce
                client.disconnect()
                done()
            })
        })

        it('should not send new rotation if it doesnt change', (done) => {
            client.on(gameEvents.playerJoinGame, (data) => {
                let player = GameManager.getPlayer(data.d[0])
                player.rotation = {x: 0, y: 0}
                player.lastRotation = player.rotation
                player.sendRotationData = sinon.spy()
                player.updateRotationToClient()
                expect(player.sendRotationData).to.not.have.been.calledOnce
                client.disconnect()
                done()
            })
        })
    })
})