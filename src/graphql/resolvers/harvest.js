const Harvest = require('../../models/harvest');
const User = require('../../models/user');
const Rearing = require('../../models/rearing');
const {transformHarvest} = require('./merge');

module.exports = {
    // Harvests
    harvests: async (args, {req}) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        const creator = await User.findOne({_id: req.userId});
        
        try {
            let rearing;
            const q = [
                {otherInformation: {$regex: '.*' + args.keyword + '.*', $options: '-i'}},
            ];
            rearing = await Rearing.find({creator})
                .and([{$or: q}])
            let totalCount = await Harvest.find({rearing})
                .skip(args.skip)
                .countDocuments();
            const harvests = await Harvest.find({rearing})
                .skip(args.skip)
                .limit(args.limit);
                
            return {
                totalCount,
                harvests: harvests.map(harvest => {
                    return transformHarvest(harvest)
                })
            }
        } catch (error) {
            console.log(error);
        }
    },
    // Harvest
    harvest: async (_id, {req}) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        try {
            const harvest = await Harvest.findOne({_id})
            if(!harvest)
                throw new Error('Harvest not found');
            return transformHarvest(harvest)
        } catch (error) {
            console.log(error);
        }
    },
    // Create
    createHarvest: async (args, {req}) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        let harvest = new Harvest({
            date: args.harvestInput.date,
            totalWeight: args.harvestInput.totalWeight,
            averageWeight: args.harvestInput.averageWeight,
            numberLiveBird: args.harvestInput.numberLiveBird,
            rearing: args.harvestInput.rearing,
            creator: req.userId
        });
        let createdHarvest;
        try {
            const res = await harvest.save();
            createdHarvest = transformHarvest(res);
            const creator = await User.findById(req.userId);
            if(!creator)
                throw new Error('user not found');
            creator.createdHarvest.push(harvest);
            await creator.save();
            return createdHarvest;
        } catch (error) {
            throw error;
        }
    },
    // Update
    updateHarvest: async (args, {req}) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        let updatedHarvest;
        try {
            const harvest = await Harvest.findOneAndUpdate({_id : args._id},{
                date: args.updateHarvestInput.date,
                totalWeight: args.updateHarvestInput.totalWeight,
                averageWeight: args.updateHarvestInput.averageWeight,
                numberLiveBird: args.updateHarvestInput.numberLiveBird,
                rearing: args.updateHarvestInput.rearing,
            });
            updatedHarvest = transformHarvest(harvest);
            return updatedHarvest;
        } catch (error) {
            throw error;
        }
    },
    // Delete
    deleteHarvest: async (args, {req}) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        let deleted;
        try {
            const res = await Harvest.findOne(args);
            console.log(res);
            await res.delete();
            deleted = {deleted : true};
            return deleted;
        } catch (error) {
            throw error;
        }
    }
};