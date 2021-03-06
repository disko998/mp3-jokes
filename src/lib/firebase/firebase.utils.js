import firebase from './config'

export const auth = firebase.auth()
export const db = firebase.firestore()
export const storageRef = firebase.storage().ref()
export const googleProvider = new firebase.auth.GoogleAuthProvider()
export const facebookProvider = new firebase.auth.FacebookAuthProvider()
export const githubProvider = new firebase.auth.GithubAuthProvider()

githubProvider.setCustomParameters({ prompt: 'select_account' })
facebookProvider.setCustomParameters({ prompt: 'select_account' })
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const checkUsersSession = () =>
  new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe()
      resolve(user)
    }, reject)
  })

export const getAuthUserRef = async user => {
  const { uid, email, emailVerified, displayName, photoURL } = user

  const userRef = db.collection('users').doc(uid)
  const userSnapshot = await userRef.get()

  if (userSnapshot.exists) {
    return userRef
  }

  await userRef.set({
    email,
    emailVerified,
    displayName,
    avatar: photoURL,
    createdAt: new Date(),
  })

  return userRef
}

export const saveAudioToStorage = async (metadata, userId) => {
  const audioRef = storageRef.child(`jokes/${userId}/${metadata.name}.mp3`)
  const snapshot = await audioRef.put(metadata.audio)

  return snapshot.ref.getDownloadURL()
}

export const recordUserJoke = async (user, audioURL, metadata) => {
  const collectionRef = db.collection('jokes')

  const docRef = await collectionRef.add({
    name: metadata.name,
    author: user.id,
    likes: [],
    audio: audioURL,
    createdAt: new Date(),
  })

  const jokes = await docRef.get()
  const jokeData = jokes.data()

  return {
    ...jokeData,
    id: docRef.id,
    author: { id: jokeData.author, name: user.displayName },
  }
}

export const updateJokeLikesTransaction = async (jokeId, userId) => {
  const jokeRef = db.doc(`jokes/${jokeId}`)

  // eslint-disable-next-line no-return-await
  return await db.runTransaction(async transaction => {
    const jokeSnapshot = await transaction.get(jokeRef)
    if (!jokeSnapshot.exists) {
      throw new Error('Document does not exists or is deleted')
    }

    const joke = jokeSnapshot.data()
    const index = joke.likes.indexOf(userId)

    index === -1 ? joke.likes.push(userId) : joke.likes.splice(index, 1)

    return transaction.update(jokeRef, { likes: joke.likes })
  })
}

export const updateUserDoc = async (partialData, currentUser) => {
  const userRef = db.doc(`users/${currentUser.id}`)
  const userSnapshot = await userRef.get()

  if (!userSnapshot.exists) {
    throw new Error('User does not exists')
  }

  const newUser = {
    ...userSnapshot.data(),
    ...partialData,
    updatedAt: new Date(),
  }

  await userRef.update(newUser)

  return newUser
}

export const uploadAvatar = async (file, currentUser) => {
  const regex = /image\/(gif|jpe?g|tiff|png|webp|bmp)$/i

  if (!regex.test(file.type)) {
    throw new Error('Please upload image file')
  }

  const audioRef = storageRef.child(`images/${currentUser.id}/avatar.jpg`)
  const snapshot = await audioRef.put(file)

  return snapshot.ref.getDownloadURL()
}
