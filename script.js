// ==UserScript==
// @name        Instagram like automation
// @namespace   Violentmonkey Scripts
// @match       https://www.instagram.com/*
// @grant       GM_xmlhttpRequest
// @version     2.2
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

const locationsUrls = {
  warsaw: "https://www.instagram.com/explore/locations/228089762273/",
  poznan: "https://www.instagram.com/explore/locations/106017852771295/",
  wroclaw: "https://www.instagram.com/explore/locations/187752695320/",
  boleslawiec: "https://www.instagram.com/explore/locations/237333900/",
  zgorzelec: "https://www.instagram.com/explore/locations/108144965872455",
  jelenia: "https://www.instagram.com/explore/locations/112377815445943"
}

// Maybe it's not the safest option to store these, but it solves instagram issue with logging out user randomly + saved accounts credential limit. Your login data is saved only in this file, and isnt send anywhere, so its relativly safe
const accounts =
  [
    { name: "yourUsername", password: "yourPassword", locations: ["poznan", "warsaw", "wroclaw"], maxExecutions: 300 }
  ];

// If photo have more then this, we'll just skip it ;)
const maxLikes = 100;

// sometimes phone verification is required. Provide phone number to which sms should be sent
const phoneNumber = "yourPhoneNumber";

/**
 * OTHER CONSTS IN CASE INSTAGRAM CHANGE ANYTHING, YOU CAN FIX IT HERE
 **/

// selector for element existing only at logged out homepage
const LOGGED_OUT_SELECTOR = 'xamitd3 xm2v1qs x322q5f xx54hvc x1vk3w4 xuyhj88 xod5an3 x1gja9t xcd7kps xkxfa8k';
// text existing at login page - it can exist at logged out homepage, but shoud not exist at any other site
const LOGIN_PAGE_TEXT = 'Save login info';
const LOGIN_PAGE_TEXT_2 = 'Don\'t have an account?';
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

const LOGGED_OUT_ON_EXPLORE_PAGE = ' _ab8q _ab8w  _ab94 _ab99 _ab9c _ab9h _ab9m _ab9p  _abbg _abby  _ab9- _abab _abcf _abcg _abci _abck _aa5t _abcm';

const NEXT_PREVIOUS_SHARE_BUTTONS_SELECTOR = '[aria-label="Next"]';
const NEXT_BUTTON_INDEX = 1;
const MAX_WAITING_TIME_BEFORE_NEXT = 15000;
const MAX_POST_AUTHORS_SAVED = 300;
const LOGIN_REQUEST_URL = 'https://www.instagram.com/api/v1/web/accounts/login/ajax/';
const NON_AUTHENTICATED_MESSAGE = 'sth went wrong on loggining in, check console, and make sure You inputed right credentials';

// selector for nickname of current loaded photo(post)
const CURRENT_POST_AUTHOR_SELECTOR = 'x1lliihq x1plvlek xryxfnj x1n2onr6 x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye xvs91rp x1s688f x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj';

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
  Notification.requestPermission().then((result) => {
    console.log(result);
  });
  // keeping sure, document is loaded
  await delay(15000);

  if (document.getElementsByClassName(LOGGED_OUT_SELECTOR).length > 0 || document.getElementsByClassName(LOGGED_OUT_ON_EXPLORE_PAGE).length > 0) {
    //logged out
    console.log('going to login page');
    window.location = LOGIN_PAGE_URL;
  } else if ((document.documentElement.textContent || document.documentElement.innerText
  ).indexOf(LOGIN_PAGE_TEXT) > -1 || (document.documentElement.textContent || document.documentElement.innerText
  ).indexOf(LOGIN_PAGE_TEXT_2) > -1) {
    console.log('on login page, gonna login');
    // in instagram login page
    login();
  }
  else if (document.getElementsByClassName(EXPLORE_SELECTOR).length > 0) {
    console.log('start like procedure');
    // in explore page
    likeProcedure();
  }
  else if (document.querySelector('[aria-label="Dismiss"]') != undefined) {
    await delay(5000);
    document.querySelector('[aria-label="Dismiss"]').click();
  }
  else if (document.querySelector('[placeholder="Phone number"]') != undefined) {
    await fetch("https://www.instagram.com/api/v1/challenge/web/action/", {
      "credentials": "include",
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.7,pl;q=0.3",
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "same-origin",
        "X-CSRFToken": "psKO7W7lwk3XODAsvhMmMGhPjmry9A8r",
        "X-Instagram-AJAX": "1010621699",
        "X-IG-App-ID": "936619743392459",
        "X-ASBD-ID": "129477",
        "X-IG-WWW-Claim": "hmac.AR1v_-G0wzXNAK2Z1O_x_lJezvjnOTwnHpb8c1MYP2SkT4T3",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache"
      },
      "referrer": "https://www.instagram.com/challenge/?next=https%3A%2F%2Fwww.instagram.com%2Fexplore%2Flocations%2F106017852771295%2F%3F__coig_challenged%3D1",
      "body": "challenge_context=Af5xttf3v8qtUB4WqRACgUXBA8vFJU8XwEVbbmtW9E_O-ctJUlQPB40nfbF4I_hk0ZZK-W3GSQfxdKkvR2B2CpoanUl0X95eESd7jGChLF8yiLjkbUaBvaehIbv_LIU5pQhhLSntmCAX35tEsWTV2D5xGqh7gKAGSQpK0FHGig1ZgndmVXLfFLEDaLRK64JH_03c3LjZL3&phone_number=" + phoneNumber + "&next=https%3A%2F%2Fwww.instagram.com%2Fexplore%2Flocations%2F106017852771295%2F%3F__coig_challenged%3D1",
      "method": "POST",
      "mode": "cors"
    });
    await delay(5000);
    window.location = INSTAGRAM_DOMAIN;
  } else if (document.querySelector('[placeholder="Enter Code"]') != undefined) {
    var text = 'Insert code you received at Your phone (' + phoneNumber + ')';
    var notification = new Notification("INSTAGRAM BOT", { body: text, icon: "https://github.com/GrzegorzWalewski/instagramLikeAutomation/assets/25950627/63da9fc7-f092-4ad1-ae83-8e7cfdb3b165", requireInteraction: true });

    notification.onerror = function (event) {
      alert(text);
    };
  }
  else {
    // any other page
    console.log('going to the next location url');
    window.location = getNextLocationUrl();
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
  if (user != null) {
    return user.name;
  }
  return "";
}

function getActiveUser() {
  return LocalStorageManager.getFromLocalStorage(LOCAL_STORAGE_ACTIVE_USER_INDEX);
}


function getNextLocationUrl() {
  var activeUser = getActiveUser();
  if (activeUser == null) {
    logout();
  }
  var userData = LocalStorageManager.getFromLocalStorage(activeUser.name);
  var activeUserAccount = accounts.find(obj => obj.name === activeUser.name);
  var changeEvery = Math.floor(activeUserAccount.maxExecutions / activeUserAccount.locations.length);
  console.log('change every ' + changeEvery);

  if (userData != null && userData.executionCount % changeEvery == 0) {
    locationIndex = Math.floor(userData.executionCount / changeEvery);
    if (locationsUrls[activeUser.locations[locationIndex]] == undefined) {
      locationIndex = 0
    }
  } else {
    locationIndex = 0;
  }
  return locationsUrls[activeUser.locations[locationIndex]];
}

function getNextAccount() {
  allProfiles = accounts;
  var nextScriptExecutionTime = Date.now() + day * 2;
  for (var i = 0; i < allProfiles.length; i++) {
    var userData = LocalStorageManager.getFromLocalStorage(allProfiles[i].name);

    if (userData == null || (Date.now() - userData.lastLikeTime) > (day) || userData.executionCount < userData.maxExecutions) {
      return allProfiles[i];
    }

    if (userData != null && nextScriptExecutionTime > userData.lastLikeTime + day) {
      nextScriptExecutionTime = userData.lastLikeTime + day;
    }
  }
  var nextScriptExecutionDate = new Date(nextScriptExecutionTime);
  document.title = 'It\'s enought for today. See You tomorrow';
  document.body.innerHTML += '<audio id="chatAudio"><source src="https://cdn.pixabay.com/download/audio/2022/10/16/audio_10bebc0b9f.mp3" type="audio/mpeg"></audio>';
  document.getElementById('chatAudio').play();

  alert('Refrest this page at: ' + nextScriptExecutionDate.getHours() + ":" + nextScriptExecutionDate.getMinutes() + ", " + nextScriptExecutionDate.toDateString());
  return false;
}

async function logout() {
  console.log('logout');
  LocalStorageManager.setToLocalStorage(LOCAL_STORAGE_ACTIVE_USER_INDEX, null);
  let xhr = GM_xmlhttpRequest({
    method: "POST",
    url: "https://www.instagram.com/api/v1/web/accounts/logout/ajax/",
    data: "one_tap_app_login=0&user_id=1522031065",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.7,pl;q=0.3",
      'X-CSRFToken': window.getCookie('csrftoken'),
      "X-Instagram-AJAX": "1009646321",
      "X-IG-App-ID": "936619743392459",
      "X-ASBD-ID": "129477",
      "X-IG-WWW-Claim": "hmac.AR3Lf0lROTQxLpmT3V4bafp8WGA8Fym_F0peerVA9Soj9x9f",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin"
    },
    onloadend: function () {
      window.location = LOGIN_PAGE_URL;
    }
  });
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
      if (authenticated != false) {
        LocalStorageManager.setToLocalStorage(LOCAL_STORAGE_ACTIVE_USER_INDEX, account);
      }
    },
    onloadend: function () {
      location.reload();
    }
  });
}


function getEncryptionData() {
  const scripts = document.querySelectorAll('script');
  let encryptionData = null;
  scripts.forEach(script => {
    const regex = /"key_id":"(\d+)","public_key":"([a-f0-9]+)","version":"(\d+)"/g;
    const match = regex.exec(script.innerHTML);

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
  var activeUserAccount = accounts.find(obj => obj.name === username);
  if (userData == undefined) {
    userData = { 'executionCount': count, 'lastLikeTime': Date.now(), 'maxExecutions': activeUserAccount.maxExecutions };
  } else {
    userData.maxExecutions = activeUserAccount.maxExecutions;
  }
  LocalStorageManager.setToLocalStorage(username, userData);
  var changeLocationEvery = Math.floor(userData.maxExecutions / activeUser.locations.length);
  if (userData !== null && (Date.now() - userData.lastLikeTime) < (24 * 60 * 60 * 1000)) {
    count = userData.executionCount;
  }
  var firstLikeInLocation = true;
  do {
    var likeButtonExists = document.getElementsByClassName(PHOTO_BUTTONS_SELECTOR)[LIKE_BUTTON_INDEX] != undefined && document.getElementsByClassName(PHOTO_BUTTONS_SELECTOR)[LIKE_BUTTON_INDEX].textContent == 'Like';
    var postHasZeroLikesOrLikesAmmountUnderLimit = document.getElementsByClassName(LIKE_AMOUNT_TEXT_SELECTOR)[0] === undefined || (document.getElementsByClassName(LIKE_AMOUNT_TEXT_SELECTOR)[0].querySelector('span') != null && document.getElementsByClassName(LIKE_AMOUNT_TEXT_SELECTOR)[0].querySelector('span').textContent < maxLikes);
    var authorNotLikedLately = true;
    if (document.getElementsByClassName(CURRENT_POST_AUTHOR_SELECTOR)[0] !== undefined) {
      var postAuthor = document.getElementsByClassName(CURRENT_POST_AUTHOR_SELECTOR)[0].innerText;
      authorNotLikedLately = !wasLikedLately(username, postAuthor);
    }

    if (authorNotLikedLately && likeButtonExists && postHasZeroLikesOrLikesAmmountUnderLimit) {
      await clickLike();
      count++;
      firstLikeInLocation = false;
      addToRecentlyLiked(username, postAuthor);
    }
    if (document.querySelector(NEXT_PREVIOUS_SHARE_BUTTONS_SELECTOR) != null) {
      await nextPhoto();
    } else {
      window.location = getNextLocationUrl();
    }
    saveExecutionCount(username, count, true);
    getStats();
    await delay(MAX_WAITING_TIME_BEFORE_NEXT / 2);
  } while ((count % changeLocationEvery != 0 || firstLikeInLocation) && count <= userData.maxExecutions)
  if (count <= userData.maxExecutions) {
    window.location = getNextLocationUrl();
  } else {
    logout();
  }
}

async function nextPhoto() {
  delay(2600).then(() => document.querySelector(NEXT_PREVIOUS_SHARE_BUTTONS_SELECTOR).parentElement.click());
}

async function clickLike() {
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

    outputText += "\n " + allProfiles[i].name + ": \n \t used likes: " + executionCount + '/' + userData.maxExecutions + "\n \t resets at: " + dateFormat + "\n";
  }
  console.clear();
  console.log(outputText);
}

function wasLikedLately(username, postAuthor) {
  var recentlyLiked = getRecentlyLiked(username);

  if (recentlyLiked.includes(postAuthor)) {
    return true;
  }

  return false;
}

function addToRecentlyLiked(username, postAuthor) {
  var recentlyLiked = getRecentlyLiked(username);
  recentlyLiked.push(postAuthor);

  // remove oldest postAuthor
  if (recentlyLiked.length > MAX_POST_AUTHORS_SAVED) {
    recentlyLiked.shift();
  }
  saveRecentlyLiked(username, recentlyLiked);
}

function getRecentlyLiked(username) {
  var userData = LocalStorageManager.getFromLocalStorage(username);

  if (userData != null && userData.recentlyLiked != null) {
    return userData.recentlyLiked;
  }

  return [];
}

function saveRecentlyLiked(username, recentlyLiked) {
  var userData = LocalStorageManager.getFromLocalStorage(username);
  userData.recentlyLiked = recentlyLiked;

  LocalStorageManager.setToLocalStorage(username, userData);
}

function saveExecutionCount(username, executionCount, updateLastExecution) {
  var userData = LocalStorageManager.getFromLocalStorage(username);
  userData.executionCount = executionCount;

  if (updateLastExecution) {
    userData.lastLikeTime = Date.now();
  }

  LocalStorageManager.setToLocalStorage(username, userData);
}