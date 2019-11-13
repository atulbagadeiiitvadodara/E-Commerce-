//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  Name: String,
  Mobile_No: String,
  email: String,
  password: String,
  facebookId: String,
  googleId: String,
  secret: String,
  country: String,
  pinCode: Number,
  city: String,
  houseNo: String,
  landmark: String,
  wishList: Array,
  cart: Array,
  orders: Array
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/userPage",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);

    User.findOrCreate({
      googleId: profile.id,
      Name: profile.displayName
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/userPage",
    profileFields: ['id', 'displayName', 'email']
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);

    User.findOrCreate({
      facebookId: profile.id,
      Name: profile.displayName
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


// render home page
app.get("/", function(req, res) {

  // Validating if user is logged in?
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        Product.find({}, function(err, items){

          res.render("userHome", {
            person: foundUser.Name,
            items: items
          });

        });

      }
    });
  } else {
    Product.find({}, function(err, items){

      res.render("Home", {
        items: items
      });

    });
  }
});


// google auth route
app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);


// facebook auth route
app.get('/auth/facebook',
  passport.authenticate('facebook'));


// google redirect url
app.get("/auth/google/userPage",
  passport.authenticate('google', {
    failureRedirect: "/"
  }),
  function(req, res) {
    // Successful authentication, redirect to user page
    res.redirect("/userPage");
  });


// facebook redirect url
app.get('/auth/facebook/userPage',
  passport.authenticate('facebook', {
    failureRedirect: '/'
  }),
  function(req, res) {
    // Successful authentication, redirect user page
    res.redirect('/userPage');
  });


// render user Specific page
app.get("/userPage", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        var count = 4;

        Product.find({}, function(err, items){

          res.render("userPage", {
            person: foundUser.Name,
            items: items,
            count: count
          });

        });

      }
    });
  } else {
    res.render("login");
  }
});


// exit user session
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});


app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});


app.get("/workInProgress", function(req, res) {
  res.render("workInProgress");
});


app.get("/thankYou", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        res.redirect("/");
        console.log(err);
      } else {
        res.render("thankYou", {
          person: foundUser.Name
        });
      }
    });
  } else {
    res.render("login");
  }

});


// render user's address page
app.get("/address", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        res.redirect("/");
        console.log(err);
      } else {
        res.render("address", {
          person: foundUser
        });
      }
    });
  } else {
    res.render("login");
  }
});


// render user's wish list page
app.get("/wishList", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        var count = 0;
        foundUser.wishList.forEach(function(item) {
          count++;
        });

        res.render("wishList", {
          list: foundUser.wishList,
          person: foundUser.Name,
          count: count
        });
      }
    });
  } else {
    res.render("login");
  }
});


// render user's order history
app.get("/myOrders", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        var count = 0;
        foundUser.orders.forEach(function(item) {
          count++;
        });

        res.render("myOrders", {
          list: foundUser.orders,
          person: foundUser.Name,
          count: count
        });
      }
    });
  } else {
    res.render("login");
  }
});


// render user's cart page
app.get("/userCart", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        var sum = 0;
        foundUser.cart.forEach(function(item) {
          sum += item.price;
        });

        res.render("userCart", {
          list: foundUser.cart,
          person: foundUser.Name,
          sum: sum
        });
      }
    });
  } else {
    res.render("login");
  }
});


app.get("/placeOrder", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        var sum = 0;
        foundUser.cart.forEach(function(item) {
          sum += item.price;
        });

        res.render("placeOrder", {
          list: foundUser.cart,
          person: foundUser.Name,
          sum: sum,
          foundUser: foundUser
        });
      }
    });
  } else {
    res.render("login");
  }
});


// user request to add an item to his/her wish list
app.post("/wishList", function(req, res) {

  if (req.isAuthenticated()) {

    User.findById(req.user.id, function(err, foundUser) {

      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        Product.findById(req.body.prodID, function(err, foundProduct) {
          var prodx = ({
            productID: req.body.prodID,
            productName: foundProduct.productName,
            rating: foundProduct.rating,
            review: foundProduct.review,
            price: foundProduct.price,
            imgSrc: foundProduct.imgSrc
          });
          foundUser.wishList.push(prodx);
          foundUser.save();
        });

        res.redirect("/userPage");

      }
    });
  } else {
    res.render("login");
  }
});


// user request to add an item to his/her cart
app.post("/userCart", function(req, res) {

  if (req.isAuthenticated()) {

    User.findById(req.user.id, function(err, foundUser) {

      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        Product.findById(req.body.prodID, function(err, foundProduct) {
          var prodx = ({
            productID: req.body.prodID,
            productName: foundProduct.productName,
            rating: foundProduct.rating,
            review: foundProduct.review,
            price: foundProduct.price,
            imgSrc: foundProduct.imgSrc
          });
          foundUser.cart.push(prodx);
          foundUser.save();
        });

        res.redirect("/userPage");

      }
    });
  } else {
    res.render("login");
  }
});



// user request to buy a item directly (without adding it to cart)
app.post("/orderPayment", function(req, res) {

  if (req.isAuthenticated()) {

    User.findById(req.user.id, function(err, foundUser) {

      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        Product.findById(req.body.prodID, function(err, foundProduct) {

          var d = new Date();
          var prodx = ({

            // ordered product details
            productID: req.body.prodID,
            productName: foundProduct.productName,
            rating: foundProduct.rating,
            review: foundProduct.review,
            price: foundProduct.price,
            imgSrc: foundProduct.imgSrc,
            date: d, // current date & time

            // customer's delivery details
            customerName: foundUser.Name,
            customerMobileNo: foundUser.Mobile_No,
            customerCountry: foundUser.country,
            customerPinCode: foundUser.pinCode,
            customerCity: foundUser.city,
            customerHouseNo: foundUser.houseNo,
            customerLandmark: foundUser.landmark

          });

          foundUser.orders.push(prodx);
          foundUser.save();

        });

        res.redirect("/thankYou");

      }
    });
  } else {
    res.render("login");
  }
});


// user request to place order from cart
app.post("/orderPaymentFromCart", function(req, res) {

  if (req.isAuthenticated()) {

    User.findById(req.user.id, function(err, foundUser) {

      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        Product.findById(req.body.prodID, function(err, foundProduct) {

          var d = new Date();

          foundUser.cart.forEach(function(item) {


            var prodx = ({

              // ordered product details
              productID: item.productID,
              productName: item.productName,
              rating: item.rating,
              review: item.review,
              price: item.price,
              imgSrc: item.imgSrc,
              date: d, // current date & time

              // customer's delivery details
              customerName: foundUser.Name,
              customerMobileNo: foundUser.Mobile_No,
              customerCountry: foundUser.country,
              customerPinCode: foundUser.pinCode,
              customerCity: foundUser.city,
              customerHouseNo: foundUser.houseNo,
              customerLandmark: foundUser.landmark

            });

            foundUser.orders.push(prodx);

          });

          foundUser.save();

        });

        res.redirect("/thankYou");

      }
    });
  } else {
    res.render("login");
  }
});




// user request to delete an item from wish list
app.post("/removeProductFromList", function(req, res) {

  User.findById(req.user.id, function(err, foundUser) {

    if (err) {
      console.log(err);
    } else {
      var len = foundUser.wishList.length;
      var i = 0;

      for (i = 0; i < len; i++) {

        if (foundUser.wishList[i].productID == req.body.prodID) {
          foundUser.wishList.splice(i, 1);
          console.log("Successfully deleted Cart Item !");
          break;
        }

      }
      foundUser.save();
    }
  });

  res.redirect("/wishList");

});


// user request to delete an item from cart
app.post("/removeProductFromCart", function(req, res) {

  User.findById(req.user.id, function(err, foundUser) {

    if (err) {
      console.log(err);
    } else {
      var len = foundUser.cart.length;
      var i = 0;

      for (i = 0; i < len; i++) {

        if (foundUser.cart[i].productID == req.body.prodID) {
          foundUser.cart.splice(i, 1);
          console.log("Successfully deleted Cart Item !");
          break;
        }

      }
      foundUser.save();
    }
  });

  res.redirect("/userCart");

});


// user request to update his/her delivery address
app.post("/address", function(req, res) {
  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      res.redirect("/");
      console.log(err);
    } else {
      foundUser.pinCode = req.body.pincode;
      foundUser.Name = req.body.personName;
      foundUser.country = req.body.country;
      foundUser.Mobile_No = req.body.personMobNo;
      foundUser.houseNo = req.body.houseNo;
      foundUser.city = req.body.city;
      foundUser.landmark = req.body.landmark;
      // foundUser.wishList.push(req.body.city);
      foundUser.save();
      res.redirect("/address");
    }
  });
});


// show product details
app.post("/productDetails", function(req, res) {

  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {

      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        Product.findById(req.body.prodID, function(err, foundProduct) {

          if (err)
            console.log(err);

          else{

            var avgRating = 0;
            var sum = 0;
            var countItems = 0;

            foundProduct.review.forEach(function(item){
              if(item.rating != null) sum += Number(item.rating);
              if(item.rating != null) countItems++;
            });

            if(countItems>0) avgRating = sum/countItems;

            var avg = avgRating.toFixed(2);

            res.render("productDetails", {
              person: foundUser.Name,
              product: foundProduct,
              reviewList: foundProduct.review,
              avgRating: avg,
              countItems: countItems
            });
          }

        });

      }
    });
  } else {

    Product.findById(req.body.prodID, function(err, foundProduct) {


      var avgRating = 0;
      var sum = 0;
      var countItems = 0;

      foundProduct.review.forEach(function(item){
        if(item.rating != null) sum += Number(item.rating);
        if(item.rating != null) countItems++;
      });

      if(countItems>0) avgRating = sum/countItems;

      var avg = avgRating.toFixed(2);

      res.render("productDetailsTwo", {
        product: foundProduct,
        reviewList: foundProduct.review,
        avgRating: avg,
        countItems: countItems
      });

    });

  }

});


// fast forward link to place order
app.post("/buyNow", function(req, res) {

  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {

      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        Product.findById(req.body.prodID, function(err, foundProduct) {

          if (err)
            console.log(err);

          else
            res.render("buyNow", {
              person: foundUser,
              product: foundProduct
            });

        });

      }
    });
  } else {

    res.render("login");

  }

});


// user adds review from his/her order history
app.post("/postReview", function(req, res) {

  if (req.isAuthenticated()) {

    User.findById(req.user.id, function(err, foundUser) {

      if (err) {
        res.redirect("/");
        console.log(err);
      } else {

        Product.findById(req.body.prodID, function(err, foundProduct) {
          var revx = ({

            customerName: foundUser.Name,
            title: req.body.title,
            rating: req.body.rating,
            summary: req.body.summary,

          });
          foundProduct.review.push(revx);
          foundProduct.save();
        });

        res.redirect("/");

      }
    });
  } else {
    res.render("login");
  }
});




// new user registration
app.post("/register", function(req, res) {

  User.register({
    username: req.body.username,
    Name: req.body.shubhNaam,
    Mobile_No: req.body.MobNo
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/userPage");
      });
    }
  });

});


// user request to login
app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/userPage");
      });
    }
  });

});


// localhost
app.listen(process.env.PORT || 3000, function() {
  console.log("Server Started");
});


const productSchema = new mongoose.Schema({
  productID: String,
  productName: String,
  rating: Number,
  review: Array,
  price: Number,
  imgSrc: String
});

const Product = new mongoose.model("Product", productSchema);


// demo product

// const prod1 = new Product({
//   productName: "65-Inch MI TV",
//   rating: 4.6,
//   review: "Outstanding Performance",
//   price: 64000,
//   imgSrc: "/images/mi tv.jpg"
// });
