module.exports = {
    types: `
        type FeedType{
            _id: ID!
            name: String!
            creator: User!
            createdAt: String!
            updatedAt: String!
            deletedAt: String
        }

        type FeedTypes{
            totalCount: Int!
            FeedTypes: [FeedType!]
        }

        type CheckDeleteFeedType{
            deleted: Boolean!
        }
    `
    ,
    queries: `
        FeedTypes(keyword: String, limit: Int, skip: Int): FeedTypes
        FeedType(_id: ID!): FeedType
        `
    ,
    mutations: `
        createFeedType(FeedTypeInput: FeedTypeInput): FeedType
        updateFeedType(_id: ID!, updateFeedTypeInput: UpdateFeedTypeInput): FeedType
        deleteFeedType(_id: ID!): CheckDeleteFeedType
    `
    ,
    inputs: `
        input FeedTypeInput{
            name: String!
        }
        input UpdateFeedTypeInput{
            name: String
        }
    `
};