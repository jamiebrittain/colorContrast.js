import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const sources = await Promise.all(
  ["jquery.colourbrightness.js", "jquery.colourbrightness.min.js"].map((file) =>
    readFile(new URL(`../${file}`, import.meta.url), "utf8"),
  ),
);

function createJQuery() {
  function jQuery(input) {
    const elements = Array.isArray(input) ? input : input ? [input] : [];
    const collection = Object.create(jQuery.fn);

    collection.elements = elements;
    collection.length = elements.length;
    elements.forEach((element, index) => {
      collection[index] = element;
    });

    return collection;
  }

  jQuery.fn = {
    each(callback) {
      this.elements.forEach((element, index) => {
        callback.call(element, index, element);
      });
      return this;
    },
    css(property) {
      assert.equal(property, "background-color");
      return this[0]?.backgroundColor;
    },
    parent() {
      return jQuery(this[0]?.parentElement);
    },
    removeClass(name) {
      return this.each(function () {
        this.classes.delete(name);
      });
    },
    addClass(name) {
      return this.each(function () {
        this.classes.add(name);
      });
    },
  };

  return jQuery;
}

function element(tagName, backgroundColor, parentElement = null) {
  return { tagName, backgroundColor, parentElement, classes: new Set() };
}

test("v1.3 evaluates every element in a jQuery collection independently", () => {
  for (const source of sources) {
    const jQuery = createJQuery();
    const black = element("DIV", "rgb(0, 0, 0)");
    const yellow = element("DIV", "rgb(255, 255, 0)");

    vm.runInNewContext(source, { jQuery });
    const collection = jQuery([black, yellow]);
    const result = collection.colourBrightness();

    assert.equal(result, collection, "preserves jQuery chaining");
    assert.deepEqual([...black.classes], ["dark"]);
    assert.deepEqual([...yellow.classes], ["light"]);
  }
});

test("v1.3 reads transparent backgrounds through the HTML element", () => {
  for (const source of sources) {
    const jQuery = createJQuery();
    const html = element("HTML", "rgb(0, 0, 0)");
    const body = element("BODY", "rgba(255, 255, 255, 0)", html);
    const child = element("DIV", "rgb(0 0 0 / 0%)", body);

    vm.runInNewContext(source, { jQuery });
    jQuery(child).colourBrightness();

    assert.deepEqual([...child.classes], ["dark"]);
  }
});

test("v1.3 falls back to white for a fully transparent document", () => {
  for (const source of sources) {
    const jQuery = createJQuery();
    const html = element("HTML", "transparent");
    const child = element("DIV", "rgba(0, 0, 0, 0.0)", html);

    vm.runInNewContext(source, { jQuery });
    jQuery(child).colourBrightness();

    assert.deepEqual([...child.classes], ["light"]);
  }
});

test("v1.3 leaves elements unchanged when a background cannot be parsed", () => {
  for (const source of sources) {
    for (const backgroundColor of [
      "color(display-p3 1 0 0)",
      "rgb(20%, 40%, 60%)",
    ]) {
      const jQuery = createJQuery();
      const child = element("DIV", backgroundColor);
      child.classes.add("existing");

      vm.runInNewContext(source, { jQuery });
      jQuery(child).colourBrightness();

      assert.deepEqual([...child.classes], ["existing"]);
    }
  }
});
