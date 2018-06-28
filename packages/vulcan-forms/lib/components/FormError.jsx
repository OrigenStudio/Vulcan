import React from 'react';
import PropTypes from 'prop-types';
import getContext from 'recompose/getContext';
import { registerComponent } from 'meteor/vulcan:core';
import { FormattedMessage } from 'meteor/vulcan:i18n';

const FormError = ({ error, context, getLabel }) => error.message || (
  <FormattedMessage
    id={error.id}
    values={{
      context,
      label: error.properties.name && getLabel(error.properties.name),
      ...error.data, // backwards compatibility
      ...error.properties,
    }}
    defaultMessage={JSON.stringify(error)}
  />
);

FormError.defaultProps = {
  context: '', // default context so format message does not complain
  getLabel: name => name,
};

registerComponent('FormError', FormError, getContext({
  getLabel: PropTypes.func,
}));
