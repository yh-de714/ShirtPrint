const sliderThumbs = new Swiper(".slider__thumbs .swiper-container", {
	direction: "vertical", 
	slidesPerView: 3, 
	spaceBetween: 10,
	freeMode: true, 
	breakpoints: {
		0: {

			direction: "horizontal" 
		},
		768: {

			direction: "vertical" 
		}
	}
});

const sliderImages = new Swiper(".slider__images .swiper-container", {
	direction: "vertical", 
	slidesPerView: 1, 
	spaceBetween: 32, 
	mousewheel: true,
	grabCursor: true, 
	thumbs: {
		swiper: sliderThumbs 
	},
	breakpoints: {
		0: {

			direction: "horizontal" 
		},
		768: {
			direction: "vertical" 
		}
	}
});

$('#register-button').on('click',function(e){
	e.preventDefault();
	var newUserName = $('#new-username').val();
	var newUserEmail = $('#new-useremail').val();
	var newUserPassword = $('#new-userpassword').val();
	$.ajax({
		type: "POST",
		url:  themeAjaxUrl,
		data: {
			action: "register_user_front_end",
			new_user_name : newUserName,
			new_user_email : newUserEmail,
			new_user_password : newUserPassword
		},
		success: function(results){
			$('.register-message').text(results).show();
		},
		error: function(results) {
			$('.register-message').text(results).show();
		}
	});
});
$('#login-button').on('click',function(e){
	e.preventDefault();
	var username = $('#username').val();
	var pass = $('#password').val();
	var agree = $('#agree').val();
	$.ajax({
	  type: 'POST',
	  url: themeAjaxUrl,
	  data: {
	  	action: "login_user_front_end",
	  	username: username, 
		password: pass, 
		security: agree
	  },
	  success: function(response) { 
		window.location.replace(baseSiteUrl);
	  },
	  error: function(results) {
		  $('.register-message').text(results).show();
	  }
	});
});
$('#logout').on('click',function(e){
	e.preventDefault();
	$.ajax({
		type: "POST",
		url: themeAjaxUrl,
		data: {
			action: 'logout_user'
		},
		success: function (output) { // if data is returned from your function you can pick it up using output now. 
			window.location.replace(baseSiteUrl + "login");//log it to your console so you can see what is returned.
		},
	});

});