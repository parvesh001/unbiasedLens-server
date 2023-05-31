//Third party packages
const express = require('express')
const cors = require('cors')

//Local files
const authorRouter = require('./Routes/authorRoutes')

const app = express()

app.use(cors())
app.use(express.json())

//Routers
app.use('/api/v1/authors', authorRouter)

app.use((err,req,res,next)=>{
    const status = err.status || 500;
    const message = err.message || 'sth went wrong';
    res.status(status).json({message, error:err})
    next()
})
module.exports = app;