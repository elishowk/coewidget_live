/**
*  LiveClock is a simple Live Overlay window for a ucengine meeting
*  depends :
*  * ucewidget.js
*  * jquery UI
*  * a player uce widget
*
*  Copyright (C) 2011 CommOnEcoute,
*  maintained by Elias Showk <elias.showk@gmail.com>
*  source code at https://github.com/CommOnEcoute/ucengine-widgets
*   
*   LiveClock widget is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   Videotag is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with the source code.  If not, see <http://www.gnu.org/licenses/>.
*/

(function($) {

if (typeof $.uce === 'undefined') { $.uce = {}; }
$.uce.LiveClock = function(){};
$.uce.LiveClock.prototype = {
    options: {
        uceclient: null,
        ucemeeting: null,
        /* milliseconds */
        startLive: null,
        endLive: null,
        updateInterval: 15000
    },
    /*
     * UCEngine events listening
     * TODO parameters from controller to select whether live or pseudolive
     */
    meetingsEvents: {
        "pseudolivemanager.live.open"    : "_handleOpen",
        "pseudolivemanager.live.close"   : "_handleClose",
        "livemanager.live.open"          : "_handleOpen",
        "livemanager.live.close"         : "_handleClose"
    },
    _isClosed: true,
    _clockLoop: null,

    _create: function() {
        this._refreshServerTime();
        var that = this;
        this._clockLoop = window.setInterval(function(){
            that._refreshServerTime();
        }, this.options.updateInterval);
	},
    /*
     * GET time
     */
    _refreshServerTime: function(){
        this.options.uceclient.time.get($.proxy(this._incrementTime, this));
    },
    /*
     * time increment and refresh after a while
     */
    _incrementTime: function(err, result, xhr) {
        if(err===null) {
            this.element.data("time", result);
            this._updateDisplay();
        }
    },
	getLiveClock: function(){
		return this.element.data("time");			  
	},
    /*
    * Updates the display again and again
    */
    _updateDisplay: function() {
        if(this._isClosed===false) {
            this.element.addClass("ui-livemanager-banner-onair");
            this._stopClock();
        } else {
            this.element.removeClass("ui-livemanager-banner-onair");
            this._updateClock(this.element.data("time"));
        }
    },
    /*
     * UCE event handler
     */
    _handleOpen: function(event) {
        this.options.endLive = null;
        if(event.metadata.unixtime) {
            this._scheduledStart = true;
            this.options.startLive = event.metadata.unixtime;
        } else {
            this._scheduledStart = false;
            this.options.startLive = event.datetime;
        }
        this._isClosed = false;
    },
    /*
     * UCE event handler
     */
    _handleClose: function(event) {
        if(event.metadata.unixtime) {
            this._scheduledClose = true;
            this.options.endLive = event.metadata.unixtime;
        } else {
            this._scheduledClose = false;
            this.options.endLive = event.datetime;
        }
        this._isClosed = true;
    },

    /*
     * a clock that displays the time remaining
     */
    _updateClock: function(servertime) {
        // TODO alos use it when there's scheduledClose
        if (typeof this.options.startLive === "number" && this._scheduledStart===true) {
            // TODO
            /* this.element.countdown({
                until: new Date(servertime - this.options.startLive)
            });*/
            return;
        }
    },
    /*
     * Dumps the clock
     */
    _stopClock: function() {
        //this.element.html("");
    },

    destroy: function() {
        if(this._clockLoop!==null) {
            window.clearInterval(this._clockLoop);
        }
        this.element.find('*').remove();
        $.Widget.prototype.destroy.apply(this, arguments); // default destroy
    }
};

if($.uce.widget!==undefined) {
    $.uce.widget("liveclock", new $.uce.LiveClock());
}

})($);