const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const Company = require('../../models/company');
const Manage = require('../../models/manage');
const {transformUser} = require('./merge');
const randing = require('randing');
const moment = require('moment');
const nodemailer = require("nodemailer");
const responseMsg = require('../../helpers/responseMessage');
const mailSender = require('../../helpers/mailSender');
const {dateToString} = require('../../helpers/date');
const { createAccessToken, createRefreshToken } = require('../../helpers/auth.js');
const {response} = require('express');
// const redis = require('../../helpers/redis');
const axios = require('axios');

module.exports = {
    
    // Get All User
    users: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        const user = await User.findOne({_id: req.userId});
        if (user.type !== 'admin')
            throw new Error('Unauthorized');

        try {
            const q = [
                {username: {$regex: '.*' + args.keyword + '.*', $options: '-i'}},
            ];
            let totalCount = await User.find()
                .and([{$or: q}])
                .skip(args.skip)
                .countDocuments();
            const users = await User.find()
                .and([{$or: q}])
                .skip(args.skip)
                .limit(args.limit);

            return {
                totalCount : totalCount,
                users : users.map(user => {
                    return transformUser(user)
                }),
            };
        } catch (error) {
            console.log(error);
        }
    },
    // Get One User
    user: async (_id, {req}) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        try {
            const user = await User.findOne({_id})
            if(!user)
                throw new Error('User not found');
            return transformUser(user);
        } catch (error) {
            console.log(error);
        }
    },
    getProfile: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        try {
            const user = await User.findById(req.userId);
            return { 
                name: user.name,
                username: user.username,
                email: user.email,
                address: user.address,
                role: user.type
            }
        } catch (error) {
            throw error;
        }
    },
    // Register Staff by Owner 
    createUser: async (args, req) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        if (!req.isAllowed)
            throw new Error('Unauthorized');
        try {
            // Check email
            const checkUser = await User.findOne({email: args.userInput.email});
            if (checkUser)
                throw new Error(`User with email ${args.userInput.email} already exist`);
            // Check Username
            const checkUsername = await User.findOne({username: args.userInput.username});
            if (checkUsername)
                throw new Error(`User with Username ${args.userInput.username} already exist`);
            // Hash Password
            const hashedPwd = await bcrypt.hash(args.userInput.password, 12);
            // Save new User
            const user = new User({
                name: args.userInput.name,
                address: args.userInput.address,
                username: args.userInput.username,
                email: args.userInput.email,
                phone: args.userInput.phone,
                type: args.userInput.type,
                password: hashedPwd,
                creator: req.userId
            });
            const res = await user.save();
            const createdUser = transformUser(res);
            // Update creator data
            const creator = await User.findById(req.userId);
            creator.createdUser.push(user);
            await creator.save();
            return createdUser;
        } catch (error) {
            throw error
        }
    },
    
    // Register Manual
    register: async (args) => {
        try {
            const checkUser = await User.findOne({email: args.registerInput.email});
            if (checkUser)
                throw new Error(`User with email ${args.registerInput.email} already exist`);
            const checkUsername = await User.findOne({username: args.registerInput.username});
            if (checkUsername)
                throw new Error(`User with Username ${args.registerInput.username} already exist`);
            const hashedPwd = await bcrypt.hash(args.registerInput.password, 12);
            const user = new User({
                name: args.registerInput.name,
                address: args.registerInput.address,
                username: args.registerInput.username,
                email: args.registerInput.email,
                type: args.registerInput.type,
                password: hashedPwd,
                tokenVersion: 0,
            });
            const res = await user.save();
            const company = new Company({
                name: args.registerInput.companyName,
                type: args.registerInput.companyType,
                creator: res._id
            });
            const resCompany = await company.save();
            const manage = new Manage({
                company: resCompany._id,
                user: res._id,
                creator: res._id
            });
            await manage.save();
            if(!args.registerInput.token && !args.registerInput.oauthType) {
                const token = randing(20);
                await user.updateOne({
                    verifyToken: token,
                    verifyTokenExpiry: moment(new Date()).add(1, 'day').format('YYYY-MM-DD HH:mm:ss')
                });
                await mailSender.verifyEmail(user.email, token);
                return {...res._doc, password: null}
            }
            if(args.registerInput.oauthType === "google") {
                let api = await axios.get(
                    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${args.registerInput.token}`
                );
                await user.updateOne({
                    verified: true,
                    google: api.body.user_id
                });
            }
            return {...res._doc, password: null}
        } catch (error) {
            throw error
        }
    },
    // Register using Socmed
    registerSocmed: async (args, req) => {
        // Check auth
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        try {
            // Check email
            const checkUser = await User.findOne({email: args.registerInput.email});
            if (checkUser)
                throw new Error(`User with email ${args.registerInput.email} already exist`);
            // Check Username
            const checkUsername = await User.findOne({username: args.registerInput.username});
            if (checkUsername)
                throw new Error(`User with Username ${args.registerInput.username} already exist`);
            // Hash Password
            const hashedPwd = await bcrypt.hash(args.registerInput.password, 12);
            // Save new User
            const user = new User({
                name: args.registerInput.name,
                address: args.registerInput.address,
                username: args.registerInput.username,
                email: args.registerInput.email,
                phone: args.registerInput.phone,
                type: args.registerInput.type,
                password: hashedPwd,
            });
            const res = await user.save();

            return {...res._doc, password: null}
        } catch (error) {
            throw error
        }
    },
    // Update User Profile
    updateUser: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        let updatedUser;
        try {
            const usernameExist = await User.findOne({username: args.updateUserInput.username});
            if(usernameExist) {
                throw new Error('Username Existing');
            }
            const user = await User.findOneAndUpdate({_id: req.userId}, {
                address: args.updateUserInput.address,
                username: args.updateUserInput.username,
                name: args.updateUserInput.name
            });
            updatedUser = transformUser(user);
            return updatedUser;
        } catch (error) {
            throw error;
        }
    },
    updateUser2: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        let updatedUser;
        try {
            const user = await User.findOneAndUpdate({_id: args.updateUserInput2.user}, {
                type: args.updateUserInput2.type
            });
            updatedUser = transformUser(user);
            return updatedUser;
        } catch (error) {
            throw error;
        }
    },
    updateEmail: async ({ email, emailBaru }, { req }) => {
        try {
            const user = await User.findOneAndUpdate({email}, {
                email: emailBaru
            });
            console.log(user);
            return true;
        } catch (error) {
            throw error;
        }
    },
    updatePassword: async ({ passwordLama, passwordBaru }, { req }) => {
        try {
          console.log(req.userId);
            const user = await User.findById(req.userId);
            const isEqual = await bcrypt.compare(passwordLama, user.password);
            if(!isEqual)
              throw new Error('Wrong Password');
            const hashedPwd = await bcrypt.hash(passwordBaru, 12);
            await user.update({password: hashedPwd});
            return true;
        } catch (error) {
            throw error;
        }
    },
    updatePassword2: async ({ email, token, passwordBaru }, { req }) => {
          try {
              const hashedPwd = await bcrypt.hash(passwordBaru, 12);
              const user = await User.findOneAndUpdate({email, resetPasswordToken: token}, {
                  password: hashedPwd
              });
              return true;
          } catch (error) {
              throw error;
          }
    },
    emailExist: async ({email}, { req }) => {
        try {
            const user = await User.findOne({email});
            if(user === null) {
                return false;
            }
            return true;
        } catch (error) {
            throw error;
        }
    },
    emailVerified: async ({email}, {req}) => {
        try {
            const user = await User.findOne({email});
            if(user === null){
                return false;
            }
            if(!user.verified){
              return false;
            }
            return true;
        } catch (error) {
            throw error;
        }
    },
    usernameExist: async ({username}, { req }) => {
        try {
            const user = await User.findOne({username});
            console.log(username);
            if(user === null) {
                return false;
            }
            return true;
        } catch (error) {
            throw error;
        }
    },
    // Delete User
    deleteUser: async (args, {req}) => {
        if(!req.isAuth)
            throw new Error('Unauthenticated');
        let deleted;
        try {
            const res = await User.findOne(args);
            await res.delete();
            deleted = {deleted : true};
            return deleted;
        } catch (error) {
            throw error;
        }
    },
    revokeRefreshToken: async (args, req) => {
      try{
        const user = await User.findOneAndUpdate({_id: args}, {$inc: { tokenVersion : 1 }});
        return true;
      } catch (error) {
        throw error;
      }
    },
    login: async ({email, password}, { res }) => {
        // Check email
        let user ;
        user = await User.findOne({email:email});
        if (!user) {
            // Check username
            user = await User.findOne({username:email});
            if (!user)
                throw new Error('Email/Username not registered');
        }
        if (!user.verified) {
            throw new Error('Not Verified');
        }
        // Check password
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual)
            throw new Error('Wrong Password');
        res.cookie('jid', createRefreshToken(user), {httpOnly: true})
      
        const token = await createAccessToken(user);
        const company = await Company.findOne({creator: user.id});
        return {
            userId: user.id,
            token: token,
            name: user.name,
            email: user.email,
            type: user.type,
            company: company.name,
            createdAt: new Date(),
            tokenExpiration: 1
        }
    },
    loginOAuth: async ({type, token}) => {
        let email, registered=true;
        if (type == "facebook") {
            const res = await axios.get(
                `https://graph.facebook.com/v6.0/me?fields=id%2Cname%2Cemail&access_token=${token}`
            );
            email = res.data.email;
        } else {
            const res = await axios.get(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
            );
            email = res.data.email;
        }
        const user = await User.findOne({email});
        if(!user)
            registered = false;
        return {
            email,
            registered
        }
    },
    loginOAuth2: async ({type, token}, {res}) => {
        let user;
        if(type === "facebook")
            user = await User.findOne({facebook: token});
        else if(type === "google")
            user = await User.findOne({email: token});
        if (!user) {
            throw new Error('User not found');
        }
        res.cookie('jid', createRefreshToken(user), {httpOnly: true});
        const token2 = await createAccessToken(user);
        const company = await Company.findOne({creator: user.id});
        return {
            userId: user.id,
            token: token2,
            name: user.name,
            email: user.email,
            type: "owner",
            company: company.name,
            createdAt: new Date(),
            tokenExpiration: 1
        }
    },
    
    checkEmail: async (email) => {
        const user = await User.findOne(email);
        return {registered : !!user};
    },

    logout: async (args, req) => {
        console.log(req.isAuth);
//         if (!req.isAuth)
//             throw new Error('Unauthenticated');
        
//         res.cookie("jid", "", {httpOnly: true});
//         // const token = req.get('Authorization').split(' ')[1];
//         // redis.redisClient.set(token, null);
        return {signedOut : true};
    },
    //Verify Email
    sendLinkVerifyEmail: async (email) => {
        const user = await User.findOne(email);
        if(!user)
            throw new Error('User not found');
        try {
            const token = randing(20);
            await user.updateOne({
                verifyToken: token,
                verifyTokenExpiry: moment(new Date()).add(1, 'day').format('YYYY-MM-DD HH:mm:ss')
            });
            await mailSender.verifyEmail(user.email, token);
            return {
                email: user.email,
                token: token,
                tokenExpiry: dateToString(user.verifyTokenExpiry)
            }
        } catch (error) {
            throw error;
        }
    },
    // Forget Password
    sendLinkForgetPassword: async (email) => {
        const user = await User.findOne(email);
        if(!user)
            throw new Error('User not found');
        try {
            if(user.resetPasswordTokenExpiry < new Date()){
              const token = randing(6);
              await user.updateOne({
                  resetPasswordToken: token,
                  resetPasswordTokenExpiry: moment(new Date()).add(1, 'day').format('YYYY-MM-DD HH:mm:ss')
              });              
            }
            await mailSender.forgetPassword(user.email, user.resetPasswordToken);
            return {
                email: user.email,
                token: user.resetPasswordToken,
                tokenExpiry: dateToString(user.resetPasswordTokenExpiry)
            }
        } catch (error) {
            throw error;
        }
    },

    otp: async({email, emailBaru}, {req}) => {
        const user = await User.findOne({email});
        if(!user)
            throw new Error('User not found');
        try {
            const token = Math.floor(1000 + Math.random() * 9000);
            await user.updateOne({
                resetPasswordToken: token,
                resetPasswordTokenExpiry: moment(new Date()).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss')
            });
            await mailSender.OTP(emailBaru, token);
            return {
                code: token
            }
        } catch (error) {
            throw error;
        }
    },

    otp2: async({email, emailBaru}, {req}) => {
        const user = await User.findOne({email});
        if(!user)
            throw new Error('User not found');
        try {
            const token = Math.floor(1000 + Math.random() * 9000);
            await user.updateOne({
                resetPasswordToken: token,
                resetPasswordTokenExpiry: moment(new Date()).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss')
            });
            await mailSender.OTP2(emailBaru, token);
            return {
                code: token
            }
        } catch (error) {
            throw error;
        }
    },

    cekOtp: async(resetPasswordToken) => {
        let now = new Date();
        try {
            const user = await User.findOne(resetPasswordToken);
            if(!user){
                throw new Error('User not found')
            }
            if(now > user.resetPasswordTokenExpiry){
                throw new Error('Expired');
            }
            await user.updateOne({
                resetPasswordToken: "zaqwsxcde",
                resetPasswordTokenExpiry: now
            });
            return true;
        } catch (error) {
            throw error;
        }

    }

    // getRedis: async(args) => {
    //     try {
    //         return redis.redisClient.get(args.key);
    //     } catch (error) {
    //         return null
    //     }
    // },

    // setRedis: async(args, {redisClient}) => {
    //     try {
    //         redisClient.set('key', 'value');
    //         return true
    //     } catch (error) {
    //         console.log(error)
    //         return false
    //     }
    // }
};