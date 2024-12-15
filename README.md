# React Chat App with Firebase 

This is a simple chat app built with React and Firebase. It uses Firebase's Firestore database to store messages and users. It also uses Firebase's authentication to allow users to sign in with their Google accounts and anonymously.

## Artwork
[![Welcome page](artworks/welcome.png)](./artworks/welcome.png)

## Features

- Sign in with Google
- Sign in anonymously
- Send messages
- See who is online
- Send a emoji
- Send a location


## Getting Started

1. Clone the repository

```
git clone 
```

2. Install dependencies

```
yarn install
```

3. Create a Firebase project

- Go to [Firebase](https://firebase.google.com/) and create a new project
- Go to the project settings and copy the config object
- Copy credentials from the Firebase SDK snippet into .env file and look at file vite-env.d.ts for more information
- Go to the Authentication section and enable Google sign-in method and Anonymous sign-in method
- Go to the Firestore section and create a new database
- Go to the Rules tab and change the rules to the following:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
        allow read: if true;
        allow read, write, update, delete: if request.auth.uid != null;
    }
  }
}
```

4. Run the app

``` shell
yarn dev
```

## Deploying

1. Install firebase-tools

```shell
npm install -g firebase-tools
```

2. Login to Firebase

```shell
firebase login
```

3. Initialize Firebase

```shell
firebase init
```

4. Select Hosting and use the default options

5. Build the app

```shell
yarn build
```

6. Deploy the app

```shell
firebase deploy
```

## License

GNU General Public License v3.0

## Credits
<a href="https://www.freepik.com/free-vector/business-people-working-laptop-development_4332351.htm#query=IT&position=7&from_view=search&track=sph">Image by katemangostar</a> on Freepik

Image by <a href="https://www.freepik.com/free-vector/hand-drawn-flat-design-people-waving-illustration_20859175.htm#query=welcome&position=2&from_view=search&track=sph">Freepik</a>