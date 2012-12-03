/**
*  LiveClock is a simple Live Overlay window for a ucengine meeting
*  depends :
*  * ucewidget.js
*  * jquery UI
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
        updateServerTimeInterval: 15000,
        updateTimeInterval: 1000
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
    _clockLoop: null,
    _fakeClockLoop: null,
    /*
     * Start by fetching time data from server
     */
    _create: function() {
        this._startClock();
    },
    /*
     * Fetches server time
     * then starts the fake time increment
     * while waiting for the next server time request
     */
    _startClock: function() {
        this._refreshServerTime();
        if(this._clockLoop===null) {
            var that = this;
            this._clockLoop = window.setInterval(function(){
                that._refreshServerTime();
                }, this.options.updateServerTimeInterval);
        }
    },
    /*
     * GET time request
     */
    _refreshServerTime: function(){
        this.options.uceclient.time.get($.proxy(this._incrementTime, this));
    },
    /*
     * increment time from server, use with care
     */
    _incrementTime: function(err, result, xhr) {
        if(err===null) {
            if(this._fakeClockLoop!==null) {
                window.clearInterval(this._fakeClockLoop);
                this._fakeClockLoop = null;
            }
            this.element.data("time", result);
            this._fakeIncrementTime();
        }
    },
    /*
     * Public method returning current time
     * in milliseconds
     */
    getLiveClock: function(){
        return this.element.data("time");
    },
    /*
    * Updates the time with a fake interval
    * between to request from the server
    */
    _fakeIncrementTime: function() {
        if(this._fakeClockLoop===null) {
            var that = this;
            this._fakeClockLoop = window.setInterval(function() {
                var time = that.element.data('time');
                that.element.data('time', time + that.options.updateTimeInterval);
            } , this.options.updateTimeInterval);
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
        }
        this.element.addClass("ui-livemanager-banner-onair");
        this.element.show();
        this._startClock();
    },
    /*
     * UCE event handler
     */
    _handleClose: function(event) {
        if (event.metadata.unixtime) {
            this._scheduledClose = true;
            this.options.endLive = event.metadata.unixtime;
        }
        this.element.removeClass("ui-livemanager-banner-onair");
        this.element.hide();
    },


    destroy: function() {
        if(this._fakeClockLoop!==null) {
            window.clearInterval(this._fakeClockLoop);
            this._fakeClockLoop = null;
        }
        if(this._clockLoop!==null) {
            window.clearInterval(this._clockLoop);
            this._clockLoop = null;
        }
        this.element.find('*').remove();
        $.Widget.prototype.destroy.apply(this, arguments); // default destroy
    }
};

if($.uce.widget!==undefined) {
    $.uce.widget("liveclock", new $.uce.LiveClock());
}

})($);
