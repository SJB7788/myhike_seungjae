//Global variable pointing to the current user's Firestore document
var currentUser;

//Function that calls everything needed for the main page
function doAll() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = db.collection('users').doc(user.uid); //global
      console.log(currentUser);

      // figure out what day of the week it is today
      const weekday = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const d = new Date();
      let day = weekday[d.getDay()];

      // the following functions are always called when someone is logged in
      readQuote(day);
      insertNameFromFirestore();
      displayCardsDynamically('hikes');
    } else {
      // No user is signed in.
      console.log('No user is signed in');
      window.location.href = 'login.html';
    }
  });
}
doAll();

function readQuote(day) {
  db.collection('quotes')
    .doc(day)
    .onSnapshot((tuesdayDoc) => {
      console.log('inside');
      console.log(tuesdayDoc.data().quote);
      document.getElementById('quote-goes-here').innerHTML =
        tuesdayDoc.data().quote;
    });
}

function insertNameFromFirestore() {
  //check if user is logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      //if user logged in
      console.log(user.uid);
      db.collection('users')
        .doc(user.uid)
        .get()
        .then((userDoc) => {
          console.log(userDoc.data().name);
          userName = userDoc.data().name;
          console.log(userName);
          document.getElementById('name-goes-here').innerHTML = userName;
        });
    }
  });
}

function writeHikes() {
  //define a variable for the collection you want to create in Firestore to populate data
  var hikesRef = db.collection('hikes');

  hikesRef.add({
    code: 'BBY01',
    name: 'Burnaby Lake Park Trail', //replace with your own city?
    city: 'Burnaby',
    province: 'BC',
    level: 'easy',
    details: 'A lovely place for lunch walk',
    length: 10, //number value
    hike_time: 60, //number value
    lat: 49.2467097082573,
    lng: -122.9187029619698,
    last_updated: firebase.firestore.FieldValue.serverTimestamp(), //current system time
  });
  hikesRef.add({
    code: 'AM01',
    name: 'Buntzen Lake Trail', //replace with your own city?
    city: 'Anmore',
    province: 'BC',
    level: 'moderate',
    details: 'Close to town, and relaxing',
    length: 10.5, //number value
    hike_time: 80, //number value
    lat: 49.3399431028579,
    lng: -122.85908496766939,
    last_updated: firebase.firestore.Timestamp.fromDate(
      new Date('March 10, 2022')
    ),
  });
  hikesRef.add({
    code: 'NV01',
    name: 'Mount Seymour Trail', //replace with your own city?
    city: 'North Vancouver',
    province: 'BC',
    level: 'hard',
    details: 'Amazing ski slope views',
    length: 8.2, //number value
    hike_time: 120, //number value
    lat: 49.38847101455571,
    lng: -122.94092543551031,
    last_updated: firebase.firestore.Timestamp.fromDate(
      new Date('January 1, 2023')
    ),
  });
}

//------------------------------------------------------------------------------
// Input parameter is a string representing the collection we are reading from
//------------------------------------------------------------------------------
function displayCardsDynamically(collection) {
  let cardTemplate = document.getElementById('hikeCardTemplate');

  db.collection(collection)
    .get() //the collection called "hikes"
    .then((allHikes) => {
      //var i = 1;  //Optional: if you want to have a unique ID for each hike
      allHikes.forEach((doc) => {
        //iterate thru each doc
        var title = doc.data().name; // get value of the "name" key
        var details = doc.data().details; // get value of the "details" key
        var hikeCode = doc.data().code; //get unique ID to each hike to be used for fetching right image
        var hikeLength = doc.data().length; //gets the length field
        var docID = doc.id;
        let newcard = cardTemplate.content.cloneNode(true);

        //update title and text and image etc.
        newcard.querySelector('.card-title').innerHTML = title;
        //newcard.querySelector('.card-length').innerHTML = hikeLength + "km";
        newcard.querySelector('.card-text').innerHTML = details;
        newcard.querySelector('.card-image').src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg
        newcard.querySelector('a').href = 'eachHike.html?docID=' + docID;

        //NEW LINE: update to display length, duration, last updated
        newcard.querySelector('.card-length').innerHTML =
          'Length: ' +
          doc.data().length +
          ' km <br>' +
          'Duration: ' +
          doc.data().hike_time +
          'min <br>' +
          'Last updated: ' +
          doc.data().last_updated.toDate().toLocaleDateString();

        //NEW LINES: next 2 lines are new for demo#11
        //this line sets the id attribute for the <i> tag in the format of "save-hikdID"
        //so later we know which hike to bookmark based on which hike was clicked
        newcard.querySelector('i').id = 'save-' + docID;
        // this line will call a function to save the hikes to the user's document
        newcard.querySelector('i').onclick = () => saveBookmark(docID);

        currentUser.get().then((userDoc) => {
          //get the user name
          var bookmarks = userDoc.data().bookmarks;
          if (bookmarks.includes(docID)) {
            document.getElementById('save-' + docID).innerText = 'bookmark';
          }
        });

        //Finally done modifying newcard
        //attach to gallery, Example: "hikes-go-here"
        document.getElementById(collection + '-go-here').appendChild(newcard);

        //i++;   //Optional: iterate variable to serve as unique ID
      });
    });
}

//-----------------------------------------------------------------------------
// This function is called whenever the user clicks on the "bookmark" icon.
// It adds the hike to the "bookmarks" array
// Then it will change the bookmark icon from the hollow to the solid version.
//-----------------------------------------------------------------------------
function saveBookmark(hikeDocID) {
  if (document.getElementById('save-' + hikeDocID).innerText == 'bookmark') {
    console.log(hikeDocID);
    document.getElementById('save-' + hikeDocID).innerHTML = 'bookmark_border';
    currentUser.set(
      {
        bookmarks: firebase.firestore.FieldValue.arrayRemove(hikeDocID),
      },
      {
        merge: true,
      }
    );
  } else {
    currentUser
      .set(
        {
          bookmarks: firebase.firestore.FieldValue.arrayUnion(hikeDocID),
        },
        {
          merge: true,
        }
      )
      .then(function () {
        console.log('bookmark has been saved for: ' + currentUser);
        var iconID = 'save-' + hikeDocID;
        //console.log(iconID);
        //this is to change the icon of the hike that was saved to "filled"
        document.getElementById(iconID).innerText = 'bookmark';
      });
  }
}
