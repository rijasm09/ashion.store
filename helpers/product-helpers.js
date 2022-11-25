var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
var categoryHelper = require('../helpers/category-helpers')
module.exports = {

    addProduct: (product, urls, callback) => {
        console.log('url in helper', urls);
        product.ActualPrice = parseInt(product.ActualPrice)
        product.OfferPrice = product.ActualPrice
        product.Stock = parseInt(product.Stock)
        product.proPercentage = parseInt(0)
        product.catPercentage = parseInt(0)
        product.activePercentage = parseInt(0)
        product.status = null
        product.cancel = false
        product.return = false
        product.image = urls


        db.get().collection('product').insertOne(product).then((data) => {
            // console.log('below daaaaaaaataaaaaaaa');
            // console.log(data);
            callback(data.insertedId.toString())
        })



    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {

            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            console.log(prodId);
            console.log(objectId(prodId));
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {

                resolve(response)
            })
        })
    },
    getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },
    editProduct: (prodId, updatedData, urls) => {

        console.log("url in product helper");
        console.log(urls);
        return new Promise((resolve, reject) => {
            updatedData.ActualPrice = Number(updatedData.ActualPrice)
            updatedData.Stock = Number(updatedData.Stock)

            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
                $set: {
                    Name: updatedData.Name,
                    Brand: updatedData.Brand,
                    Stock: updatedData.Stock,
                    ActualPrice: updatedData.ActualPrice,
                    category: updatedData.category,
                    Description: updatedData.Description,
                    image: urls
                }
            }).then((response) => {
                resolve(response)
            })

        })
    },

    getSearchProduct: (key) => {
        console.log("kkkkkkkkkkkkkkkkkkeeeeeeeeeeeyyyyyyy");
        console.log(key);
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.PRODUCT_COLLECTION).find({

                "$or": [
                    { Name: { $regex: key, '$options': 'i' } },
                    { Brand: { $regex: key, '$options': 'i' } },
                    { category: { $regex: key, '$options': 'i' } }
                ]
            }).toArray()
            console.log("'ddddddddddddddddaaaaaaaaaaaaaaaaaatttttttttttttaaaaaaa'");
            console.log(data);
            if (data.length > 0) {
                resolve(data)

            } else {
                reject()
            }
        })
    }
}