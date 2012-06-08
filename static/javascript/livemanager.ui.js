/**
*  LiveManager is a simple Live Overlay window for a ucengine meeting
*  depends :
*  * ucewidget.js
*  * jquery UI
*
*  Copyright (C) 2011 CommOnEcoute,
*  maintained by Elias Showk <elias.showk@gmail.com>
*  source code at https://github.com/CommOnEcoute/ucengine-widgets
*   
*   LiveManager widget is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   LiveManager is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with the source code.  If not, see <http://www.gnu.org/licenses/>.
*/

(function($) {

if (typeof $.uce === 'undefined') { $.uce = {}; }
$.uce.LiveManager = function(){};
$.uce.LiveManager.prototype = {
    // Default options
    options: {
        uceclient: null,
        ucemeeting: null,
        /* milliseconds */
        startLive: null,
        endLive: null,
        buttonContainer: $('#livemanagerbutton'),
        livespeakerContainer: $('#livespeaker'),
        autoOpenInterval: 3000
    },
    /*
     * UCEngine events listening
     */
    meetingsEvents: {
        "livemanager.live.open"      : "_handleOpen",
        "livemanager.live.close"      : "_handleClose"
    },  
    _isClosed: true,

    _create: function() {
        this.element.addClass("ui-livemanager-overlay");
        var that = this;
        this.options.uceclient.user.can(
			this.options.uceclient.uid, 
			"add",
			"event",
			{type: "livemanager.live.open"},
			"localhost",
			function(err, result, xhr){
				if(result===true) {
					that.options.buttonContainer = that.options.buttonContainer.show();
					that.handleManagerButton();
				}
        });
        // TODO implement scheduled open and close live
        /*if(typeof this.options.startLive === "number" || typeof this.options.endLive === "number") {
            $(".ui-button-text", this.options.buttonContainer).append(
                $("<span>").text("configured with auto start at " +
                     Date(this.options.startLive).toISOString() +
                    "\n configured with auto close at " +
                    Date(this.options.endLive).toISOString())
            );
            this._autoOpenCloseLoop = window.setInterval(function(){
                that._autoOpenClose();},
                that.autoOpenInterval);
        }*/
    },

	/*
	 * UCE event handler
	 */
    _handleOpen: function(event) {
        this.options.startLive = event.datetime;
        this.options.endLive = null;
        this._isClosed = false;
        this.element.removeClass("ui-livemanager-overlay");
        this.element.hide();
        this.handleManagerButton();
    },
	/*
	 * UCE event handler
	 */
    _handleClose: function(event) {
        this.options.endLive = event.datetime;
        this._isClosed = true;
        this.element.addClass("ui-livemanager-overlay");
        this.element.show();
        this.handleManagerButton();
    },
    
    /*
	 * Switch button
	 */
    handleManagerButton: function() {
        if(this.options.buttonContainer === null) {
            return;
        }
        this.options.buttonContainer.unbind('click');
        var that = this;
        if(this._isClosed===true) {
            this.options.buttonContainer.text("Open the Live Now !");
            this.options.buttonContainer.unbind('click');
            this.options.buttonContainer.click(function(){
                that.options.ucemeeting.push('livemanager.live.open', {}, function(){
                    //console.log("opened the live !");
                });
            });
        } else {
            this.options.buttonContainer.text("Close the Live Now !");
            this.options.buttonContainer.unbind('click');
            this.options.buttonContainer.click(function(){
                that.options.ucemeeting.push('livemanager.live.close', {}, function(){
                    console.log("closed the live !");
                });
            });
        }
    },
    /*
	 * TODO
     * Scheduled event open and close
	 */
    _autoOpenClose: function() {
        // TODO use liveclock server time
        var millisec = Date.now();
        if (millisec>=this.options.endLive && this._isClosed===false) {
            that.options.ucemeeting.push('livemanager.live.close', {}, function(){
                console.log("auto closed the live !");
            });
        }
        else if (millisec>=this.options.startLive && this._isClosed===true) {
            that.options.ucemeeting.push('livemanager.live.open', {}, function(){
                console.log("auto opened the live !");
            });
        }
    },

    destroy: function() {
        this.element.find('*').remove();
        window.clearInterval(this._autoOpenCloseLoop);
        $.Widget.prototype.destroy.apply(this, arguments); // default destroy
    },
};

if($.uce.widget!==undefined) {
    $.uce.widget("livemanager", new $.uce.LiveManager());
}

})($);