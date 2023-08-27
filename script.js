// ==UserScript==
// @name        XXXXX
// @namespace   Violentmonkey Scripts
// @match       https://www.instagram.com/*
// @grant       GM_xmlhttpRequest
// @version     3.0
// @author      Grzegorz Grzojda Walewski
// @require     https://tweetnacl.js.org/nacl.min.js
// @require     https://cdn.jsdelivr.net/npm/tweetnacl-sealedbox-js@1.2.0/sealedbox.web.js
// @description
// ==/UserScript==

/**
 * CONFIGURATION
 * */

// Full url to instagram locationUrl. It can be exported from https://instahunt.co/
// For example: https://www.instagram.com/explore/locations/228089762273/ is Warsaw, Poland

//const locationUrl = 'https://www.instagram.com/explore/locations/228089762273/'; // warszawa
const locationUrl = 'https://www.instagram.com/explore/locations/106017852771295/'; // poznan
//const locationUrl = 'https://www.instagram.com/explore/locations/187752695320/'; // wroclaw

const locationsUrls = {
  warsaw: "https://www.instagram.com/explore/locations/228089762273/",
  poznan: "https://www.instagram.com/explore/locations/106017852771295/",
  wroclaw: "https://www.instagram.com/explore/locations/187752695320/"
}


// Maybe it's not the safest option to store these, but it solves instagram issue with logging out user randomly + saved accounts credential limit. Your login data is saved only in this file, and isnt send anywhere, so its relativly safe
const accounts =
[
  { name: "yourUsername", password: "yourPassword", locations: ["poznan", "warsaw", "wroclaw"] }
];

// If photo have more then this, we'll just skip it ;)
const maxLikes = 100;
// Max likes per day per account
const maxExecutions = 300;

/**
 * OTHER CONSTS IN CASE INSTAGRAM CHANGE ANYTHING, YOU CAN FIX IT HERE
 **/

// selector for element existing only at logged out homepage
const LOGGED_OUT_SELECTOR = 'xamitd3 xm2v1qs x322q5f xx54hvc x1vk3w4 xuyhj88 xod5an3 x1gja9t xcd7kps xkxfa8k';
// text existing at login page - it can exist at logged out homepage, but shoud not exist at any other site
const LOGIN_PAGE_TEXT = 'Save login info';
// login page direct link
const LOGIN_PAGE_URL = 'https://www.instagram.com/accounts/login';
// selector for element existing only at explore page
const EXPLORE_SELECTOR = 'leaflet-tile-container';
// selector for button 'More'
const MORE_BUTTON_SELECTOR = 'x9f619 xxk0z11 xii2z7h x11xpdln x19c4wfv xvy4d1p';
// selector for all link elements inside of "more menu"
const LOG_OUT_SELECTOR = 'x1lliihq x193iq5w x6ikm8r x10wlt62 xlyipyv xuxw1ft';
// selector for a photo at explore page
const PHOTO_SELECTOR = 'x5yr21d xu96u03 x10l6tqk x13vifvy x87ps6o xh8yej3';
// used for getting username
const INSTAGRAM_DOMAIN = 'https://www.instagram.com/';
// selector for text which contains information of how much likes photo already got
const LIKE_AMOUNT_TEXT_SELECTOR = 'x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs xt0psk2 x1i0vuye xvs91rp x1s688f x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj';
// selector for all photo related buttons
const PHOTO_BUTTONS_SELECTOR = 'x1i10hfl x6umtig x1b1mbwd xaqea5y xav7gou x9f619 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x6s0dn4 xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x1ypdohk x78zum5 xl56j7k x1y1aw1k x1sxyh0 xwib8y2 xurb0ha';
// index for like button
const LIKE_BUTTON_INDEX = 3;
const NEXT_PREVIOUS_SHARE_BUTTONS_SELECTOR = '_abl-';
const NEXT_BUTTON_INDEX = 1;
const MAX_WAITING_TIME_BEFORE_NEXT = 15000;
const LOGIN_REQUEST_URL = 'https://www.instagram.com/api/v1/web/accounts/login/ajax/';
const NON_AUTHENTICATED_MESSAGE = 'sth went wrong on loggining in, check console, and make sure You inputed right credentials';

const LOCAL_STORAGE_ACTIVE_USER_INDEX = 'activeUser';

/**
 * ENTRY POINT
 * */
const urlParams = new URLSearchParams(window.location.search);
const day = 24 * 60 * 60 * 1000;
const Crypto = window.crypto || window.msCrypto;
console.log('documentStart');
init();

async function init() {
  console.log('init');
  // keeping sure, document is loaded
  await delay(15000);

  if (document.getElementsByClassName(LOGGED_OUT_SELECTOR).length > 0) {
    // in instagram homepage and logged out
    window.location = LOGIN_PAGE_URL;
  } else if ((document.documentElement.textContent || document.documentElement.innerText
  ).indexOf(LOGIN_PAGE_TEXT) > -1) {
    // in instagram login page
    login();
  }
  else if (document.getElementsByClassName(EXPLORE_SELECTOR).length > 0) {
    // in explore page
    likeProcedure();
  } else {
    // any other page
    window.location = locationUrl;
  }
}

const generatePostDataForSignIn = async (
  user_name,          // user name or email
  user_pass,          // user pass
  passEncKeyId,       // ig-set-password-encryption-web-key-id
  passEncPublicKey,   // ig-set-password-encryption-web-pub-key
  passEncVersion      // ig-set-password-encryption-web-key-version
) => {
  const getHandlerDate = () => {
    return Math.floor(Date.now() / 1e3).toString();
  }
  const decodeUTF8 = (date) => {
    if ('string' != typeof date)
      throw new TypeError('expected string');

    let dateEncodeUnescape = unescape(encodeURIComponent(date)),
      dateArray = new Uint8Array(dateEncodeUnescape.length);

    for (let index = 0; index < dateEncodeUnescape.length; index++)
      dateArray[index] = dateEncodeUnescape.charCodeAt(index);

    return dateArray;
  }
  const decodeStr = (string) => {
    const arrayNew = [];

    for (let constSize = 0; constSize < string.length; constSize += 2)
      arrayNew.push(parseInt(string.slice(constSize, constSize + 2), 16));

    return new Uint8Array(arrayNew);
  }
  const encrypt = async (passEncKeyId, passEncPublicKey, userpassDataDecoded, dateDataDecoded) => {
    const constSize = 100;
    const arraySize = constSize + userpassDataDecoded.length;

    if (64 !== passEncPublicKey.length)
      throw new Error('public key is not a valid hex sting');

    const decodedPublicKey = decodeStr(passEncPublicKey);
    if (!decodedPublicKey)
      throw new Error('public key is not a valid hex string');
    const cryptedData = new Uint8Array(arraySize);
    let counter = 0;

    cryptedData[counter] = 1,
      cryptedData[counter += 1] = passEncKeyId,
      counter += 1;
    const cryptoConfig = {
      name: 'AES-GCM',
      iv: new Uint8Array(12),
      additionalData: dateDataDecoded,
      tagLen: 16
    };
    return Crypto.subtle.generateKey({
      name: 'AES-GCM',
      length: 256
    },
      true,
      ['encrypt', 'decrypt']
    )
      .then(function (cryptoKey) { // key
        const promiseExportKey = Crypto.subtle.exportKey('raw', cryptoKey),
          promiseCiphertext = Crypto.subtle.encrypt(cryptoConfig, cryptoKey, userpassDataDecoded.buffer);
        return Promise.all([promiseExportKey, promiseCiphertext]);
      }).then(function (keyArrays) { // [exportKey, ciphertext]
        const cryptedAESKey = sealedBox.seal(new Uint8Array(keyArrays[0]), decodedPublicKey);
        const overheadLength = 48;

        if (cryptedData[counter] = 255 & cryptedAESKey.length,
          cryptedData[counter + 1] = cryptedAESKey.length >> 8 & 255,
          counter += 2,
          cryptedData.set(cryptedAESKey, counter),
          counter += 32,

          counter += overheadLength,
          cryptedAESKey.length !== 32 + overheadLength
        ) {
          throw new Error('encrypted key is the wrong length');
        }

        const passEncKeyId = new unsafeWindow.Uint8Array(keyArrays[1]);
        const passEncPublicKey = new unsafeWindow.Uint8Array(keyArrays[1].slice(-16));
        const userpassDataDecoded = new unsafeWindow.Uint8Array(keyArrays[1].slice(0, -16));

        cryptedData.set(passEncPublicKey, counter);
        counter += 16;
        cryptedData.set(userpassDataDecoded, counter);
        return cryptedData;
      }).catch(function (t) {
        throw t
      })
  }

  const encodeBase64 = (arrayData) => {
    let arrayChars = [],
      arraySize = arrayData.length;

    for (let index = 0; index < arraySize; index++)
      arrayChars.push(String.fromCharCode(arrayData[index]));

    return btoa(arrayChars.join(''))
  }

  const formatData = (cryptedData, date, version) => {
    const prefix = "#PWD_INSTAGRAM_BROWSER";
    return [prefix, version, date, cryptedData].join(':');
  }

  const prepareData = async (user_name, user_pass, encryptData) => {
    const date = getHandlerDate();

    const userpassDataDecoded = decodeUTF8(user_pass),
      dateDataDecoded = decodeUTF8(date),
      cryptedData = await encrypt(encryptData.passEncKeyId, encryptData.passEncPublicKey, userpassDataDecoded, dateDataDecoded);

    const enc_password = formatData(encodeBase64(cryptedData), date, encryptData.passEncVersion);

    return `username=${user_name}&enc_password=${encodeURIComponent(enc_password)}&queryParams=${encodeURIComponent("{}")}&optIntoOneTap=${false}`;
  }
  const encryptData = {
    passEncKeyId: passEncKeyId,
    passEncPublicKey: passEncPublicKey,
    passEncVersion: passEncVersion
  }

  return await prepareData(user_name, user_pass, encryptData);
}


window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
}

function getActiveUserUsername() {
  var user = LocalStorageManager.getFromLocalStorage(LOCAL_STORAGE_ACTIVE_USER_INDEX);
  if (user != null)
  {
    return user.name;
  }
  return "";
}

function getActiveUser() {
  return LocalStorageManager.getFromLocalStorage(LOCAL_STORAGE_ACTIVE_USER_INDEX);
}


function getNextLocationUrl()
{
  var activeUser = getActiveUser();
  var userData = LocalStorageManager.getFromLocalStorage(activeUser.name);
    console.log('userData');
    console.log(LocalStorageManager.getFromLocalStorage(activeUser.name));
    console.log('executionsCount');
    console.log(userData.executionCount);

  var changeEvery = Math.floor(maxExecutions / activeUser.locations.length);
    console.log('change every ' + changeEvery);

  if (userData.executionCount % changeEvery == 0) {
      console.log(Math.floor(userData.executionCount / changeEvery));
    locationIndex = Math.floor(userData.executionCount / changeEvery);
      if (locationsUrls[activeUser.locations[locationIndex]] == undefined)
      {
          locationIndex = 0
          console.log('x')
      }
  } else {
    locationIndex = 0;
      console.log('arax')
  }
console.log(userData.executionCount);
    console.log(changeEvery);
    console.log(locationIndex);
  return locationsUrls[activeUser.locations[locationIndex]];
}

function getNextAccount() {
  console.log('getNextAccount');
  allProfiles = accounts;
    console.log(allProfiles);
  for (var i = 0; i < allProfiles.length; i++) {
    var userData = LocalStorageManager.getFromLocalStorage(allProfiles[i].name);
      console.log(userData);
    if (userData == null || (Date.now() - userData.lastLikeTime) > (day) || userData.executionCount < maxExecutions) {
      return allProfiles[i];
    }
  }
    document.title = 'It\'s enought for today. See You tomorrow';
    document.body.innerHTML += '<audio id="chatAudio"><source src="https://cdn.pixabay.com/download/audio/2022/10/16/audio_10bebc0b9f.mp3" type="audio/mpeg"></audio>';
    document.getElementById('chatAudio').play();

    alert('It\'s enought for today. See You tomorrow');
  return false;
}

async function logout() {
  console.log('logout');
  LocalStorageManager.setToLocalStorage(LOCAL_STORAGE_ACTIVE_USER_INDEX, null);
  //click "more"
  await delay(3000);
  var links = document.getElementsByClassName(MORE_BUTTON_SELECTOR);
  links[links.length - 1].click();

  //click logout
  await delay(3000);
  var links = document.getElementsByClassName(LOG_OUT_SELECTOR);
  links[links.length - 1].click();
  await delay(500);
  window.location = LOGIN_PAGE_URL;
}

async function login() {
  var account = getNextAccount();
  var encryptionData = getEncryptionData();
  await delay(3000);
  var postData = await generatePostDataForSignIn(account.name, account.password, encryptionData.key_id, encryptionData.public_key, encryptionData.version);
  await delay(3000);
  var authenticated = false;
  let xhr = GM_xmlhttpRequest({
    method: "POST",
    url: LOGIN_REQUEST_URL,
    data: postData,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.7,pl;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.instagram.com/accounts/login/?__coig_restricted=1',
      'Origin': 'https://www.instagram.com',
      'Connection': 'keep-alive',
      'Cookie': document.cookie,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'same-origin',
      'TE': 'trailers',
      'X-CSRFToken': window.getCookie('csrftoken'),
      'X-Instagram-AJAX': '1007942130',
      'X-IG-App-ID': '936619743392459',
      'X-ASBD-ID': '129477',
      'X-IG-WWW-Claim': 'hmac.AR15nQElFH7hyC1ku3NnlhMF41qM0wysU1cgXrYkYx1ui0h0',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Alt-Used': 'www.instagram.com',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    },
    onload: function (response) {
      authenticated = JSON.parse(response.response).authenticated;
    }
  });
  await delay(4000);
  if (authenticated != true) {
    alert(NON_AUTHENTICATED_MESSAGE);
  } else {
    LocalStorageManager.setToLocalStorage(LOCAL_STORAGE_ACTIVE_USER_INDEX, account);
  }
  await delay(1500);
  location.reload()
}


function getEncryptionData() {
  const scripts = document.querySelectorAll('script');
  let encryptionData = null;
  scripts.forEach(script => {
    const regex = /\\"encryption\\":{\\"key_id\\":\\"(\d+)\\",\\"public_key\\":\\"([a-f0-9]+)\\",\\"version\\":\\"(\d+)\\"}/;
    const match = script.innerHTML.match(regex);
    if (match) {
      encryptionData = {
        key_id: match[1],
        public_key: match[2],
        version: match[3]
      };
    }
  });
  return encryptionData;
}

async function likeProcedure() {
  console.log('likeProcedure');
  await delay(4000);

  var username = getActiveUserUsername();
  var activeUser = getActiveUser();
  if (username == '') {
    console.log('sth went wrong in active user assignment process, logging out');
    logout();
  }
  //click on the second photo
  document.getElementsByClassName(PHOTO_SELECTOR)[2].click();

  await delay(4000);


  var count = 0;
  //get current user limit
  var userData = LocalStorageManager.getFromLocalStorage(username);
  if (userData == undefined) {
    userData = {'executionCount': count, 'lastLikeTime': Date.now()};
    LocalStorageManager.setToLocalStorage(username, userData);
  }
  var changeLocationEvery = Math.floor(maxExecutions / activeUser.locations.length);
  if (userData !== null && (Date.now() - userData.lastLikeTime) < (24 * 60 * 60 * 1000)) {
    count = userData.executionCount;
  }
    var firstLikeInLocation = true;
    do {
        if (document.getElementsByClassName(PHOTO_BUTTONS_SELECTOR)[LIKE_BUTTON_INDEX] != undefined && document.getElementsByClassName(PHOTO_BUTTONS_SELECTOR)[LIKE_BUTTON_INDEX].textContent == 'Like') {
            if (document.getElementsByClassName(LIKE_AMOUNT_TEXT_SELECTOR)[0] === undefined)
                {
                    await clickLike();
                    count++;
                    firstLikeInLocation = false;
                    console.log(count);
                } else if (document.getElementsByClassName(LIKE_AMOUNT_TEXT_SELECTOR)[0].querySelector('span') != null && document.getElementsByClassName(LIKE_AMOUNT_TEXT_SELECTOR)[0].querySelector('span').textContent < maxLikes) {
                    await clickLike();
                    count++;
                    firstLikeInLocation = false;
                    console.log(count);
                }
            }
            await nextPhoto();
        console.log(count);
            LocalStorageManager.setToLocalStorage(username, {'executionCount': count, 'lastLikeTime': Date.now()});
        getStats();
            await delay(MAX_WAITING_TIME_BEFORE_NEXT/ 2);
        console.log(count); console.log(changeLocationEvery);
        console.log("result: " + (count % changeLocationEvery));
        } while (count % changeLocationEvery != 0 && !firstLikeInLocation)
        if (count <= 300) {
          window.location = getNextLocationUrl();
        } else {
          logout();
        }
}

async function nextPhoto()
{
  delay(2600).then(() => document.getElementsByClassName(NEXT_PREVIOUS_SHARE_BUTTONS_SELECTOR)[NEXT_BUTTON_INDEX].click());
}

async function clickLike()
{
  document.getElementsByClassName(PHOTO_BUTTONS_SELECTOR)[LIKE_BUTTON_INDEX].click();
}


async function delay(time) {
  console.info('Waiting: ' + time / 1000 + ' seconds');
  return new Promise(resolve => setTimeout(resolve, time));
}

class LocalStorageManager {

  static getRawFromLocalStorage(name) {
    return window.localStorage.getItem(name);
  }
  static getFromLocalStorage(name) {
    return JSON.parse(window.localStorage.getItem(name))
  }

  static setToLocalStorage(name, value) {
    window.localStorage.setItem(name, JSON.stringify(value));
  }
}

function getStats() {
  var activeUser = getActiveUserUsername();
  var outputText = 'LOGGED IN AS:' + activeUser;
    outputText += '\nAll accounts statistics:';

  allProfiles = accounts;
  if (allProfiles == null) {
    alert('You have to add account in script\'s account const!');
  }
  for (var i = 0; i < allProfiles.length; i++) {
    var userData = LocalStorageManager.getFromLocalStorage(allProfiles[i].name);
    if (userData == null) {
      continue;
    }
    var date = new Date(userData.lastLikeTime);
    date.setDate(date.getDate() + 1);
    var dateFormat = date.getHours() + ":" + date.getMinutes() + ", " + date.toDateString();

    executionCount = userData.executionCount;

    if (userData == null || (Date.now() - userData.lastLikeTime) > (24 * 60 * 60 * 1000)) {
      dateFormat = 'READY TO PROCESS';
      executionCount = 0;
    }

    outputText += "\n " + allProfiles[i].name + ": \n \t used likes: " + executionCount + '/' + maxExecutions + "\n \t resets at: " + dateFormat + "\n";
  }
  //console.clear()
  console.log(outputText);
}

