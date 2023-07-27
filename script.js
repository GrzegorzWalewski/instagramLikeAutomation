// ==UserScript==
// @name        Auto liker, with account switcher 2023
// @namespace   Violentmonkey Scripts
// @match       https://www.instagram.com/*
// @grant       none
// @version     1.0
// @author      Grzegorz Grzojda Walewski
// @description 18.07.2023, 00:00:21
// ==/UserScript==

/**
 * ENTRY POINT
 * */
const urlParams = new URLSearchParams(window.location.search);
const action = urlParams.get('action');

init();

async function init()
{
  // keeping sure, document is loaded
  await delay(5000);
  getStats();
switch (action)
  {
    case 'switchAccount':
      switchAccount();
      break;
    case 'like':
      likeProcedure();
      break;
    default:
      window.location = 'https://www.instagram.com/explore/locations/293164558280563?action=like';
      break;
  }
}

function getActiveUserUsername()
{
   return document.getElementsByClassName('x1i10hfl xjbqb8w x6umtig x1b1mbwd xaqea5y xav7gou x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz _a6hd')[8].href.replace('https://www.instagram.com/','').replace('/','');
}

function getNextAccountName()
{
  allProfiles = LocalStorageManager.getFromLocalStorage('allProfiles');
  for (var i=0; i<allProfiles.length; i++)
    {
      var userData = LocalStorageManager.getFromLocalStorage(allProfiles[i]);
      if (userData == null || (Date.now() - userData.lastLikeTime) > (24 * 60 * 60 * 1000))
        {
          return allProfiles[i];
        }
    }
  alert('It\'s enought for today. See You tomorrow');
  return false;
}


async function likeProcedure()
{
    await delay(4000);

    var username = getActiveUserUsername();
    //click on the second photo
    document.getElementsByClassName('x5yr21d xu96u03 x10l6tqk x13vifvy x87ps6o xh8yej3')[1].click();


    var count = 0;
    //get current user limit
    var userData = LocalStorageManager.getFromLocalStorage(username);
    if (userData !== null && (Date.now() - userData.lastLikeTime) < (24 * 60 * 60 * 1000))
    {
      count = userData.executionCount;
    }

    var intervalId = window.setInterval(function(){
      if (document.getElementsByClassName('x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs xt0psk2 x1i0vuye xvs91rp x1s688f x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj')[0] === undefined)
      {
        document.getElementsByClassName('x1i10hfl x6umtig x1b1mbwd xaqea5y xav7gou x9f619 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x6s0dn4 xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x1ypdohk x78zum5 xl56j7k x1y1aw1k x1sxyh0 xwib8y2 xurb0ha')[3].click();
        count++;
      } else if (document.getElementsByClassName('x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs xt0psk2 x1i0vuye xvs91rp x1s688f x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj')[0].querySelector('span') != null && document.getElementsByClassName('x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs xt0psk2 x1i0vuye xvs91rp x1s688f x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj')[0].querySelector('span').textContent < 100) {
        document.getElementsByClassName('x1i10hfl x6umtig x1b1mbwd xaqea5y xav7gou x9f619 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x6s0dn4 xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x1ypdohk x78zum5 xl56j7k x1y1aw1k x1sxyh0 xwib8y2 xurb0ha')[3].click();
        count++;
      }

      delay(2600).then(() => document.getElementsByClassName('_abl-')[1].click());

      console.log('POLAJKOWANE: ' + count);
      LocalStorageManager.setToLocalStorage(username, {'executionCount': count, 'lastLikeTime': Date.now()});

      getStats();

      var nextAccountName = getNextAccountName();

      if (count >= 300) {
        if (nextAccountName) {
          window.location = 'https://instagram.com?action=switchAccount&account=' + nextAccountName;
        }

      }
    }, Math.random() * 15000);
}


async function switchAccount()
{
  var nextAccountName = urlParams.get('account');
  //click "more"
  await delay(3000);
  var links = document.getElementsByClassName('x9f619 xxk0z11 xii2z7h x11xpdln x19c4wfv xvy4d1p');
  links[links.length - 1].click();

  //click switch account
  await delay(3000);
  var links = document.getElementsByClassName('x1lliihq x1plvlek xryxfnj x1n2onr6 x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye xvs91rp xo1l8bm x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj');
  links[links.length - 2].click();

  //change max height so all accounts are displayed
  await delay(3000);
  document.getElementsByClassName('x9f619 xjbqb8w x78zum5 x168nmei x13lgxp2 x5pf9jr xo71vjh x1n2onr6 xw2csxc x1odjw0f x1iyjqo2 x2lwn1j xeuugli xdt5ytf xqjyukv x1qjc9v5 x1oa3qoh x1nhvcw1')[0].style += "max-height: unset;"

  //click on last profile from list
  await delay(3000);
  profiles = document.getElementsByClassName('xs83m0k xl56j7k x1sy10c2 x1h5jrl4 xieb3on xmn8rco x1iy3rx x1n2onr6 x1hfn5x7 x13wlyjk')[0].getElementsByClassName('x1lliihq x1plvlek xryxfnj x1n2onr6 x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye xvs91rp x1s688f x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj');  // save all profiles to localStorage
  var allProfilesArray = [];

  for (var i=0;i<profiles.length; i++)
    {
     allProfilesArray.push(profiles[i].innerText);
    }
  LocalStorageManager.setToLocalStorage('allProfiles', allProfilesArray);
  await delay(4000);
  for (var i=0; i<profiles.length; i++)
    {
      console.log(profiles[i]);
      console.log(nextAccountName);
      if (profiles[i].innerText.includes(nextAccountName))
        {
          profiles[i].click();
        }
    }

  // redirect to tag posts
  await delay(5000);
}



function delay(time) {
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

function getStats()
{
  var outputText = '';

  allProfiles = LocalStorageManager.getFromLocalStorage('allProfiles')
  if (allProfiles == null)
    {
      return;
    }
  for (var i = 0; i<allProfiles.length; i++)
    {
      var userData = LocalStorageManager.getFromLocalStorage(allProfiles[i]);
      if (userData == null) {
        continue;
      }
      var date = new Date(userData.lastLikeTime);
      date.setDate(date.getDate() + 1);
      var dateFormat = date.getHours() + ":" + date.getMinutes() + ", "+ date.toDateString();

      executionCount = userData.executionCount;

      if (userData == null || (Date.now() - userData.lastLikeTime) > (24 * 60 * 60 * 1000))
      {
        dateFormat = 'READY TO PROCESS';
        executionCount = 0;
      }

      outputText += "\n" + allProfiles[i] + ": \n \t used likes: " + executionCount + "\n \t resets at: " + dateFormat + "\n";
    }
  document.getElementsByClassName('_acb4')[0].style.minHeight = "200px";
  document.getElementsByClassName('_acb4')[0].style.backgroundColor = "lightblue";
  document.getElementsByClassName('_acb4')[0].style.width = "200px";
  document.getElementsByClassName('_acb4')[0].style.padding = "10px";
  document.getElementsByClassName('_acb4')[0].style.left = "unset !important";
  document.getElementsByClassName('_acb4')[0].style.right = "0px";
  document.getElementsByClassName('_acb4')[0].innerText = outputText;
}

