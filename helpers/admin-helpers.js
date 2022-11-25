var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
const { ObjectId } = require('mongodb')
const objectId = require('mongodb').ObjectId
module.exports = {
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email })
            if (admin) {
                await bcrypt.compare(adminData.Password, admin.Password).then((status) => {
                    if (status) {
                        console.log('login success');
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    changeUserStatus: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, [{ "$set": { status: { "$not": "$status" } } }])
            resolve("success")
        })

    },

    getOrderDetails: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    //     {
                    //     $match: {
                    //         userId: ObjectId('636cb5b2e4f9a39f68686215')
                    //     }
                    // },
                    {
                        $unwind: {
                            path: '$products'
                        }
                    }, {
                        $project: {
                            addressId: 1,
                            userId: 1,
                            paymentMethod: 1,
                            totalAmount: 1,
                            date: 1,
                            isoDate: 1,
                            ordername: '$deliveryDetails.ordername',
                            email: '$deliveryDetails.email',
                            phonenumber: '$deliveryDetails.phonenumber',
                            address: '$deliveryDetails.address',
                            pincode: '$deliveryDetails.pincode',
                            country: '$deliveryDetails.country',
                            state: '$deliveryDetails.state',
                            city: '$deliveryDetails.city',
                            item: '$products.item',
                            quantity: '$products.quantity',
                            Name: '$products.Name',
                            category: '$products.category',
                            Brand: '$products.Brand',
                            ActualPrice: '$products.ActualPrice',
                            Stock: '$products.Stock',
                            Description: '$products.Description',
                            OfferPrice: '$products.OfferPrice',
                            proPercentage: '$products.proPercentage',
                            catPercentage: '$products.catPercentage',
                            activePercentage: '$products.activePercentage',
                            return: '$products.return',
                            cancel: '$products.cancel',
                            status: '$products.status'
                        }
                    }, {
                        $sort: {
                            isoDate: -1
                        }
                    }]).toArray()

            resolve(orders)
        })
    },

    changeOrderStatus: (orderId, proId, status) => {
        return new Promise((resolve, reject) => {
            let newDate = new Date().toDateString()
            let queryDate = new Date()
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId), 'products.item': objectId(proId) },
                { $set: { 'products.$.status': status, date: newDate, isoDate: queryDate } }).then(() => {
                    resolve()
                })
        })
    },

    salesReport: (yy, mm) => {
        return new Promise(async (resolve, reject) => {
            console.log('qqqqqqqqqq');
            console.log(yy, mm);


            let agg = [{
                $unwind: {
                    path: '$products'
                }
            }, {
                $match: {
                    'products.status': 'delivered'
                }
            }, {
                $project: {
                    totalAmount: 1,
                    paymentMethod: 1,
                    date: 1,
                    isoDate: 1,
                    OfferPrice: '$products.OfferPrice',
                    status: '$products.status'
                }
            }]

            if (yy && mm) {
                let dd = "1"
                let de = "30"

                let fromDate = mm.concat("/" + dd + "/", yy)
                console.log(fromDate)
                let fromD = new Date(new Date(fromDate).getTime() + 3600 * 24 * 1000)
                console.log(fromD);

                let toDate = mm.concat("/" + de + "/" + yy)
                console.log(toDate)
                let toD = new Date(new Date(toDate).getTime() + 3600 * 24 * 1000)
                console.log(toD)

                dbQuery = {
                    $match: {
                        isoDate: {
                            $gte: fromD,
                            $lte: toD
                        }
                    }
                }

                agg.unshift(dbQuery)
                let deliveredOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate(agg).toArray()
                // console.log('reprottttttttt');
                // console.log(deliveredOrders);
                resolve(deliveredOrders)
            } else if (yy) {
                let dateRange = yy.daterange.split("-")
                let [from, to] = dateRange
                from = from.trim("")
                to = to.trim("")
                fromDate = new Date(new Date(from).getTime() + 3600 * 24 * 1000)
                toDate = new Date(new Date(to).getTime() + 3600 * 24 * 1000)

                dbQuery = {
                    $match: {
                        isoDate: {
                            $gte: fromDate,
                            $lte: toDate
                        }
                    }
                }

                agg.unshift(dbQuery)
                let deliveredOrders = await db.get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            } else {

                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                console.log('required deliverd orders');
                resolve(deliveredOrders)
            }
        })

    },

    addCategoryOffer: (data) => {
        return new Promise(async (resolve, reject) => {
            data.catPercentage = parseInt(data.catPercentage)
            console.log('rreq daataaaa');
            console.log(data);

            await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ Name: data.category },
                { $set: { catPercentage: data.catPercentage } })


            await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ category: data.category },
                { $set: { catPercentage: data.catPercentage } })

            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: data.category }).toArray()
            // console.log(product);



            for (let i = 0; i < product.length; i++) {

                let temp = 0
                let updatedOfferPrice = 0

                if (product[i].proPercentage === 0 && product[i].catPercentage == 0) {

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: product[i].ActualPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].proPercentage } })

                }
                else if (product[i].proPercentage >= product[i].catPercentage) {

                    temp = (product[i].ActualPrice * product[i].proPercentage) / 100
                    updatedOfferPrice = (product[i].ActualPrice - temp)
                    console.log({ updatedOfferPrice })
                    updatedOfferPrice = parseInt(updatedOfferPrice)

                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: updatedOfferPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].proPercentage } })



                }
                else if (product[i].proPercentage <= product[i].catPercentage) {

                    let temp = (product[i].ActualPrice * product[i].catPercentage) / 100
                    let updatedOfferPrice = (product[i].ActualPrice - temp)
                    console.log({ updatedOfferPrice })
                    updatedOfferPrice = parseInt(updatedOfferPrice)


                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: updatedOfferPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].catPercentage } })


                }

            }

            resolve()
        })
    },


    addProductOffer: (data) => {
        return new Promise(async (resolve, reject) => {
            data.proPercentage = parseInt(data.proPercentage)
            console.log('rreq daataaaa');
            console.log(data);

            await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ _id: objectId(data.product) },
                { $set: { proPercentage: data.proPercentage } })

            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ _id: objectId(data.product) }).toArray()
            console.log(product);

            for (let i = 0; i < product.length; i++) {

                let updatedOfferPrice = 0

                if (product[i].proPercentage == 0 && product[i].catPercentage == 0) {

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: objectId(data.product) }, { $set: { OfferPrice: product[i].ActualPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].proPercentage } })


                }
                else if (product[i].proPercentage >= product[i].catPercentage) {

                    updatedOfferPrice = ((100 - product[i].proPercentage) * product[i].ActualPrice) / 100
                    updatedOfferPrice = parseInt(updatedOfferPrice)


                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: objectId(data.product) }, { $set: { OfferPrice: updatedOfferPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].proPercentage } })



                }
                else if (product[i].proPercentage <= product[i].catPercentage) {
                    updatedOfferPrice = ((100 - product[i].catPercentage) * product[i].ActualPrice) / 100
                    updatedOfferPrice = parseInt(updatedOfferPrice)


                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: objectId(data.product) }, { $set: { OfferPrice: updatedOfferPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].catPercentage } })

                }

            }

            resolve()
        })
    },

    deleteCategoryOffer: (id) => {
        return new Promise(async (resolve, reject) => {


            await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(id) },
                { $set: { catPercentage: 0 } })


            let categorys = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(id) })
            console.log(categorys);

            await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ category: categorys.Name },
                { $set: { catPercentage: categorys.catPercentage } })



            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: categorys.Name }).toArray()
            console.log(product);

            for (let i = 0; i < product.length; i++) {

                let temp = 0
                let updatedOfferPrice = 0

                if (product[i].proPercentage === 0 && product[i].catPercentage == 0) {

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: product[i].ActualPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].proPercentage } })

                }
                else if (product[i].proPercentage >= product[i].catPercentage) {

                    temp = (product[i].ActualPrice * product[i].proPercentage) / 100
                    updatedOfferPrice = (product[i].ActualPrice - temp)
                    console.log({ updatedOfferPrice })
                    updatedOfferPrice = parseInt(updatedOfferPrice)


                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: updatedOfferPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].proPercentage } })



                }
                else if (product[i].proPercentage <= product[i].catPercentage) {

                    let temp = (product[i].ActualPrice * product[i].catPercentage) / 100
                    let updatedOfferPrice = (product[i].ActualPrice - temp)
                    console.log({ updatedOfferPrice })
                    updatedOfferPrice = parseInt(updatedOfferPrice)


                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: updatedOfferPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].catPercentage } })


                }
            }

            resolve()
        })
    },

    deleteProductOffer: (id) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(id) },
                { $set: { proPercentage: 0 } })

            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ _id: objectId(id) }).toArray()
            console.log(product);

            for (let i = 0; i < product.length; i++) {

                let temp = 0
                let updatedOfferPrice = 0

                if (product[i].proPercentage === 0 && product[i].catPercentage == 0) {

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: product[i].ActualPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].proPercentage } })

                }
                else if (product[i].proPercentage >= product[i].catPercentage) {

                    temp = (product[i].ActualPrice * product[i].proPercentage) / 100
                    updatedOfferPrice = (product[i].ActualPrice - temp)
                    console.log({ updatedOfferPrice })
                    updatedOfferPrice = parseInt(updatedOfferPrice)


                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: updatedOfferPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].proPercentage } })



                }
                else if (product[i].proPercentage <= product[i].catPercentage) {

                    let temp = (product[i].ActualPrice * product[i].catPercentage) / 100
                    let updatedOfferPrice = (product[i].ActualPrice - temp)
                    console.log({ updatedOfferPrice })
                    updatedOfferPrice = parseInt(updatedOfferPrice)


                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(product[i]._id) }, { $set: { OfferPrice: updatedOfferPrice } })

                    await db.get().collection(collection.PRODUCT_COLLECTION)
                        .updateOne({ _id: ObjectId(product[i]._id) }, { $set: { activePercentage: product[i].catPercentage } })


                }
            }

            resolve()
        })
    },

    dashboardCount: (days) => {
        days = parseInt(days)
        console.log(days);
        return new Promise(async (resolve, reject) => {
            let startDate = new Date();
            let endDate = new Date();

            // console.log(startDate, endDate);

            startDate.setDate(startDate.getDate() - days)

            let data = {};

            data.deliveredOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ isoDate: { $gte: startDate, $lte: endDate }, 'products.status': 'delivered' }).count()
            // console.log("data.deliveredOrders");
            // console.log(data.deliveredOrders);
            data.shippedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ isoDate: { $gte: startDate, $lte: endDate }, 'products.status': 'shipped' }).count()
            data.placedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ isoDate: { $gte: startDate, $lte: endDate }, 'products.status': 'placed' }).count()
            data.pendingOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ isoDate: { $gte: startDate, $lte: endDate }, 'products.status': 'pending' }).count()
            data.canceledOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ isoDate: { $gte: startDate, $lte: endDate }, 'products.status': 'canceled' }).count()

            let codTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
                $match: {
                    isoDate: {
                        $gte: startDate,
                        $lte: endDate
                    },
                    paymentMethod: 'COD'
                }
            }, {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: '$totalAmount'
                    }
                }
            }]).toArray()
            data.codTotal = codTotal?.[0]?.totalAmount
            // console.log("data.codTotal");
            // console.log(data.codTotal);

            let razorpayTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        isoDate: {
                            $gte: startDate, $lte: endDate
                        },
                        paymentMethod: "RAZORPAY"
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.razorpayTotal = razorpayTotal?.[0]?.totalAmount
            // console.log("data.razorpayTotal");
            // console.log(data.razorpayTotal);

            let walletpayTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        isoDate: {
                            $gte: startDate, $lte: endDate
                        },
                        paymentMethod: "WALLET"
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.walletpayTotal = walletpayTotal?.[0]?.totalAmount
            // console.log("data.walletpayTotal");
            // console.log(data.walletpayTotal);

            let paypalTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        isoDate: {
                            $gte: startDate, $lte: endDate
                        },
                        paymentMethod: "PAYPAL"
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.paypalTotal = paypalTotal?.[0]?.totalAmount
            // console.log("data.paypalTotal");
            // console.log(data.paypalTotal);

            let totalAmount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        isoDate: {
                            $gte: startDate, $lte: endDate
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.totalAmount = totalAmount?.[0]?.totalAmount
            // console.log("data.totalAmount");
            // console.log(data.totalAmount);

            // console.log(data);

            resolve(data)
        })
    },

    //banner management
    addBanner: (bannerData, image_url) => {
        return new Promise((resolve, reject) => {
            bannerData.image = image_url

            db.get().collection(collection.BANNER_COLLECTION).insertOne(bannerData).then((response) => {
                resolve(response)
            })
        })

    },
    dispalyBanner: () => {
        return new Promise(async (resolve, reject) => {
            bannerData = await db.get().collection(collection.BANNER_COLLECTION).find({}).toArray()
            resolve(bannerData)
        })
    }

}