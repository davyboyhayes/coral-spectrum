/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2017 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */

import {transform, commons} from 'coralui-util';

// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories
const LABELLABLE_ELEMENTS_SELECTOR = 'button,input:not([type=hidden]),keygen,meter,output,progress,select,textarea';
// _onInputChange is only triggered on non-hidden inputs
const TARGET_INPUT_SELECTOR = 'input:not([type=hidden])';

/**
 @mixin FormField
 @classdesc The base element for all Form Field components
 */
const FormField = (superClass) => class extends superClass {
  constructor() {
    super();
    
    this._events = commons.extend(this._events || {}, {
      'capture:change input': '_onTargetInputChange',
      'global:reset': '_onFormReset'
    });
  }
  
  /**
   Name used to submit the data in a form.
   @type {String}
   @default ""
   @htmlattribute name
   @htmlattributereflected
   @memberof Coral.mixin.formField#
   */
  
  /**
   This field's current value.
   @type {String}
   @default ""
   @htmlattribute value
   @memberof Coral.mixin.formField#
   @fires Coral.mixin.formField#change
   */
  
  /**
   Whether this field is disabled or not.
   @type {Boolean}
   @default false
   @htmlattribute disabled
   @htmlattributereflected
   @memberof Coral.mixin.formField#
   */
  
  /**
   Whether this field is required or not.
   @type {Boolean}
   @default false
   @htmlattribute required
   @htmlattributereflected
   @memberof Coral.mixin.formField#
   */
  
  /**
   Whether this field is readOnly or not. Indicating that the user cannot modify the value of the control.
   This is ignored for checkbox, radio or fileupload.
   @type {Boolean}
   @default false
   @htmlattribute readonly
   @htmlattributereflected
   @memberof Coral.mixin.formField#
   */
  
  /**
   Whether the current value of this field is invalid or not.
   
   @type {Boolean}
   @default false
   @htmlattribute invalid
   @htmlattributereflected
   @memberof Coral.mixin.formField#
   */
  get invalid() {
    return this._invalid || false;
  }
  set invalid(value) {
    this._invalid = transform.booleanAttr(value);
    transform.reflect(this, 'invalid', this._invalid);
    
    this.setAttribute('aria-invalid', this._invalid);
    this.classList.toggle('is-invalid', this._invalid);
  }
  
  /**
   Reference to a space delimited set of ids for the HTML elements that provide a label for the formField.
   Implementers should override this method to ensure that the appropriate descendant elements are labelled using the
   <code>aria-labelledby</code> attribute. This will ensure that the component is properly identified for
   accessibility purposes. It reflects the <code>aria-labelledby</code> attribute to the DOM.
   @type {?String}
   @default null
   @htmlattribute labelledby
   @memberof Coral.mixin.formField#
   */
  get labelledBy() {
    return this._getLabellableElement().getAttribute('aria-labelledby');
  }
  set labelledBy(value) {
    value = transform.string(value);
  
    // gets the element that will get the label assigned. the _getLabellableElement method should be overriden to
    // allow other bevaviors.
    const element = this._getLabellableElement();
    // we get and assign the it that will be passed around
    const elementId = element.id = element.id || commons.getUID();
  
    const currentLabelledBy = element.getAttribute('aria-labelledby');
  
    // we clear the old label asignments
    if (currentLabelledBy && currentLabelledBy !== value) {
      this._updateForAttributes(currentLabelledBy, elementId, true);
    }
  
    if (value) {
      element.setAttribute('aria-labelledby', value);
      if (element.matches(LABELLABLE_ELEMENTS_SELECTOR)) {
        this._updateForAttributes(value, elementId);
      }
    }
    else {
      // since no labelledby value was set, we remove everything
      element.removeAttribute('aria-labelledby');
    }
  }
  
  /**
   Target property inside the component that will be updated when a change event is triggered.
   @type {String}
   @default "value"
   @protected
   @memberof Coral.mixin.formField#
   */
  get _componentTargetProperty() {
    return 'value';
  }
  
  /**
   Target property that will be taken from <code>event.target</code> and set into
   {@link Coral.mixin.formField#_componentTargetProperty} when a change event is triggered.
   @type {String}
   @default "value"
   @protected
   @memberof Coral.mixin.formField#
   */
  get _eventTargetProperty() {
    return 'value';
  }
  
  /**
   Whether the change event needs to be triggered when {@link Coral.mixin.formField#_onInputChange} is called.
   @type {Boolean}
   @default true
   @protected
   @memberof Coral.mixin.formField#
   */
  get _triggerChangeEvent() {
    return true;
  }
  
  /**
   Gets the element that should get the label. In case none of the valid labelelable items are found, the component
   will be labelled instead.
   @protected
   @memberof Coral.mixin.formField#
   @returns {HTMLElement} the labellable element.
   */
  _getLabellableElement() {
    const element = this.querySelector(LABELLABLE_ELEMENTS_SELECTOR);
    
    // Use the found element or the container
    return element || this;
  }
  
  /**
   Gets the internal input that the mixin.formField would watch for change. By default, it searches if the
   <code>_getLabellableElement()</code> is an input. Components can override this function to be able to provide a
   different implementation. In case the value is <code>null</code>, the change event will be handled no matter
   the input that produced it.
   @protected
   @memberof Coral.mixin.formField#
   @return {HTMLElement} the input to watch for changes.
   */
  _getTargetChangeInput() {
    // we use this._targetChangeInput as an internal cache to avoid querying the DOM again every time
    return this._targetChangeInput ||
      // assignment returns the value
      (this._targetChangeInput = this._getLabellableElement().matches(TARGET_INPUT_SELECTOR) ?
        this._getLabellableElement() : null);
  }
  
  /**
   Function called whenever the target component triggers a change event. <code>_getTargetChangeInput</code> is used
   internally to determine if the input belongs to the component. If the component decides to override this function,
   the default from the mixin will not be called.
   @protected
   @memberof Coral.mixin.formField#
   */
  _onInputChange(event) {
    // stops the current event
    event.stopPropagation();
    
    this[this._componentTargetProperty] = event.target[this._eventTargetProperty];
    
    // Explicitly re-emit the change event after the property has been set
    if (this._triggerChangeEvent) {
      this.trigger('change');
    }
  }
  
  /**
   Resets the formField when a reset is triggered on the parent form.
   @protected
   @memberof Coral.mixin.formField#
   */
  _onFormReset(event) {
    if (event.target.contains(this)) {
      this.reset();
    }
  }
  
  /**
   We capture every input change and validate that it belongs to our target input. If this is the case,
   <code>_onInputChange</code> will be called with the same event.
   @protected
   @memberof Coral.mixin.formField#
   */
  _onTargetInputChange(event) {
    const targetInput = this._getTargetChangeInput();
    // if the targetInput is null we still call _onInputChange to be backwards compatible
    if (targetInput === event.target || targetInput === null) {
      // we call _onInputChange since the target matches
      this._onInputChange(event);
    }
  }
  
  /**
   A utility method for adding the appropriate <code>for</code> attribute to any <code>label</code> elements
   referenced by the <code>labelledBy</code> property value.
   @param {String} labelledBy
   The value of the <code>labelledBy<code> property providing a space-delimited list of the <code>id</code>
   attributes for elements that label the formField.
   @param {String} elementId
   The <code>id</code> of the formField or one of its descendants that should be labelled by
   <code>label</code> elements referenced by the <code>labelledBy</code> property value.
   @param {Boolean} remove
   Whether the existing <code>for</code> attributes should be removed.
   @protected
   @memberof Coral.mixin.formField#
   */
  _updateForAttributes(labelledBy, elementId, remove) {
    // labelledby contains whitespace sparated items, so we need to separate each individual id
    const labelIds = labelledBy.split(/\s+/);
    // we update the 'for' attribute for every id.
    labelIds.forEach(function(currentValue) {
      const labelElement = document.getElementById(currentValue);
      if (labelElement && labelElement.tagName === 'LABEL') {
        const forAttribute = labelElement.getAttribute('for');
        
        if (remove) {
          // we just remove it when it is our target
          if (forAttribute === elementId) {
            labelElement.removeAttribute('for');
          }
        }
        else {
          // if we do not have to remove, it does not matter the current value of the label, we can set it in every
          // case
          labelElement.setAttribute('for', elementId);
        }
      }
    });
  }
  
  /**
   Clears the <code>value</code> of formField to the default value.
   */
  clear() {
    this.value = '';
  }
  
  /**
   Resets the <code>value</code> to the initial value.
   */
  reset() {
    // since the 'value' property is not reflected, form components use it to restore the initial value. When a
    // component has support for values, this method needs to be overwritten
    this.value = transform.string(this.getAttribute('value'));
  }
};

export default FormField;