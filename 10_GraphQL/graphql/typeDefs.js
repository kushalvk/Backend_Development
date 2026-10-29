const typeDefs = `#graphql
  type Auction {
    id: ID!
    playerName: String!
    basePrice: Float!
    currentBid: Float!
    status: String!
    auctionRoom: ID!
  }

  type RoomStats {
    auctionRoom: ID!
    totalAuctions: Int!
    liveCount: Int!
    soldCount: Int!
    averageBid: Float
    highestBid: Float
  }

  type LeaderboardEntry {
    playerName: String!
    currentBid: Float!
    status: String!
  }

  type Query {
    auction(id: ID!): Auction
    auctionsByRoom(roomId: ID!): [Auction!]!
    roomStats(roomId: ID!): RoomStats
    leaderboard(roomId: ID!, limit: Int): [LeaderboardEntry!]!
  }

  type Mutation {
    placeBid(auctionId: ID!, amount: Float!, userId: ID!): Auction!
  }
`;

module.exports = typeDefs;