/*!
 *  colourBrightness.js
 *
 *  Copyright 2013-2026, Jamie Brittain - https://jamiebrittain.com
 *  Released under the MIT License
 *
 *  Github: https://github.com/jamiebrittain/colorContrast.js
 *  Version: 1.3.0
 */

(function($){
  $.fn.colourBrightness = function(){
    function isTransparent(colour) {
      var match, parts;

      if (colour == "transparent") {
        return true;
      }

      match = colour.match(/^rgba?\((.*)\)$/i);
      if (!match) {
        return false;
      }

      parts = match[1].split(/\s*\/\s*/);
      if (parts.length == 2) {
        return parseFloat(parts[1]) == 0;
      }

      parts = match[1].split(/\s*,\s*/);
      return parts.length == 4 && parseFloat(parts[3]) == 0;
    }

    function getBackgroundColor($el) {
      var bgColor;

      while($el.length) {
        bgColor = $el.css("background-color");
        if (!isTransparent(bgColor)) {
          return bgColor;
        }
        if ($el[0].tagName.toLowerCase() == "html") {
          break;
        }
        $el = $el.parent();
      }

      return "rgb(255, 255, 255)";
    }

    return this.each(function(){
      var r,g,b,brightness,
          $el = $(this),
          colour = getBackgroundColor($el);

      if (colour.match(/^rgb/)) {
        colour = colour.match(/rgba?\(([^)]+)\)/)[1];
        colour = colour.split(/ *, */).map(Number);
        r = colour[0];
        g = colour[1];
        b = colour[2];
      } else if ('#' == colour[0] && 7 == colour.length) {
        r = parseInt(colour.slice(1, 3), 16);
        g = parseInt(colour.slice(3, 5), 16);
        b = parseInt(colour.slice(5, 7), 16);
      } else if ('#' == colour[0] && 4 == colour.length) {
        r = parseInt(colour[1] + colour[1], 16);
        g = parseInt(colour[2] + colour[2], 16);
        b = parseInt(colour[3] + colour[3], 16);
      }

      if (!isFinite(r) || !isFinite(g) || !isFinite(b)) {
        return;
      }

      brightness = (r * 299 + g * 587 + b * 114) / 1000;

      if (brightness < 125) {
        // white text
        $el.removeClass("light").addClass("dark");
      } else {
        // black text
        $el.removeClass("dark").addClass("light");
      }
    });
  };
})(jQuery);
