import '@testing-library/jest-dom';

// Polyfill HTMLDialogElement methods for jsdom
HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.showModal ?? function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
};

HTMLDialogElement.prototype.close = HTMLDialogElement.prototype.close ?? function (this: HTMLDialogElement) {
  this.removeAttribute('open');
};
