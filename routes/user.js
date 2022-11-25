// TO SET THE ROUTES FOR USERS

var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
var categoryHelper = require('../helpers/category-helpers')
var couponsHelpers = require('../helpers/coupons-helpers')
// const otpVerify = require('../otp') 
const client = require('twilio')(process.env.accountSID, process.env.authToken)
var paypal = require('paypal-rest-sdk');



// AUTHENTICATION MIDDLEWARES

async function checkAuthenticated(req, res, next) {
  if (req.session.loggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    getWishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
    return next();
  }

  res.redirect("/login");
}
function checkNotAuthenticated(req, res, next) {
  if (req.session.loggedIn) {
    return res.redirect("/");
  }

  next();
}

// CACHE

router.use((req, res, next) => {
  res.set(
    'Cache-Control',
    'no-cache,private,no-store,must-revalidate,max-stale=0,pre-check=0'
  );
  next();
});

// redirecting to the current page
redirect = function (req, res, next) {
  if (!req.session.loggedIn) {
    req.session.redirectTo = req.originalUrl;
    console.log("path in redirect function");
    console.log(req.session.redirectTo);
    // res.redirect('/login');
    next();
  } else {
    next();
  }
};



/* ============= SIGNUP PAGE============== */

router.get('/signup', checkNotAuthenticated, (req, res) => {
  var emailChecker = req.query.valid;
  // console.log('email down');
  // console.log(emailChecker);
  res.render('user/signup', { emailChecker })
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {

    res.redirect("/login")
  })
    .catch(() => {
      var string = encodeURIComponent('Email is already taken');
      res.redirect('/signup?valid=' + string);
    })
})



/* ============= USER LOGIN PAGE============== */

router.get('/login',checkNotAuthenticated, (req, res) => {
  res.render("user/login", { login: true });
})


// router.post('/login', (req, res) => {
//   userHelpers.doLogin(req.body).then((response) => {

//     let phoneNumber = response.user.phoneNumber;
//     console.log(phoneNumber);
//     client
//       .verify
//       .services(otpVerify.serviceID)
//       .verifications
//       .create({
//         to: `+91${phoneNumber}`,
//         channel: 'sms'
//       }).then((data) => {


//         if (response.status) {
//           // req.session.loggedIn = true
//           req.session.user = response.user

//           res.render('user/otp-verification', { phoneNumber })
//         }

//       }).catch((err) => {
//         console.log(err)
//       })
//   }).catch((response) => {
//     var string = encodeURIComponent(response);
//     res.redirect('/login?valid=' + string);
//   })
// })

// router.post('/otp-verification', (req, res) => {
//   client
//     .verify
//     .services(otpVerify.serviceID)
//     .verificationChecks
//     .create({
//       to: `+91${req.body.phoneNumber}`,
//       code: req.body.code
//     }).then((data) => {
//       console.log(data);
//       if (data.valid) {
//         console.log('data inside if');
//         console.log(data.status);
//         req.session.loggedIn = true
//         // req.session.user = response.user

//         res.redirect('/')
//       } else {
//         res.redirect('/login')
//       }
//     }).catch((err) => {
//       console.log(err);
//       req.session.destroy();
//       res.redirect('/login')
//     })
// })

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      // console.log('first');
      req.session.loggedIn = true
      req.session.user = response.user
      console.log('in login');
      console.log(req.session.redirectTo);

      res.redirect(req.session.redirectTo)
    } else {
      // console.log('second');
      res.redirect('/login')
    }
  })
})

/* =============USER LOGOUT PAGE============== */

router.get('/logout', (req, res) => {
  req.session.loggedIn = false;
  req.session.user = null;
  res.redirect("/login");
})


/* ============= USER LANDING PAGE============== */

router.get('/', redirect, async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    getWishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  } else {
    cartCount = 0
    getWishlistCount = 0
  }

  let category = await categoryHelper.getAllCategory()
  let banner = await userHelpers.getAllBanners()

  console.log("banner");
  console.log(banner);


  productHelper.getAllProducts().then((products) => {
    res.render('user/landingpage', { products, user, cartCount, category, getWishlistCount, banner })
  })
})

/* ============= USER ACCOUNT PAGE============== */

router.get('/search', redirect, async (req, res, next) => {
  console.log("query in the search in the route");
  console.log(req.query.search); //rias
  // console.log(req.body);  //{}
  // console.log(req.query); // { search: 'rias' }

  console.log('pathi in search');
  console.log(req.path);
  console.log(req.originalUrl);
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    getWishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  } else {
    cartCount = 0
    getWishlistCount = 0
  }


  productHelper.getSearchProduct(req.query.search).then((response) => {
    // console.log("'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr'");
    // console.log(response);
    categoryHelper.getAllCategory().then((category) => {
      // console.log("category");
      // console.log(category);

      res.render('user/searchPage', { user, cartCount, getWishlistCount, response, category })

    })
  }).catch(() => {
    categoryHelper.getAllCategory().then((category) => {
      res.render('user/searchPage', { user, cartCount, getWishlistCount, category })
    })
  })

})

/* ============= USER ACCOUNT PAGE============== */

router.get('/account', redirect, checkAuthenticated, async (req, res) => {

  let user = req.session.user
  let userAddresses = await userHelpers.getUserAddress(req.session.user._id)
  let category = await categoryHelper.getAllCategory()
  let walletBalance = await userHelpers.walletBalance(req.session.user._id)

  // console.log('rrrrrrrrrrrrrrrrr');
  // console.log(walletBalance);
  userHelpers.getUser(req.session.user._id).then((userdata) => {
    // console.log('userdata requires');
    // console.log(userdata);
    res.render('user/account', { user, cartCount, userdata, userAddresses, category, getWishlistCount, walletBalance })
  });

})

router.get('/coupons', redirect, checkAuthenticated, async (req, res) => {

  let user = req.session.user
  let coupons = await couponsHelpers.getAllCoupons()

    res.render('user/coupons', { user, cartCount,getWishlistCount,coupons})

})


/* ============= VIEW-PRODCUTS PAGE============== */

router.get('/view-products', redirect, async (req, res, next) => {
  let user = req.session.user
  // console.log(user);
  // let cartCount = null
  console.log("path in view products");
  console.log(req.path);
  console.log(req.originalUrl);
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    getWishlistCount = await userHelpers.getWishlistCount(req.session.user._id)

  } else {
    cartCount = 0
    getWishlistCount = 0

  }

  let category = await categoryHelper.getAllCategory()

  productHelper.getAllProducts().then((products) => {
    // console.log('products in view products');
    // console.log(products);

    res.render('user/view-products', { products, user, cartCount, category, getWishlistCount })
  })
});

router.get('/productDetails/:id', redirect, async (req, res) => {

  console.log('pathi in productDetails');
  console.log(req.path);
  console.log(req.originalUrl);

  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  } else {
    cartCount = 0
  }

  if (user) {
    getWishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  } else {
    getWishlistCount = 0
  }
  let category = await categoryHelper.getAllCategory()
  let product = await productHelper.getProductDetails(req.params.id)
  // console.log('products in product details');
  // console.log(product);

  categoryHelper.getAllCategory().then((response) => {
    res.render('user/productDetails', { product, response, user, cartCount, getWishlistCount, category })
  })
})


/* ============= USER WISHLIST PAGE============== */

router.get('/wishlist', redirect, checkAuthenticated, async (req, res) => {
  console.log("path in wishlist");
  console.log(req.path);

  let userId = req.session.user._id
  let user = req.session.user
  let category = await categoryHelper.getAllCategory()
  let getWishlistProducts = await userHelpers.getWishlistProducts(req.session.user._id)
  let products = await productHelper.getAllProducts()
  // console.log('category');
  // console.log(category);
  // console.log('getWishlistProducts');
  // console.log(getWishlistProducts);
  // console.log('products');
  // console.log(products);

  res.render('user/wishlist', { user, userId, cartCount, getWishlistCount, category, getWishlistProducts, products })
})

router.get('/add-to-wishlist/:id', redirect, checkAuthenticated, async (req, res) => {

  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })

  })
})

router.post('/wishlist-product-remove', (req, res, next) => {
  // console.log('heeeeeeeeelllllloooooooooo');
  // console.log(req.body);
  userHelpers.wishlistRemoveProduct(req.body).then((response) => {
    res.json(response)
  })
})


/* ============= USER CART PAGE============== */
router.get('/cart', redirect, checkAuthenticated, async (req, res) => {

  let user = req.session.user
  // let cartCount = null
  // if (user) {
  //   cartCount = await userHelpers.getCartCount(req.session.user._id)
  // }
  // let totalValue = 0
  let category = await categoryHelper.getAllCategory()
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let getWishlistCount = await userHelpers.getWishlistCount(req.session.user._id)

  let getCartProducts = await userHelpers.getCartProducts(req.session.user._id)
  // console.log('getCartProducts');
  // console.log(getCartProducts);
  let products = await productHelper.getAllProducts()
  // if (getCartProducts.length > 0) {   //to pass totalvalue only if products are present in the cart
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  // }


  res.render('user/cart', { products, userId: req.session.user._id, user, cartCount, getWishlistCount, totalValue, getCartProducts, category })
})


router.get('/add-to-cart/:id', redirect, checkAuthenticated, async (req, res) => {

  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })

  })
})

router.post('/change-product-quantity', (req, res, next) => {
  // console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user) //we can add total to response here because response is an object
    response.prodtotal = await userHelpers.getProdTotalAmount(req.body.user, req.body.product) //we can add total to response here because response is an object

    res.json(response)
  })
})

router.post('/cart-product-remove', (req, res, next) => {
  // console.log(req.body);
  userHelpers.cartRemoveProduct(req.body).then((response) => {
    res.json(response)
  })
})

/* ============= PLACE ORDER PAGE============== */

router.get('/place-order', redirect, checkAuthenticated, async (req, res, next) => {
  let user = req.session.user
  let getCartProducts = await userHelpers.getCartProducts(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let userAddresses = await userHelpers.getUserAddress(req.session.user._id)
  let category = await categoryHelper.getAllCategory()
  let coupons = await couponsHelpers.eligibleCoupons(req.session.user._id)

  // console.log('below coupons');
  // console.log(coupons);

  res.render('user/place-order', { cartCount, getWishlistCount, total, user, userAddresses, getCartProducts, category, coupons })
})


router.post('/submit-address', (req, res) => {
  userHelpers.addAddress(req.body, req.session.user._id).then(() => {
    res.json({ codSuccess: true })
  })
})

router.post('/coupon-amount', async (req, res) => {
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  couponsHelpers.couponChecker(req.body, req.session.user._id, totalValue).then((response) => {
    // console.log('response');
    // console.log(response);
    // if (response.status) {
    res.json({ status: true, newTotalValue: response.newTotalValue, discountedValue: response.discountedValue, couponCode: response.couponCode })
    // } else {
    // res.json({ status: false })
    // }

  }).catch((response) => {
    // console.log('messsage in catch');
    // console.log(response);
    if (response.status) {
      console.log("Coupon is already applied");
      let message = "Coupon is already applied"
      res.json({ used: message, total: totalValue })

    } else {
      console.log("coupon expired or check the price limits");
      let message = "coupon expired or check the price limits"
      res.json({ msg: message, total: totalValue })
    }

  })
})

router.post('/address-form', async (req, res) => {

  let userId = req.session.user._id
  console.log(userId);


  let addId = req.body.flexRadioDefault
  // console.log(addId);
  // console.log("in the address form");
  // console.log(req.body);


  userHelpers.userAddress(addId, userId).then((response) => {
    // console.log(response);
    res.json({ status: true, response })

  })

})





router.post('/place-order-submit', async (req, res) => {
  let userId = req.session.user._id
  let products = await userHelpers.getCartProductList(req.session.user._id)
  // let totalPrice = await userHelpers.getTotalAmount(req.body.userId) 
  let totalPrice = req.body.total

  req.session.couponstore = req.body.coupon
  let coupon = req.session.couponstore

  // console.log("req.bodynnnnnnnnnnnnnnnnyyyyyyynnnnnnnnnnnnnnnnnn");
  // console.log(req.body);


  //we are passing userId when we submit the form in place-order.hbs
  //we call razorpay from client side that is in script file but we should create an order for razorpay that orders id is
  //passed through ajax so that the key will not be in clients hands to make it secure, key will be in server itself, orderid s something will be passed

  userHelpers.placeOrder(products, totalPrice, req.body, userId).then((orderId) => {

    if (req.body.paymentmethod === 'COD') {
      res.json({ codSuccess: true })

    } else if (req.body.paymentmethod === 'RAZORPAY') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json({ razorPaySuccess: true, response })
      })

    } else if (req.body.paymentmethod === 'WALLET') {
      userHelpers.walletPay(orderId, totalPrice, userId, coupon, products).then((response) => {
        // console.log('respone');
        // console.log(response);
        if (response.walletPay) {
          res.json({ walletSuccess: true, response })
        }
      }).catch((response) => {
        res.json({ walletSuccess: true, response })
      })


    } else if (req.body.paymentmethod === 'PAYPAL') {
      req.session.orderId = orderId

      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/success",
          "cancel_url": "http://cancel.url"
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
          "description": "Payment for the product."
        }]
      }



      paypal.payment.create(create_payment_json, function (error, payment) {
        console.log("third");
        if (error) {
          throw error;
        } else {
          console.log("fourth");
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              console.log(create_payment_json);
              res.json({ url: payment.links[i].href, paypal: true })
            }
          }
        }
      });

    }

  })


})

//for razor pay verification
router.post('/verify-payment', async (req, res) => {
  let userId = req.session.user._id
  // console.log('gottttttttt');
  // console.log(req.session.couponstore);
  let coupon = req.session.couponstore
  let products = await userHelpers.getCartProductList(userId)

  // console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]'], userId, coupon, products).then(() => {
      console.log('payment success');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})

//for paypal succcess
router.get('/success', async (req, res) => {
  let userId = req.session.user._id
  let products = await userHelpers.getCartProductList(userId)
  let coupon = req.session.couponstore

  userHelpers.changePaymentStatus(req.session.orderId, userId, coupon, products).then(() => {
    req.session.orderId = null
    res.redirect('/orders')
  })
})
/* ============= ORDER HISTORY PAGE ============== */

router.get('/orders', redirect, checkAuthenticated, async (req, res) => {
  let user = req.session.user
  let userId = req.session.user._id
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let products = await productHelper.getAllProducts()
  let category = await categoryHelper.getAllCategory()
  if (user) {
    getWishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  } else {
    getWishlistCount = 0
  }
  // console.log('ppppppppppppppppppppppppppppppppppp');
  // console.log(orders);
  userHelpers.deletePendingOrders(userId).then(() => {

    res.render('user/orders', { user, orders, cartCount, products, category, getWishlistCount })
  })

})

//to view products in orders//incomplete
router.get('/view-order-products/:id', checkAuthenticated, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: req.session.user, products })
})

//to cancel order in order list
router.post('/cancel-order', (req, res) => {
  // console.log('orderid and product id');
  // console.log(req.body);
  let userId = req.session.user._id
  orderId = req.body.orderId
  proId = req.body.proId
  quantity = req.body.quantity
  prodTotal = req.body.prodTotal

  userHelpers.cancelOrder(userId, orderId, proId, quantity, prodTotal).then(() => {
    let message = "Amount refunded to Wallet"
    res.json({ msg: message, status: true })
  })
})

//to return the order
router.put('/return-order', (req, res) => {

  // console.log("req.body in return order in user.js");
  // console.log(req.body);
  let userId = req.session.user._id
  orderId = req.body.orderId
  proId = req.body.proId
  quantity = req.body.quantity
  prodTotal = req.body.prodTotal

  // console.log("in returnorders in user.js");
  // console.log(userId, orderId, proId, quantity,prodTotal);

  userHelpers.returnOrder(userId, orderId, proId, quantity, prodTotal).then(() => {
    let message = "Amount refunded to Wallet"
    res.json({ msg: message, status: true })
  })
})

// router.get('/*', (req, res)=> {
//   res.render('user/view-order-products')

// });

module.exports = router;
