/**
*  PseudoLiveManager is a simple Synchronization tool for uce player widgets
*  depends :
*  * ucewidget.js
*  * jquery UI
*  * a player uce widget
*
*  Copyright (C) 2011 CommOnEcoute,
*  maintained by Elias Showk <elias.showk@gmail.com>
*  source code at https://github.com/CommOnEcoute/ucengine-widgets
*   
*   PseudoLiveManager widget is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   PseudoLiveManager is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with the source code.  If not, see <http://www.gnu.org/licenses/>.
*/

(function($) {

if (typeof $.uce === 'undefined') { $.uce = {}; }
$.uce.PseudoLiveManager = function(){};
$.uce.PseudoLiveManager.prototype = {
    // Default options
    options: {
        uceclient: null,
        ucemeeting: null,
        /* milliseconds */
        startLive: null,
        endLive: null,
        buttonContainer: $('#livemanagerbutton'),
        livespeakerContainer: $('#livespeaker'),
        player: null,
        seekButtonActive: false,
        seekButton: null,
        updatePlayerInterval: 30000,
        liveclock: null,
        maxPlayerDiff: 60,
        userCanManage: false
    },
    /*
     * UCEngine events listening
     */
    meetingsEvents: {
        "pseudolivemanager.live.open"      : "_handleOpen",
        "pseudolivemanager.live.close"      : "_handleClose"
    },
    _isClosed: true,
    _playerLoop: null,

    _create: function() {
        this.element.addClass("ui-pseudolivemanager-overlay");
        this.element.show();
        if(this.options.userCanManage===true) {
            this.options.buttonContainer.show();
            this._updateManagerButton();
        } else {
            this.options.buttonContainer.hide();
        }
        // TODO a manual button to reset the player synchro
        /*if(this.options.seekButtonActive===true && this.options.seekButton !== null) {
            this.options.uceclient.time.get(function(err, result, xhr) {
                that.options.seekButton.live("click", function(event){
                    that.options.player.data("uceplayer").seek(
                        Math.round((result - that.options.startLive)/1000)
                    );
                });
            });
        }*/
    },
    /*
     * Syncs player position
     * @param {boolean} force always syncs the player if true, check if there's a gap
     */
    syncPlayerNow: function(force){
        var time = this.options.liveclock.getLiveClock(),
            seektime = Math.round((time - this.options.startLive)/1000);
        if(force===true) {
            this.options.player.data("uceplayer").seek(seektime);
            return;
        }
        var currenttime = this.options.player.data("uceplayer").getCurrentTime();
        if(typeof currenttime === "number") {
            if(Math.abs(currenttime - seektime) > this.options.maxPlayerDiff) {
                this.options.player.data("uceplayer").seek(seektime);
            }
            return;
        }
    },
    /*
     * Updates the player position and again and again
     */
    updatePlayerSync: function() {
        if(this._isClosed===false) {
            this.syncPlayerNow(false);
        }
    },
    /*
     * UCE event handler
     */
    _handleOpen: function(event) {
        this.options.endLive = null;
        if(event.metadata.unixtime) {    
            this.options.startLive = event.metadata.unixtime;
        }
        this._isClosed = false;
        this._updateManagerButton();
        this.syncPlayerNow(true);
        if(this._playerLoop!==null) {
            window.clearInterval(this._playerLoop);
            this._playerLoop = null;
        }
        var that = this;
        this._playerLoop = window.setInterval(function(){
            that.updatePlayerSync(); }, this.options.updatePlayerInterval);
        if(this.element.hasClass("ui-pseudolivemanager-overlay")===true) {
            this.element.removeClass("ui-pseudolivemanager-overlay");
            this.element.hide();
        }
    },
    /*
     * UCE event handler
     */
    _handleClose: function(event) {
        if(event.metadata.unixtime) {
            this.options.endLive = event.metadata.unixtime;
        }
        this._isClosed = true;
        this._updateManagerButton();
        if(this.element.hasClass("ui-pseudolivemanager-overlay")===false) {
            this.element.show();
            this.element.addClass("ui-pseudolivemanager-overlay");
        }
        if(this._playerLoop!==null) {
            window.clearInterval(this._playerLoop);
            this._playerLoop = null;
        }
        this.options.player.data("uceplayer").options.player.play(false);
    },
    /*
     * Open/Close switch button
     */
    _updateManagerButton: function() {
        if(this.options.buttonContainer === null) {
            return;
        }
        this.options.buttonContainer.unbind('click');
        var that = this;
        if(this._isClosed===true) {
            this.options.buttonContainer.text("Open the Pseudo Live Now !");
            this.options.buttonContainer.unbind('click');
            this.options.buttonContainer.click(function(){
                // TODO schedule time
                if( window.confirm("Are you sure that you want to open this live ? The video broadcast would be started immediately if you do so.") ) {
                    var time = that.options.liveclock.getLiveClock();
                    that.options.ucemeeting.push('pseudolivemanager.live.open', {
                        unixtime: time
                    }, function(){
                        alert("you opened the live ! At the end of your broadcast, please click once again on the same button to close and hide the video");
                    });
                } else {
                    window.alert("Opening canceled, the video broadcast is not started...");
                }
            });
        } else {
            this.options.buttonContainer.text("Close the Pseudo Live Now !");
            this.options.buttonContainer.unbind('click');
            this.options.buttonContainer.click(function(){
                // TODO schedule time
                if( window.confirm("Are you sure that you want to close this live ? The video broadcast would be stopped immediately if you do so.") ) {
                    that.options.ucemeeting.push('pseudolivemanager.live.close', {}, function(){
                        window.alert("You closed the live ! Please do not re-open it another time.");
                    });
                } else {
                    window.alert("Closing canceled, the video broadcast continues...");
                }
            });
        }
    },

    destroy: function() {
        this.element.find('*').remove();
        $.Widget.prototype.destroy.apply(this, arguments); // default destroy
    }
};

if($.uce.widget!==undefined) {
    $.uce.widget("pseudolivemanager", new $.uce.PseudoLiveManager());
}

})($);
