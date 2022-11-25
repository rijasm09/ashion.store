var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { log } = require('console')
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});
module.exports = {
    // doSignup: (userData) => {  
    //     return new Promise(async (resolve, reject) => {
    //         userData.Password = await bcrypt.hash(userData.Password, 10) 
    //         db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((result) => { 
    //             resolve(result.insertedId) 
    //         })
    //     })
    // },
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {

            // console.log('userdata');
            // console.log(userData);
            let emailChecking = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            // console.log('email checkijg');
            // console.log(emailChecking);
            if (emailChecking == null) {
                userData.Password = await bcrypt.hash(userData.Password, 10)
                userData.address = []
                userData.status = true;
                userData.signUpDate = new Date()
                userData.referralId = userData.Name + new objectId().toString().slice(1, 7)

                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    db.get().collection(collection.WALLET_COLLECTION).insertOne(
                        {
                            userId: userData._id,
                            walletBalance: 0,
                            referralId: userData.referralId,
                            transaction: []
                        })
                    // resolve("success")
                })

                // console.log('final userdata in helper');
                // console.log(userData);
                // console.log(userData.referralCode);

                if (userData.referralCode) {
                    db.get().collection(collection.USER_COLLECTION).findOne({ referralId: userData.referralCode }).then(async (response) => {
                        // console.log('resppppppppooo', response);
                        if (response != null) {
                            console.log('reached second');
                            await db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: objectId(userData._id) }, { $set: { walletBalance: 100 } })
                            await db.get().collection(collection.WALLET_COLLECTION).updateOne({ referralId: userData.referralCode }, { $inc: { walletBalance: 100 } })
                        }
                    })
                }

                resolve(userData)
            } else if (emailChecking != null) {
                reject("Email is already taken")
            }


        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            // let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            // console.log(user);
            if (user && user.status) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('login failed initially');
                resolve({ status: false })
            }
        })
    },

    // prodDetails: (proId) => {
    //     return new Promise(async (resolve, reject) => {
    //         let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ _id: objectId(proId) }).toArray()
    //         // console.log('eeeeeeeeeeeeeeeeeeeeeeeeee');
    //         // console.log(products);
    //         resolve(products)
    //     })
    // },

    getAllBanners: () => {
        return new Promise(async (resolve, reject) => {

            let banner = await db.get().collection(collection.BANNER_COLLECTION).find({}).toArray()
            resolve(banner)
        })

    },

    addToCart: (proId, userId) => {



        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
            // console.log('user cart');
            // console.log(userCart);
            // console.log('product');
            // console.log(product);

            let proObj = {
                item: objectId(proId),
                quantity: 1,
                Name: product.Name,
                category: product.category,
                Brand: product.Brand,
                ActualPrice: product.ActualPrice,
                Stock: product.Stock,
                Description: product.Description,
                OfferPrice: product.OfferPrice,
                proPercentage: product.proPercentage,
                catPercentage: product.catPercentage,
                activePercentage: product.activePercentage,
                return: product.return,
                cancel: product.cancel,
                status: product.status,
                image: product.image[0]
            }

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)

                // console.log('proExist below');
                // console.log(proExist);

                if (proExist != -1) { //if product present '!= -1'
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne(
                            {
                                user: objectId(userId),
                                "products.item": objectId(proId)
                            },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {

                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: proObj }

                            }).then((response) => {
                                resolve()
                            })
                }
            } else {
                let cartObj = {

                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    addToWishlist: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1

        }

        return new Promise(async (resolve, reject) => {
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })

            // console.log('this is userCart in addToCart ');
            // console.log(userWishlist);
            // console.log('productid and userid');
            // console.log(proId, userId);

            if (userWishlist) {
                let proExist = userWishlist.products.findIndex(product => product.item == proId)

                // console.log('proExist below');
                // console.log(proExist);

                if (proExist != -1) { //if product present '!= -1'
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne(
                            {
                                user: objectId(userId),
                                "products.item": objectId(proId)
                            },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {

                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: proObj }

                            }).then((response) => {
                                resolve()
                            })
                }
            } else {
                let wishlistObj = {

                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response) => {
                    resolve()
                })
            }
        })

    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: 1,
                        total: { $multiply: ['$quantity', '$product.OfferPrice'] }
                    }
                }
            ]).toArray()
            // console.log('ooooo');
            // console.log(cartItems);
            resolve(cartItems)

        })
    },

    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: 1,
                        total: { $multiply: ['$quantity', '$product.OfferPrice'] }
                    }
                }
            ]).toArray()
            // console.log('ooooo');
            // console.log(wishlistItems);
            resolve(wishlistItems)

        })
    },

    wishlistRemoveProduct: (details) => {
        return new Promise((resolve, reject) => {
            console.log('required detaisl');
            console.log(details);
            db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne({ _id: objectId(details.wishlist) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
        })
    },

    getWishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wishlist) {
                count = wishlist.products.length
            }
            resolve(count)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)  //to convert the count in string format to int
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {

            if (details.count == -1 && details.quantity == 1) {  //details.count = -1 sent from cart.hbs
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true }) // we made status object so that we can insert one more value into it, now we can append total also to it
                    })
            }
        })
    },

    cartRemoveProduct: (details) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId, typeof userId);
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }, {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.OfferPrice'] } }
                    }
                }
            ]).toArray()
            // console.log("total in cart");
            // console.log(total);
            resolve(total[0]?.total)
        })
    },

    getProdTotalAmount: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId, typeof userId);
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $match: { item: objectId(proId) } //so that only 1 product at a time comes
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }, {
                    $project: {
                        total: { $multiply: ['$quantity', '$product.OfferPrice'] }
                    }
                }
            ]).toArray()
            resolve(total[0]?.total)
        })
    },

    addAddress: (userAddress, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).update(
                { _id: objectId(userId) },
                {
                    $push: {
                        'address': {
                            addId: objectId(),
                            name: userAddress.name,
                            address: userAddress.address,
                            phoneNumber: userAddress.phoneNumber,
                            country: userAddress.country,
                            city: userAddress.city,
                            state: userAddress.state,
                            pincode: userAddress.pincode
                        }
                    }
                }
            ).then((response) => {
                resolve()
            })

        })
    },

    getUserAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION)
                .aggregate(
                    [{
                        $match: {
                            _id: objectId(userId)
                        }
                    }, {
                        $unwind: {
                            path: '$address'
                        }
                    }]
                ).toArray()
            resolve(address)
        })
    },
    userAddress: (addid, userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION)
                .aggregate([{
                    $match: {
                        _id: objectId(userId)
                    }
                }, {
                    $unwind: {
                        path: '$address'
                    }
                }, {
                    $match: {
                        'address.addId': objectId(addid)
                    }
                }, {
                    $project: {
                        addId: '$address.addId',
                        name: '$address.name',
                        address: '$address.address',
                        pincode: '$address.pincode',
                        country: '$address.country',
                        state: '$address.state',
                        city: '$address.city',
                        phoneNumber: '$address.phoneNumber'
                    }
                }]).toArray()
            resolve(address)
        })
    },

    walletBalance: (userId) => {
        return new Promise(async (resolve, reject) => {
            let walletAmount = await db.get().collection(collection.WALLET_COLLECTION).aggregate([{
                $match: {
                    userId: objectId(userId)
                }
            }, {
                $project: {
                    walletBalance: 1,
                    _id: 0
                }
            }]).toArray()

            let walletBalance = walletAmount[0].walletBalance
            console.log(walletBalance);
            resolve(walletBalance)
        })

    },

    getOrderAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION)
                .aggregate(
                    [{
                        $match: {
                            _id: objectId(userId)
                        }
                    }, {
                        $unwind: {
                            path: '$address'
                        }
                    }, {
                        $project: {
                            Name: 1,
                            Email: 1,
                            addId: '$address.addId',
                            orderName: '$address.name',
                            address: '$address.address',
                            phoneNumber: '$address.phoneNumber',
                            country: '$address.country',
                            city: '$address.city',
                            state: '$address.state',
                            pincode: '$address.pincode'
                        }
                    }, {
                        $match: {
                            addId: objectId(addressId)
                        }
                    }]
                ).toArray()
            resolve(address)
        })

    },

    placeOrder: (products, total, order, userId) => {

        // console.log('order bodyyyyyyyyyyyyyyyyyy');
        // console.log(order);
        // console.log(address);
        // console.log(products);
        // console.log(total);


        return new Promise((resolve, reject) => {

            let userObj = {
                user_id: objectId(userId)
            }
            // if paymentmethod id cod then status = cod else status = pending
            let status = order.paymentmethod === 'COD' ? 'placed' : 'pending' //here we are using conditional operator to check the status of the order's (object's) payment method //since 'payment-method': 'COD', here payment method is in string format we cant write in order.payment-method instead write order['payment-method']  

            const productChecked = products.map(product => ({
                ...product,
                status: status
            }))
            // console.log(productChecked);


            let orderObj = {
                deliveryDetails: {
                    ordername: order.name,
                    phonenumber: order.phoneNumber,
                    address: order.address,
                    pincode: order.pincode,
                    country: order.country,
                    state: order.state,
                    city: order.city
                },
                // addressId: objectId(order.addressId),
                userId: objectId(order.userId),
                paymentMethod: order.paymentmethod,
                products: productChecked,
                totalAmount: parseInt(total),
                status: status,
                date: new Date().toDateString(),
                isoDate: new Date()
                // queryDate: new Date(date).toISOString()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {



                if (status === 'placed') {
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) }).then(() => {

                        // TO DECREMENT STOCK AFTER BUYING 
                        products.forEach(element => {

                            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(element.item) }, { $inc: { Stock: -(element.quantity) } })
                        })

                        if (order.coupon) {
                            db.get().collection(collection.COUPON_COLLECTION)
                                .updateOne({ couponCode: order.coupon },
                                    {

                                        $push: { users: userObj }

                                    })
                        }

                    })
                    resolve(response.insertedId)
                } else {
                    resolve(response.insertedId)
                }
            })

        })
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart?.products)
        })
    },

    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            // console.log('iiiiiiiiiiiiiiiiiiiiii');
            // console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([{
                    $match: {
                        userId: objectId(userId)
                    }
                }, {
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
                        status: '$products.status',
                        image: '$products.image',
                        prodTotal: { $multiply: ['$products.quantity', '$products.OfferPrice'] }
                    }
                }, {
                    $sort: {
                        isoDate: -1
                    }
                }]).toArray()
            // console.log('below requ orders');
            // console.log(orders);
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }
            ]).toArray()
            // console.log(orderItems)
            resolve(orderItems)
        })
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            console.log('total');
            console.log(total);
            var options = {
                amount: total * 100, //amount in the smallest currency unit
                currency: 'INR',
                receipt: "" + orderId //if we give simply orderId its not working
                //receipt: '6356a7c33014bd62aeb705d8', we get this in terminal reciept is the id which we gave
                //id: 'order_KXeLM36yLsBRbv', this is the id given by the razor pay, using these id we call from the browser side, hiding the key
                //amount: 887,  we only need these 3 things to the client side
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log('i am the error');
                    console.log(err);
                } else {
                    console.log('new order:', order);
                    resolve(order)
                }

            });
        })
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'FDOaJBtR9yoC1Ddx0UTCQ8bt'); //we can require in block also where we need it
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },

    changePaymentStatus: (orderId, userId, coupon, products) => {

        // console.log('products in changepaymentstatus');
        // console.log(products);

        let userObj = {
            user_id: objectId(userId)
        }

        return new Promise((resolve, reject) => {

            products.forEach(async (element) => {   //element means each object inside the array

                let response = await db.get().collection(collection.ORDER_COLLECTION)
                    .updateOne({ _id: objectId(orderId), 'products.item': objectId(element.item) },
                        {
                            $set: {
                                'products.$.status': 'placed'
                            }
                        });
                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                    {
                        _id: objectId(element.item)
                    },
                    {
                        $inc: {
                            Stock: -(element.quantity)
                        }
                    })
            })

            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) }).then(() => {

                if (coupon) {
                    db.get().collection(collection.COUPON_COLLECTION)
                        .updateOne({ couponCode: coupon },
                            {

                                $push: { users: userObj }

                            }).then(() => {
                                resolve()
                            })
                }

                resolve("success")
            })

        })
    },

    walletPay: (orderId, total, userId, coupon, products) => {
        return new Promise(async (resolve, reject) => {

            let walletAmount = await db.get().collection(collection.WALLET_COLLECTION).aggregate([{
                $match: {
                    userId: objectId(userId)
                }
            }, {
                $project: {
                    walletBalance: 1,
                    _id: 0
                }
            }]).toArray()


            let walletBalance = walletAmount[0].walletBalance
            // console.log('walletamount', walletAmount[0].walletBalance);
            // console.log(total, walletBalance);
            // console.log(coupon);

            if (walletBalance >= total) {
                let newwalletBalance = walletBalance - total
                // console.log('newwalletBalance');
                // console.log(newwalletBalance);

                let userObj = {
                    user_id: objectId(userId)
                }

                products.forEach(async (element) => {   //element means each object inside the array

                    let response = await db.get().collection(collection.ORDER_COLLECTION)
                        .updateOne({ _id: objectId(orderId), 'products.item': objectId(element.item) },
                            {
                                $set: {
                                    'products.$.status': 'placed'
                                }
                            });
                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                        {
                            _id: objectId(element.item)
                        },
                        {
                            $inc: {
                                Stock: -(element.quantity)
                            }
                        })
                })

                // console.log('reached first');
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })

                    .then(() => {
                        // console.log('reached second');

                        db.get().collection(collection.WALLET_COLLECTION)
                            .updateOne({ userId: objectId(userId) },
                                {
                                    $set: {
                                        walletBalance: newwalletBalance
                                    }
                                }).then(() => {

                                    // console.log('reached fourth');

                                    if (coupon) {
                                        // console.log('reached fifth');
                                        db.get().collection(collection.COUPON_COLLECTION)
                                            .updateOne({ couponCode: coupon },
                                                {

                                                    $push: { users: userObj }

                                                }).then((response) => {
                                                    resolve({ walletPay: true })
                                                })
                                    }

                                    resolve({ walletPay: true })
                                })


                    })



            } else {
                reject({ walletPay: false })
            }


        })
    },

    paypalPay: (orderId, total, userId, coupon, products) => {
        return new Promise((resolve, reject) => {
            console.log("second");

            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/success"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "item",
                            "sku": "item",
                            "price": "1.00",
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": "1.00"
                    },
                    "description": "This is the payment description."
                }]
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                console.log("third");
                if (error) {
                    throw error;
                } else {
                    console.log("Create Payment Response");
                    console.log(payment);
                    resolve({ paypalPay: true })
                }
            });

        })
    },

    cancelOrder: (userId, orderId, proId, quantity, prodTotal) => {
        return new Promise(async (resolve, reject) => {

            let newDate = new Date().toDateString()
            let queryDate = new Date()
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId), 'products.item': objectId(proId) },
                { $set: { 'products.$.status': 'canceled', date: newDate, isoDate: queryDate } }).then(async (response) => {




                    let walletAmount = await db.get().collection(collection.WALLET_COLLECTION).aggregate([{
                        $match: {
                            userId: objectId(userId)
                        }
                    }, {
                        $project: {
                            walletBalance: 1,
                            _id: 0
                        }
                    }]).toArray()


                    let walletBalance = parseInt(walletAmount[0].walletBalance)
                    // console.log('walletbalance');
                    // console.log(walletAmount);
                    // console.log(walletBalance);

                    let newwalletBalance = parseInt(walletBalance) + parseInt(prodTotal)
                    console.log("newwalletBalance", newwalletBalance);

                    await db.get().collection(collection.WALLET_COLLECTION)
                        .updateOne({ userId: objectId(userId) },
                            {
                                $set: {
                                    walletBalance: newwalletBalance
                                }
                            }).then(async () => {
                                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                                    {
                                        _id: objectId(proId)
                                    },
                                    {
                                        $inc: {
                                            Stock: +(quantity)
                                        }
                                    })

                                resolve()
                            })




                }).catch((err) => {
                    console.log(err);
                })
        })
    },

    returnOrder: (userId, orderId, proId, quantity, prodTotal) => {
        return new Promise(async (resolve, reject) => {
            // console.log("in returnorders in userhelpers.js");
            // console.log(userId, orderId, proId, quantity, prodTotal);

            let newDate = new Date().toDateString()
            let queryDate = new Date()

            await db.get().collection(collection.ORDER_COLLECTION).updateOne(
                { _id: objectId(orderId), 'products.item': objectId(proId) },
                { $set: { 'products.$.status': 'return', date: newDate, isoDate: queryDate } })
                .then(async (response) => {

                    let walletAmount = await db.get().collection(collection.WALLET_COLLECTION).aggregate([{
                        $match: {
                            userId: objectId(userId)
                        }
                    }, {
                        $project: {
                            walletBalance: 1,
                            _id: 0
                        }
                    }]).toArray()


                    let walletBalance = parseInt(walletAmount[0].walletBalance)
                    // console.log('walletbalance');
                    // console.log(walletAmount);
                    // console.log(walletBalance);

                    let newwalletBalance = parseInt(walletBalance) + parseInt(prodTotal)
                    console.log("newwalletBalance", newwalletBalance);

                    await db.get().collection(collection.WALLET_COLLECTION)
                        .updateOne({ userId: objectId(userId) },
                            {
                                $set: {
                                    walletBalance: newwalletBalance
                                }
                            }).then(async () => {
                                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                                    {
                                        _id: objectId(proId)
                                    },
                                    {
                                        $inc: {
                                            Stock: +(quantity)
                                        }
                                    })

                                resolve()
                            })

                }).catch((err) => {
                    console.log(err);
                })
        })
    },

    // accounts page
    getUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).aggregate([{
                $match: {
                    _id: objectId(userId)
                }
            }]).toArray()
            resolve(user)
        })
    },

    deletePendingOrders: (userId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.ORDER_COLLECTION).
                deleteMany({ "products.status": "pending" })
            resolve()
        })

    }


}