var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
module.exports = {

    addCategory: (category, callback) => {
        category.catPercentage=parseInt(0)
        console.log('hey category');
        console.log(category);

        db.get().collection('category').insertOne(category).then((data) => {
            console.log('this is the cat data');
            console.log(data);
            callback(data.insertedId.toString())
        })
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()

            resolve(category)
        })

    },
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            console.log(catId);
            console.log(objectId(catId));
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {

                resolve(response)
            })
        })
    },
    getCategoryDetails: (prodId) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId)}).then((product) => {
                resolve(product)
            })
        })
    },
    editCategory: (prodId, updatedData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, { "$set": updatedData })
            resolve()
        })
    }
}