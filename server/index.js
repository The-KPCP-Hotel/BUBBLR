const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const { User, customDrinks, estDrinks } = require('../server/db/index');
const axios = require('axios');


const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
require('dotenv').config();

// MIDDLEWARES
const app = express();
app.set('view engine', 'ejs');
// app.set('view engine', 'jsx');
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: 'bubblr',
    resave: false,
    saveUninitialized: true,
    // trying an atricle adonis sent: https://medium.com/@mohan.velegacherla/how-to-setup-passport-authentication-in-node-js-with-example-using-express-js-bf44a51e8ca0
    // saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// SERVING REACT STATIC PAGES
const CLIENT_PATH = path.resolve(__dirname, '../dist');
app.use(express.static(CLIENT_PATH));

// ROUTER SENDING TO WHEREVER
app.use('/auth', authRouter);
app.use('/profile', profileRouter);

// ROUTER SENDING TO WHEREVER
// app.use('/api', apiRouter);

// ROUTES FOR THIS FILE
app.get('/dashboard', (req, res) => {
  // res.cookies()
  res.render(path.join(__dirname, '../client/views/dashboard.ejs'), {
    url: '/dashboard',
  });
});
app.post('/logout', (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
  // res.redirect('/login');
  // console.log('-------> User Logged out');
});

// for getting user info from db
app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  User.findByPk(id)
    .then((userObj) => {
      // console.log('find by pk result', userObj);
      res.send(userObj);
    })
    .catch((err) => {
      console.error('failed finding user by pk: ', err);
      res.send(500);
    });
});

// this grabs a users friends when opening profile, not able to do in one query...
app.get('/profile/friends/:id', (req, res) => {
  const { id } = req.params;
  UserFriends.findAll({ attributes: ['friend2Id'], where: { friend1Id: id }, raw: true })
    .then((arrFriend2IdObj) => {
      if (arrFriend2IdObj) {
        const userIdArr = [];
        for (let i = 0; i < arrFriend2IdObj.length; i++) {
          userIdArr.push({ id: arrFriend2IdObj[i].friend2Id });
        }
        return User.findAll({ where: { [Op.or]: userIdArr }, raw: true });
      }
    })
    .then((userArr) => {
      res.send(userArr);
    })
    .catch((err) => console.error('Failed finding friends: ', err));
});

// for user search
app.get('/profile/users/:displayName', (req, res) => {
  const { displayName } = req.params;
  User.findAll({ where: { displayName } })
    .then((userArr) => {
      res.send(userArr);
    })
    .catch((err) => console.error('failed search for user by name: ', err));
});

// for user follow
app.post('/profile/follow', (req, res) => {
  // represents the user ids in db
  const { id, idFollow } = req.body;
  // currently is creating even if exists
  UserFriends.create({ friend1Id: id, friend2Id: idFollow })
    // .then((response) => console.log(response))
    .then(() => res.sendStatus(200))
    .catch((err) => console.error('failed following: ', err));
});

app.delete('/profile/unfollow', (req, res) => {
  const { friend1Id, friend2Id } = req.body;
  UserFriends.destroy({ where: { friend1Id, friend2Id } })
    .then(() => res.sendStatus(200))
    .catch((err) => console.error('failed to unfollow user: ', err));
});

//get all custom saved custom drinks
app.get('/api/customDrinks', (req, res) => {
  customDrinks
    .findAll()
    .then((results) => {
      res.status(200).send(results);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });});

//get list of all possible drink ingredients
app.get('/api/getIngredients', (req, res) => {
  axios
    .get('https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list')
    .then((results) => {
      res.status(200).send(results.data.drinks);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

//post a custom drink to the database
app.post('/api/customDrinks', (req, res) => {
  data = req.body;
  customDrinks
    .create(data)
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

// add to db only when drink info is 'got'
app.post('/api/estDrinks', async (req, res) => {
  console.log(req.body);
  let data = req.body;

  estDrinks
    .findOne({ where: { drinkId: data.drinkId } })
    .then((exists) => {
      if (exists) {
        res.sendStatus(200);
      } else {
        estDrinks
          .create(data)
          .then(() => {
            res.sendStatus(200);
          })
          .catch((err) => {
            console.error(err);
            res.sendStatus(500);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

app.get('*', (req, res) => {
  // console.log('trying to find full url', req.hostname);
  res.sendFile(path.join(CLIENT_PATH, 'index.html'));
});

// app.post('/logout', (req, res) => {
//   req.logOut((err) => {
//     if (err) { return next(err); }
//     res.redirect('/');
//   });
//   res.redirect('/login');
//   console.log('-------> User Logged out');
// });

const PORT = 8080;

const devOrProd = () => {
  if (process.env.npm_lifecycle_event === 'start') {
    return 'localhost';
  }
  return '13.52.61.243';
};

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`Server listening on http://${devOrProd()}:${PORT}`);
});
