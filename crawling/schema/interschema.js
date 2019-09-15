const mongoose = require('mongoose')

const interSchema = new mongoose.Schema( {
    boardid: {
        type: String
    },
    entryid: {
        type: String
    },
    userid: {
        type: String
    },
    username: {
        type: String
    },
    profile: {
        type: String
    },
    likes: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    isMine: {
        type: Boolean
    },
    title: {
        type: String
    },
    contents: {
        type: String
    },
    pictures: {
        type: String
    },
    url: {
        type: String
    }
})

module.exports = mongoose.model('Inter', interSchema)