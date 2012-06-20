/**
*  LiveSpeaker jQuery UI widget  
*  depends :
*  * underscore.js
*  * ucewidgets.js
*  * jqueryUI
*
*  Copyright (C) 2011 CommOnEcoute,
*  maintained by Elias Showk <elias.showk@gmail.com>
*/

(function($) {

$.uce.LiveSpeaker = function(){};
$.uce.LiveSpeaker.prototype = {
    options: {
        ucemeeting: null,
        uceclient: null,
        userCanSpeak: null,
        width: 900,
        height: 600,
        speakerformContainer: $("#livespeakerform")
    },
    /*
     * UCEngine events listening
     */
    meetingsEvents: {
        "livespeaker.message.new"           : "_newAnnoucement",
        "pseudolivemanager.live.open"       : "_handleOpen",
        "pseudolivemanager.live.close"      : "_handleClose",
        "livemanager.live.open"       : "_handleOpen",
        "livemanager.live.close"      : "_handleClose"
    },
    /*
     * UI initialize
     */
    _create: function() {
        this.show();
        if(this.options.userCanSpeak) {
            this.initSpeakerInput();
        } else {
            this.options.speakerformContainer.hide();
            var that = this;
            this.options.uceclient.user.can(
                this.options.uceclient.uid, 
                "add",
                "event",
                {type: "livespeaker.message.new"},
                "localhost",
                function(err, result, xhr){
                    if(result===true) {
                        that.initSpeakerInput();
                    } else {
                        that.options.speakerformContainer.hide();
                    }
            });
        }
    },
    _newAnnoucement: function(event) {
        if(event.metadata.htmlMode==="true") {
            // FIXME don't force h3 !
            this.element.children(".ui-livespeaker-display").html('<h3>'+
                event.metadata.text +'</h3>');
        } else {
            this.element.children(".ui-livespeaker-display").text(event.metadata.text);
        }
    },
    /*
    * Annoucement form event initialization
    */
    initSpeakerInput: function() {
        var that = this;
        $(".ui-livespeaker-submit").click(function(){
            var text = $(".ui-livespeaker-input");
            if(text.val()==="") {
                return false;
            }
            if(text.val().length > 600) {
                alert("post too long, please be more concise");
                return false;
            }
            var metadata = {
                title: $('head > title').text(),
                href: location.href,
                text: text.val(),
                // FIXME add a checkbox for this options
                htmlMode: "true"
            };

            that.postNewAnnoucement(metadata, that.sharePost);
            text.val("");
            $(".ui-livespeaker-input-numChar").text("600");
            return false;
        });
        $(".ui-livespeaker-input").keyup(function(event) {
            var numCharField = $(".ui-livespeaker-input-numChar");
            
            if ($(".ui-livespeaker-input").val().length <= 600){
                numCharField.css({"color":"#8E8E8E"});
            }
            else{
                numCharField.css({"color":"#9c100c"});
            }
            numCharField.text((600 - $(".ui-livespeaker-input").val().length).toString());
            if ( event.keyCode == 27 ) {
                $(".ui-livespeaker-input").val("");
            }
        });
        $(".ui-livespeaker-input").keypress(function(event) {
            if ( event.which == 13 ) {
                event.preventDefault();
                $(".ui-livespeaker-submit").click();
            }
        });
        this.options.speakerformContainer.show();
    },
    /*
     * Event sender
     * Public method posting a new annoucement
     */
    postNewAnnoucement: function(metadata, successcallback) {
        var it = this;
        this.options.ucemeeting.push(
            "livespeaker.message.new",
            metadata,
            function(err, data, xhr) {
                if(err) {
                    if(err==401) {
                        it.options.ucemeeting.trigger({
                            'type': "internal.user.disconnected", 
                            'id': Date.now().toString(), 
                            'metadata': { error: err }
                        });
                    }
                } else {
                    // FIXME : suscribe to twitter feed here ?
                    successcallback(metadata);
                }
            }
        );
    },
	/*
	 * UCE event handler
	 */
    _handleOpen: function(event) {
        this.hide();
    },
	/*
	 * UCE event handler
	 */
    _handleClose: function(event) {
        this.show();
    },
    /*
     * Main function sending post to other planets
     */
    sharePost: function(metadata) {
        var toFacebook = ($('#livespeakerform #ui-postform-share-facebook').hasClass('dim') === true);
        var toTwitter = ($('#livespeakerform #ui-postform-share-twitter').hasClass('dim') === true);
        if(toTwitter===true && window.twttr !== undefined) {
            var windowOptions = "scrollbars=yes,resizable=yes,toolbar=no,location=yes,width=450,height=500,top=300,left=400";
            var twpublish = {
                url: metadata.href,
                via: "commonecoute",
                text: (metadata.text.length > 110) ? metadata.text.slice(0,110) + "..." : metadata.text,
                related: "commonecoute"
            };
            $("#twitter-intents-a").attr("href",  $("#twitter-intents-a").attr("href") +
                $.param(twpublish)
            );
            window.open( $("#twitter-intents-a").attr("href"), "intents", windowOptions);
        }
        if(toFacebook===true && FB !== undefined) {
            var publish = {
                method: 'feed',
                message: metadata.text,
                caption: 'Un concert sur CommOnEcoute',
                name: metadata.title,
                description: metadata.text,
                link: metadata.href,
                picture: 'http://cdn.commonecoute.fr/images/layout/header-logo.png',
                actions: [
                    { name: 'commonecoute', link: 'http://commonecoute.fr/' }
                ],
                user_message_prompt: 'Share your Annoucement' 
            };

            FB.ui(publish, function(){});
        }
    },
    show: function() {
        this.element.show();
    },
    hide: function() {
        this.element.hide();
    },
    setSize: function(w, h) {
        this.element.width(getOverlayWidth());
		this.element.height(getOverlayHeight());
		/* On oublies pas le pseudo live */
		$('#livespeakerform').width(w);
		$('.ui-livespeaker-input').width(h);
    }
};
if($.uce.widget!==undefined) {
    $.uce.widget("livespeaker", new $.uce.LiveSpeaker());
}

})($);
