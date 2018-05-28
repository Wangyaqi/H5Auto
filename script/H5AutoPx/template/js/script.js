var current_page = $(".page_0");
var d_width = {{script_d_width}},
	d_height = {{script_d_height}},
	loaded = 0,
	w_width=0,
	w_height=0;

function page_init() {
	w_width = $(window).width() > d_width ? d_width : $(window).width();
	w_height = $(window).height() / w_width * d_width;
	$(".page_box").css({
		"width": d_width + "px",
		"height": d_height + "px",
		"top": (w_height - d_height) / 2 + "px"
	});
}

function page_show(obj) {}

function page_hide(obj) {}

function loader_text() {
	var total = $("img").length;
	$("img").on("load", function() {
		loaded++;
		$(".loader_text").text(parseInt(loaded / total * 100) + "%");
	});
}

function csswithprefix(a, b) {
	var pre = ["", "-o-", "-ms-", "-moz-", "-webkit-"];
	var withpre = {};
	$.each(pre, function(i) {
		withpre[pre[i] + a] = b;
	});
	return withpre;
}

var sliding = false;

function slideto(nextpage) {
	if(sliding) {
		return false;
	}
	sliding = true;
	var thispage = current_page;
	if(thispage.index() < nextpage.index()) {
		nextpage.show().css(csswithprefix("transform", "translate(0%, 100%)"));
		setTimeout(function() {
			thispage.addClass("page_transition").css(csswithprefix("transform", "translate(0%, -100%)"));
			nextpage.addClass("page_transition").css(csswithprefix("transform", "translate(0%, 0%)"));
		}, 100);

	} else {
		nextpage.show().css(csswithprefix("transform", "translate(0%, -100%)"));
		setTimeout(function() {
			thispage.addClass("page_transition").css(csswithprefix("transform", "translate(0%, 100%)"));
			nextpage.addClass("page_transition").css(csswithprefix("transform", "translate(0%, 0%)"));
		}, 100);
	}
	setTimeout(function() {
		thispage.removeClass("page_transition").hide();
		nextpage.removeClass("page_transition");
		page_hide(thispage);
		page_show(nextpage);
		current_page = nextpage;
		sliding = false;
	}, 500);
}

$(window).on("load", function() {
	if($(".music_btn").hasClass("music_play")) {
		$(".bgm")[0].play();
	}
	$(".page_0").fadeOut();
	var first_page = $(".page_1");
	first_page.fadeIn();
	page_show(first_page);
	page_hide($(".page_0"));
	current_page = first_page;
});

$(document).ready(function() {
	page_init();
	loader_text();
	var touch_sy = 0,
		touch_ey = 0;
	$(".view").on("touchstart", ".page", function(e) {
		touch_sy = e.originalEvent.targetTouches[0].clientY;
		touch_ey = e.originalEvent.targetTouches[0].clientY;
	});
	$(".view").on("touchmove", ".page", function(e) {
		e.preventDefault();
		touch_ey = e.originalEvent.targetTouches[0].clientY;
	});
	$(".view").on("touchend", ".page", function(e) {
		if(touch_sy - touch_ey > 50 && $(this).index() < $(".page").length - 1 && $(this).index() > 0 && !$(this).hasClass("slidenextdisable")) {
			slideto($(this).next());
		} else if(touch_ey - touch_sy > 50 && $(this).index() > 1 && !$(this).hasClass("slideprevdisable")) {
			slideto($(this).prev());
		}
	});
	$(".clickslide").click(function(e) {
		var nextpage = $($(this).attr("data-destination"));
		slideto(nextpage);
	});

	$(".music_btn").click(function(e) {
		if($(this).hasClass("music_play")) {
			$(this).removeClass("music_play").addClass("music_pause");
			$(".bgm")[0].pause();
		} else {
			$(this).removeClass("music_pause").addClass("music_play");
			$(".bgm")[0].play();
		}
	});
});