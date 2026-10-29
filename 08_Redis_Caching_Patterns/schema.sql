CREATE TABLE auctions (
                          id SERIAL PRIMARY KEY,
                          player_name VARCHAR(255) NOT NULL,
                          base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
                          current_bid NUMERIC(10, 2) DEFAULT 0 CHECK (current_bid >= 0),
                          current_bidder_id INTEGER,
                          status VARCHAR(20) DEFAULT 'upcoming'
                              CHECK (status IN ('upcoming', 'live', 'sold', 'unsold')),
                          auction_room_id INTEGER NOT NULL,
                          created_at TIMESTAMP DEFAULT NOW(),
                          updated_at TIMESTAMP DEFAULT NOW()
);

-- Equivalent to the Mongo compound index: speeds up
-- "find auctions in this room, filtered by status"
CREATE INDEX idx_room_status ON auctions (auction_room_id, status);

-- Equivalent to the Mongo currentBid index: speeds up leaderboard sorting
CREATE INDEX idx_current_bid ON auctions (current_bid DESC);