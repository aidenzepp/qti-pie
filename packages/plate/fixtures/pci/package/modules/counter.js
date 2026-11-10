/*
 * A press counter: the smallest Portable Custom Interaction the frame host (issue pci-04) can
 * load. It is an AMD module that defines against `qtiCustomInteractionContext`, registers a
 * factory whose `typeIdentifier` is the item's `custom-interaction-type-identifier`, and renders
 * one button into the `dom` it is handed. Each press adds one to the count, which it reports as a
 * single integer in the Appendix C JSON binding, `{ base: { integer: n } }`, and announces through
 * the `qti-interaction-changed` event on its `dom`.
 */
define(["qtiCustomInteractionContext"], function (qtiCustomInteractionContext) {
  "use strict";

  var typeIdentifier = "urn:qti-pie:pci:counter";

  function Counter(dom, configuration) {
    this.dom = dom;
    this.configuration = configuration;
    this.count = Number(configuration.properties["start_value-2"] || 0);
    this.max = Number(configuration.properties.maxCount || 5);
    this.status = configuration.status || "interacting";
    this.onready = configuration.onready;
    this.ondone = configuration.ondone;
    this.render();
  }

  Counter.prototype.render = function () {
    var self = this;
    var face = this.dom.querySelector("template");
    var fragment = face
      ? face.content.cloneNode(true)
      : this.dom.ownerDocument.createDocumentFragment();
    this.dom.textContent = "";
    this.dom.appendChild(fragment);
    this.value = this.dom.querySelector(".counter-value");
    if (!this.value) {
      this.value = this.dom.ownerDocument.createElement("span");
      this.value.className = "counter-value";
      this.dom.appendChild(this.value);
    }
    this.button = this.dom.ownerDocument.createElement("button");
    this.button.type = "button";
    this.button.className = "counter-press";
    this.button.textContent = "Press";
    this.dom.appendChild(this.button);
    this.button.addEventListener("click", function () {
      self.press();
    });
    this.show();
    if (typeof this.onready === "function") {
      this.onready(this, this.getState());
    }
  };

  Counter.prototype.show = function () {
    this.value.textContent = String(this.count);
    this.button.disabled = this.status !== "interacting" || this.count >= this.max;
  };

  Counter.prototype.press = function () {
    if (this.status !== "interacting" || this.count >= this.max) {
      return;
    }
    this.count += 1;
    this.show();
    this.dom.dispatchEvent(
      new CustomEvent("qti-interaction-changed", {
        bubbles: true,
        detail: { interaction: this, responseIdentifier: this.configuration.responseIdentifier },
      }),
    );
  };

  Counter.prototype.getResponse = function () {
    return { base: { integer: this.count } };
  };

  Counter.prototype.getState = function () {
    return { count: this.count };
  };

  Counter.prototype.setState = function (state) {
    if (state && typeof state.count === "number") {
      this.count = state.count;
      this.show();
    }
  };

  Counter.prototype.checkValidity = function () {
    return true;
  };

  Counter.prototype.getCustomValidity = function () {
    return "";
  };

  Counter.prototype.setStatus = function (status) {
    this.status = status;
    this.show();
  };

  Counter.prototype.oncompleted = function () {
    this.button.disabled = true;
    if (typeof this.ondone === "function") {
      this.ondone(this, this.getResponse(), this.getState(), "closed");
    }
  };

  qtiCustomInteractionContext.register({
    typeIdentifier: typeIdentifier,
    getInstance: function (dom, configuration, state) {
      var instance = new Counter(dom, configuration);
      if (state) {
        instance.setState(typeof state === "string" ? JSON.parse(state) : state);
      }
      return instance;
    },
  });
});
