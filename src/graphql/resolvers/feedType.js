const FeedType = require('../../models/feedType');
const User = require('../../models/user');
const {transformFeedType} = require('./merge');

module.exports = {
    feedTypes: async (args, req) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        const creator = await User.findOne({_id: req.userId});
        try {
            const q = [
                {name: {$regex: '.*' + args.keyword + '.*', $options: '-i'}},
            ];
            let totalCount = await FeedType.find({creator})
                .and([{$or: q}])
                .skip(args.skip)
                .countDocuments();
            const feedTypes = await FeedType.find({creator})
                .and([{$or: q}])
                .skip(args.skip)
                .limit(args.limit);
                
            return {
                totalCount,
                feedTypes: feedTypes.map(feedType => {
                    return transformFeedType(feedType)
                })
            }
        } catch (error) {
            console.log(error);
        }
    },
    feedType: async (_id, req) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        try {
            const feedTypes = await FeedType.findOne({_id})
            if(!feedTypes)
                throw new Error('Sensor Type not found');
            return transformFeedType(feedTypes)
        } catch (error) {
            console.log(error);
        }
    },
    createFeedType: async (args, req) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        let feedType = new FeedType({
            name: args.feedTypeInput.name,
            creator: req.userId
        });
        let createdFeedType;
        try {
            const res = await feedType.save();
            createdFeedType = transformFeedType(res);
            const creator = await User.findById(req.userId);
            if (!creator)
                throw new Error('user not found');
            creator.createdFeedType.push(feedType);
            await creator.save();
            return createdFeedType;
        } catch (error) {
            throw error;
        }
    },
};