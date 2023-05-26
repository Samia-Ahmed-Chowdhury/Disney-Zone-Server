const express = require('express');
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000;
require('dotenv').config()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.scg3zw6.mongodb.net/?retryWrites=true&w=majority`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {
    // console.log(req.headers.authorization)
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized' })
    }
    const token = authorization.split(' ')[1]
    console.log('36line ', token)

    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized' })
        }
        console.log('36', decoded)
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const database = client.db('toyDB')
        const toyCollection = database.collection('toyCollection')
        const blogCollection = database.collection('blogCollection')

        
        app.get('/toys', async (req, res) => {
            const result = await toyCollection.find().limit(20).toArray()
            // console.log(result)
            res.send(result)
        })


        app.post('/toys', async (req, res) => {
            const newItem = req.body;
            // console.log(newItem)
            const result = await toyCollection.insertOne(newItem)
            res.send(result)
        })

        app.get('/toys/:id', async (req, res) => {
            const id = req.params.id
            // console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.findOne(query)
            // console.log(result)
            res.send(result)
        })


        //search some data on category
        app.get('/toy', async (req, res) => {
            let query = {}
            if (req.query.category) {
                query = { category: req.query.category }
            }
            const result = await toyCollection.find(query).limit(3).toArray()
            res.send(result)
        })

        //search some data on name on change
        app.get('/search', async (req, res) => {
            let query = {}
            if (req.query.name) {
                query = { name: { $regex: req.query.name, $options: 'i' } }
            }
            const result = await toyCollection.find(query).toArray()
            res.send(result)
        })


        //sort some data on name on change
        app.get('/sort', verifyJWT, async (req, res) => {
            const decoded = req.decoded
            console.log('108', req.query.email)
            console.log('109', req.query.type)
            console.log('line 110', decoded)
            let query = {}

            if (decoded.email !== req.query.email) {
                res.status(403).send('forbidden access!!')
            }
            else {
                query = { seller_email: req.query.email }
                let value
                if (req.query.type) {
                    if (req.query.type === 'ascending') {
                        value = 1
                    }
                    if (req.query.type === 'descending') {
                        value = -1
                    }
                    const result = await toyCollection.find(query).sort({ price: value }).toArray()
                    res.send(result)
                }
            }
        })

        //search of my data
        app.get('/my_toy', verifyJWT, async (req, res) => {
            const decoded = req.decoded
            console.log('106', req.query.email)
            console.log('line 109', decoded)
            let query = {}

            if (decoded.email !== req.query.email) {
                res.status(403).send('forbidden access!!')
            }
            else {
                query = { seller_email: req.query.email }
            }
            const result = await toyCollection.find(query).toArray()
            // console.log(result)
            res.send(result)
        })

        app.put('/toys/:id', async (req, res) => {
            const id = req.params.id
            const options = { upsert: true }
            const filter = { _id: new ObjectId(id) }
            const itemInfo = req.body
            const updatedItemInfo = {
                $set: {
                    ...itemInfo
                }
            }
            const result = await toyCollection.updateOne(filter, updatedItemInfo, options)
            res.send(result)
        })

        app.delete('/toys/:id', async (req, res) => {
            // console.log(req.params.id)
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = toyCollection.deleteOne(query)
            res.send(result)
        })

        /// blog db connecting and data fetched

        app.get('/blogs', async (req, res) => {
            const result = await blogCollection.find().toArray()
            // console.log(result)
            res.send(result)
        })


        //jwt API..........
        app.post('/jwt', (req, res) => {
            const user = req.body
            // console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '9hr' })
            // console.log(token)
            res.send({ token })
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send(' disney-zone-server is running')
})




app.listen(port, () => {
    console.log('server is running on port', +port)
})