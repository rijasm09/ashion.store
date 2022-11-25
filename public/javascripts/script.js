/* ============= USER SIDE ============== */


//   signup validation

function signupValidate() {
    const username = document.getElementById('Name');
    const email = document.getElementById('Email');
    const pass = document.getElementById('Password');
    const phone = document.getElementById('phoneNumber')
    const error = document.getElementsByClassName('invalid-feedback');
    console.log('calling');
    if (username.value.trim() === "" || username.value.trim().match(/^[0-9]+$/)) {
        error[0].style.display = "block";
        error[0].innerHTML = "please enter valid username"
        username.style.border = "2px solid red";
        return false;
    } else {
        error[0].innerHTML = ""
        username.style.border = "2px solid green";
    }

    if (!(email.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))) {
        error[1].style.display = "block";
        error[1].innerHTML = "Enter correct email";
        email.style.border = "2px solid red";
        return false;
    } else {
        error[1].innerHTML = ""
        email.style.border = "2px solid green";
    }



    if (pass.value.trim() === "" || pass.value.length < 3) {
        error[3].style.display = "block";
        error[3].innerHTML = "password must be minimum 3 character";
        pass.style.border = "2px solid red";
        return false;
    } else {
        error[2].innerHTML = ""
        pass.style.border = "2px solid green";
    }

    if (phone.value.trim() === "" || phone.value.length < 10) {
        error[2].style.display = "block";
        error[2].innerHTML = "Enter valid phone number";
        phone.style.border = "2px solid red";
        return false;
    } else {
        error[2].innerHTML = ""
        phone.style.border = "2px solid green";
    }

    return true;

}

//  signin validation

function signinValidate() {
    const email = document.getElementById('Email');
    const pass = document.getElementById('Password');
    const error = document.getElementsByClassName('invalid-feedback');

    if (!(email.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))) {
        error[0].style.display = "block";
        error[0].innerHTML = "Enter email";
        email.style.border = "2px solid red";
        return false;
    } else {
        error[0].innerHTML = ""
        email.style.border = "2px solid none";
    }

    if (pass.value.trim() === "") {
        error[1].style.display = "block";
        error[1].innerHTML = "Enter password";
        pass.style.border = "2px solid red";
        return false;
    } else {
        error[1].innerHTML = ""
        pass.style.border = "2px solid none";
    }

    return true;
}

// OTP validation
function otpValidate() {
    const code = document.getElementById('code');
    const error = document.getElementsByClassName('invalid-feedback');

    if (code.value.trim() === "" || code.value.length < 6) {
        error.style.display = "block";
        error.innerHTML = "Enter code";
        pass.style.border = "2px solid red";
        return false;
    } else {
        error.innerHTML = ""
        pass.style.border = "2px solid none";
    }

    return true;
}

// zoom in product details

$(document).ready(function () {
    $(".blockis_pic").imagezoomsl({
        zoomrange: [6, 6]
    });
});


// for reaction to the function written on add to cart button on productDetails page
function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {  //success will work only after res.json() in user.js
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
            }
            swal({
                title: "Product added to cart",
                text: false,
                timer: 900,
                showConfirmButton: false,
            });

        }
    })
}

// Add to Wishlist

function addToWishlist(proId) {
    $.ajax({
        url: '/add-to-wishlist/' + proId,
        method: 'get',
        success: (response) => {  //success will work only after res.json() in user.js
            if (response.status) {
                let count = $('#wishlist-count').html()
                count = parseInt(count) + 1
                $('#wishlist-count').html(count)
                $('#wishlist-count_0').html(count)
            }
            swal({
                title: "Product added to wishlist",
                text: false,
                timer: 900,
                showConfirmButton: false,
            });

        }
    })
}

// remove product from wishlist
function wishlistRemovePro(wishlistId, proId) {
    $.ajax({
        url: '/wishlist-product-remove',
        data: {
            wishlist: wishlistId,
            product: proId
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {
                alert('Product Removed from wishlist')
                location.reload() //to refresh the page after we remove the product
            } else {
                // document.getElementById(proId).value = quantity + count
            }
        }
    })

}


function changeQuantity(cartId, proId, userId, stock, count) {
    let quantity = parseInt(document.getElementById(proId).value) //quantity = currently displayed quantity, proId = this.product._id
    count = parseInt(count)  //count = +1 / -1
    stock = parseInt(stock)
    quantityCheck = quantity + count
    // console.log('this is in the changeQuantity');
    // console.log(quantity);
    // console.log(count);
    // console.log(stock);
    // console.log(quantityCheck);

    if (quantityCheck <= stock && quantityCheck != 0) {

        document.getElementById("minus" + proId).classList.remove("invisible")
        document.getElementById("plus" + proId).classList.remove("invisible")

        $.ajax({
            url: '/change-product-quantity',
            data: {
                user: userId,
                cart: cartId,
                product: proId,
                count: count,
                quantity: quantity
            },
            method: 'post',
            success: (response) => {
                if (response.removeProduct) {
                    alert('Product Removed from cart')
                    location.reload() //to refresh the page after we remove the product
                } else {
                    // console.log(response);
                    // console.log('below proid');
                    // console.log(proId, typeof proId);
                    document.getElementById(proId).value = quantity + count
                    document.getElementById('subtotal').innerHTML = response.total //total is static not a variable    
                    document.getElementById('total').innerHTML = response.total //total is static not a variable    
                    document.getElementById(proId + "_0").innerHTML = response.prodtotal
                }
            }
        })
    }

    if (quantityCheck == 1) {
        document.getElementById("minus" + proId).classList.add("invisible")
    }
    if (quantityCheck == stock) {
        document.getElementById("plus" + proId).classList.add("invisible")
    }


}

function cartRemovePro(cartId, proId) {
    $.ajax({
        url: '/cart-product-remove',
        data: {
            cart: cartId,
            product: proId
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {

                swal({
                    title: "Product removed from cart",
                    text: false,
                    timer: 900,
                    showConfirmButton: false,
                });

                location.reload() //to refresh the page after we remove the product
            } else {
                document.getElementById(proId).value = quantity + count
            }

        }
    })

}


// address submition - checkout page

$('#checkout-form').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/submit-address',
        method: 'post',
        data: $('#checkout-form').serialize(), //serialize is used so that we get all the details in the form
        success: (response) => {
            // console.log('response');
            // console.log(response);
            location.href = '/place-order'
        }
    })
})

// user side : coupon selection : place order page

$('#coupon-form').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/coupon-amount',
        method: 'post',
        data: $('#coupon-form').serialize(), //serialize is used so that we get all the details in the form
        success: (response) => {
            console.log('response in script');
            console.log(response);

            if (response.status) {
                console.log('inside ajax');

                // document.getElementById('couponamount').innerHTML = response.discountedValue     
                // document.getElementById('finalTotal').innerHTML = response.newTotalValue     
                // document.getElementById('couponName').innerHTML = response.couponCode   
                $('#coupon-condition').text("")
                $('#couponName').text(response.couponCode)
                $('#finalTotal').text(response.newTotalValue)
                $('#couponamount').text(response.discountedValue)
                $('#isCoupon').val(response.couponCode)
                $('#totalCheckOutAmount').val(response.newTotalValue)
                // $('#addCouponModal').hide()
                // $('.modal').remove()
                // $('.modal-backdrop').remove()
                // $('body').removeClass('modal-open')
                // $('.modal.fade.in').removeClass('modal fade in')

            } else if (response.used) {
                $('#coupon-condition').text(response.used)
                $('#coupon-condition').css('color', 'red')

            }
            else {
                $('#coupon-condition').text(response.msg)
                $('#coupon-condition').css('color', 'red')
            }


        }
    })
})

//palce order page
//address display in billing details
$('#address-form').change((e) => {
    e.preventDefault()
    $.ajax({
        url: '/address-form',
        method: 'post',
        data: $('#address-form').serialize(),

        success: (response) => {
            console.log('response in script');
            console.log(response);

            if (response.status) {
                console.log('inside ajax');
                console.log(response);
                console.log(response.response[0].name);

                $('#validationCustom02').val(response.response[0].name)
                $('#validationCustom03').val(response.response[0].address)
                $('#phoneNumber').val(response.response[0].phoneNumber)
                $('#validationCustom04').val(response.response[0].country)
                $('#validationCustom06').val(response.response[0].state)
                $('#validationCustom05').val(response.response[0].city)
                $('#validationCustom07').val(response.response[0].pincode)
                $('#addressId').val(response.response[0].addId)

            }
        }
    })
})



// place order form details

$('#order-details-form').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order-submit',
        method: 'post',
        data: $('#order-details-form').serialize(), //serialize is used so that we get all the details in the form
        success: (response) => {
            console.log('responseuuuuuuuuuuuuuuuuuuuuu');
            console.log(response);

            if (response.codSuccess) {
                swal({
                    title: "Order Placed Successfully",
                    text: "go to orders for more details",
                    icon: "success",
                    confirmButtonColor: "#318a2c",
                    confirmButtonText: "Goto orders",
                    closeOnConfirm: false
                },
                    function (isConfirm) {
                        if (isConfirm) {
                            location.href = '/orders'
                        }
                    })

            } else if (response.razorPaySuccess) {
                razorpayPayment(response.response) //response= new order, this function is written below can write hereitself also

            } else if (response.walletSuccess) {
                console.log('below final resp');
                console.log(response);

                if (response.response.walletPay) {
                    swal({
                        title: "Order Placed Successfully",
                        text: "go to orders for more details",
                        icon: "success",
                        confirmButtonColor: "#318a2c",
                        confirmButtonText: "Goto orders",
                        closeOnConfirm: false
                    },
                        function (isConfirm) {
                            if (isConfirm) {
                                location.href = '/orders'
                            }
                        })
                } else {
                    swal({
                        title: "Not Enough Amount in Wallet",
                        text: false,
                        timer: 900,
                        showConfirmButton: false,
                    })
                    location.href = '/place-order'
                }

            } else if (response.paypal) {
                location.href = response.url
            }

        }
    })
})

function razorpayPayment(order) {
    console.log(order, 'order');
    var options = {
        "key": "rzp_test_kLS1DJFJUGyFPz", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Favly",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            // console.log("order:",order);
            // console.log("response:",response);
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature)
            //we dont need the above details because we are already passing it through the reposnse in verifyPayment(response, order) 

            verifyPayment(response, order)  //in this verifyPayment we are calling the ajax and we sendback all these details so we send reponse(response of payment done) and order(it has our orderid which is in databse we use it to match and place itin the database)
            // response = payment details {id: 'order_KXg42aAHm54Ohn', entity: 'order', amount: 887, amount_paid: 0, amount_due: 887, …}
        },
        "prefill": {
            "name": "Rijas Muhammed",
            "email": "rijasm07@gmail.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    console.log("hai");
    rzp1.open();
}

function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                swal({
                    title: "Order Placed Successfully",
                    // text: "go to orders for more details",
                    icon: "success",
                    confirmButtonColor: "#318a2c",
                    confirmButtonText: "Goto orders",
                    closeOnConfirm: false
                },
                    function (isConfirm) {
                        if (isConfirm) {
                            location.href = '/orders'
                        }
                    })
            } else {
                alert('payment failed')
            }

        }
    })
}



// user side : orders page - cancel order - button
function cancelOrder(orderId, proId, quantity, prodTotal, index) {
    swal({
        title: "Are you sure?",
        text: "Do you want to cancel the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, cancel the order !",
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/cancel-order',
                    data: {
                        orderId,
                        proId,
                        quantity,
                        prodTotal
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.status) {
                            document.getElementById(orderId + proId).innerHTML = "canceled"
                            document.getElementById(proId + orderId).style.display = 'none'
                            $("#" + index).text(response.msg)
                        }
                    }
                })
            }
        }
    );
}

// user side : orders page - return order - button
function returnOrder(orderId, proId, quantity, prodTotal, index) {
    swal({
        title: "Are you sure?",
        text: "Why do you want to return the order",
        type: "input",
        showCancelButton: true,
        animation: "slide-from-top",
        inputPlaceholder: "Reason for returning",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, I want to return!",
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                console.log("reachead here");
                $.ajax({
                    url: '/return-order',
                    data: {
                        orderId,
                        proId,
                        quantity,
                        prodTotal
                    },
                    method: 'put',
                    success: (response) => {
                        console.log("resonse in return");
                        console.log(response);
                        if (response.status) {
                            document.getElementById(orderId + proId).innerHTML = "return"
                            document.getElementById(proId + orderId).style.display = 'none'
                            $("#" + index).text(response.msg)
                            // document.getElementById(index+proId).innerHTML = "Payment Status : Amount refunded to Wallet"

                        }
                    }
                })
            }
        }
    );
}


/* ======================== ADMIN SIDE ================================================ */
/* ======================== ADMIN SIDE ================================================ */
/* ======================== ADMIN SIDE ================================================ */
/* ======================== ADMIN SIDE ================================================ */


// admin side - orders page - status button
function statusChange(orderId, proId) {
    var status = document.getElementById(proId + orderId).value;
    swal({
        title: "Are you sure?",
        text: "Do you want to " + status + " the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, " + status + " it!",
        cancelButtonText: "No!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/orderStatus',
                    data: {
                        orderId,
                        proId,
                        status
                    },
                    method: 'put',
                    success: (response) => {
                        if (response.status) {
                            document.getElementById(orderId + proId).innerHTML = status //here id is orderId+ProId, id must be unique
                        }
                    }
                })
            } else {
                location.reload()
            }
        }
    );
}

function salesReport(days, buttonId) {
    console.log('hey');
    $.ajax({
        url: '/admin/sales-report/' + days,
        data: {
            days,
            buttonId
        },
        method: 'get',
        success: (response) => {

        }
    })
}

//month form details

// $('#month-form').submit((e) => {
//     e.preventDefault()
//     $.ajax({
//         url: '/admin/sales-report-data',
//         method: 'get',
//         data: $('#month-form').serialize(), //serialize is used so that we get all the details in the form
//         success: (response) => {
//             console.log('response');
//             console.log(response);

//             $.each(response, function (key, value) {
//                 $('#month-form').append('<tr> <td>' + value._id + '</td>  <td>' + value.totalAmount + '</td> <td>' + value.paymentMethod + '</td> <td>' + value.date + '</td> <td>' + value.status +  '</td></tr>');
//             })


//         }
//     })
// })

// date range picker
$(function () {
    $('input[name="daterange"]').daterangepicker({
        opens: 'left'
    }, function (start, end, label) {
        console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });
});

//   category offer modal
$('#add-category-offer-form').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/admin/submit-category-offer',
        method: 'post',
        data: $('#add-category-offer-form').serialize(), //serialize is used so that we get all the details in the form
        success: (response) => {
            if (response.codSuccess) {

                location.reload()
            }
        }
    })
})


// product offer model
$('#add-product-offer-form').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/admin/submit-product-offer',
        method: 'post',
        data: $('#add-product-offer-form').serialize(), //serialize is used so that we get all the details in the form
        success: (response) => {
            console.log('hi', response);
            if (response.codSuccess) {
                location.reload()
            }
        }
    })
})

// delete category offer
function deleteCategoryOffer(id) {
    console.log('heyyyaa');
    $.ajax({
        url: '/admin/delete-category-offer/' + id,
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.reload()
            }
            swal({
                title: "Offer Deleted",
                text: false,
                timer: 600,
                showConfirmButton: false,
            });

        }
    })
}

// delete product offer
function deleteProductOffer(id) {
    $.ajax({
        url: '/admin/delete-product-offer/' + id,
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.reload()
            }
            swal({
                title: "Offer Deleted",
                text: false,
                timer: 600,
                showConfirmButton: false,
            });

        }
    })
}

// add coupon form submition 

$('#add-coupon-form').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/admin/submit-coupon',
        method: 'post',
        data: $('#add-coupon-form').serialize(), //serialize is used so that we get all the details in the form
        success: (response) => {
            if (response.status) {
                location.href = '/admin/coupons'
            }
        }
    })
})

//delete coupon

function deleteCoupon(couponId) {
    swal({
        title: "Are you sure?",
        text: "Do you want to delete the coupon",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete the coupon !",
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/delete-coupon/' + couponId,
                    method: 'post',
                    success: (response) => {
                        location.href = '/admin/coupons'
                    }
                })
            }
        }
    );
}

// download as pdf in sales report admin

$(document).ready(function ($) {
    $(document).on("click", ".btn_print", function (event) {
        event.preventDefault();
        let element = document.getElementById("container_content");

        let randomNumber = Math.floor(Math.random() * (10000000000 - 1)) + 1;

        let opt = {
            margin: 0,
            filename: "Favily (Sales Report)" + randomNumber + ".pdf",
            html2canvas: { scale: 10 },
            jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        };
        html2pdf().set(opt).from(element).save();
    });
});

// excel export sales report

function export_data() {
    let data = document.getElementById("container_content");
    var fp = XLSX.utils.table_to_book(data, { sheet: "Favily" });
    XLSX.write(fp, {
        bookType: "xlsx",
        type: "base64",
    });
    XLSX.writeFile(fp, "Favily(Sales Report).xlsx");
}

//   DASHBOARD

window.addEventListener('load', () => {
    histogram(1, 'daily')
})


function histogram(days, buttonId) {

    $.ajax({
        url: '/admin/dashboard/' + days,
        method: 'get',
        success: (response) => {
            if (response) {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    button.classList.remove('active');
                });
                document.getElementById(buttonId).classList.add("active");

                let totalOrder = response.deliveredOrders + response.shippedOrders + response.placedOrders

                document.getElementById('totalOrders').innerHTML = totalOrder
                document.getElementById('placedOrders').innerHTML = response.placedOrders
                document.getElementById('deliveredOrders').innerHTML = response.deliveredOrders
                document.getElementById('totalAmount').innerHTML = response.totalAmount

                // ////charttttttttttttttttttttttttttttttttttt

                var xValues = ["Delivered", "Shipped", "Placed", "Pending", "Canceled"];
                var yValues = [response.deliveredOrders, response.shippedOrders, response.placedOrders, response.pendingOrders, response.canceledOrders];
                var barColors = ["#b621fe", "rgb(255,27,0)", "rgb(251,33,117)", "rgb(0,172,238)", "rgb(255,151,0)"];

                new Chart("order", {
                    type: "bar",
                    data: {
                        labels: xValues,
                        datasets: [{
                            backgroundColor: barColors,
                            data: yValues
                        }]
                    },
                    options: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: "Order Report"
                        }
                    }
                });

                // barrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr

                var xValues = ["COD", "RAZORPAY", "WALLET"];
                var yValues = [response.codTotal, response.razorpayTotal, response.walletpayTotal];

                var barColors = [
                    "#b91d47",
                    "#00aba9",
                    "rgb(255,27,0)"
                ];

                new Chart("payment", {
                    type: "pie",
                    data: {
                        labels: xValues,
                        datasets: [{
                            backgroundColor: barColors,
                            data: yValues
                        }]
                    },
                    options: {
                        title: {
                            display: true,
                            text: "Payment Report"
                        }
                    }
                });




            }
        }
    })
}