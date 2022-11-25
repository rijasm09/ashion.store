var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
const { ObjectId } = require('mongodb')
var objectId = require('mongodb').ObjectId
module.exports = {
    addCoupons: (data) => {
        return new Promise(async (resolve, reject) => {
            // console.log('coupon data');
            // console.log(data);


            let couponObj = {
                couponCode: data.couponCode,
                couponPercentage: parseInt(data.couponPercentage),
                minPrice: parseInt(data.minPrice),
                maxPrice: parseInt(data.maxPrice),
                expiryDate: data.expiryDate,
                isoDate: new Date(),
                users: []
            }

            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponObj).then((response) => {
                // console.log('below response');
                // console.log(response);
                resolve(response)
            })
        })

    },

    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },

    couponChecker: (data, userId, totalValue) => {
        return new Promise(async (resolve, reject) => {

            // let userObj = {
            //     user_id: objectId(userId)
            // }
            couponCode = data.couponCode

            // console.log('coupon code');
            // console.log(data);
            // console.log(totalValue);

            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponCode: data.couponCode })
            // console.log('coupon body');
            // console.log(coupon);
            // console.log(userId);

            let user = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponCode: data.couponCode, users: { user_id: objectId(userId) } })
            // console.log('below user match');
            // console.log(user);

            expiryDate = new Date(coupon?.expiryDate)
            // console.log(expiryDate);
            createdDate = new Date(coupon?.isoDate)
            // console.log(createdDate);

            if (user) {
                console.log('coupon already used');
                reject({ status: true })
            } else if (!user) {
                if (createdDate < expiryDate && coupon.minPrice < totalValue && coupon.maxPrice > totalValue) {
                    console.log('coupon not used');

                    // await db.get().collection(collection.COUPON_COLLECTION)
                    //     .updateOne({ couponCode: data.couponCode },
                    //         {

                    //             $push: { users: userObj }

                    //         })

                    newTotalValue = parseInt((totalValue * (100 - coupon.couponPercentage)) / 100)
                    discountedValue = parseInt((totalValue * (coupon.couponPercentage)) / 100)
                    // console.log('newtotql value');
                    // console.log(newTotalValue);
                    resolve({ newTotalValue, discountedValue, couponCode, status: true })


                } else {
                    reject({ status: false })
                }

            }
        })
    },

    eligibleCoupons: (userId) => {
        return new Promise(async (resolve, reject) => {
            let eligibleCoupons = await db.get().collection(collection.COUPON_COLLECTION).aggregate([{
                $unwind: {
                 path: '$users'
                }
               }, {
                $match: {
                 'users.user_id': ObjectId(userId)
                }
               }]).toArray()
            // console.log('eligibleCoupons');
            // console.log(eligibleCoupons);
            resolve(eligibleCoupons)

        })

    },

    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            console.log('coupon id in the helpers file');
            console.log(couponId);
            console.log(objectId(couponId));
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then((response) => {

                resolve(response)
            })
        })

    }
}