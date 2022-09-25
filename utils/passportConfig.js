const LocalStrategy = require("passport-local").Strategy;
const { nameExists, createGoogleUser, createUser, matchPassword } = require("../model/register");


module.exports = (passport) => {
    passport.use(
      "local-signup",
      new LocalStrategy(
        {
          usernameField: "name",
          passwordField: "password",
          passReqToCallback : true
        },
        async (req, name, password, done) => {
          try {
            //console.log(`>>>> Name: ${req.body.name} or ${name}`);
            console.log(`Name: ${req.body.name} >> ${name}`);
            const userExists = await nameExists(name)
   
            if (userExists) {
              return done(null, false);
            }
   
            const user = await createUser(name, req.body.email, password);
            console.log(`>>>>>>>>>>>> Returning user ${user}`);
            return done(null, user);
          } catch (error) {
            done(error);
          }
        }
      )
    );

    passport.use(
        "local-login",
        new LocalStrategy(
          {
            usernameField: "name",
            passwordField: "password",
            passReqToCallback : true
          },
          async (req, name, password, done) => {
            try {
              const user = await nameExists(name);
              if (!user) return done(null, false);
              
              const isMatch = await matchPassword(password, user.password);
              console.log(`isMatch ${isMatch} id ${user.id} name ${user.name}`);
              if (!isMatch) return done(null, false);
              return done(null, {id: user.id, name: user.name});
            } catch (error) {
              return done(error, false);
            }
          }
        )
    );

    passport.use(
      "google-login",
      new LocalStrategy(
        {
          usernameField: "name",
          passwordField: "password",
          passReqToCallback : true
        },
        async (req, email, password, done) => {
          // try {
          //   console.log(`Authenticated google user  ${email} data ${req.body.id}`);
          //   return done(null, {name: email, id: req.body.id});
          // } catch (error) {
          //   return done(error, false);
          // }
          try {
            console.log(`Authenticated google user  ${email} data ${req.body.id}`);
            const user = await nameExists(email)
   
            if (!user) {
              // return done(null, false);
              const user = await createGoogleUser(email, email, req.body.id);
              console.log(`>>>>>>>>>>>> Returning user ${user}`);
              return done(null, user);
            }
            return done(null, {id: user.id, name: user.name});
            
          } catch (error) {
            done(error);
          }
        }
      )
  );
};