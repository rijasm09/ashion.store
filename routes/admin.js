var express = require('express');
const { render } = require('../app')
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const adminHelpers = require('../helpers/admin-helpers')
var categoryHelper = require('../helpers/category-helpers')
const userHelpers = require('../helpers/user-helpers')
var couponsHelpers = require('../helpers/coupons-helpers')

const cloudinary = require('../utils/cloudinary')

const multer = require('multer')
const path = require('path');

// multer

upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname)
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".webp") {
      cb(new Error("File type is not supported"), false)
      console.log('Its workinggggggggggggggggggggg');
      return
    }
    cb(null, true)
  }
})



/*==========CACHE========== */

router.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-cache, private,no-store,must-revalidate,max-stale=0,pre-check=0"
  );
  next();
});
/*========== AUTHENTICATION========== */

function checkAdminAuthenticated(req, res, next) {
  if (req.session.adminloggedIn) {
    return next();
  }

  res.redirect("/admin/adminlogin");
}
function checkAdminNotAuthenticated(req, res, next) {
  if (req.session.adminloggedIn) {
    return res.redirect("/admin");
  }

  next();
}


/*========== LOGIN========== */

router.get('/adminlogin', checkAdminNotAuthenticated, (req, res) => {
  res.render("admin/adminlogin", { login: true });
})

router.post('/adminlogin', (req, res) => {
  // console.log('3232',req.body)
  adminHelpers.doLogin(req.body).then((response) => {
    // console.log('001',response);
    if (response.status) {
      req.session.adminloggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin/dashboard')
    } else {
      res.redirect('/admin/adminlogin')
    }
  })
})

/*========== LOGOUT========== */

router.get("/adminlogout", checkAdminAuthenticated, (req, res) => {
  req.session.adminloggedIn = false;
  req.session.admin = null;
  res.redirect("/admin/adminlogin");
});


/*========== DASH BOARD========== */

router.get('/dashboard', checkAdminAuthenticated, function (req, res, next) {

  res.render('admin/dashboard', { admin: true })
});

router.get('/dashboard/:days', checkAdminAuthenticated, (req, res) => {
  adminHelpers.dashboardCount(req.params.days).then((data) => {
    res.json(data)
  })
})

/*========== BANNER MANAGEMENT========== */

router.get("/banner", checkAdminAuthenticated, (req, res) => {
  adminHelpers.dispalyBanner().then((bannerData) => {
    res.render('admin/banner', { admin: true, bannerData })
  })
})

router.post("/banner", upload.single("bannerImage"), async (req, res) => {
  bannerData = req.body

  const result = await cloudinary.uploader.upload(req.file.path)
  let image_url = result.secure_url
 
  adminHelpers.addBanner(bannerData, image_url).then((response) => {
    res.redirect("/admin/banner")
  })

})




/*========== PRODUCT PAGES========== */

router.get('/view-products', checkAdminAuthenticated, (req, res) => {
  productHelper.getAllProducts().then((products) => {
    console.log(products);
    res.render('admin/view-products', { admin: true, products })
  })
});

router.get('/add-product', checkAdminAuthenticated, (req, res) => {
  categoryHelper.getAllCategory().then((response) => {
    // console.log('htkelewwwwww');
    // console.log(response);
    res.render('admin/add-product', { response, admin: true })
  })

})

router.post('/add-product', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]), async (req, res) => {
  console.log(req.files);
  const cloudinaryImageUploadMethod = (file) => {
    console.log("qwertyui");
    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {
        console.log(err, " asdfgh");
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )
  console.log(urls);

  productHelper.addProduct(req.body, urls, (id) => {
    res.redirect('/admin/view-products')
  })
})

router.get('/delete-product/:id', checkAdminAuthenticated, (req, res) => {
  let proId = req.params.id
  console.log(proId);
  productHelper.deleteProduct(proId).then((response) => {
    res.redirect('/admin/view-products')
  })
})

router.get('/edit-product/:id', checkAdminAuthenticated, async (req, res) => {
  let product = await productHelper.getProductDetails(req.params.id)
  console.log('below products');
  console.log(product);
  categoryHelper.getAllCategory().then((response) => {
    res.render('admin/edit-product', { product, response, admin: true })
  })
})

// router.post('/edit-product/:id', (req, res) => {
//   console.log(req.params.id);
//   let id = req.params.id
//   productHelper.editProduct(req.params.id, req.body).then(() => {
//     res.redirect('/admin/view-products')
//     if (req.files.Image) {
//       let image = req.files.Image
//       image.mv('./public/product-images/' + id + '.jpg')
//     }
//   })
// })

router.post('/edit-product/:id', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]), async (req, res) => {
  console.log(req.files);
  const cloudinaryImageUploadMethod = (file) => {
    console.log("qwertyui");
    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {
        console.log(err, " asdfgh");
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )
  console.log(urls);

  productHelper.editProduct(req.params.id, req.body, urls).then((id) => {
    res.redirect('/admin/view-products')
  })
})


/*========== CATEGORY========== */
router.get('/view-category', checkAdminAuthenticated, (req, res) => {
  categoryHelper.getAllCategory().then((category) => {
    console.log(category);
    res.render('admin/view-category', { admin: true, category })
  })
})

router.get('/add-category', checkAdminAuthenticated, (req, res) => {
  res.render('admin/add-category', { admin: true })
})

// router.post('/add-category', (req, res) => {
//   categoryHelper.addCategory(req.body, (id) => {
//     let image = req.files.Image
//     console.log(id);
//     image.mv('./public/category-images/' + id + '.jpg', (err) => {
//       if (!err) {
//         res.render('admin/add-category', { admin: true })
//       } else {
//         console.log(err);
//       }
//     })
//   })
// })
router.post('/add-category', (req, res) => {
  console.log('hey category');
  console.log(req.body);
  categoryHelper.addCategory(req.body, (id) => {
    res.render('admin/add-category', { admin: true })
  })
})


router.get('/delete-category/:id', checkAdminAuthenticated, (req, res) => {
  let catId = req.params.id
  console.log(catId);
  categoryHelper.deleteCategory(catId).then((response) => {
    res.redirect('/admin/view-category')
  })
})

router.get('/edit-category/:id', checkAdminAuthenticated, async (req, res) => {
  let category = await categoryHelper.getCategoryDetails(req.params.id)
  res.render('admin/edit-category', { category, admin: true })
})

router.post('/edit-category/:id', (req, res) => {
  console.log(req.params.id);
  categoryHelper.editCategory(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-category')
  })
})
/*==========VIEW USER========== */

router.get("/view-user", checkAdminAuthenticated, (req, res) => {
  let admin = req.session.admin;
  adminHelpers.getAllUsers().then((userdata) => {
    res.render("admin/view-user", { userdata, admin });
  });
});

router.get('/view-user/:id', checkAdminAuthenticated, (req, res) => {
  adminHelpers.changeUserStatus(req.params.id).then((response) => {
    res.redirect('/admin/view-user')
  })
})

/*==========ORDERS========== */

router.get('/orders', checkAdminAuthenticated, async (req, res) => {
  let admin = req.session.admin;
  let orders = await adminHelpers.getOrderDetails()
  // console.log('zzzzzzzzzzzzzzzzz');
  // console.log(orders);
  res.render('admin/orders', { admin, orders })
})

router.put('/orderStatus', (req, res) => {
  adminHelpers.changeOrderStatus(req.body.orderId, req.body.proId, req.body.status).then(() => {
    res.json({ status: true })
  })
})

/*==========SALES REPORT========== */


router.get("/sales-report", checkAdminAuthenticated, async (req, res) => {
  let admin = req.session.admin;
  let deliveredOrders

  if (req.query?.month) {
    let month = req.query?.month.split("-");
    let [yy, mm] = month;
    deliveredOrders = await adminHelpers.salesReport(yy, mm);

  } else if (req.query?.daterange) {
    console.log(req.query);
    deliveredOrders = await adminHelpers.salesReport(req.query);

  } else {
    deliveredOrders = await adminHelpers.salesReport();
  }
  console.log('delivered orders');
  console.log({ deliveredOrders })

  res.render("admin/sales-report", { admin, deliveredOrders });
});

/*==========OFFER PAGE========== */

router.get('/offers', checkAdminAuthenticated, async (req, res) => {
  let admin = req.session.admin;
  let category = await categoryHelper.getAllCategory()
  let products = await productHelper.getAllProducts()
  res.render("admin/offers", { admin, category, products });

})

// category offer
router.post('/submit-category-offer', (req, res) => {

  adminHelpers.addCategoryOffer(req.body).then(() => {
    res.json({ codSuccess: true })
  })
})

router.post('/delete-category-offer/:id', (req, res) => {

  console.log('required id');
  console.log(req.params.id);

  adminHelpers.deleteCategoryOffer(req.params.id).then((response) => {
    res.json({ status: true })
  })
})

// product offer
router.post('/submit-product-offer', async (req, res) => {

  adminHelpers.addProductOffer(req.body).then(() => {
    res.json({ codSuccess: true })
  })
})

router.post('/delete-product-offer/:id', (req, res) => {

  console.log('required id');
  console.log(req.params.id);

  adminHelpers.deleteProductOffer(req.params.id).then((response) => {
    res.json({ status: true })
  })
})

/*==========COUPONS PAGE========== */

router.get('/coupons', checkAdminAuthenticated, async (req, res) => {
  let admin = req.session.admin;
  let coupons = await couponsHelpers.getAllCoupons()

  // let userDetails = await userHelpers.userDetails(req.session.user._id)

  console.log('coupons');
  console.log(coupons);

  res.render("admin/coupons", { admin, coupons });

})

router.post('/submit-coupon', (req, res) => {
  // console.log('coupon data');
  // console.log(req.body);

  couponsHelpers.addCoupons(req.body).then(() => {
    console.log('reached here');
    res.json({ status: true })
  })
})

router.post('/delete-coupon/:id', checkAdminAuthenticated, (req, res) => {
  let couponId = req.params.id
  console.log('coupon id in admin.js ');
  console.log(couponId);
  couponsHelpers.deleteCoupon(couponId).then((response) => {
    res.redirect('/admin/coupons')
  })
})



module.exports = router;
