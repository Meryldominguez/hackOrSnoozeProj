$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $editForm = $("#edit-article-form")
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $newArticle = $("#nav-new-article")
  const $favButton = $(".favorite-button")
  const $navFav = $("#nav-favorites")
  const $favDiv = $("#user-favorites")
  const $favList = $("#favorited-articles")
  const $navProfile = $("#nav-profile")
  const $profileDiv = $("#user-profile")
  const $profileEditBtn = $("#user-info-edit-button")
  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  //global username and token variables

  await checkIfLoggedIn();
  console.log(currentUser)
  console.log(storyList)
  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle()
  });


  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    if(await checkIfLoggedIn())
    {$profileDiv.attr("class","hidden");
    hideElements();
    $allStoriesList.empty()
    await generateStories(0);
    $allStoriesList.show();}
  });

 //show/hide newArticle form
 $newArticle.on("click",()=>{
  $submitForm.toggleClass("hidden")
  $favDiv.addClass("hidden")
  $allStoriesList.attr("class","articles-list")
  $profileDiv.attr("class","hidden")
  

})
//submit new article
  $submitForm.on("submit", async function(evt) {
    evt.preventDefault(); 

    // no page-refresh on submit
    const newStoryObj = {
      author: $("#author").val(),
      title:$("#title").val(),
      url: $("#url").val()
    }

    $("#submit-form input").val("")
    $submitForm.toggleClass("hidden")


    const newStory = new Story(newStoryObj)

    await storyList.addStory(currentUser,newStory)
    $allStoriesList.empty()
    
    await generateUserSubmitted()

    await generateStories(0)

  });
//show/hide user favorites
$navFav.on("click",async()=>{
  $favDiv.toggleClass("hidden")
  $allStoriesList.removeClass("hidden")
  $submitForm.addClass("hidden")
  $profileDiv.attr("class","hidden")
  

})
//show.hide profile and user submitted articles
$navProfile.on("click",async()=>{
  $favDiv.addClass("hidden")
  $profileDiv.toggleClass("hidden container")
  $submitForm.addClass("hidden")
  await showCurrentUser()
})





  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    try {
      currentUser = await User.getLoggedInUser(token, username)
    } catch (error) {
      alert(error)
    }

    if (currentUser) {
      showNavForLoggedInUser();
      $allStoriesList.empty()
      await generateStories(0);
      $favList.empty()
      await generateUserFavorites()
      $ownStories.empty()
      await generateUserSubmitted()
      await showCurrentUser()
      return true

    }else{
      $allStoriesList.empty()
      $allStoriesList.append($("<h3> Sign in or Login for articles and news!</h3>"))
      return false
    }
  }
  
  async function showCurrentUser(){
    
    $("#profile-name").text(`Name: ${currentUser.name}`)
    $("#profile-username").text(`Username: ${currentUser.username}`)
    $("#profile-account-date").text(`Account Created: ${currentUser.createdAt}`)
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  async function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.empty()
    $allStoriesList.attr("style","")

    await showCurrentUser()
    await generateStories(0);

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories(skip) {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories(skip);
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    // loop through all of our stories and generate HTML for them
    
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story, $allStoriesList, "&#9734");
    }
    
  }
  
  async function populateScroll() {
        await generateStories(storyList.stories.length)

  }
  //infinite scroll
  $allStoriesList.on("scroll", ()=>{
    var scrollHeight = $(document).height();
    var scrollPos = $(window).height() + $(window).scrollTop();
    
    if ((scrollHeight - scrollPos) / scrollHeight >= -2) {
      populateScroll()
    };
    
  })


    


  
  /**
   * A function to render HTML for an individual Story instance
   */
 
  function generateStoryHTML(story, location, icon) {
    let hostName = getHostName(story.url);
    
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <a id="button-${story.storyId}"class="favorite favorite-button">${icon}</a>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    ;
    storyMarkup.appendTo(location)
  }



  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $loginForm,
      $createAccountForm,
      $favDiv,
    ];
    elementsArr.forEach($elem => $elem.addClass("hidden"));
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $newArticle.show()
    $navFav.show()
    $navProfile.show()


  }
 


 async function generateUserFavorites(){
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    currentUser = await User.getLoggedInUser(token, username)

   $favList.empty()
    if (currentUser.favorites.length !== 0){
     currentUser.favorites.map((story) => {
       generateStoryHTML(story,$favList,"&#9733")
      })
    }else{
       $("<h5>")
        .text("You have no favorited Articles!")
        .appendTo($favList) }
  }

  //add favorites to user favorite list
  $allStoriesList.on("click",".favorite",async(e)=>{
    await User.addFavorite(e.target.parentElement.id);
    console.log(e.target.parentElement.id)
    $favList.empty()
    await generateUserFavorites()

  })
  //remove favorites
  $favDiv.on("click",".favorite",async(e)=>{
    await User.removeFavorite(e.target.parentElement.id)
    await generateUserFavorites()

  })

//populate the profile section
  async function generateUserSubmitted(){
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    currentUser = await User.getLoggedInUser(token, username)

  $ownStories.empty()
    if (currentUser.ownStories.length === 0){
      $("<h5>")
        .text("You have no stories that you've submitted")
        .appendTo($ownStories)
    }else{
      currentUser.ownStories.map(story => {
        generateStoryHTML(story,$ownStories,"&#9998")
      })

    }
  }
//edit stories
//edit stories

$ownStories.on("click",".favorite",(e)=>{
  var storyId = (e.target.parentElement.id)
  $editForm.attr("class", "")
  $("#edit-title").val(e.target.nextSibling.nextSibling.innerText)
  $("#edit-author").val(e.target.nextSibling.nextSibling.nextSibling.nextSibling.innerText.slice(3))
  $("#edit-url").val(e.target.nextSibling.nextSibling.href)
$("#story-edit-button").on("click", async (e)=>{
    e.preventDefault()
    const newStoryObj = new Story({title: $("#edit-title").val(),author:$("#edit-author").val(),url:$("#edit-url").val(),storyId:storyId})
    
    await User.editStory(storyId,newStoryObj)
    $ownStories.empty()
    await generateUserSubmitted()
    $editForm.addClass("hidden")
    })
$("#story-delete-button").on("click", async(e)=>{
    e.preventDefault()
    await User.deleteStory(storyId)
    $ownStories.empty()
    await generateUserSubmitted()
    $editForm.addClass("hidden")
    
  })  
})

$profileEditBtn.on("click",async()=>{
  $("#profile-info").toggleClass("hidden");

let name = $("#profile-name").text().slice(6)
console.log(name)
let username = $("#profile-username").text().slice(10)
console.log(username)
$("#profile-edit-form").attr("class", "")
  $("#edit-name").val(name)
  $("#edit-username").val(username)



  $("profile-edit-submit").on("submit", async(e)=>{
    e.preventDefault()
    let userObj = new User({name:("#edit-name").val(),
    username:$("#edit-username").val()})
    await User.changeUserInfo(userObj)
    $("#profile-edit-form").attr("class", "hidden")
    $("#profile-info").attr("class", "")
    
  })

})

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
      
    }
  }

});
