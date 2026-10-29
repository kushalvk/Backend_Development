const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

async function startServer() {
    await mongoose.connect('mongodb://localhost:27017/graphql_auction_demo');

    const app = express();
    app.use(cors());
    app.use(express.json());

    const apolloServer = new ApolloServer({ typeDefs, resolvers });
    await apolloServer.start(); // must start before attaching as middleware

    app.use('/graphql', expressMiddleware(apolloServer));

    app.listen(4000, () => {
        console.log('GraphQL server ready at http://localhost:4000/graphql');
    });
}

startServer();